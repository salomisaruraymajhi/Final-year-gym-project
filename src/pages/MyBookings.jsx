import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import Layout from "../components/Layout";
import { Loader2, CalendarDays, XCircle } from "lucide-react";

export default function MyBookings() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data: memberData } = await supabase
        .from("members")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (!memberData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select(
          "*, classes(title, description, schedule, capacity, trainers(profiles(full_name)))"
        )
        .eq("member_id", memberData.id)
        .order("booked_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function handleCancel(bookingId) {
    if (!window.confirm("Cancel this booking?")) return;
    setCancellingId(bookingId);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw error;
      setBookings((prev) =>
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
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const pastBookings = bookings.filter((b) => b.status !== "confirmed");

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">My Bookings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          View and manage your class bookings
        </p>
      </div>

      {confirmedBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Active Bookings
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {confirmedBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                cancelling={cancellingId === booking.id}
              />
            ))}
          </div>
        </div>
      )}

      {pastBookings.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Past Bookings
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CalendarDays className="h-12 w-12 text-text-muted mb-3" />
          <h3 className="font-semibold text-text-primary">No bookings yet</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Head to the dashboard to browse and book classes
          </p>
        </div>
      )}
    </Layout>
  );
}

function BookingCard({ booking, onCancel, cancelling }) {
  const classData = booking.classes;
  const trainerName = classData?.trainers?.profiles?.full_name || "Staff";
  const isConfirmed = booking.status === "confirmed";

  const statusStyles = {
    confirmed: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700",
    completed: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-text-primary">
          {classData?.title || "Unknown Class"}
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
            statusStyles[booking.status] || statusStyles.confirmed
          }`}
        >
          {booking.status}
        </span>
      </div>

      <p className="mt-2 text-sm text-text-secondary line-clamp-2">
        {classData?.description || "No description"}
      </p>

      <div className="mt-3 space-y-1 text-xs text-text-muted">
        <p>Trainer: {trainerName}</p>
        <p>
          Schedule:{" "}
          {classData?.schedule
            ? new Date(classData.schedule).toLocaleString()
            : "TBD"}
        </p>
        <p>
          Booked on: {new Date(booking.booked_at).toLocaleDateString()}
        </p>
      </div>

      {isConfirmed && onCancel && (
        <button
          onClick={() => onCancel(booking.id)}
          disabled={cancelling}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-red-50 disabled:opacity-50"
        >
          {cancelling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {cancelling ? "Cancelling..." : "Cancel Booking"}
        </button>
      )}
    </div>
  );
}
