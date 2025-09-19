import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Menu,
  Home,
  Users,
  GraduationCap,
  FileText,
  Bell,
  Book,
  Clipboard,
} from "lucide-react";
import bannerLight from "../../assets/banner-light.png";
import bannerDark from "../../assets/banner-dark.png";

export default function TeacherSidebar() {
  const [open, setOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.admin === true;

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const menuItems = [
    {
      key: "overview",
      name: "Tổng quan",
      path: "/teacher/dashboard",
      icon: <Home size={20} />,
    },
    {
      key: "myClasses",
      name: "Lớp giảng dạy",
      path: "/teacher/my-classes",
      icon: <GraduationCap size={20} />,
    },
    ...(isAdmin
      ? [
          {
            key: "manageClasses",
            name: "Quản lý lớp học",
            path: "/teacher/classes",
            icon: <Clipboard size={20} />,
          },
          {
            key: "manageSubjects",
            name: "Quản lý môn học",
            path: "/teacher/subjects",
            icon: <Book size={20} />,
          },
        ]
      : []),
    {
      key: "schedules",
      name: "Lịch giảng dạy",
      path: "/teacher/schedules",
      icon: <FileText size={20} />,
    },
    {
      key: "notifications",
      name: "Thông báo",
      path: "/teacher/notifications",
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
        onClick={() => setOpen((prev) => !prev)}
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
        <ul className="flex flex-col gap-3 px-2">
          {menuItems.map((item, idx) => (
            <li key={idx}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `p-3 flex items-center gap-3 text-sm font-medium transition rounded-lg ${
                    isActive
                      ? "bg-green-100 dark:bg-green-700 text-green-800 dark:text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                {item.icon}
                {open && <span className="hidden sm:inline">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
