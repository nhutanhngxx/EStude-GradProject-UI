import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

const UserMenu = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const menuRef = useRef(null);

  if (!user) return null;

  // Đóng menu khi click ra ngoài
  // eslint-disable-next-line react-hooks/rules-of-hooks
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
              user.username
            )}&background=random`}
            alt="User Avatar"
            className="w-8 h-8 rounded-full"
          />
          <span className="hidden sm:inline text-gray-800 dark:text-white">
            {user.username} ({user.role})
          </span>
        </div>

        {/* Dropdown menu với hiệu ứng trượt */}
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
            onClick={() => {
              logout();
            }}
            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-700 dark:hover:text-white"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Modal thông tin tài khoản */}
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-200 
          ${showModal ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      >
        {/* Nền tối */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setShowModal(false)}
        ></div>

        {/* Nội dung modal với animation scale */}
        <div
          className={`relative bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-96 z-10 transform transition-all duration-200
            ${showModal ? "scale-100" : "scale-50"}
          `}
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Thông tin tài khoản
          </h2>

          <div className="flex items-center gap-4 mb-4">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.username
              )}&background=random`}
              alt="User Avatar"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="text-gray-800 dark:text-gray-200">
                <strong>Tên:</strong> {user.username}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Vai trò:</strong> {user.role}
              </p>
              {user.email && (
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Email:</strong> {user.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition"
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
