import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import { Loader2, Search, UserCog } from "lucide-react";

export default function AdminPanel() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error("Failed to load profiles:", err);
    } finally {
      setLoading(false);
    }
  }

  function openRoleModal(user) {
    setSelectedUser(user);
    setNewRole(user.role);
    setModalOpen(true);
  }

  async function handleRoleChange(e) {
    e.preventDefault();
    if (!selectedUser || newRole === selectedUser.role) {
      setModalOpen(false);
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", selectedUser.id);
      if (updateError) throw updateError;

      if (newRole === "trainer") {
        const { data: existingTrainer } = await supabase
          .from("trainers")
          .select("id")
          .eq("profile_id", selectedUser.id)
          .maybeSingle();

        if (!existingTrainer) {
          const { error: trainerError } = await supabase
            .from("trainers")
            .insert({ profile_id: selectedUser.id });
          if (trainerError) throw trainerError;
        }
      }

      if (newRole === "member") {
        const { data: existingMember } = await supabase
          .from("members")
          .select("id")
          .eq("profile_id", selectedUser.id)
          .maybeSingle();

        if (!existingMember) {
          const { error: memberError } = await supabase
            .from("members")
            .insert({ profile_id: selectedUser.id });
          if (memberError) throw memberError;
        }
      }

      setModalOpen(false);
      fetchProfiles();
    } catch (err) {
      console.error("Role update failed:", err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredProfiles = profiles.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.role?.toLowerCase().includes(query)
    );
  });

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
        <h1 className="text-2xl font-bold leading-tight text-text-primary">User Management</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Manage user accounts and role assignments
        </p>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Name</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Email</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Phone</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Role</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Joined</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProfiles.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                        {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="font-medium text-text-primary">
                        {user.full_name || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                  <td className="px-6 py-4 text-text-secondary">{user.phone || "—"}</td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openRoleModal(user)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-light"
                    >
                      <UserCog className="h-3.5 w-3.5" />
                      Change Role
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProfiles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-muted">
                    {searchQuery ? "No users match your search" : "No users found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Change User Role"
      >
        {selectedUser && (
          <form onSubmit={handleRoleChange} className="space-y-4">
            <div className="rounded-lg bg-background p-4">
              <p className="text-sm font-medium text-text-primary">
                {selectedUser.full_name}
              </p>
              <p className="text-xs text-text-muted">{selectedUser.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="member">Member</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </select>
              {newRole !== selectedUser.role && (
                <p className="mt-1.5 text-xs text-warning">
                  This will change the user&apos;s role from{" "}
                  <strong>{selectedUser.role}</strong> to{" "}
                  <strong>{newRole}</strong>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || newRole === selectedUser.role}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Role
              </button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  );
}

function RoleBadge({ role }) {
  const styles = {
    admin: "bg-purple-50 text-purple-700",
    trainer: "bg-blue-50 text-blue-700",
    member: "bg-green-50 text-green-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        styles[role] || styles.member
      }`}
    >
      {role}
    </span>
  );
}
