import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, X } from "lucide-react";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";
import notificationService from "../../services/notificationService";
import { formatVietnameseDate, timeAgo } from "../../services/dateUtils";

const Notifications = () => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    message: "",
    recipientsType: "class",
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const result = await notificationService.getReceivedNotifications();
        console.log("result:", result);

        if (result && Array.isArray(result)) {
          setNotifications(
            result.map((n) => ({
              id: n.notificationId,
              title: n.message, // Có thể cần điều chỉnh nếu API trả về trường title riêng
              status: n.status || "sent",
              message: n.message,
              date: n.sentAt ? new Date(n.sentAt).toISOString() : "N/A",
              recipients: n.recipientsCount || 0,
            }))
          );
        } else {
          setNotifications([]);
        }
      } catch (error) {
        showToast("Lỗi khi tải danh sách thông báo", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [showToast]);

  return (
    <div className="bg-bg-transparent dark:bg-transparent p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Quản lý thông báo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Trang thông báo là nơi xem các tin tức, sự kiện và thông tin quan
            trọng từ hệ thống EStude.
          </p>
        </div>
      </div>

      {/* Notification History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-600">
        {/* <div className="border-b px-4 py-2 font-semibold text-gray-900 dark:text-gray-100 text-sm">
          Lịch sử thông báo
        </div> */}
        <div>
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              Đang tải thông báo...
            </div>
          ) : notifications.length === 0 ? (
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
                    {/* <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                      {n.status}
                    </span> */}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex gap-4 mt-1">
                    <span>{formatVietnameseDate(n.date)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 py-0.5 italic">
                      {timeAgo(n.date)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
