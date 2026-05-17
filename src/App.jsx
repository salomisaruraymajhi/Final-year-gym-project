import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import ManageClasses from "./pages/ManageClasses";
import MyBookings from "./pages/MyBookings";
import Members from "./pages/Members";
import Trainers from "./pages/Trainers";
import Profile from "./pages/Profile";
import Unauthorized from "./pages/Unauthorized";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Packages from "./pages/Packages";
import Subscriptions from "./pages/Subscriptions";
import MySubscriptions from "./pages/MySubscriptions";

export default function App() {
  const { isRecovery } = useAuth();

  if (isRecovery) {
    return (
      <Routes>
        <Route path="*" element={<ResetPassword />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute allowedRoles={["member"]}>
            <MyBookings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/classes/manage"
        element={
          <ProtectedRoute allowedRoles={["admin", "trainer"]}>
            <ManageClasses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/packages"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Packages />
          </ProtectedRoute>
        }
      />

      <Route
        path="/subscriptions"
        element={
          <ProtectedRoute allowedRoles={["admin", "trainer"]}>
            <Subscriptions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-subscriptions"
        element={
          <ProtectedRoute allowedRoles={["member"]}>
            <MySubscriptions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/members"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Members />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainers"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Trainers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
