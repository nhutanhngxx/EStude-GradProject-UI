import React, { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const NotificationBell = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const menuRef = useRef(null);

  const notifications = [
    { id: 1, text: t("notifications.newAssignment"), time: "5 phút trước" },
    { id: 2, text: t("notifications.classStart"), time: "1 giờ trước" },
    { id: 3, text: t("notifications.gradeUpdated"), time: t("time.yesterday") },
    { id: 4, text: t("notifications.newTeacherNotice"), time: "2 ngày trước" },
    { id: 5, text: t("notifications.examResult"), time: "3 ngày trước" },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Bell Icon */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>

        {/* Dropdown */}
        <div
          className={`absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50 transform transition-all duration-200 origin-top-right
            ${
              open
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
            }`}
        >
          <div className="px-4 py-2 border-b dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-200">
            {t("notifications.title")}
          </div>
          {notifications.length > 0 ? (
            <ul className="max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {n.text}
                  </p>
                  <span className="text-xs text-gray-500">{n.time}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
              {t("notifications.empty")}
            </div>
          )}
          <div className="px-4 py-2 border-t dark:border-gray-700 text-center">
            <button
              onClick={() => {
                setShowModal(true);
                setOpen(false);
              }}
              className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
            >
              {t("notifications.viewAll")}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-200
          ${showModal ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setShowModal(false)}
        ></div>

        <div
          className={`relative bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl h-[80vh] p-6 z-10 transform transition-all duration-200
            ${showModal ? "scale-100" : "scale-95"}`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {t("notifications.all")}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto h-[calc(80vh-60px)]">
            {notifications.length > 0 ? (
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <p className="text-gray-800 dark:text-gray-200">{n.text}</p>
                    <span className="text-xs text-gray-500">{n.time}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center mt-4">
                {t("notifications.empty")}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationBell;
