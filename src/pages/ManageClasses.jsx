import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import { Plus, Pencil, Trash2, Loader2, Dumbbell } from "lucide-react";

const EMPTY_FORM = {
  title: "",
  description: "",
  schedule: "",
  capacity: 20,
  trainer_id: "",
};

export default function ManageClasses() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [trainerRecord, setTrainerRecord] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [classesRes, trainersRes] = await Promise.all([
          supabase
            .from("classes")
            .select("*, trainers(id, profiles(full_name)), bookings(count)")
            .order("schedule", { ascending: true }),
          supabase.from("trainers").select("id, profiles(full_name)"),
        ]);
        setClasses(classesRes.data || []);
        setTrainers(trainersRes.data || []);
      } else {
        const { data: myTrainer } = await supabase
          .from("trainers")
          .select("id")
          .eq("profile_id", profile.id)
          .single();

        setTrainerRecord(myTrainer);

        if (myTrainer) {
          const { data: classesData } = await supabase
            .from("classes")
            .select("*, bookings(count)")
            .eq("trainer_id", myTrainer.id)
            .order("schedule", { ascending: true });
          setClasses(classesData || []);
        }
      }
    } catch (err) {
      console.error("Failed to load classes:", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, profile.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreateModal() {
    setEditingClass(null);
    setForm({
      ...EMPTY_FORM,
      trainer_id: isAdmin ? "" : trainerRecord?.id || "",
    });
    setModalOpen(true);
  }

  function openEditModal(cls) {
    setEditingClass(cls);
    setForm({
      title: cls.title,
      description: cls.description || "",
      schedule: cls.schedule ? cls.schedule.slice(0, 16) : "",
      capacity: cls.capacity,
      trainer_id: cls.trainer_id || "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        schedule: form.schedule ? new Date(form.schedule).toISOString() : null,
        capacity: parseInt(form.capacity, 10),
        trainer_id: form.trainer_id || (isAdmin ? null : trainerRecord?.id),
      };

      if (editingClass) {
        const { error } = await supabase
          .from("classes")
          .update(payload)
          .eq("id", editingClass.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("classes").insert(payload);
        if (error) throw error;
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Save failed:", err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(classId) {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    try {
      const { error } = await supabase.from("classes").delete().eq("id", classId);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.message);
    }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-text-primary">Manage Classes</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {isAdmin ? "Create and manage all gym classes" : "Manage your classes"}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          New Class
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Title</th>
                {isAdmin && (
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Trainer</th>
                )}
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Schedule</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Capacity</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Bookings</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-text-muted" />
                      <span className="font-medium text-text-primary">{cls.title}</span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-text-secondary">
                      {cls.trainers?.profiles?.full_name || "Unassigned"}
                    </td>
                  )}
                  <td className="px-6 py-4 text-text-secondary">
                    {cls.schedule
                      ? new Date(cls.schedule).toLocaleString()
                      : "Not scheduled"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{cls.capacity}</td>
                  <td className="px-6 py-4 text-text-secondary">
                    {cls.bookings?.[0]?.count || 0}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cls)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-background hover:text-text-primary"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-danger"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="px-6 py-10 text-center text-text-muted"
                  >
                    No classes yet. Create your first class to get started.
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
        title={editingClass ? "Edit Class" : "Create New Class"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Morning Yoga"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Describe the class..."
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Schedule
              </label>
              <input
                type="datetime-local"
                value={form.schedule}
                onChange={(e) => updateForm("schedule", e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Capacity
              </label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => updateForm("capacity", e.target.value)}
                min={1}
                required
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Trainer
              </label>
              <select
                value={form.trainer_id}
                onChange={(e) => updateForm("trainer_id", e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select a trainer</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.profiles?.full_name || "Unknown"}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {editingClass ? "Update Class" : "Create Class"}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
