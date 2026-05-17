import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import { Loader2, Search, Pencil } from "lucide-react";

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ specialization: "", bio: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  async function fetchTrainers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trainers")
        .select("*, profiles(full_name, email, phone), classes(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTrainers(data || []);
    } catch (err) {
      console.error("Failed to load trainers:", err);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(trainer) {
    setEditingTrainer(trainer);
    setForm({
      specialization: trainer.specialization || "",
      bio: trainer.bio || "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("trainers")
        .update({
          specialization: form.specialization || null,
          bio: form.bio || null,
        })
        .eq("id", editingTrainer.id);
      if (error) throw error;
      setModalOpen(false);
      fetchTrainers();
    } catch (err) {
      console.error("Update failed:", err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredTrainers = trainers.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.profiles?.full_name?.toLowerCase().includes(query) ||
      t.profiles?.email?.toLowerCase().includes(query) ||
      t.specialization?.toLowerCase().includes(query)
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
        <h1 className="text-2xl font-bold leading-tight text-text-primary">Trainers</h1>
        <p className="mt-2 text-sm text-text-secondary">
          View and manage gym trainers
        </p>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trainers..."
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
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Specialization</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Classes</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Joined</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTrainers.map((trainer) => (
                <tr key={trainer.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                        {trainer.profiles?.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="font-medium text-text-primary">
                        {trainer.profiles?.full_name || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {trainer.profiles?.email}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {trainer.specialization || "—"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {trainer.classes?.[0]?.count || 0}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {new Date(trainer.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openEditModal(trainer)}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-background hover:text-text-primary"
                      title="Edit trainer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTrainers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-muted">
                    {searchQuery ? "No trainers match your search" : "No trainers found"}
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
        title="Edit Trainer"
      >
        {editingTrainer && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-background p-4">
              <p className="text-sm font-medium text-text-primary">
                {editingTrainer.profiles?.full_name}
              </p>
              <p className="text-xs text-text-muted">
                {editingTrainer.profiles?.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Specialization
              </label>
              <input
                type="text"
                value={form.specialization}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, specialization: e.target.value }))
                }
                placeholder="e.g. Yoga, CrossFit, Cardio"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bio: e.target.value }))
                }
                rows={4}
                placeholder="Short bio about the trainer..."
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
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
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  );
}
