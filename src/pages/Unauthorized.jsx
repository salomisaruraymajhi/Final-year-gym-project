import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <ShieldX className="mx-auto h-16 w-16 text-danger mb-4" />
        <h1 className="text-2xl font-bold text-text-primary">Access Denied</h1>
        <p className="mt-2 text-text-secondary max-w-sm">
          You do not have permission to access this page. Contact your administrator
          if you believe this is a mistake.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
