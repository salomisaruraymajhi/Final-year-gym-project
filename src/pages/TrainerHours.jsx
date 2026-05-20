import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

const EMPTY_FORM = {
  trainer_id: "",
  class_id: "",
  work_date: new Date().toISOString().slice(0, 10),
  hours: "",
  notes: "",
};

export default function TrainerHours() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [hours, setHours] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [trainerRecord, setTrainerRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      if (isAdmin) {
        const [hoursRes, trainersRes, classesRes] = await Promise.all([
          supabase
            .from("trainer_hours")
            .select(
              "*, trainers(id, profiles(full_name, email)), classes(id, title, schedule)"
            )
            .order("work_date", { ascending: false }),
          supabase
            .from("trainers")
            .select("id, profiles(full_name, email)")
            .order("created_at", { ascending: false }),
          supabase
            .from("classes")
            .select("id, title, trainer_id, schedule")
            .order("schedule", { ascending: true }),
        ]);

        if (hoursRes.error) throw hoursRes.error;
        if (trainersRes.error) throw trainersRes.error;
        if (classesRes.error) throw classesRes.error;

        setHours(hoursRes.data || []);
        setTrainers(trainersRes.data || []);
        setClasses(classesRes.data || []);
      } else {
        const trainerRes = await supabase
          .from("trainers")
          .select("id")
          .eq("profile_id", profile.id)
          .single();

        if (trainerRes.error) throw trainerRes.error;

        setTrainerRecord(trainerRes.data);

        const [hoursRes, classesRes] = await Promise.all([
          supabase
            .from("trainer_hours")
            .select("*, classes(id, title, schedule)")
            .eq("trainer_id", trainerRes.data.id)
            .order("work_date", { ascending: false }),
          supabase
            .from("classes")
            .select("id, title, trainer_id, schedule")
            .eq("trainer_id", trainerRes.data.id)
            .order("schedule", { ascending: true }),
        ]);

        if (hoursRes.error) throw hoursRes.error;
        if (classesRes.error) throw classesRes.error;

        setHours(hoursRes.data || []);
        setClasses(classesRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load trainer hours:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, profile.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalHours = useMemo(
    () => hours.reduce((sum, row) => sum + Number(row.hours || 0), 0),
    [hours]
  );

  const thisMonthHours = useMemo(() => {
    const now = new Date();
    return hours.reduce((sum, row) => {
      const date = new Date(row.work_date);
      const sameMonth =
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      return sameMonth ? sum + Number(row.hours || 0) : sum;
    }, 0);
  }, [hours]);

  function openCreateModal() {
    setForm({
      ...EMPTY_FORM,
      trainer_id: isAdmin ? "" : trainerRecord?.id || "",
    });
    setModalOpen(true);
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        trainer_id: isAdmin ? form.trainer_id : trainerRecord?.id,
        class_id: form.class_id || null,
        work_date: form.work_date,
        hours: Number(form.hours),
        notes: form.notes || null,
      };

      const { error } = await supabase.from("trainer_hours").insert(payload);
      if (error) throw error;

      setModalOpen(false);
      setForm(EMPTY_FORM);
      fetchData();
    } catch (err) {
      console.error("Failed to save trainer hours:", err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this logged hour record?")) return;

    try {
      const { error } = await supabase
        .from("trainer_hours")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error("Failed to delete trainer hour:", err);
      alert(err.message);
    }
  }

  const classOptions = isAdmin
    ? classes.filter((cls) => !form.trainer_id || cls.trainer_id === form.trainer_id)
    : classes;

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
          <h1 className="text-2xl font-bold text-text-primary">
            Trainer Hours
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Track trainer working hours for assigned gym classes
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Log Hours
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          icon={Clock}
          title="Total Hours"
          value={totalHours.toFixed(1)}
          color="primary"
        />
        <StatCard
          icon={CalendarDays}
          title="This Month"
          value={thisMonthHours.toFixed(1)}
          color="success"
        />
        <StatCard
          icon={Clock}
          title="Records"
          value={hours.length}
          color="accent"
        />
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-base font-semibold text-text-primary">
            Logged Working Hours
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                {isAdmin && (
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Trainer
                  </th>
                )}
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Class
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Work Date
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Hours
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Notes
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {hours.map((row) => (
                <tr key={row.id}>
                  {isAdmin && (
                    <td className="px-6 py-4 text-text-primary">
                      {row.trainers?.profiles?.full_name || "Unknown trainer"}
                    </td>
                  )}
                  <td className="px-6 py-4 text-text-secondary">
                    {row.classes?.title || "General work"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {new Date(row.work_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-text-primary">
                    {Number(row.hours).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {row.notes || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-danger"
                      title="Delete hours"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {hours.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="px-6 py-10 text-center text-text-muted"
                  >
                    No trainer hours have been logged yet.
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
        title="Log Trainer Hours"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {isAdmin && (
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Trainer
              </label>
              <select
                value={form.trainer_id}
                onChange={(e) => updateForm("trainer_id", e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select trainer</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.profiles?.full_name || "Unnamed trainer"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Class
            </label>
            <select
              value={form.class_id}
              onChange={(e) => updateForm("class_id", e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">General work / no class</option>
              {classOptions.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Work Date
            </label>
            <input
              type="date"
              value={form.work_date}
              onChange={(e) => updateForm("work_date", e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Hours Worked
            </label>
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={form.hours}
              onChange={(e) => updateForm("hours", e.target.value)}
              required
              placeholder="e.g. 2"
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              rows={3}
              placeholder="e.g. Covered evening yoga session"
              className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
              Save Hours
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}