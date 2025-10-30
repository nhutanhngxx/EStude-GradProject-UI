import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, X, Edit2, BookMarked, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import topicService from "../../services/topicService";
import subjectService from "../../services/subjectService";
import { useToast } from "../../contexts/ToastContext";
import Pagination from "../../components/common/Pagination";

const Modal = ({ title, children, onClose, size = "2xl" }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm max-w-${size} w-full p-6 max-h-[90vh] overflow-y-auto`}
    >
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

const GRADE_LEVELS = [
  { value: "GRADE_10", label: "Lớp 10" },
  { value: "GRADE_11", label: "Lớp 11" },
  { value: "GRADE_12", label: "Lớp 12" },
];

const VOLUMES = [
  { value: 1, label: "Tập 1" },
  { value: 2, label: "Tập 2" },
];

const ManageTopics = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  // Filters
  const [filters, setFilters] = useState({
    subjectId: "",
    gradeLevel: "",
    volume: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    chapter: "",
    orderIndex: 1,
    gradeLevel: "GRADE_10",
    volume: 1,
    subjectId: "",
  });

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (filters.subjectId) {
      fetchTopics();
    } else {
      setTopics([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchSubjects = async () => {
    try {
      const data = await subjectService.getAllSubjects();
      if (data) {
        setSubjects(data);
        if (data.length > 0 && !filters.subjectId) {
          setFilters((prev) => ({ ...prev, subjectId: data[0].subjectId }));
        }
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      showToast(
        t("admin.topics.fetchSubjectsError") || "Lỗi khi tải danh sách môn học",
        "error"
      );
    }
  };

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const data = await topicService.getTopics(filters);
      if (data) {
        setTopics(data);
      }
    } catch (error) {
      console.error("Error loading topics:", error);
      showToast(
        t("admin.topics.fetchError") || "Lỗi khi tải danh sách chủ đề",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, topic = null) => {
    setModalType(type);
    setSelectedTopic(topic);
    if (topic) {
      setFormData({
        name: topic.name,
        description: topic.description || "",
        chapter: topic.chapter || "",
        orderIndex: topic.orderIndex || 1,
        gradeLevel: topic.gradeLevel,
        volume: topic.volume,
        subjectId: topic.subjectId,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        chapter: "",
        orderIndex: 1,
        gradeLevel: filters.gradeLevel || "GRADE_10",
        volume: filters.volume || 1,
        subjectId:
          filters.subjectId ||
          (subjects.length > 0 ? subjects[0].subjectId : ""),
      });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedTopic(null);
    setFormData({
      name: "",
      description: "",
      chapter: "",
      orderIndex: 1,
      gradeLevel: "GRADE_10",
      volume: 1,
      subjectId: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast(
        t("admin.topics.nameRequired") || "Vui lòng nhập tên chủ đề",
        "error"
      );
      return;
    }

    if (!formData.subjectId) {
      showToast(
        t("admin.topics.subjectRequired") || "Vui lòng chọn môn học",
        "error"
      );
      return;
    }

    try {
      setLoading(true);

      if (modalType === "add") {
        await topicService.createTopic(formData);
        showToast(
          t("admin.topics.addSuccess") || "Thêm chủ đề thành công",
          "success"
        );
        await fetchTopics();
        closeModal();
      } else if (modalType === "edit") {
        await topicService.updateTopic(selectedTopic.topicId, formData);
        showToast(
          t("admin.topics.updateSuccess") || "Cập nhật chủ đề thành công",
          "success"
        );
        await fetchTopics();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving topic:", error);
      showToast(
        error.message || t("admin.topics.saveError") || "Lỗi khi lưu chủ đề",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTopic) return;

    try {
      setLoading(true);
      await topicService.deleteTopic(selectedTopic.topicId);
      showToast(
        t("admin.topics.deleteSuccess") || "Xóa chủ đề thành công",
        "success"
      );
      await fetchTopics();
      closeModal();
    } catch (error) {
      console.error("Error deleting topic:", error);
      showToast(
        error.message || t("admin.topics.deleteError") || "Lỗi khi xóa chủ đề",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredTopics = topics.filter((topic) =>
    [topic.name, topic.chapter, topic.description]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTopics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTopics = filteredTopics.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s.subjectId === subjectId);
    return subject ? subject.name : "";
  };

  const getGradeLabel = (gradeLevel) => {
    const grade = GRADE_LEVELS.find((g) => g.value === gradeLevel);
    return grade ? grade.label : gradeLevel;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <BookMarked className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("admin.topics.title") || "Quản lý Chủ đề"}
            </h1>
          </div>
          <button
            onClick={() => openModal("add")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            disabled={!filters.subjectId}
          >
            <PlusCircle className="w-5 h-5" />
            {t("admin.topics.addNew") || "Thêm chủ đề"}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("admin.topics.filters") || "Bộ lọc"}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("admin.topics.subject") || "Môn học"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={filters.subjectId}
                onChange={(e) => {
                  setFilters({ ...filters, subjectId: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {t("admin.topics.selectSubject") || "Chọn môn học"}
                </option>
                {subjects.map((subject) => (
                  <option key={subject.subjectId} value={subject.subjectId}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("admin.topics.gradeLevel") || "Khối lớp"}
              </label>
              <select
                value={filters.gradeLevel}
                onChange={(e) => {
                  setFilters({ ...filters, gradeLevel: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {t("admin.topics.allGrades") || "Tất cả khối"}
                </option>
                {GRADE_LEVELS.map((grade) => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("admin.topics.volume") || "Tập sách"}
              </label>
              <select
                value={filters.volume}
                onChange={(e) => {
                  setFilters({ ...filters, volume: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {t("admin.topics.allVolumes") || "Tất cả tập"}
                </option>
                {VOLUMES.map((volume) => (
                  <option key={volume.value} value={volume.value}>
                    {volume.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder={t("admin.topics.search") || "Tìm kiếm chủ đề..."}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t("admin.topics.name") || "Tên chủ đề"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t("admin.topics.chapter") || "Chương"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t("admin.topics.subject") || "Môn học"}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t("admin.topics.gradeLevel") || "Khối"}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t("admin.topics.volume") || "Tập"}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t("admin.topics.order") || "Thứ tự"}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t("admin.topics.totalQuestions") || "Số câu hỏi"}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t("admin.topics.actions") || "Thao tác"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      {t("common.loading") || "Đang tải..."}
                    </td>
                  </tr>
                ) : !filters.subjectId ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      {t("admin.topics.selectSubjectFirst") ||
                        "Vui lòng chọn môn học"}
                    </td>
                  </tr>
                ) : currentTopics.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      {t("admin.topics.noData") || "Không có dữ liệu"}
                    </td>
                  </tr>
                ) : (
                  currentTopics.map((topic) => (
                    <tr
                      key={topic.topicId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {topic.topicId}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {topic.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {topic.chapter || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {topic.subjectName || getSubjectName(topic.subjectId)}
                      </td>
                      <td className="px-4 py-4 text-sm text-center text-gray-600 dark:text-gray-400">
                        {getGradeLabel(topic.gradeLevel)}
                      </td>
                      <td className="px-4 py-4 text-sm text-center text-gray-600 dark:text-gray-400">
                        {topic.volume}
                      </td>
                      <td className="px-4 py-4 text-sm text-center text-gray-600 dark:text-gray-400">
                        {topic.orderIndex}
                      </td>
                      <td className="px-4 py-4 text-sm text-center text-gray-600 dark:text-gray-400">
                        {topic.totalQuestions || 0}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openModal("edit", topic)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title={t("common.edit") || "Sửa"}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal("delete", topic)}
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
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              totalItems={filteredTopics.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(modalType === "add" || modalType === "edit") && (
        <Modal
          title={
            modalType === "add"
              ? t("admin.topics.addNew") || "Thêm chủ đề mới"
              : t("admin.topics.edit") || "Chỉnh sửa chủ đề"
          }
          onClose={closeModal}
          size="3xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("admin.topics.name") || "Tên chủ đề"}{" "}
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
                    t("admin.topics.namePlaceholder") || "Ví dụ: Mệnh đề"
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("admin.topics.subject") || "Môn học"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">
                    {t("admin.topics.selectSubject") || "Chọn môn học"}
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject.subjectId} value={subject.subjectId}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("admin.topics.chapter") || "Chương"}
              </label>
              <input
                type="text"
                value={formData.chapter}
                onChange={(e) =>
                  setFormData({ ...formData, chapter: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  t("admin.topics.chapterPlaceholder") ||
                  "CHƯƠNG I: MỆNH ĐỀ VÀ TẬP HỢP"
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("admin.topics.description") || "Mô tả"}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  t("admin.topics.descriptionPlaceholder") ||
                  "Mô tả chi tiết về chủ đề"
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("admin.topics.gradeLevel") || "Khối lớp"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, gradeLevel: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {GRADE_LEVELS.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("admin.topics.volume") || "Tập sách"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.volume}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      volume: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {VOLUMES.map((volume) => (
                    <option key={volume.value} value={volume.value}>
                      {volume.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("admin.topics.order") || "Thứ tự"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.orderIndex}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orderIndex: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
      {modalType === "delete" && selectedTopic && (
        <Modal
          title={t("admin.topics.deleteConfirm") || "Xác nhận xóa"}
          onClose={closeModal}
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {t("admin.topics.deleteMessage") ||
                "Bạn có chắc chắn muốn xóa chủ đề"}
              <span className="font-semibold"> "{selectedTopic.name}"</span>?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("admin.topics.deleteWarning") ||
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

export default ManageTopics;
