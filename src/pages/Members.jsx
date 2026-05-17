import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import { Loader2, Search, Pencil } from "lucide-react";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMember, setEditingMember] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    membership_type: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*, profiles(full_name, email, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(member) {
    setEditingMember(member);
    setForm({
      membership_type: member.membership_type || "",
      start_date: member.start_date || "",
      end_date: member.end_date || "",
      is_active: member.is_active ?? true,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("members")
        .update({
          membership_type: form.membership_type || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          is_active: form.is_active,
        })
        .eq("id", editingMember.id);
      if (error) throw error;
      setModalOpen(false);
      fetchMembers();
    } catch (err) {
      console.error("Update failed:", err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredMembers = members.filter((m) => {
    const query = searchQuery.toLowerCase();
    return (
      m.profiles?.full_name?.toLowerCase().includes(query) ||
      m.profiles?.email?.toLowerCase().includes(query) ||
      m.membership_type?.toLowerCase().includes(query)
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
        <h1 className="text-2xl font-bold leading-tight text-text-primary">Members</h1>
        <p className="mt-2 text-sm text-text-secondary">
          View and manage gym memberships
        </p>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
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
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Type</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Start</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">End</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Status</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 font-medium text-text-primary">
                    {member.profiles?.full_name || "—"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {member.profiles?.email}
                  </td>
                  <td className="px-6 py-4 text-text-secondary capitalize">
                    {member.membership_type || "—"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {member.start_date || "—"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {member.end_date || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openEditModal(member)}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-background hover:text-text-primary"
                      title="Edit membership"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-text-muted">
                    {searchQuery ? "No members match your search" : "No members found"}
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
        title="Edit Membership"
      >
        {editingMember && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-background p-4">
              <p className="text-sm font-medium text-text-primary">
                {editingMember.profiles?.full_name}
              </p>
              <p className="text-xs text-text-muted">
                {editingMember.profiles?.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Membership Type
              </label>
              <select
                value={form.membership_type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, membership_type: e.target.value }))
                }
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select type</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, start_date: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, end_date: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm text-text-primary">
                Active membership
              </label>
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
