import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaBars,
  FaHome,
  FaUsers,
  FaChalkboardTeacher,
  FaFileAlt,
  FaBell,
  FaSchool,
} from "react-icons/fa";
import bannerLight from "../../assets/banner-light-white.png";

export default function AdminSidebar() {
  const [open, setOpen] = useState(true);

  const menuItems = [
    { name: "Tổng quan", path: "/admin/dashboard", icon: <FaHome /> },
    { name: "Quản lý trường học", path: "/admin/schools", icon: <FaSchool /> },
    { name: "Quản lý người dùng", path: "/admin/users", icon: <FaUsers /> },
    {
      name: "Quản lý lớp học",
      path: "/admin/classes",
      icon: <FaChalkboardTeacher />,
    },
    {
      name: "Phân tích & Báo cáo",
      path: "/admin/statistics-reports",
      icon: <FaFileAlt />,
    },
    { name: "Gửi thông báo", path: "/admin/notifications", icon: <FaBell /> },
  ];

  return (
    <div
      className={`${
        open ? "w-64" : "w-16"
      } bg-green-600 text-white transition-all duration-300 flex flex-col min-h-screen`}
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
                  `p-4 flex items-center gap-2 hover:bg-green-700 transition ${
                    isActive ? "bg-green-800" : ""
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
