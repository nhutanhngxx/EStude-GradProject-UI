import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaBars,
  FaHome,
  FaChalkboard,
  FaClipboardList,
  FaTasks,
  FaBell,
  FaChalkboardTeacher,
  FaBrain,
  FaFileAlt,
} from "react-icons/fa";
import { FaBook } from "react-icons/fa6";
import bannerLight from "../../assets/banner-light.png";

export default function TeacherSidebar() {
  const [open, setOpen] = useState(true);

  const menuItems = [
    { name: "Tổng quan", path: "/teacher/dashboard", icon: <FaHome /> },
    {
      name: "Quản lý lớp học",
      path: "/teacher/classes",
      icon: <FaChalkboard />,
    },
    {
      name: "Quản lý môn học",
      path: "/teacher/subjects",
      icon: <FaBook />,
    },
    {
      name: "Quản lý điểm danh",
      path: "/teacher/attendance",
      icon: <FaClipboardList />,
    },
    {
      name: "Lịch giảng dạy",
      path: "/teacher/schedules",
      icon: <FaChalkboardTeacher />,
    },
    { name: "Thông báo", path: "/teacher/notifications", icon: <FaBell /> },
    { name: "Công cụ hỗ trợ AI", path: "/teacher/ai-tools", icon: <FaBrain /> },
    {
      name: "Phân tích và báo cáo",
      path: "/teacher/statistics-reports",
      icon: <FaFileAlt />,
    },
  ];

  return (
    <div
      className={`${
        open ? "w-64" : "w-16"
      } bg-white transition-all duration-300 flex flex-col min-h-screen`}
    >
      <button
        className="px-4 py-6 focus:outline-none"
        onClick={() => {
          if (window.innerWidth >= 720) setOpen(!open);
        }}
      >
        <FaBars />
      </button>

      {/* Menu items */}
      <nav className="flex-1">
        <ul>
          {menuItems.map((item, idx) => (
            <li key={idx}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `p-4 flex items-center gap-2 hover:bg-green-300 transition , ${
                    isActive ? "bg-blue-800 text-white" : ""
                  }`
                }
              >
                {item.icon}
                {open && <span>{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
