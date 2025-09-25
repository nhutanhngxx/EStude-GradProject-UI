import { useContext, useState, useEffect } from "react";
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
  Edit,
} from "lucide-react";
import bannerLight from "../../assets/banner-light.png";
import bannerDark from "../../assets/banner-dark.png";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";

export default function TeacherSidebar() {
  const [open, setOpen] = useState(true);
  const { darkMode } = useContext(ThemeContext);
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language || "vi");

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
      setCurrentLang(savedLang);
    }
  }, [i18n]);

  const toggleLanguage = () => {
    const newLang = currentLang === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
    setCurrentLang(newLang);
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.admin === true;

  const menuItems = [
    { key: "overview", path: "/teacher/dashboard", icon: <Home size={20} /> },
    {
      key: "myClasses",
      path: "/teacher/my-classes",
      icon: <GraduationCap size={20} />,
    },
    ...(isAdmin
      ? [
          {
            key: "manageClasses",
            path: "/teacher/classes",
            icon: <Clipboard size={20} />,
          },
          {
            key: "manageSubjects",
            path: "/teacher/subjects",
            icon: <Book size={20} />,
          },
        ]
      : []),
    {
      key: "grades",
      path: "/teacher/grades",
      icon: <Edit size={20} />,
    },
    {
      key: "schedules",
      path: "/teacher/schedules",
      icon: <FileText size={20} />,
    },
    {
      key: "notifications",
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
