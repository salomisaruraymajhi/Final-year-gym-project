import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { useNavigate, Navigate } from "react-router-dom";
import { Dumbbell, Lock, Loader2, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const { user, isRecovery, clearRecovery, signOut } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user || !isRecovery) {
    return <Navigate to="/login" replace />;
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      clearRecovery();
      await signOut();
      navigate("/login", {
        state: { message: "Password reset successful. Sign in with your new password." },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar items-center justify-center p-16">
        <div className="max-w-md text-center">
          <Dumbbell className="mx-auto h-16 w-16 text-primary mb-8" />
          <h1 className="text-3xl font-bold text-white mb-4">GymSphere</h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            You&apos;re almost there. Set your new password below and you&apos;ll
            be back on track.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden flex items-center justify-center gap-3">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-text-primary">GymSphere</span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary leading-tight">
            Set new password
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Choose a strong password for your account
          </p>

          {error && (
            <div className="mt-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-danger leading-normal">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <p className="mt-1.5 text-xs text-text-muted">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Confirm password
              </label>
              <div className="relative">
                <CheckCircle className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
