import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import { Plus, Pencil, Loader2, Package, ToggleLeft, ToggleRight } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  class_id: "",
  duration_days: 30,
  price: "",
  description: "",
  is_active: true,
};

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [packagesRes, classesRes] = await Promise.all([
        supabase
          .from("subscription_packages")
          .select("*, classes(title)")
          .order("created_at", { ascending: false }),
        supabase.from("classes").select("id, title").order("title"),
      ]);
      setPackages(packagesRes.data || []);
      setClasses(classesRes.data || []);
    } catch (err) {
      console.error("Failed to load packages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreateModal() {
    setEditingPackage(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(pkg) {
    setEditingPackage(pkg);
    setForm({
      name: pkg.name,
      class_id: pkg.class_id || "",
      duration_days: pkg.duration_days,
      price: pkg.price,
      description: pkg.description || "",
      is_active: pkg.is_active,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        class_id: form.class_id || null,
        duration_days: parseInt(form.duration_days, 10),
        price: parseFloat(form.price),
        description: form.description || null,
        is_active: form.is_active,
      };

      if (editingPackage) {
        const { error } = await supabase
          .from("subscription_packages")
          .update(payload)
          .eq("id", editingPackage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("subscription_packages")
          .insert(payload);
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

  async function toggleActive(pkg) {
    try {
      const { error } = await supabase
        .from("subscription_packages")
        .update({ is_active: !pkg.is_active })
        .eq("id", pkg.id);
      if (error) throw error;
      setPackages((prev) =>
        prev.map((p) =>
          p.id === pkg.id ? { ...p, is_active: !p.is_active } : p
        )
      );
    } catch (err) {
      console.error("Toggle failed:", err);
      alert(err.message);
    }
  }

  function formatDuration(days) {
    if (days === 365) return "1 Year";
    if (days === 180) return "6 Months";
    if (days === 90) return "3 Months";
    if (days === 30) return "1 Month";
    if (days === 7) return "1 Week";
    return `${days} Days`;
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
          <h1 className="text-2xl font-bold text-text-primary leading-tight">
            Subscription Packages
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Create and manage subscription plans for classes
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          New Package
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Package
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Class
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Duration
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Price
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {packages.map((pkg) => (
                <tr key={pkg.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-text-muted" />
                      <span className="font-medium text-text-primary">
                        {pkg.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {pkg.classes?.title || "—"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {formatDuration(pkg.duration_days)}
                  </td>
                  <td className="px-6 py-4 font-medium text-text-primary">
                    ${Number(pkg.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        pkg.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-text-muted"
                      }`}
                    >
                      {pkg.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-background hover:text-text-primary"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(pkg)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-background hover:text-text-primary"
                        title={pkg.is_active ? "Deactivate" : "Activate"}
                      >
                        {pkg.is_active ? (
                          <ToggleRight className="h-4 w-4 text-success" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-muted">
                    No packages yet. Create your first subscription package.
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
        title={editingPackage ? "Edit Package" : "Create Package"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Package Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              required
              placeholder="e.g. Monthly Yoga"
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Class
            </label>
            <select
              value={form.class_id}
              onChange={(e) => updateForm("class_id", e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Duration (days)
              </label>
              <select
                value={form.duration_days}
                onChange={(e) => updateForm("duration_days", e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={7}>1 Week (7 days)</option>
                <option value={30}>1 Month (30 days)</option>
                <option value={90}>3 Months (90 days)</option>
                <option value={180}>6 Months (180 days)</option>
                <option value={365}>1 Year (365 days)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Price ($)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={3}
              placeholder="Describe what this package includes..."
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pkg_active"
              checked={form.is_active}
              onChange={(e) => updateForm("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="pkg_active" className="text-sm text-text-primary">
              Active (visible to members)
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
              {editingPackage ? "Update Package" : "Create Package"}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
