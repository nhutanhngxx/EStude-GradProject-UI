import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import authService from "../services/authService";

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();
  const isLoggedIn = authService.isTokenValid();

  if (!isLoggedIn || !user) {
    // Chưa đăng nhập ==> quay về login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Đã login nhưng không có quyền truy cập
    return <Navigate to="/" replace />;
  }

  // Hợp lệ → render tiếp route con
  return <Outlet />;
}
