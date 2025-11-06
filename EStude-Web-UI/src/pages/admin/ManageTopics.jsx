import React, { useState, useEffect, useRef } from "react";
import {
  PlusCircle,
  Trash2,
  X,
  Edit2,
  BookMarked,
  Filter,
  Upload,
  Download,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
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
  const fileInputRef = useRef(null);
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
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
    // ✅ Check: Phải chọn môn học trước khi thêm mới
    if (type === "add" && !filters.subjectId) {
      console.log("🔍 [ManageTopics openModal] Checking filters:", filters);
      console.log(
        "⚠️ [ManageTopics openModal] Missing subjectId - showing toast"
      );
      showToast("Vui lòng chọn môn học trước khi thêm chủ đề!", "warn");
      return;
    }

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

  const filteredTopics = topics
    .filter((topic) =>
      [topic.name, topic.chapter, topic.description]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    // ✅ Sắp xếp theo volume trước, sau đó theo orderIndex trong mỗi volume
    .sort((a, b) => {
      // So sánh volume trước
      if (a.volume !== b.volume) {
        return a.volume - b.volume;
      }
      // Nếu cùng volume, so sánh orderIndex
      return a.orderIndex - b.orderIndex;
    });

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

  // Download template Excel
  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/files/topics-template.xlsx";
    link.download = "topics-template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đang tải template...", "info");
  };

  // Handler click nút Import - check validation trước khi mở file dialog
  const handleImportClick = () => {
    console.log(
      "🔍 [ManageTopics handleImportClick] Checking filters:",
      filters
    );
    if (!filters.subjectId) {
      console.log(
        "⚠️ [ManageTopics handleImportClick] Missing subjectId - showing toast"
      );
      showToast("Vui lòng chọn môn học trước khi import!", "warn");
      return;
    }
    // Nếu validation pass, mở file dialog
    fileInputRef.current?.click();
  };

  // Import Excel
  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input để có thể chọn lại cùng 1 file
    e.target.value = "";

    // Validation đã được check ở handleImportClick rồi, nên bỏ qua ở đây
    // Chỉ check file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      showToast("Vui lòng chọn file Excel (.xlsx hoặc .xls)", "error");
      return;
    }

    try {
      setImporting(true);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      console.log("Available sheets:", workbook.SheetNames);

      // Đọc sheet "Danh sách chủ đề" hoặc sheet đầu tiên nếu không tìm thấy
      let sheetName = "Danh sách chủ đề";
      let worksheet = workbook.Sheets[sheetName];

      // Nếu không tìm thấy, thử các tên khác
      if (!worksheet) {
        const possibleNames = [
          "Danh sách chủ đề",
          "Danh sach chu de",
          "Topics",
          "Data",
        ];

        for (const name of possibleNames) {
          if (workbook.Sheets[name]) {
            worksheet = workbook.Sheets[name];
            sheetName = name;
            break;
          }
        }
      }

      // Nếu vẫn không tìm thấy, dùng sheet đầu tiên (bỏ qua sheet "Hướng dẫn")
      if (!worksheet) {
        const firstDataSheet = workbook.SheetNames.find(
          (name) =>
            !name.toLowerCase().includes("hướng dẫn") &&
            !name.toLowerCase().includes("huong dan") &&
            !name.toLowerCase().includes("instruction")
        );

        if (firstDataSheet) {
          worksheet = workbook.Sheets[firstDataSheet];
          sheetName = firstDataSheet;
          console.log(`Using sheet: ${sheetName}`);
        } else {
          showToast(
            `Không tìm thấy sheet dữ liệu. Sheets có sẵn: ${workbook.SheetNames.join(
              ", "
            )}`,
            "error"
          );
          return;
        }
      }

      console.log(`Reading data from sheet: ${sheetName}`);

      // Convert sang JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("Parsed data:", jsonData);

      if (jsonData.length === 0) {
        showToast("File Excel không có dữ liệu", "error");
        return;
      }

      console.log("Dữ liệu import:", jsonData);

      // Lấy môn học đã chọn trong filter
      console.log(
        "🔍 [Import] filters.subjectId:",
        filters.subjectId,
        "Type:",
        typeof filters.subjectId
      );
      console.log(
        "🔍 [Import] Available subjects:",
        subjects.map((s) => ({
          id: s.subjectId,
          type: typeof s.subjectId,
          name: s.name,
        }))
      );

      // So sánh subjectId (giờ cả 2 đều là number)
      const selectedSubject = subjects.find(
        (s) => s.subjectId === filters.subjectId
      );

      console.log("🔍 [Import] selectedSubject:", selectedSubject);

      if (!selectedSubject) {
        showToast("Không tìm thấy thông tin môn học đã chọn", "error");
        return;
      }

      console.log("✅ Môn học được chọn:", selectedSubject);

      // Validate và chuẩn bị dữ liệu
      const topicsToImport = [];
      const errors = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; // +2 vì Excel bắt đầu từ 1 và có header row

        // Validate required fields
        if (!row["Tên chủ đề"]?.trim()) {
          errors.push(`Dòng ${rowNum}: Thiếu tên chủ đề`);
          continue;
        }

        if (!row["Khối lớp"]) {
          errors.push(`Dòng ${rowNum}: Thiếu khối lớp`);
          continue;
        }

        if (!row["Tập sách"]) {
          errors.push(`Dòng ${rowNum}: Thiếu tập sách`);
          continue;
        }

        // Validate grade level
        const gradeLevel = row["Khối lớp"].toString().trim();
        const validGrades = GRADE_LEVELS.map((g) => g.value);
        if (!validGrades.includes(gradeLevel)) {
          errors.push(
            `Dòng ${rowNum}: Khối lớp không hợp lệ (phải là ${validGrades.join(
              ", "
            )})`
          );
          continue;
        }

        // Validate volume
        const volume = parseInt(row["Tập sách"]);
        if (![1, 2].includes(volume)) {
          errors.push(`Dòng ${rowNum}: Tập sách phải là 1 hoặc 2`);
          continue;
        }

        // Tạo object topic với subjectId từ filter đã chọn
        topicsToImport.push({
          name: row["Tên chủ đề"].toString().trim(),
          chapter: row["Chương"]?.toString().trim() || "",
          description: row["Mô tả"]?.toString().trim() || "",
          gradeLevel: gradeLevel,
          volume: volume,
          orderIndex: parseInt(row["Thứ tự"]) || 1,
          subjectId: parseInt(filters.subjectId), // Convert sang number để đảm bảo đúng type
        });
      }

      // Hiển thị lỗi nếu có
      if (errors.length > 0) {
        const errorMsg = `Có ${errors.length} lỗi:\n${errors
          .slice(0, 5)
          .join("\n")}${
          errors.length > 5 ? `\n...và ${errors.length - 5} lỗi khác` : ""
        }`;
        showToast(errorMsg, "error");
      }

      // Import các topic hợp lệ
      if (topicsToImport.length === 0) {
        showToast("Không có dữ liệu hợp lệ để import", "error");
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const topic of topicsToImport) {
        try {
          await topicService.createTopic(topic);
          successCount++;
        } catch (error) {
          failCount++;
          console.error("Lỗi import topic:", topic.name, error);
        }
      }

      // Refresh danh sách
      await fetchTopics();

      // Hiển thị kết quả
      if (successCount > 0) {
        showToast(
          `Import thành công ${successCount} chủ đề${
            failCount > 0 ? `, thất bại ${failCount}` : ""
          }`,
          failCount > 0 ? "warn" : "success"
        );
      } else {
        showToast("Import thất bại. Vui lòng kiểm tra lại dữ liệu", "error");
      }
    } catch (error) {
      console.error("Lỗi khi import Excel:", error);
      showToast("Lỗi khi đọc file Excel: " + error.message, "error");
    } finally {
      setImporting(false);
    }
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
          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Template
            </button>
            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              disabled={importing}
            >
              <Upload className="w-5 h-5" />
              {importing ? "Đang import..." : "Import Excel"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
            />
            <button
              onClick={() => openModal("add")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              {t("admin.topics.addNew") || "Thêm chủ đề"}
            </button>
          </div>
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
                  // Convert sang number nếu có giá trị, giữ nguyên empty string nếu chọn "Chọn môn học"
                  const value = e.target.value ? parseInt(e.target.value) : "";
                  console.log(
                    "🔍 [Filter onChange] Selected subjectId:",
                    value,
                    "Type:",
                    typeof value
                  );
                  setFilters({ ...filters, subjectId: value });
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
          <div className="overflow-x-auto mb-16">
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
                    setFormData({
                      ...formData,
                      subjectId: parseInt(e.target.value) || "",
                    })
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
