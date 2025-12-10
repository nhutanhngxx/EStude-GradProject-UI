import { useNavigate } from "react-router-dom";
import bannerLight from "../assets/banner-light.png";
import bannerDark from "../assets/banner-dark.png";
import { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContext";
import { Sun, Moon, Globe } from "lucide-react";

export default function RoleSelection() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const roles = [
    // {
    //   name: "Học sinh",
    //   value: "student",
    //   color: "blue",
    //   lightBg: "bg-white",
    //   lightText: "text-blue-700",
    //   lightBorder: "border-blue-200",
    //   lightHover: "hover:bg-blue-50",
    //   darkBg: "dark:bg-gray-800",
    //   darkText: "dark:text-blue-400",
    //   darkBorder: "dark:border-blue-700",
    //   darkHover: "dark:hover:bg-blue-900",
    // },
    {
      name: "Giáo viên",
      value: "teacher",
      color: "green",
      lightBg: "bg-white",
      lightText: "text-green-700",
      lightBorder: "border-green-200",
      lightHover: "hover:bg-green-50",
      darkBg: "dark:bg-gray-800",
      darkText: "dark:text-green-400",
      darkBorder: "dark:border-green-700",
      darkHover: "dark:hover:bg-green-900",
    },
    {
      name: "Admin",
      value: "admin",
      color: "red",
      lightBg: "bg-white",
      lightText: "text-red-700",
      lightBorder: "border-red-200",
      lightHover: "hover:bg-red-50",
      darkBg: "dark:bg-gray-800",
      darkText: "dark:text-red-400",
      darkBorder: "dark:border-red-700",
      darkHover: "dark:hover:bg-red-900",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-4">
      {/* Toggle dark mode button */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600"
      >
        {darkMode ? (
          <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-400" />
        )}
      </button>

      <img
        src={darkMode ? bannerDark : bannerLight}
        alt="EStude Banner"
        className="w-[260px] sm:w-[400px] lg:w-[500px] mb-6 sm:mb-8"
      />
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-wide text-center">
        Bạn là ai?
      </h1>

      <p className="mt-2 text-base sm:text-lg opacity-90 mb-6 text-center">
        Chọn vai trò để đăng nhập vào hệ thống
      </p>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 w-full max-w-xs sm:max-w-4xl">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => navigate(`/login?role=${role.value}`)}
            className={`${role.lightBg} ${role.lightText} h-20 sm:h-24 w-full rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 border ${role.lightBorder} ${role.lightHover} ${role.darkBg} ${role.darkText} ${role.darkBorder} ${role.darkHover}`}
          >
            <span className="text-lg sm:text-xl font-semibold">
              {role.name}
            </span>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 px-2 text-center">
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
