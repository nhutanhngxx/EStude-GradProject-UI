import React, { useState } from "react";
import { PlusCircle, Eye, Trash2, X } from "lucide-react";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";

const Notifications = () => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
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
    if (!form.title.trim() || !form.message.trim()) {
      showToast("Vui lòng nhập tiêu đề và nội dung thông báo!", "warn");
      return;
    }
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
    showToast("Gửi thông báo thành công!", "success");
  };

  const handleDelete = async (id) => {
    const ok = await confirm(
      "Xóa thông báo?",
      "Bạn có chắc chắn muốn xóa thông báo này?"
    );
    if (!ok) return;
    setNotifications(notifications.filter((n) => n.id !== id));
    showToast("Xóa thông báo thành công!", "success");
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
    if (!form.title.trim() || !form.message.trim()) {
      showToast("Vui lòng nhập tiêu đề và nội dung thông báo!", "warn");
      return;
    }
    setNotifications(
      notifications.map((n) =>
        n.id === selectedNotification.id
          ? { ...n, title: form.title, message: form.message }
          : n
      )
    );
    setIsViewEditOpen(false);
    setSelectedNotification(null);
    showToast("Cập nhật thông báo thành công!", "success");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 bg-transparent dark:bg-transparent text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">Quản lý thông báo</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Trang thông báo là nơi đăng tải các tin tức, sự kiện và thông tin
            quan trọng từ giáo viên đến học sinh hoặc phụ huynh.
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ title: "", message: "", recipientsType: "class" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
        >
          <PlusCircle size={16} /> Gửi thông báo mới
        </button>
      </div>

      {/* Notification History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-600">
        <div className="border-b px-4 py-2 font-semibold text-gray-900 dark:text-gray-100 text-sm">
          Lịch sử thông báo
        </div>
        <div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              Chưa có thông báo nào.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="flex justify-between items-center px-4 py-3 border-b last:border-0 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                      {n.title}
                    </span>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                      {n.status}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm truncate">
                    {n.message}
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex gap-4 mt-1">
                    <span>📅 {n.date}</span>
                    <span>👥 {n.recipients} người nhận</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    title="Xem/Sửa"
                    onClick={() => handleViewEdit(n)}
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    <Eye size={16} /> Xem
                  </button>
                  <button
                    title="Xóa"
                    onClick={() => handleDelete(n.id)}
                    className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:underline text-sm"
                  >
                    <Trash2 size={16} /> Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Compose */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Soạn thông báo
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                aria-label="Đóng modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200 text-sm">
                Tiêu đề
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                placeholder="Nhập tiêu đề thông báo"
              />
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200 text-sm">
                Nội dung
              </label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                placeholder="Nhập nội dung thông báo"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200 text-sm">
                Người nhận
              </label>
              <select
                value={form.recipientsType}
                onChange={(e) =>
                  setForm({ ...form, recipientsType: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
              >
                <option value="class">Lớp học</option>
                <option value="teacher">Giáo viên</option>
                <option value="student">Học sinh</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 transition text-sm"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View/Edit */}
      {isViewEditOpen && selectedNotification && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Xem / Sửa thông báo
              </h2>
              <button
                onClick={() => setIsViewEditOpen(false)}
                className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                aria-label="Đóng modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200 text-sm">
                Tiêu đề
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                placeholder="Nhập tiêu đề thông báo"
              />
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200 text-sm">
                Nội dung
              </label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                placeholder="Nhập nội dung thông báo"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsViewEditOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
              >
                Đóng
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-500 transition text-sm"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
