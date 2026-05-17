import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import {
  Loader2,
  Package,
  Clock,
  DollarSign,
  Dumbbell,
  Send,
} from "lucide-react";

export default function MySubscriptions() {
  const { profile } = useAuth();
  const [packages, setPackages] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [memberRecord, setMemberRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: memberData } = await supabase
        .from("members")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      setMemberRecord(memberData);

      const [packagesRes, subsRes] = await Promise.all([
        supabase
          .from("subscription_packages")
          .select("*, classes(title)")
          .eq("is_active", true)
          .order("price"),
        memberData
          ? supabase
              .from("subscriptions")
              .select("*, subscription_packages(name, duration_days, price, classes(title))")
              .eq("member_id", memberData.id)
              .order("requested_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      setPackages(packagesRes.data || []);
      setMySubscriptions(subsRes.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRequest(packageId) {
    if (!memberRecord) return;
    setRequestingId(packageId);
    try {
      const { error } = await supabase.from("subscriptions").insert({
        member_id: memberRecord.id,
        package_id: packageId,
      });
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error("Request failed:", err);
      alert(err.message);
    } finally {
      setRequestingId(null);
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

  const pendingPackageIds = new Set(
    mySubscriptions
      .filter((s) => s.status === "pending" || s.status === "active")
      .map((s) => s.package_id)
  );

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary leading-tight">
          Subscriptions
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Browse packages and manage your subscriptions
        </p>
      </div>

      <div className="mb-10">
        <h2 className="text-base font-semibold text-text-primary mb-5">
          Available Packages
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => {
            const alreadyRequested = pendingPackageIds.has(pkg.id);
            return (
              <div
                key={pkg.id}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <h3 className="font-semibold text-text-primary leading-snug">
                  {pkg.name}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2">
                  {pkg.description || "No description"}
                </p>
                <div className="mt-4 space-y-2 text-xs text-text-muted">
                  <p className="flex items-center gap-2">
                    <Dumbbell className="h-3.5 w-3.5 shrink-0" />
                    {pkg.classes?.title || "General"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {formatDuration(pkg.duration_days)}
                  </p>
                  <p className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 shrink-0" />
                    ${Number(pkg.price).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => handleRequest(pkg.id)}
                  disabled={alreadyRequested || requestingId === pkg.id}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
                    alreadyRequested
                      ? "bg-amber-50 text-amber-700 cursor-default"
                      : "bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
                  }`}
                >
                  {requestingId === pkg.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Requesting...
                    </>
                  ) : alreadyRequested ? (
                    "Requested"
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Request Subscription
                    </>
                  )}
                </button>
              </div>
            );
          })}
          {packages.length === 0 && (
            <p className="col-span-full py-10 text-center text-text-muted">
              No subscription packages available right now
            </p>
          )}
        </div>
      </div>

      {mySubscriptions.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-5">
            My Subscriptions
          </h2>
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
                      Price
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Period
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mySubscriptions.map((sub) => (
                    <tr key={sub.id}>
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
                        {sub.start_date && sub.end_date
                          ? `${sub.start_date} — ${sub.end_date}`
                          : sub.status === "pending"
                            ? "Awaiting confirmation"
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {mySubscriptions.some((s) => s.notes && s.status === "rejected") && (
            <div className="mt-4 space-y-2">
              {mySubscriptions
                .filter((s) => s.notes && s.status === "rejected")
                .map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-danger"
                  >
                    <span className="font-medium">
                      {s.subscription_packages?.name}:
                    </span>{" "}
                    {s.notes}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
