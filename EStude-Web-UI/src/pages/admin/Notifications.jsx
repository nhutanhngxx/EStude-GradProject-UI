import React, { useState, useEffect } from "react";
import { PlusCircle, Bell, Edit, Trash2 } from "lucide-react";
import notificationService from "../../services/notificationService";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useTranslation } from "react-i18next";
import Pagination from "../../components/common/Pagination";

const Modal = ({ title, form, setForm, onCancel, onConfirm, isLoading }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              {t("fields.message")}
            </label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                {t("fields.targetType")}
              </label>
              <select
                value={form.targetType}
                onChange={(e) =>
                  setForm({ ...form, targetType: e.target.value })
                }
                className="w-full border rounded p-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="SYSTEM">{t("values.SYSTEM")}</option>
                {/* <option value="SCHOOL">{t("values.SCHOOL")}</option>
                <option value="CLASS">{t("values.CLASS")}</option>
                <option value="CLASS_SUBJECT">
                  {t("values.CLASS_SUBJECT")}
                </option> */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                {t("fields.type")}
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border rounded p-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="GENERAL">{t("values.GENERAL")}</option>
                <option value="SYSTEM_MAINTENANCE">
                  {t("values.SYSTEM_MAINTENANCE")}
                </option>
                {/* <option value="ASSIGNMENT_REMINDER">
                  {t("values.ASSIGNMENT_REMINDER")}
                </option>
                <option value="ATTENDANCE_REMINDER">
                  {t("values.ATTENDANCE_REMINDER")}
                </option>
                <option value="GRADE_POSTED">{t("values.GRADE_POSTED")}</option>
                <option value="AI_ALERT">{t("values.AI_ALERT")}</option> */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                {t("fields.priority")}
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border rounded p-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="LOW">{t("values.LOW")}</option>
                <option value="MEDIUM">{t("values.MEDIUM")}</option>
                <option value="HIGH">{t("values.HIGH")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {t("buttons.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? t("ui.loading") : t("buttons.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationsAdmin = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    message: "",
    targetType: "SYSTEM",
    type: "GENERAL",
    priority: "MEDIUM",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const targetTypeMap = {
    SYSTEM: t("values.SYSTEM"),
    SCHOOL: t("values.SCHOOL"),
    CLASS: t("values.CLASS"),
    CLASS_SUBJECT: t("values.CLASS_SUBJECT"),
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const fetchSentNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getSentNotifications();
      if (response) {
        const formattedNotifications = response.map((n) => ({
          id: n.notificationId,
          message: n.message,
          type: n.type,
          targetType: n.targetType,
          priority: n.priority,
          sentAt: n.sentAt,
          recipientCount: n.recipientCount,
          sender: n.sender,
        }));
        setNotifications(formattedNotifications);
      } else {
        showToast(t("toast.sendError"), "error");
      }
    } catch (error) {
      showToast(t("toast.sendError"), "error");
      console.error("Error fetching sent notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentNotifications();
  }, [showToast]);

  const handleSend = async () => {
    if (!form.message.trim()) {
      return showToast(t("toast.emptyMessage"), "warn");
    }

    const payload = {
      message: form.message,
      targetType: form.targetType,
      type: form.type,
      priority: form.priority,
    };

    try {
      const res = await notificationService.adminCreateNotification(payload);
      if (res) {
        setNotifications([
          {
            id: res.notificationId,
            message: res.message,
            type: res.type,
            targetType: res.targetType,
            priority: res.priority,
            sentAt: res.sentAt,
            recipientCount: res.recipientCount,
            sender: res.sender,
          },
          ...notifications,
        ]);
        showToast(t("toast.sentSuccess"), "success");
        setCurrentPage(1); // Reset to first page on new notification
      }
    } catch (error) {
      showToast(t("toast.sendError"), "error");
      console.error("Error creating notification:", error);
    }

    setForm({
      message: "",
      targetType: "SYSTEM",
      type: "GENERAL",
      priority: "MEDIUM",
    });
    setIsModalOpen(false);
  };

  const handleUpdate = async () => {
    if (!form.message.trim()) {
      return showToast(t("toast.emptyMessage"), "warn");
    }

    setUpdating(true);
    const payload = {
      notificationId: selected.id,
      message: form.message,
      type: form.type,
      priority: form.priority,
    };

    try {
      const res = await notificationService.updateNotification(payload);
      if (res) {
        setNotifications(
          notifications.map((n) =>
            n.id === selected.id
              ? {
                  ...n,
                  message: res.message,
                  type: res.type,
                  priority: res.priority,
                  targetType: res.targetType || n.targetType,
                  sentAt: res.sentAt || n.sentAt,
                  recipientCount: res.recipientCount || n.recipientCount,
                  sender: res.sender || n.sender,
                }
              : n
          )
        );
        showToast(t("toast.updateSuccess"), "success");
        setIsEditOpen(false);
        setSelected(null);
      }
    } catch (error) {
      showToast(t("toast.updateError"), "error");
      console.error("Error updating notification:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await notificationService.deleteNotification(id);
      if (res) {
        setNotifications(notifications.filter((n) => n.id !== id));
        showToast(t("toast.deleteSuccess"), "success");
        if (
          notifications.length % itemsPerPage === 1 &&
          currentPage > 1 &&
          currentPage === Math.ceil(notifications.length / itemsPerPage)
        ) {
          setCurrentPage(currentPage - 1);
        }
        await fetchSentNotifications();
      }
    } catch (error) {
      showToast(t("toast.deleteError"), "error");
      console.error("Error deleting notification:", error);
    }
  };

  const openEdit = (notif) => {
    setSelected(notif);
    setForm({
      message: notif.message,
      targetType: notif.targetType,
      type: notif.type,
      priority: notif.priority,
    });
    setIsEditOpen(true);
  };

  const openConfirmModal = (action, title, message) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      action,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, title: "", message: "", action: null });
  };

  const handleConfirmAction = () => {
    if (confirmModal.action) {
      confirmModal.action();
    }
    closeConfirmModal();
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = notifications.slice(startIndex, endIndex);

  return (
    <div className="p-6 bg-gray-50 dark:bg-transparent">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl font-bold text-green-800 dark:text-white flex items-center gap-2 mb-3">
            <Bell className="w-6 h-6 text-green-800" />
            {t("manageNotifications.subtitle")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("manageNotifications.description")}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-800 rounded-lg text-white text-sm shadow"
        >
          <PlusCircle className="w-5 h-5" />
          {t("newNotification")}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...Array(5)].map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row justify-between px-4 py-3 animate-pulse"
              >
                <div className="w-full">
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="flex flex-wrap gap-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                  </div>
                </div>
                <div className="flex gap-3 mt-2 sm:mt-0">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {t("noNotifications")}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedNotifications.map((n) => (
              <div
                key={n.id}
                className="flex flex-col sm:flex-row justify-between px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {n.message}
                    <span
                      className={`mx-2 px-1 py-1 rounded text-xs ${
                        n.priority === "HIGH"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                          : n.priority === "MEDIUM"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {t(`values.${n.priority}`)}
                    </span>
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap gap-3">
                    <span>{formatTimestamp(n.sentAt)}</span>
                    <span>{targetTypeMap[n.targetType] || n.targetType}</span>
                    <span>{t(`values.${n.type}`)}</span>
                    <span>
                      {n.recipientCount} {t("notifications.recipients")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 mt-2 sm:mt-0">
                  <button
                    onClick={() => openEdit(n)}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" /> {t("edit")}
                  </button>
                  <button
                    onClick={() =>
                      openConfirmModal(
                        () => handleDelete(n.id),
                        t("confirmDeleteTitle"),
                        t("confirmDeleteMessage")
                      )
                    }
                    className="text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> {t("delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        totalItems={notifications.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        siblingCount={1}
      />

      {/* Create Notification Modal */}
      {isModalOpen && (
        <Modal
          title={t("newNotification")}
          form={form}
          setForm={setForm}
          onCancel={() => setIsModalOpen(false)}
          onConfirm={() =>
            openConfirmModal(
              handleSend,
              t("confirmSendTitle"),
              t("confirmSendMessage")
            )
          }
          isLoading={false}
        />
      )}

      {/* Edit Notification Modal */}
      {isEditOpen && (
        <Modal
          title={t("edit")}
          form={form}
          setForm={setForm}
          onCancel={() => setIsEditOpen(false)}
          onConfirm={() =>
            openConfirmModal(
              handleUpdate,
              t("confirmUpdateTitle"),
              t("confirmUpdateMessage")
            )
          }
          isLoading={updating}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmModal}
      />
    </div>
  );
};

export default NotificationsAdmin;
