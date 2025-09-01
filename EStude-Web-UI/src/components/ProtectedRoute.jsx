import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import authService from "../services/authService";

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();
  const isLoggedIn = authService.isTokenValid();
  if (!isLoggedIn || !user) {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
