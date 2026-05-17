import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import {
  CalendarDays,
  Users,
  Award,
  ClipboardList,
  Dumbbell,
  Clock,
  Loader2,
  XCircle,
  CreditCard,
} from "lucide-react";

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary leading-tight">
          Welcome back, {profile?.full_name}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Here&apos;s what&apos;s happening today
        </p>
      </div>

      {profile?.role === "admin" && <AdminDashboard />}
      {profile?.role === "trainer" && <TrainerDashboard profile={profile} />}
      {profile?.role === "member" && <MemberDashboard profile={profile} />}
    </Layout>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({ members: 0, trainers: 0, classes: 0, bookings: 0 });
  const [recentMembers, setRecentMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [membersRes, trainersRes, classesRes, bookingsRes, recentRes, pendingSubsRes] =
          await Promise.all([
            supabase.from("members").select("*", { count: "exact", head: true }),
            supabase.from("trainers").select("*", { count: "exact", head: true }),
            supabase.from("classes").select("*", { count: "exact", head: true }),
            supabase.from("bookings").select("*", { count: "exact", head: true }),
            supabase
              .from("profiles")
              .select("id, full_name, email, role, created_at")
              .order("created_at", { ascending: false })
              .limit(5),
            supabase
              .from("subscriptions")
              .select("*", { count: "exact", head: true })
              .eq("status", "pending"),
          ]);

        setStats({
          members: membersRes.count || 0,
          trainers: trainersRes.count || 0,
          classes: classesRes.count || 0,
          bookings: bookingsRes.count || 0,
          pendingSubs: pendingSubsRes.count || 0,
        });
        setRecentMembers(recentRes.data || []);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} title="Total Members" value={stats.members} color="primary" />
        <StatCard icon={Award} title="Trainers" value={stats.trainers} color="accent" />
        <StatCard icon={Dumbbell} title="Classes" value={stats.classes} color="success" />
        <StatCard icon={CalendarDays} title="Bookings" value={stats.bookings} color="warning" />
        <StatCard icon={CreditCard} title="Pending Subs" value={stats.pendingSubs} subtitle="Awaiting confirmation" color="primary" />
      </div>

      <div className="mt-10 rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-base font-semibold text-text-primary">
            Recent Users
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Name
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Email
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Role
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentMembers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 font-medium text-text-primary">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-text-muted">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function TrainerDashboard({ profile }) {
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState({ totalClasses: 0, totalBookings: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrainerData() {
      try {
        const { data: trainerData } = await supabase
          .from("trainers")
          .select("id")
          .eq("profile_id", profile.id)
          .single();

        if (!trainerData) return;

        const { data: classesData } = await supabase
          .from("classes")
          .select("*, bookings(count)")
          .eq("trainer_id", trainerData.id)
          .order("schedule", { ascending: true });

        const classList = classesData || [];
        setClasses(classList);

        const now = new Date().toISOString();
        const totalBookings = classList.reduce(
          (sum, cls) => sum + (cls.bookings?.[0]?.count || 0),
          0
        );
        const upcomingClasses = classList.filter(
          (cls) => cls.schedule && cls.schedule > now
        ).length;

        setStats({
          totalClasses: classList.length,
          totalBookings,
          upcoming: upcomingClasses,
        });
      } catch (err) {
        console.error("Failed to load trainer data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrainerData();
  }, [profile.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard icon={Dumbbell} title="My Classes" value={stats.totalClasses} color="primary" />
        <StatCard icon={CalendarDays} title="Total Bookings" value={stats.totalBookings} color="accent" />
        <StatCard icon={Clock} title="Upcoming" value={stats.upcoming} color="success" />
      </div>

      <div className="mt-10 rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-base font-semibold text-text-primary">My Classes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Title
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Schedule
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Capacity
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Bookings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td className="px-6 py-4 font-medium text-text-primary">{cls.title}</td>
                  <td className="px-6 py-4 text-text-secondary">
                    {cls.schedule
                      ? new Date(cls.schedule).toLocaleString()
                      : "Not scheduled"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{cls.capacity}</td>
                  <td className="px-6 py-4 text-text-secondary">
                    {cls.bookings?.[0]?.count || 0}
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-text-muted">
                    No classes created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function MemberDashboard({ profile }) {
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [memberRecord, setMemberRecord] = useState(null);
  const [activeSubs, setActiveSubs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    async function fetchMemberData() {
      try {
        const [classesRes, memberRes] = await Promise.all([
          supabase
            .from("classes")
            .select("*, trainers(id, profiles(full_name))")
            .order("schedule", { ascending: true }),
          supabase
            .from("members")
            .select("*")
            .eq("profile_id", profile.id)
            .single(),
        ]);

        setClasses(classesRes.data || []);
        setMemberRecord(memberRes.data);

        if (memberRes.data) {
          const [bookingsResult, subsResult] = await Promise.all([
            supabase
              .from("bookings")
              .select("*, classes(title, schedule)")
              .eq("member_id", memberRes.data.id)
              .order("booked_at", { ascending: false })
              .limit(5),
            supabase
              .from("subscriptions")
              .select("*", { count: "exact", head: true })
              .eq("member_id", memberRes.data.id)
              .eq("status", "active"),
          ]);
          setMyBookings(bookingsResult.data || []);
          setActiveSubs(subsResult.count || 0);
        }
      } catch (err) {
        console.error("Failed to load member data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMemberData();
  }, [profile.id]);

  async function handleBookClass(classId) {
    if (!memberRecord) return;
    setBookingInProgress(classId);
    try {
      const { error } = await supabase
        .from("bookings")
        .insert({ class_id: classId, member_id: memberRecord.id });
      if (error) throw error;

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*, classes(title, schedule)")
        .eq("member_id", memberRecord.id)
        .order("booked_at", { ascending: false })
        .limit(5);
      setMyBookings(bookingsData || []);
    } catch (err) {
      console.error("Booking failed:", err);
      alert(err.message);
    } finally {
      setBookingInProgress(null);
    }
  }

  async function handleCancelBooking(bookingId) {
    if (!window.confirm("Cancel this booking?")) return;
    setCancellingId(bookingId);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw error;
      setMyBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b
        )
      );
    } catch (err) {
      console.error("Cancel failed:", err);
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const bookedClassIds = new Set(
    myBookings.filter((b) => b.status === "confirmed").map((b) => b.class_id)
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          title="Active Bookings"
          value={myBookings.filter((b) => b.status === "confirmed").length}
          color="primary"
        />
        <StatCard
          icon={Dumbbell}
          title="Available Classes"
          value={classes.length}
          color="accent"
        />
        <StatCard
          icon={CreditCard}
          title="Active Subscriptions"
          value={activeSubs}
          color="success"
        />
        <StatCard
          icon={CalendarDays}
          title="Membership"
          value={memberRecord?.membership_type || "Standard"}
          subtitle={memberRecord?.is_active ? "Active" : "Inactive"}
          color="success"
        />
      </div>

      <div className="mt-10">
        <h2 className="text-base font-semibold text-text-primary mb-5">
          Available Classes
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const isBooked = bookedClassIds.has(cls.id);
            const trainerName = cls.trainers?.profiles?.full_name || "Staff";
            return (
              <div
                key={cls.id}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <h3 className="font-semibold text-text-primary leading-snug">
                  {cls.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2">
                  {cls.description || "No description"}
                </p>
                <div className="mt-4 space-y-2 text-xs text-text-muted">
                  <p className="flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 shrink-0" />
                    {trainerName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {cls.schedule
                      ? new Date(cls.schedule).toLocaleString()
                      : "TBD"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    Capacity: {cls.capacity}
                  </p>
                </div>
                {isBooked ? (
                  <button
                    onClick={() => {
                      const booking = myBookings.find(
                        (b) => b.class_id === cls.id && b.status === "confirmed"
                      );
                      if (booking) handleCancelBooking(booking.id);
                    }}
                    disabled={cancellingId !== null}
                    className="mt-5 w-full rounded-lg border border-danger px-4 py-2.5 text-sm font-medium text-danger hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancellingId &&
                    myBookings.find(
                      (b) => b.class_id === cls.id && b.status === "confirmed"
                    )?.id === cancellingId
                      ? "Cancelling..."
                      : "Cancel Booking"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleBookClass(cls.id)}
                    disabled={bookingInProgress === cls.id}
                    className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                  >
                    {bookingInProgress === cls.id ? "Booking..." : "Book Class"}
                  </button>
                )}
              </div>
            );
          })}
          {classes.length === 0 && (
            <p className="col-span-full py-10 text-center text-text-muted">
              No classes available right now
            </p>
          )}
        </div>
      </div>

      {myBookings.length > 0 && (
        <div className="mt-10 rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-base font-semibold text-text-primary">
              Recent Bookings
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Class
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Schedule
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Booked
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 font-medium text-text-primary">
                      {booking.classes?.title}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {booking.classes?.schedule
                        ? new Date(booking.classes.schedule).toLocaleString()
                        : "TBD"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {new Date(booking.booked_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {booking.status === "confirmed" ? (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-danger hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
                        </button>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
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

function StatusBadge({ status }) {
  const styles = {
    confirmed: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700",
    completed: "bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        styles[status] || styles.confirmed
      }`}
    >
      {status}
    </span>
  );
}
