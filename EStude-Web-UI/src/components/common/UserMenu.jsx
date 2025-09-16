import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Mail, Phone, Calendar, User, Shield } from "lucide-react";

const UserMenu = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const menuRef = useRef(null);

  if (!user) return null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setOpen((prev) => !prev)}
        >
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.fullName || user.username
            )}&background=random`}
            alt="User Avatar"
            className="w-8 h-8 rounded-full"
          />
          <span className="hidden sm:inline text-gray-800 dark:text-white font-medium">
            {user.fullName || user.username}
          </span>
        </div>

        {/* Dropdown */}
        <div
          className={`absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-50 transform transition-all duration-200 origin-top-right
            ${
              open
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
            }`}
        >
          <button
            onClick={() => {
              setOpen(false);
              setShowModal(true);
            }}
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <User size={18} />
            Xem thông tin tài khoản
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-700 dark:hover:text-white"
          >
            <Shield size={18} />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Modal */}
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-200 
          ${showModal ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        ></div>

        {/* Modal content */}
        <div
          className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-96 max-w-full z-10 transform transition-all duration-200
            ${showModal ? "scale-100" : "scale-50"}`}
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.fullName || user.username
              )}&background=random&size=128`}
              alt="User Avatar"
              className="w-24 h-24 rounded-full shadow-md mb-3"
            />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {user.fullName || user.username}
            </h2>
            <span className="px-3 py-1 mt-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200">
              {user.role === "ADMIN"
                ? "QUẢN TRỊ VIÊN"
                : user.role === "TEACHER"
                ? "GIÁO VIÊN"
                : user.role}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 dark:text-gray-300">
            {user.email && (
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-500 dark:text-gray-400" />
                <span>{user.email}</span>
              </div>
            )}
            {user.numberPhone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-500 dark:text-gray-400" />
                <span>{user.numberPhone}</span>
              </div>
            )}
            {user.dob && (
              <div className="flex items-center gap-2">
                <Calendar
                  size={16}
                  className="text-gray-500 dark:text-gray-400"
                />
                <span>{user.dob}</span>
              </div>
            )}
            {user.role === "ADMIN" && user.adminCode && (
              <div className="flex items-center gap-2">
                <Shield
                  size={16}
                  className="text-gray-500 dark:text-gray-400"
                />
                <span>Mã Admin: {user.adminCode}</span>
              </div>
            )}
            {user.role === "TEACHER" && user.teacherCode && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-500 dark:text-gray-400" />
                <span>Mã Giáo viên: {user.teacherCode}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserMenu;
