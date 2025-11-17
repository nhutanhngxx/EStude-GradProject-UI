import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, X, Edit2, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import subjectService from "../../services/subjectService";
import { useToast } from "../../contexts/ToastContext";
import Pagination from "../../components/common/Pagination";

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm max-w-2xl w-full p-6">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <button
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ManageSubjects = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 12;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectService.getAllSubjects();
      if (data) {
        setSubjects(data);
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      showToast(
        t("admin.subjects.fetchError") || "Lỗi khi tải danh sách môn học",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, subject = null) => {
    setModalType(type);
    setSelectedSubject(subject);
    if (subject) {
      setFormData({
        name: subject.name,
        description: subject.description || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
      });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedSubject(null);
    setFormData({
      name: "",
      description: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast(
        t("admin.subjects.nameRequired") || "Vui lòng nhập tên môn học",
        "error"
      );
      return;
    }

    try {
      setLoading(true);

      if (modalType === "add") {
        const result = await subjectService.addSubject(formData);
        if (result) {
          showToast(
            t("admin.subjects.addSuccess") || "Thêm môn học thành công",
            "success"
          );
          await fetchSubjects();
          closeModal();
        }
      } else if (modalType === "edit") {
        const result = await subjectService.updateSubject({
          ...formData,
          subjectId: selectedSubject.subjectId,
        });
        if (result) {
          showToast(
            t("admin.subjects.updateSuccess") || "Cập nhật môn học thành công",
            "success"
          );
          await fetchSubjects();
          closeModal();
        }
      }
    } catch (error) {
      console.error("Error saving subject:", error);
      showToast(
        error.message || t("admin.subjects.saveError") || "Lỗi khi lưu môn học",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubject) return;

    try {
      setLoading(true);
      const success = await subjectService.deleteSubject(
        selectedSubject.subjectId
      );
      if (success) {
        showToast(
          t("admin.subjects.deleteSuccess") || "Xóa môn học thành công",
          "success"
        );
        await fetchSubjects();
        closeModal();
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      showToast(
        error.message ||
          t("admin.subjects.deleteError") ||
          "Lỗi khi xóa môn học",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((subject) =>
    [subject.name, subject.description]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSubjects = filteredSubjects.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="bg-transparent dark:bg-gray-900 p-6">
      {/* <div className="max-w-7xl mx-auto"> */}
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        {/* <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("admin.subjects.title") || "Quản lý Môn học"}
          </h1>
        </div> */}
        <div>
          <h1 className="text-3xl font-bold text-green-800 dark:text-gray-200 flex items-center gap-2 mb-3">
            <BookOpen className="w-8 h-8 text-green-600 dark:text-gray-400" />
            {t("admin.subjects.title") || "Quản lý Môn học"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {/* {t("manageClasses.subtitle")} */}
          </p>
        </div>
        <button
          onClick={() => openModal("add")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          {t("admin.subjects.addNew") || "Thêm môn học"}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t("admin.subjects.search") || "Tìm kiếm môn học..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-12">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t("admin.subjects.name") || "Tên môn học"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t("admin.subjects.description") || "Mô tả"}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t("admin.subjects.actions") || "Thao tác"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  {t("common.loading") || "Đang tải..."}
                </td>
              </tr>
            ) : currentSubjects.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  {t("admin.subjects.noData") || "Không có dữ liệu"}
                </td>
              </tr>
            ) : (
              currentSubjects.map((subject) => (
                <tr
                  key={subject.subjectId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {subject.subjectId}
                  </td>
                  <td className="px-6 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {subject.name}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {subject.description || "-"}
                  </td>
                  <td className="px-6 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openModal("edit", subject)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title={t("common.edit") || "Sửa"}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal("delete", subject)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title={t("common.delete") || "Xóa"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            totalItems={filteredSubjects.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
      {/* </div> */}

      {/* Add/Edit Modal */}
      {(modalType === "add" || modalType === "edit") && (
        <Modal
          title={
            modalType === "add"
              ? t("admin.subjects.addNew") || "Thêm môn học mới"
              : t("admin.subjects.edit") || "Chỉnh sửa môn học"
          }
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("admin.subjects.name") || "Tên môn học"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  t("admin.subjects.namePlaceholder") || "Ví dụ: Toán, Lý, Hóa"
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("admin.subjects.description") || "Mô tả"}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  t("admin.subjects.descriptionPlaceholder") ||
                  "Sách giáo khoa - kết nối tri thức với cuộc sống"
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                {t("common.cancel") || "Hủy"}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading
                  ? t("common.saving") || "Đang lưu..."
                  : modalType === "add"
                  ? t("common.add") || "Thêm"
                  : t("common.save") || "Lưu"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {modalType === "delete" && selectedSubject && (
        <Modal
          title={t("admin.subjects.deleteConfirm") || "Xác nhận xóa"}
          onClose={closeModal}
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {t("admin.subjects.deleteMessage") ||
                "Bạn có chắc chắn muốn xóa môn học"}
              <span className="font-semibold"> "{selectedSubject.name}"</span>?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("admin.subjects.deleteWarning") ||
                "Thao tác này không thể hoàn tác!"}
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                {t("common.cancel") || "Hủy"}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading
                  ? t("common.deleting") || "Đang xóa..."
                  : t("common.delete") || "Xóa"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageSubjects;
