import { useNavigate } from "react-router-dom";
import bannerLight from "../assets/banner-light.png";
import bannerDark from "../assets/banner-dark.png";
import { useEffect, useState } from "react";

export default function RoleSelection() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  // kiểm tra theme từ localStorage hoặc prefers-color-scheme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
      if (savedTheme === "dark") document.documentElement.classList.add("dark");
    } else {
      const darkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDark(darkMode);
      if (darkMode) document.documentElement.classList.add("dark");
    }
  }, []);

  // đổi theme
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

  const roles = [
    { name: "Giáo viên", value: "teacher" },
    { name: "Admin", value: "admin" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-4">
      {/* Toggle dark mode button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600"
      >
        {isDark ? "☀️" : "🌙"}
      </button>

      <img
        src={isDark ? bannerDark : bannerLight}
        alt="EStude Banner"
        className="w-[400px] sm:w-[500px] mb-8"
      />
      <h1 className="text-4xl font-extrabold tracking-wide">Bạn là ai?</h1>

      <p className="mt-2 text-lg opacity-90 mb-6">
        Chọn vai trò để đăng nhập vào hệ thống
      </p>

      <div className="grid gap-6 sm:grid-cols-2 max-w-lg w-full">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => navigate(`/login?role=${role.value}`)}
            className="bg-white text-green-700 h-24 w-full rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-2 border border-green-200 hover:bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900"
          >
            <span className="text-xl font-semibold">{role.name}</span>
            <span className="text-sm text-gray-500 dark:text-gray-300">
              Đăng nhập với tư cách {role.name.toLowerCase()}
            </span>
          </button>
        ))}
      </div>

      <p className="absolute bottom-4 text-sm opacity-80 text-center w-full">
        © 2025 ESTUDE - Graduation Project
      </p>
    </div>
  );
}
