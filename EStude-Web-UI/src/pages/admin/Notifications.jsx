import React, { useState } from "react";

const Notifications = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewEditOpen, setIsViewEditOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Welcome Back!",
      status: "sent",
      message: "New semester has started. Please check your schedules.",
      date: "2024-01-15",
      recipients: 1,
    },
  ]);

  const [form, setForm] = useState({
    title: "",
    message: "",
    recipientsType: "class",
  });

  const handleSend = () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setNotifications([
      ...notifications,
      {
        id: Date.now(),
        title: form.title,
        status: "sent",
        message: form.message,
        date: new Date().toISOString().split("T")[0],
        recipients: Math.floor(Math.random() * 20) + 1,
      },
    ]);
    setForm({ title: "", message: "", recipientsType: "class" });
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this notification?")) {
      setNotifications(notifications.filter((n) => n.id !== id));
    }
  };

  const handleViewEdit = (notif) => {
    setSelectedNotification(notif);
    setForm({
      title: notif.title,
      message: notif.message,
      recipientsType: "class",
    });
    setIsViewEditOpen(true);
  };

  const handleUpdate = () => {
    setNotifications(
      notifications.map((n) =>
        n.id === selectedNotification.id
          ? { ...n, title: form.title, message: form.message }
          : n
      )
    );
    setIsViewEditOpen(false);
    setSelectedNotification(null);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-transparent">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Thông báo
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Trang thông báo là nơi đăng tải các tin tức, sự kiện và thông tin
            quan trọng từ Hệ thống đến với người dùng.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2 rounded hover:bg-blue-700 flex items-center gap-2 text-sm sm:text-base"
        >
          Compose
        </button>
      </div>

      {/* Notification History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 font-semibold text-gray-900 dark:text-white">
          Notification History
        </div>
        <div>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div className="w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {n.title}
                  </span>
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-2 py-0.5 rounded">
                    {n.status}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-0">
                  {n.message}
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1">
                  <span>📅 {n.date}</span>
                  <span>👥 {n.recipients} recipients</span>
                </div>
              </div>
              <div className="flex gap-3 text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
                <button
                  title="View/Edit"
                  onClick={() => handleViewEdit(n)}
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Xem chi tiết
                </button>
                <button
                  title="Delete"
                  onClick={() => handleDelete(n.id)}
                  className="hover:text-red-600 dark:hover:text-red-400"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Compose */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Compose Notification
            </h2>
            <div className="mb-3">
              <label className="block font-medium mb-1 text-gray-900 dark:text-white">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded w-full p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1 text-gray-900 dark:text-white">
                Message
              </label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded w-full p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1 text-gray-900 dark:text-white">
                Recipients
              </label>
              <select
                value={form.recipientsType}
                onChange={(e) =>
                  setForm({ ...form, recipientsType: e.target.value })
                }
                className="border border-gray-300 dark:border-gray-600 rounded w-full p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="class">Class</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 sm:px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="px-3 sm:px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View/Edit */}
      {isViewEditOpen && selectedNotification && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
              View / Edit Notification
            </h2>
            <div className="mb-3">
              <label className="block font-medium mb-1 text-gray-900 dark:text-white">
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded w-full p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1 text-gray-900 dark:text-white">
                Message
              </label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded w-full p-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsViewEditOpen(false)}
                className="px-3 sm:px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button
                onClick={handleUpdate}
                className="px-3 sm:px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
