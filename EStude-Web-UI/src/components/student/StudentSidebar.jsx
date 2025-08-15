import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaBars,
  FaHome,
  FaClipboardList,
  FaBook,
  FaChartLine,
  FaBell,
} from "react-icons/fa";

export default function StudentSidebar() {
  const [open, setOpen] = useState(true);

  const menuItems = [
    { name: "Trang chủ", path: "/student/dashboard", icon: <FaHome /> },
    {
      name: "Điểm danh",
      path: "/student/attendance",
      icon: <FaClipboardList />,
    },
    { name: "Môn học", path: "/student/courses", icon: <FaBook /> },
    { name: "Lớp học của tôi", path: "/student/grades", icon: <FaChartLine /> },
    { name: "Thông báo", path: "/student/notifications", icon: <FaBell /> },
  ];

  return (
    <div
      className={`${
        open ? "w-64" : "w-16"
      } bg-purple-600 text-white transition-all duration-300 flex flex-col min-h-screen`}
    >
      {/* Toggle button */}
      <button className="p-4 focus:outline-none" onClick={() => setOpen(!open)}>
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
                  `p-4 flex items-center gap-2 hover:bg-purple-700 transition ${
                    isActive ? "bg-purple-800" : ""
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
