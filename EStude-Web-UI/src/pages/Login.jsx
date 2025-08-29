import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import authService from "../services/authService";
import bannerLight from "../assets/banner-light.png";
import bannerDark from "../assets/banner-dark.png";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const success = await login({
        username,
        password,
        role: role.toLowerCase(),
      });
      if (!success) {
        setError("Đăng nhập thất bại");
        return;
      }

      alert("Đăng nhập thành công");

      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser) {
        setError("Không tìm thấy thông tin người dùng");
        return;
      }

      const roleRoutes = {
        ADMIN: "/admin",
        TEACHER: "/teacher",
        STUDENT: "/student",
      };

      const redirectPath = roleRoutes[storedUser.role] || "/login";
      navigate(redirectPath);
    } catch (err) {
      console.error("Lỗi khi đăng nhập:", err);
      setError("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Banner */}
        <img
          src={
            window.matchMedia("(prefers-color-scheme: dark)").matches
              ? bannerDark
              : bannerLight
          }
          alt="EStude Banner"
          className="w-[260px] sm:w-[320px] mb-6"
        />

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl font-extrabold mb-2 capitalize text-center">
            Đăng nhập {role}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            Vui lòng nhập thông tin để tiếp tục
          </p>

          {error && (
            <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
          )}

          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 w-full p-3 rounded-lg mb-4 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 w-full p-3 rounded-lg mb-2 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          {/* Quên mật khẩu */}
          <div className="flex justify-end mt-2 mb-6 text-sm">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-green-600 hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>

          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-3 rounded-lg w-full font-semibold hover:bg-green-700 transition-all shadow-md"
          >
            Đăng nhập
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-sm opacity-80 text-center py-4">
        © 2025 EStude - Graduation Project
      </p>
    </div>
  );
}
