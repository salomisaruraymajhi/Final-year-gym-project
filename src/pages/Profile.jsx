import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import { Loader2, Save, UserCircle } from "lucide-react";

export default function Profile() {
  const { profile, user } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
  });
  const [trainerForm, setTrainerForm] = useState({
    specialization: "",
    bio: "",
  });
  const [trainerRecord, setTrainerRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchTrainerData = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("trainers")
        .select("*")
        .eq("profile_id", profile.id)
        .single();

      if (data) {
        setTrainerRecord(data);
        setTrainerForm({
          specialization: data.specialization || "",
          bio: data.bio || "",
        });
      }
    } catch (err) {
      console.error("Failed to load trainer data:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || "",
      });

      if (profile.role === "trainer") {
        fetchTrainerData();
      } else {
        setLoading(false);
      }
    }
  }, [profile, fetchTrainerData]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          phone: form.phone || null,
          avatar_url: form.avatar_url || null,
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      if (profile.role === "trainer" && trainerRecord) {
        const { error: trainerError } = await supabase
          .from("trainers")
          .update({
            specialization: trainerForm.specialization || null,
            bio: trainerForm.bio || null,
          })
          .eq("id", trainerRecord.id);

        if (trainerError) throw trainerError;
      }

      setSuccessMessage("Profile updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Update failed:", err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-tight text-text-primary">Profile</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Manage your personal information
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                {profile?.full_name}
              </h2>
              <p className="text-sm text-text-secondary">{user?.email}</p>
              <span className="mt-1 inline-block rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                {profile?.role}
              </span>
            </div>
          </div>

          {successMessage && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-success">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, full_name: e.target.value }))
                }
                required
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-muted cursor-not-allowed"
                />
                <UserCircle className="h-5 w-5 text-text-muted shrink-0" />
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Email cannot be changed here
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {profile?.role === "trainer" && (
              <>
                <hr className="border-border" />
                <h3 className="text-sm font-semibold text-text-primary">
                  Trainer Details
                </h3>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={trainerForm.specialization}
                    onChange={(e) =>
                      setTrainerForm((prev) => ({
                        ...prev,
                        specialization: e.target.value,
                      }))
                    }
                    placeholder="e.g. Yoga, CrossFit, Cardio"
                    className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Bio
                  </label>
                  <textarea
                    value={trainerForm.bio}
                    onChange={(e) =>
                      setTrainerForm((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    rows={4}
                    placeholder="Tell members about yourself..."
                    className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
