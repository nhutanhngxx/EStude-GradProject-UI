import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
          className={`absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-50 transform transition-all duration-200 origin-top-right
            ${
              open
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
            }
          `}
        >
          <button
            onClick={() => {
              setOpen(false);
              setShowModal(true);
            }}
            className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Xem thông tin tài khoản
          </button>
          <button
            onClick={logout}
            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-700 dark:hover:text-white"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Modal */}
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-200 
          ${showModal ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setShowModal(false)}
        ></div>

        {/* Modal content */}
        <div
          className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-96 z-10 transform transition-all duration-200
            ${showModal ? "scale-100" : "scale-50"}
          `}
        >
          {/* Header */}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
            Thông tin tài khoản
          </h2>

          {/* User info */}
          <div className="flex flex-col items-center text-center mb-6">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.fullName || user.username
              )}&background=random&size=128`}
              alt="User Avatar"
              className="w-20 h-20 rounded-full shadow-md mb-3"
            />
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {user.fullName || user.username}
            </p>
            <span className="px-3 py-1 mt-1 text-sm rounded-full bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200">
              {user.role}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            {user.email && (
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> {user.email}
              </p>
            )}
            {user.numberPhone && (
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Số điện thoại:</strong> {user.numberPhone}
              </p>
            )}
            {user.dob && (
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Ngày sinh:</strong> {user.dob}
              </p>
            )}
            {/* Nếu là Admin */}
            {user.role === "ADMIN" && user.adminCode && (
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Mã Admin:</strong> {user.adminCode}
              </p>
            )}
            {/* Nếu là Teacher */}
            {user.role === "TEACHER" && user.teacherCode && (
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Mã Giáo viên:</strong> {user.teacherCode}
              </p>
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
