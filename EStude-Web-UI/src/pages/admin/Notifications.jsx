// src/pages/Notifications.jsx
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Thông báo
          </h1>
          <p className="text-gray-600">
            Trang thông báo là nơi đăng tải các tin tức, sự kiện và thông tin
            quan trọng từ Hệ thống đến với người dùng.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          Compose
        </button>
      </div>

      {/* Notification History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b px-4 py-2 font-semibold">
          Notification History
        </div>
        <div>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex justify-between items-center px-4 py-3 border-b last:border-0"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{n.title}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    {n.status}
                  </span>
                </div>
                <p className="text-gray-600">{n.message}</p>
                <div className="text-sm text-gray-500 flex gap-4 mt-1">
                  <span>📅 {n.date}</span>
                  <span>👥 {n.recipients} recipients</span>
                </div>
              </div>
              <div className="flex gap-3 text-gray-500">
                <button title="View/Edit" onClick={() => handleViewEdit(n)}>
                  Xem chi tiết
                </button>
                <button title="Delete" onClick={() => handleDelete(n.id)}>
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
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Compose Notification</h2>
            <div className="mb-3">
              <label className="block font-medium mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="border rounded w-full p-2"
              />
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Message</label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="border rounded w-full p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Recipients</label>
              <select
                value={form.recipientsType}
                onChange={(e) =>
                  setForm({ ...form, recipientsType: e.target.value })
                }
                className="border rounded w-full p-2"
              >
                <option value="class">Class</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
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
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">View / Edit Notification</h2>
            <div className="mb-3">
              <label className="block font-medium mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="border rounded w-full p-2"
              />
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Message</label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="border rounded w-full p-2"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsViewEditOpen(false)}
                className="px-4 py-2 rounded border"
              >
                Close
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
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
