import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import {
  Mail,
  Phone,
  Calendar,
  User,
  Shield,
  LogOut,
  X,
  Camera,
} from "lucide-react";
import userService from "../../services/userService";
import { useToast } from "../../contexts/ToastContext";

const Example = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("userMenu.accountInfo")}</h1>
      <button>{t("common.close")}</button>
    </div>
  );
};

const UserMenu = () => {
  const { user, logout, updateUser } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  if (!user) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input để có thể chọn lại cùng file
    e.target.value = "";

    try {
      setUploading(true);
      const updatedUser = await userService.updateAvatar(user.userId, file);

      // Update user in context if updateUser function exists
      if (updateUser && updatedUser.avatarPath) {
        updateUser({ ...user, avatarPath: updatedUser.avatarPath });
      }

      showToast("Cập nhật avatar thành công!", "success");

      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      showToast(error.message || "Lỗi khi cập nhật avatar", "error");
    } finally {
      setUploading(false);
    }
  };

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
      {/* Avatar + Name */}
      <div className="relative" ref={menuRef}>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setOpen((prev) => !prev)}
        >
          <img
            src={
              user.avatarPath ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.fullName || user.username
              )}&background=random`
            }
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
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-700 transition-colors rounded-lg"
          >
            <User size={18} />
            {t("userMenu.accountInfo")}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-700 dark:hover:text-white transition-colors rounded-lg"
          >
            <LogOut size={18} />
            {t("userMenu.logout")}
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
          <div className="flex flex-col items-center mb-6 relative">
            {/* Avatar with camera overlay */}
            <div className="relative group mb-3">
              <img
                src={
                  user.avatarPath ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.fullName || user.username
                  )}&background=random&size=128`
                }
                alt="User Avatar"
                className="w-24 h-24 rounded-full shadow-md"
              />
              {/* Camera overlay - appears on hover */}
              <div
                onClick={handleAvatarClick}
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer"
              >
                <Camera
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  size={24}
                />
              </div>
              {/* Loading spinner */}
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {user.fullName || user.username}
            </h2>
            <span
              className={`px-3 py-1 mt-1 text-sm font-medium rounded-full ${
                user.role === "ADMIN"
                  ? "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200"
                  : user.role === "TEACHER"
                  ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200"
              }`}
            >
              {user.role === "ADMIN"
                ? t("roles.admin")
                : user.role === "TEACHER"
                ? t("roles.teacher")
                : t("roles.student")}
            </span>

            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
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
                <span>
                  {t("userMenu.adminCode")}: {user.adminCode}
                </span>
              </div>
            )}
            {user.role === "TEACHER" && user.teacherCode && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-500 dark:text-gray-400" />
                <span>
                  {t("userMenu.teacherCode")}: {user.teacherCode}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          {/* <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              {t("common.close")}
            </button>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default UserMenu;
