import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Menu,
  Home,
  Users,
  GraduationCap,
  FileBarChart,
  Bell,
  School,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import bannerLight from "../../assets/banner-light.png";
import bannerDark from "../../assets/banner-dark.png";

export default function AdminSidebar() {
  const [open, setOpen] = useState(true);
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  const { i18n: i18next } = useTranslation(); // lấy i18n instance
  const currentLang = i18next.language || "vi"; // luôn đọc từ i18n

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedLang = localStorage.getItem("language");

    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    if (savedLang) {
      i18next.changeLanguage(savedLang);
    }
  }, [i18next]);

  const menuItems = [
    { key: "overview", path: "/admin/dashboard", icon: <Home size={20} /> },
    { key: "schools", path: "/admin/schools", icon: <School size={20} /> },
    { key: "users", path: "/admin/users", icon: <Users size={20} /> },
    {
      key: "classes",
      path: "/admin/classes",
      icon: <GraduationCap size={20} />,
    },
    // {
    //   key: "reports",
    //   path: "/admin/statistics-reports",
    //   icon: <FileBarChart size={20} />,
    // },
    {
      key: "notifications",
      path: "/admin/notifications",
      icon: <Bell size={20} />,
    },
  ];

  return (
    <div
      className={`${
        open ? "w-56" : "w-16"
      } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col min-h-screen`}
    >
      {/* Toggle button */}
      <button
        className="p-4 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
        onClick={() => {
          if (window.innerWidth >= 720) setOpen(!open);
        }}
      >
        {!open && <Menu size={20} />}
        {open && (
          <img
            src={darkMode ? bannerDark : bannerLight}
            alt="EStude Banner"
            className="w-[100px] sm:w-[130px]"
          />
        )}
      </button>

      {/* Menu items */}
      <nav className="flex-1 mt-2">
        <ul className="flex flex-col gap-5 px-2">
          {/* Thêm gap giữa các li */}
          {menuItems.map((item, idx) => (
            <li key={idx}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `p-3 flex items-center gap-3 text-sm font-medium transition rounded-lg
    ${
      isActive
        ? "bg-green-100 dark:bg-green-700 text-green-800 dark:text-white"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`
                }
              >
                {item.icon}
                {open && (
                  <span className="hidden sm:inline">
                    {t(`sidebar.${item.key}`)}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
