import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import { Loader2, CheckCircle, XCircle, Filter } from "lucide-react";

const STATUS_OPTIONS = ["all", "pending", "active", "expired", "rejected"];

export default function Subscriptions() {
  const { profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionInProgress, setActionInProgress] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, id: null });
  const [rejectNotes, setRejectNotes] = useState("");

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(
          "*, subscription_packages(name, duration_days, price, classes(title)), members(profiles(full_name, email))"
        )
        .order("requested_at", { ascending: false });
      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  async function handleConfirm(sub) {
    setActionInProgress(sub.id);
    try {
      const durationDays = sub.subscription_packages?.duration_days || 30;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          confirmed_at: new Date().toISOString(),
          confirmed_by: profile.id,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        })
        .eq("id", sub.id);
      if (error) throw error;
      fetchSubscriptions();
    } catch (err) {
      console.error("Confirm failed:", err);
      alert(err.message);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleReject() {
    const subId = rejectModal.id;
    if (!subId) return;
    setActionInProgress(subId);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "rejected",
          confirmed_at: new Date().toISOString(),
          confirmed_by: profile.id,
          notes: rejectNotes || null,
        })
        .eq("id", subId);
      if (error) throw error;
      setRejectModal({ open: false, id: null });
      setRejectNotes("");
      fetchSubscriptions();
    } catch (err) {
      console.error("Reject failed:", err);
      alert(err.message);
    } finally {
      setActionInProgress(null);
    }
  }

  const filtered =
    statusFilter === "all"
      ? subscriptions
      : subscriptions.filter((s) => s.status === statusFilter);

  const statusStyles = {
    pending: "bg-amber-50 text-amber-700",
    active: "bg-green-50 text-green-700",
    expired: "bg-gray-100 text-text-muted",
    rejected: "bg-red-50 text-red-700",
  };

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
        <h1 className="text-2xl font-bold text-text-primary leading-tight">
          Subscription Requests
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Review and manage member subscription requests
        </p>
      </div>

      <div className="mb-5 flex items-center gap-2">
        <Filter className="h-4 w-4 text-text-muted" />
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                statusFilter === status
                  ? "bg-primary text-white"
                  : "bg-background text-text-secondary hover:bg-border"
              }`}
            >
              {status}
              {status !== "all" && (
                <span className="ml-1.5 opacity-70">
                  ({subscriptions.filter((s) => s.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Member
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Package
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Class
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Price
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Dates
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-text-primary">
                        {sub.members?.profiles?.full_name || "—"}
                      </p>
                      <p className="text-xs text-text-muted">
                        {sub.members?.profiles?.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-text-primary">
                    {sub.subscription_packages?.name}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {sub.subscription_packages?.classes?.title || "—"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    ${Number(sub.subscription_packages?.price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        statusStyles[sub.status] || statusStyles.pending
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-text-muted">
                    {sub.status === "active" || sub.status === "expired" ? (
                      <div>
                        <p>{sub.start_date} —</p>
                        <p>{sub.end_date}</p>
                      </div>
                    ) : (
                      <p>
                        Requested{" "}
                        {new Date(sub.requested_at).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {sub.status === "pending" ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleConfirm(sub)}
                          disabled={actionInProgress === sub.id}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-success hover:bg-green-50 disabled:opacity-50"
                          title="Confirm payment"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Confirm
                        </button>
                        <button
                          onClick={() =>
                            setRejectModal({ open: true, id: sub.id })
                          }
                          disabled={actionInProgress === sub.id}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-red-50 disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-text-muted">
                    {statusFilter === "all"
                      ? "No subscription requests yet"
                      : `No ${statusFilter} subscriptions`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={rejectModal.open}
        onClose={() => {
          setRejectModal({ open: false, id: null });
          setRejectNotes("");
        }}
        title="Reject Subscription"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to reject this subscription request?
          </p>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Reason (optional)
            </label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
              placeholder="Add a note for the member..."
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setRejectModal({ open: false, id: null });
                setRejectNotes("");
              }}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-background"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={actionInProgress !== null}
              className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              {actionInProgress && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject Request
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
