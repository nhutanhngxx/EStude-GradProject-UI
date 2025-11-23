import { useContext, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Menu,
  Home,
  BookOpen,
  FileText,
  ClipboardList,
  Calendar,
  Brain,
  MapPin,
  TrendingUp,
} from "lucide-react";
import bannerLight from "../../assets/banner-light.png";
import bannerDark from "../../assets/banner-dark.png";
import { ThemeContext } from "../../contexts/ThemeContext";

export default function StudentSidebar() {
  const [open, setOpen] = useState(true);
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1600) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { name: "Trang chủ", path: "/student/dashboard", icon: <Home size={20} /> },
    {
      name: "Môn học",
      path: "/student/subjects",
      icon: <BookOpen size={20} />,
    },
    {
      name: "Đánh giá",
      path: "/student/assessment",
      icon: <ClipboardList size={20} />,
    },
    {
      name: "Lịch học",
      path: "/student/schedule",
      icon: <Calendar size={20} />,
    },
    {
      name: "Bản đồ năng lực",
      path: "/student/competency-map",
      icon: <Brain size={20} />,
    },
    {
      name: "Lộ trình học tập",
      path: "/student/learning-roadmap",
      icon: <MapPin size={20} />,
    },
    {
      name: "Thống kê",
      path: "/student/statistics",
      icon: <TrendingUp size={20} />,
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
                      ? "bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-white"
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
