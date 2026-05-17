import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { Dumbbell, Mail, Loader2, ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSendReset(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (resetError) throw resetError;
      setSent(true);
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
            Don&apos;t worry, it happens to the best of us. We&apos;ll help you
            get back into your account.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden flex items-center justify-center gap-3">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-text-primary">GymSphere</span>
          </div>

          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>

          {sent ? (
            <div className="text-center">
              <MailCheck className="mx-auto h-12 w-12 text-success mb-4" />
              <h2 className="text-2xl font-bold text-text-primary leading-tight">
                Check your email
              </h2>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                We sent a password reset link to{" "}
                <span className="font-medium text-text-primary">{email}</span>.
                Click the link in the email to set your new password.
              </p>
              <p className="mt-4 text-xs text-text-muted">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="font-medium text-primary hover:text-primary-hover"
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-text-primary leading-tight">
                Reset your password
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Enter your email and we&apos;ll send you a reset link
              </p>

              {error && (
                <div className="mt-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-danger leading-normal">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendReset} className="mt-8 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
