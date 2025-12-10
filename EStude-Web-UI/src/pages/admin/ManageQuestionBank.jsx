import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Trash2,
  X,
  Edit2,
  HelpCircle,
  Filter,
  Eye,
  Upload,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import questionService from "../../services/questionService";
import topicService from "../../services/topicService";
import subjectService from "../../services/subjectService";
import { useToast } from "../../contexts/ToastContext";
import Pagination from "../../components/common/Pagination";
import LatexText from "../../components/common/LatexText";

const Modal = ({ title, children, onClose, size = "2xl" }) => {
  // Convert size to width percentage
  const getWidthClass = () => {
    switch (size) {
      case "sm":
        return "w-full max-w-md";
      case "md":
        return "w-full max-w-2xl";
      case "lg":
        return "w-full max-w-4xl";
      case "xl":
        return "w-full max-w-6xl";
      case "2xl":
        return "w-full max-w-7xl";
      case "80%":
        return "w-[80%]";
      default:
        return "w-full max-w-2xl";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm ${getWidthClass()} max-h-[90vh] flex flex-col`}
      >
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-6 pb-4 flex-shrink-0">
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
        <div className="overflow-y-auto flex-1 p-6 pt-4">{children}</div>
      </div>
    </div>
  );
};

const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm nhiều đáp án" },
  { value: "TRUE_FALSE", label: "Đúng/Sai" },
  { value: "SHORT_ANSWER", label: "Tự luận ngắn" },
];

const DIFFICULTY_LEVELS = [
  {
    value: "EASY",
    label: "Dễ",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  {
    value: "MEDIUM",
    label: "Trung bình",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  {
    value: "HARD",
    label: "Khó",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
];

const GRADE_LEVELS = [
  { value: "GRADE_10", label: "Lớp 10" },
  { value: "GRADE_11", label: "Lớp 11" },
  { value: "GRADE_12", label: "Lớp 12" },
];

const VOLUMES = [
  { value: 1, label: "Tập 1" },
  { value: 2, label: "Tập 2" },
];

const ManageQuestionBank = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0); // API v2.0: page starts from 0
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importedQuestions, setImportedQuestions] = useState([]);
  const itemsPerPage = 20; // API v2.0: default page size

  // Filters
  const [filters, setFilters] = useState({
    subjectId: "",
    gradeLevel: "",
    volume: "",
    topicId: "",
    difficulty: "",
  });

  const [formData, setFormData] = useState({
    questionText: "",
    points: 1.0,
    questionType: "MULTIPLE_CHOICE",
    topicId: "",
    difficultyLevel: "EASY",
    attachmentUrl: "",
    options: [
      { optionText: "", isCorrect: false, optionOrder: 1 },
      { optionText: "", isCorrect: false, optionOrder: 2 },
      { optionText: "", isCorrect: false, optionOrder: 3 },
      { optionText: "", isCorrect: false, optionOrder: 4 },
    ],
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
      setQuestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.subjectId, filters.gradeLevel, filters.volume]);

  useEffect(() => {
    if (filters.topicId) {
      fetchQuestions();
    } else {
      setQuestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.topicId, filters.difficulty, currentPage]); // ✅ Added currentPage dependency

  const fetchSubjects = async () => {
    try {
      const data = await subjectService.getAllSubjects();
      if (data) {
        setSubjects(data);
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      showToast("Lỗi khi tải danh sách môn học", "error");
    }
  };

  const fetchTopics = async () => {
    try {
      const topicFilters = { subjectId: filters.subjectId };
      if (filters.gradeLevel) topicFilters.gradeLevel = filters.gradeLevel;
      if (filters.volume) topicFilters.volume = filters.volume;

      const data = await topicService.getTopics(topicFilters);
      if (data) {
        // ✅ Sắp xếp topics theo volume trước, sau đó theo orderIndex
        const sortedTopics = data.sort((a, b) => {
          if (a.volume !== b.volume) {
            return a.volume - b.volume;
          }
          return a.orderIndex - b.orderIndex;
        });
        setTopics(sortedTopics);
      }
    } catch (error) {
      console.error("Error loading topics:", error);
      showToast("Lỗi khi tải danh sách chủ đề", "error");
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);

      // ✅ API v2.0: Use getQuestionBankBySubject with topicId filter and pagination
      // URL: /api/questions/bank/subject/{subjectId}?page=0&size=20&topicId={topicId}&difficulty={difficulty}
      const response = await questionService.getQuestionBankBySubject(
        filters.subjectId, // Required for the new API
        currentPage, // 0-based page number
        itemsPerPage, // 20 items per page
        false, // full = false (summary DTO)
        filters.topicId, // Optional topicId filter
        filters.difficulty || null // Optional difficulty filter
      );

      // Handle paginated response
      if (response && response.success && response.data) {
        // API returns: { success: true, message: "...", data: { content: [...], totalPages: ..., ... } }
        const data = response.data;
        setQuestions(Array.isArray(data.content) ? data.content : []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else {
        // Fallback: empty response
        setQuestions([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      showToast("Lỗi khi tải danh sách câu hỏi", "error");
      // ⚠️ CRITICAL: Reset về array rỗng khi lỗi
      setQuestions([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, question = null) => {
    // ✅ Check: Phải chọn môn học và chủ đề trước khi thêm mới
    if (type === "add") {
      console.log("🔍 [openModal] Checking filters:", filters);
      if (!filters.subjectId) {
        console.log("⚠️ [openModal] Missing subjectId - showing toast");
        showToast("Vui lòng chọn môn học trước khi thêm câu hỏi!", "warn");
        return;
      }
      if (!filters.topicId) {
        console.log("⚠️ [openModal] Missing topicId - showing toast");
        showToast("Vui lòng chọn chủ đề trước khi thêm câu hỏi!", "warn");
        return;
      }
    }

    setModalType(type);
    setSelectedQuestion(question);

    if (type === "view" && question) {
      return;
    }

    if (question) {
      setFormData({
        questionText: question.questionText,
        points: 1.0, // ✅ Luôn mặc định = 1 (kể cả khi edit)
        questionType: question.questionType,
        topicId: question.topic?.topicId || filters.topicId,
        difficultyLevel: question.difficultyLevel,
        attachmentUrl: question.attachmentUrl || "",
        options:
          question.questionOptions && question.questionOptions.length > 0
            ? question.questionOptions.map((opt) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
                optionOrder: opt.optionOrder,
              }))
            : [
                { optionText: "", isCorrect: false, optionOrder: 1 },
                { optionText: "", isCorrect: false, optionOrder: 2 },
              ],
      });
    } else {
      setFormData({
        questionText: "",
        points: 1.0,
        questionType: "MULTIPLE_CHOICE",
        topicId: filters.topicId || "",
        difficultyLevel: filters.difficulty || "EASY",
        attachmentUrl: "",
        options: [
          { optionText: "", isCorrect: false, optionOrder: 1 },
          { optionText: "", isCorrect: false, optionOrder: 2 },
          { optionText: "", isCorrect: false, optionOrder: 3 },
          { optionText: "", isCorrect: false, optionOrder: 4 },
        ],
      });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedQuestion(null);
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        {
          optionText: "",
          isCorrect: false,
          optionOrder: formData.options.length + 1,
        },
      ],
    });
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions.map((opt, idx) => ({
          ...opt,
          optionOrder: idx + 1,
        })),
      });
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.questionText.trim()) {
      showToast("Vui lòng nhập câu hỏi", "error");
      return;
    }

    if (!formData.topicId) {
      showToast("Vui lòng chọn chủ đề", "error");
      return;
    }

    // Validate options for multiple choice
    if (formData.questionType === "MULTIPLE_CHOICE") {
      const hasCorrectAnswer = formData.options.some((opt) => opt.isCorrect);
      if (!hasCorrectAnswer) {
        showToast("Vui lòng chọn ít nhất một đáp án đúng", "error");
        return;
      }

      const allOptionsFilled = formData.options.every((opt) =>
        opt.optionText.trim()
      );
      if (!allOptionsFilled) {
        showToast("Vui lòng điền đầy đủ các đáp án", "error");
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        questionText: formData.questionText,
        points: 1.0,
        questionType: formData.questionType,
        topicId: parseInt(formData.topicId),
        difficultyLevel: formData.difficultyLevel,
        attachmentUrl: formData.attachmentUrl || null,
        options:
          formData.questionType === "MULTIPLE_CHOICE" ? formData.options : [],
      };

      if (modalType === "add") {
        const response = await questionService.createQuestionBank(payload);
        if (response) {
          showToast("Thêm câu hỏi thành công", "success");
          await fetchQuestions();
          closeModal();
        }
      } else if (modalType === "edit") {
        const response = await questionService.updateQuestionBank(
          selectedQuestion.questionId,
          payload
        );
        if (response) {
          showToast("Cập nhật câu hỏi thành công", "success");
          await fetchQuestions();
          closeModal();
        }
      }
    } catch (error) {
      console.error("Error saving question:", error);
      showToast(error.message || "Lỗi khi lưu câu hỏi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedQuestion) return;

    try {
      setLoading(true);
      await questionService.deleteQuestionBank(selectedQuestion.questionId);
      showToast("Xóa câu hỏi thành công", "success");
      await fetchQuestions();
      closeModal();
    } catch (error) {
      console.error("Error deleting question:", error);
      showToast(error.message || "Lỗi khi xóa câu hỏi", "error");
    } finally {
      setLoading(false);
    }
  };

  // Import Excel functions
  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/files/questions-template.xlsx";
    link.download = "questions-template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đang tải xuống file mẫu Excel...", "info");
  };

  // Handler click nút Import - check validation trước khi mở file dialog
  const handleImportClick = () => {
    console.log("🔍 [handleImportClick] Checking filters:", filters);
    if (!filters.subjectId) {
      console.log("⚠️ [handleImportClick] Missing subjectId - showing toast");
      showToast("Vui lòng chọn môn học trước khi import câu hỏi!", "warn");
      return;
    }
    if (!filters.topicId) {
      console.log("⚠️ [handleImportClick] Missing topicId - showing toast");
      showToast("Vui lòng chọn chủ đề trước khi import câu hỏi!", "warn");
      return;
    }
    // Nếu validation pass, trigger input file click
    document.getElementById("import-excel-input")?.click();
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input để có thể chọn lại cùng 1 file
    e.target.value = "";

    // Validation đã được check ở handleImportClick rồi
    // Chỉ check file type
    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      !file.name.endsWith(".csv")
    ) {
      showToast("Vui lòng chọn file Excel (.xlsx, .xls, .csv)", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate and transform data
        const transformedQuestions = jsonData.map((row, index) => {
          // Validate required fields
          if (!row.questionText || !row.questionType || !row.difficultyLevel) {
            throw new Error(
              `Dòng ${
                index + 2
              }: Thiếu thông tin bắt buộc (questionText, questionType, difficultyLevel)`
            );
          }

          // Validate question type
          const validTypes = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"];
          if (!validTypes.includes(row.questionType)) {
            throw new Error(
              `Dòng ${
                index + 2
              }: Loại câu hỏi không hợp lệ. Phải là: ${validTypes.join(", ")}`
            );
          }

          // Validate difficulty level
          const validLevels = ["EASY", "MEDIUM", "HARD"];
          if (!validLevels.includes(row.difficultyLevel)) {
            throw new Error(
              `Dòng ${
                index + 2
              }: Độ khó không hợp lệ. Phải là: ${validLevels.join(", ")}`
            );
          }

          // Build options for MULTIPLE_CHOICE
          const options = [];
          if (row.questionType === "MULTIPLE_CHOICE") {
            const optionLetters = ["A", "B", "C", "D", "E", "F"];
            optionLetters.forEach((letter, idx) => {
              const optionKey = `option${letter}`;
              if (row[optionKey]) {
                options.push({
                  optionText: row[optionKey].toString(),
                  isCorrect: row.correctAnswer === letter,
                  optionOrder: idx + 1,
                });
              }
            });

            if (options.length < 2) {
              throw new Error(
                `Dòng ${
                  index + 2
                }: Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án`
              );
            }

            if (!options.some((opt) => opt.isCorrect)) {
              throw new Error(
                `Dòng ${
                  index + 2
                }: Phải có ít nhất một đáp án đúng (correctAnswer)`
              );
            }
          }

          return {
            questionText: row.questionText.toString(),
            points: 1.0, // ✅ Luôn mặc định = 1 (bỏ qua giá trị từ Excel)
            questionType: row.questionType,
            difficultyLevel: row.difficultyLevel,
            attachmentUrl: row.attachmentUrl || null,
            options,
          };
        });

        setImportedQuestions(transformedQuestions);
        setModalType("import");
        showToast(
          `Đã đọc ${transformedQuestions.length} câu hỏi từ file`,
          "success"
        );
      } catch (error) {
        console.error("Error parsing Excel:", error);
        showToast(error.message || "Lỗi khi đọc file Excel", "error");
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = ""; // Reset input
  };

  // const handleConfirmImport = async () => {
  //   if (!filters.topicId) {
  //     showToast("Vui lòng chọn chủ đề trước khi import", "error");
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     let successCount = 0;
  //     let errorCount = 0;

  //     for (const question of importedQuestions) {
  //       try {
  //         const payload = {
  //           ...question,
  //           topicId: parseInt(filters.topicId),
  //         };
  //         await questionService.createQuestionBank(payload);
  //         successCount++;
  //       } catch (error) {
  //         console.error("Error importing question:", error);
  //         errorCount++;
  //       }
  //     }

  //     showToast(
  //       `Import thành công ${successCount} câu hỏi${
  //         errorCount > 0 ? `, ${errorCount} câu hỏi lỗi` : ""
  //       }`,
  //       successCount > 0 ? "success" : "error"
  //     );

  //     await fetchQuestions();
  //     setImportedQuestions([]);
  //     closeModal();
  //   } catch (error) {
  //     console.error("Error importing questions:", error);
  //     showToast("Lỗi khi import câu hỏi", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleConfirmImport = async () => {
    if (!filters.topicId) {
      showToast("Vui lòng chọn chủ đề trước khi import", "error");
      return;
    }

    // Lấy số lượng câu hỏi
    const total = importedQuestions.length;

    // 1. ĐÓNG MODAL NGAY LẬP TỨC
    closeModal();
    setImportedQuestions([]); // Xóa dữ liệu preview

    // 2. HIỂN THỊ TOAST "ĐANG IMPORT..." NGAY LẬP TỨC
    showToast(`Đang import ${total} câu hỏi...`, "info");

    try {
      let successCount = 0;
      let errorCount = 0;

      // 3. IMPORT SONG SONG - NHANH GẤP 10 LẦN
      const importPromises = importedQuestions.map(async (question) => {
        try {
          const payload = {
            ...question,
            topicId: parseInt(filters.topicId),
          };
          await questionService.createQuestionBank(payload);
          return { status: "success" };
        } catch (err) {
          console.error("Lỗi import câu hỏi:", err);
          return { status: "error", error: err };
        }
      });

      const results = await Promise.allSettled(importPromises);

      results.forEach((result) => {
        if (
          result.status === "fulfilled" &&
          result.value.status === "success"
        ) {
          successCount++;
        } else {
          errorCount++;
        }
      });

      // 4. TẢI LẠI DANH SÁCH CÂU HỎI
      await fetchQuestions();

      // 5. HIỂN THỊ KẾT QUẢ CUỐI CÙNG
      if (successCount === total) {
        showToast(`Import thành công ${successCount} câu hỏi!`, "success");
      } else if (successCount > 0) {
        showToast(
          `Import thành công ${successCount} câu hỏi, thất bại ${errorCount} câu`,
          "warn"
        );
      } else {
        showToast(`Import thất bại toàn bộ ${total} câu hỏi`, "error");
      }
    } catch (error) {
      console.error("Lỗi nghiêm trọng khi import:", error);
      showToast("Đã xảy ra lỗi nghiêm trọng khi import", "error");
    }
  };

  // ✅ Server-side filtering: API handles pagination and filtering
  // Client-side search only for display (filter already-loaded page)
  const filteredQuestions = searchTerm
    ? questions.filter((question) =>
        question.questionText.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : questions;

  // For display: use currentPage (0-based for API, 1-based for UI)
  const displayPage = currentPage + 1;
  const startIndex = currentPage * itemsPerPage;

  // Show current page results (already filtered by API)
  const currentQuestions = filteredQuestions;

  const getDifficultyBadge = (level) => {
    const difficulty = DIFFICULTY_LEVELS.find((d) => d.value === level);
    return difficulty ? (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${difficulty.color}`}
      >
        {difficulty.label}
      </span>
    ) : null;
  };

  const getQuestionTypeLabel = (type) => {
    const questionType = QUESTION_TYPES.find((t) => t.value === type);
    return questionType ? questionType.label : type;
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 bg-transparent dark:bg-transparent text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-green-800 dark:text-gray-200 flex items-center gap-2 mb-3">
            <HelpCircle className="w-8 h-8 text-green-800 dark:text-gray-200 " />
            {t("admin.questionBank.title") || "Quản lý Ngân hàng Câu hỏi"}
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            title="Tải file mẫu Excel"
          >
            <Download className="w-5 h-5" />
            Tải file mẫu
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            title="Import từ Excel"
          >
            <Upload className="w-5 h-5" />
            Import Excel
          </button>
          <input
            id="import-excel-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportExcel}
            className="hidden"
          />
          <button
            onClick={() => openModal("add")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            {t("admin.questionBank.addNew") || "Thêm câu hỏi"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("admin.questionBank.filters") || "Bộ lọc"}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Môn học <span className="text-red-500">*</span>
            </label>
            <select
              value={filters.subjectId}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  subjectId: e.target.value,
                  topicId: "",
                });
                setCurrentPage(0); // API v2.0: page starts from 0
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn môn học</option>
              {subjects.map((subject) => (
                <option key={subject.subjectId} value={subject.subjectId}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Khối lớp
            </label>
            <select
              value={filters.gradeLevel}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  gradeLevel: e.target.value,
                  topicId: "",
                });
                setCurrentPage(0); // API v2.0: page starts from 0
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!filters.subjectId}
            >
              <option value="">Tất cả</option>
              {GRADE_LEVELS.map((grade) => (
                <option key={grade.value} value={grade.value}>
                  {grade.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tập sách
            </label>
            <select
              value={filters.volume}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  volume: e.target.value,
                  topicId: "",
                });
                setCurrentPage(0); // API v2.0: page starts from 0
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!filters.subjectId}
            >
              <option value="">Tất cả</option>
              {VOLUMES.map((volume) => (
                <option key={volume.value} value={volume.value}>
                  {volume.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chủ đề <span className="text-red-500">*</span>
            </label>
            <select
              value={filters.topicId}
              onChange={(e) => {
                setFilters({ ...filters, topicId: e.target.value });
                setCurrentPage(0); // API v2.0: page starts from 0
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!filters.subjectId}
            >
              <option value="">Chọn chủ đề</option>
              {topics.map((topic) => (
                <option key={topic.topicId} value={topic.topicId}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Độ khó
            </label>
            <select
              value={filters.difficulty}
              onChange={(e) => {
                setFilters({ ...filters, difficulty: e.target.value });
                setCurrentPage(0); // API v2.0: page starts from 0
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!filters.topicId}
            >
              <option value="">Tất cả</option>
              {DIFFICULTY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
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
          placeholder="Tìm kiếm câu hỏi..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(0); // API v2.0: page starts from 0
          }}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!filters.topicId}
        />
      </div>

      {/* Question Count */}
      {filters.topicId && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {searchTerm ? (
            <>
              Tìm thấy{" "}
              <span className="font-semibold">{filteredQuestions.length}</span>{" "}
              trong tổng số{" "}
              <span className="font-semibold">{totalElements}</span> câu hỏi
            </>
          ) : (
            <>
              Tổng số câu hỏi:{" "}
              <span className="font-semibold">
                {totalElements || filteredQuestions.length}
              </span>
            </>
          )}
        </div>
      )}

      {/* Questions List - Flex grow để chiếm hết không gian còn lại */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center text-gray-500 dark:text-gray-400">
            Đang tải...
          </div>
        ) : !filters.topicId ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center text-gray-500 dark:text-gray-400">
            Vui lòng chọn môn học và chủ đề
          </div>
        ) : currentQuestions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center text-gray-500 dark:text-gray-400">
            Không có câu hỏi nào
          </div>
        ) : (
          currentQuestions.map((question, index) => (
            <div
              key={question.questionId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      #{currentPage * itemsPerPage + index + 1}
                    </span>
                    {getDifficultyBadge(question.difficultyLevel)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getQuestionTypeLabel(question.questionType)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {question.points} điểm
                    </span>
                  </div>
                  <div className="text-gray-900 dark:text-gray-100 font-medium">
                    <LatexText>{question.questionText}</LatexText>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => openModal("view", question)}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal("edit", question)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Sửa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal("delete", question)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {question.questionOptions &&
                question.questionOptions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {question.questionOptions.map((option) => (
                      <div
                        key={option.optionId}
                        className={`flex items-start gap-2 p-2 rounded ${
                          option.isCorrect
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "bg-gray-50 dark:bg-gray-700/50"
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {String.fromCharCode(65 + option.optionOrder - 1)}.
                        </span>
                        <div
                          className={`text-sm flex-1 ${
                            option.isCorrect
                              ? "text-green-900 dark:text-green-300 font-medium"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <LatexText>{option.optionText}</LatexText>
                        </div>
                        {option.isCorrect && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                            ✓ Đáp án đúng
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))
        )}
      </div>

      {/* Pagination - Luôn ở cuối, không sticky */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Hiển thị {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, totalElements)} trong tổng số{" "}
              {totalElements} câu hỏi
            </div>
            <Pagination
              totalItems={totalElements}
              itemsPerPage={itemsPerPage}
              currentPage={displayPage}
              onPageChange={(page) => setCurrentPage(page - 1)} // Convert 1-based to 0-based
            />
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalType === "view" && selectedQuestion && (
        <Modal title="Chi tiết câu hỏi" onClose={closeModal} size="3xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Câu hỏi
              </label>
              <div className="text-gray-900 dark:text-gray-100">
                <LatexText>{selectedQuestion.questionText}</LatexText>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại câu hỏi
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {getQuestionTypeLabel(selectedQuestion.questionType)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Độ khó
                </label>
                {getDifficultyBadge(selectedQuestion.difficultyLevel)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Điểm
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedQuestion.points}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chủ đề
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedQuestion.topicName ||
                    selectedQuestion.topic?.name ||
                    "-"}
                </p>
              </div>
            </div>

            {selectedQuestion.questionOptions &&
              selectedQuestion.questionOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Đáp án
                  </label>
                  <div className="space-y-2">
                    {selectedQuestion.questionOptions.map((option) => (
                      <div
                        key={option.optionId}
                        className={`flex items-start gap-2 p-3 rounded ${
                          option.isCorrect
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "bg-gray-50 dark:bg-gray-700/50"
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {String.fromCharCode(65 + option.optionOrder - 1)}.
                        </span>
                        <div
                          className={`text-sm flex-1 ${
                            option.isCorrect
                              ? "text-green-900 dark:text-green-300 font-medium"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <LatexText>{option.optionText}</LatexText>
                        </div>
                        {option.isCorrect && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                            ✓ Đúng
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="flex justify-end pt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit Modal */}
      {(modalType === "add" || modalType === "edit") && (
        <Modal
          title={modalType === "add" ? "Thêm câu hỏi mới" : "Chỉnh sửa câu hỏi"}
          onClose={closeModal}
          size="80%"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Câu hỏi <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.questionText}
                onChange={(e) =>
                  setFormData({ ...formData, questionText: e.target.value })
                }
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập nội dung câu hỏi..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại câu hỏi
                </label>
                <select
                  value={formData.questionType}
                  onChange={(e) =>
                    setFormData({ ...formData, questionType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {QUESTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Độ khó
                </label>
                <select
                  value={formData.difficultyLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      difficultyLevel: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DIFFICULTY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ Ẩn trường Điểm - Mặc định = 1 */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Điểm
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.points}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      points: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chủ đề
                </label>
                <select
                  value={formData.topicId}
                  onChange={(e) =>
                    setFormData({ ...formData, topicId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn chủ đề</option>
                  {topics.map((topic) => (
                    <option key={topic.topicId} value={topic.topicId}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.questionType === "MULTIPLE_CHOICE" && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Đáp án <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    + Thêm đáp án
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 pt-2">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <input
                        type="text"
                        value={option.optionText}
                        onChange={(e) =>
                          handleOptionChange(
                            index,
                            "optionText",
                            e.target.value
                          )
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Đáp án ${String.fromCharCode(
                          65 + index
                        )}`}
                        required
                      />
                      <label className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) =>
                            handleOptionChange(
                              index,
                              "isCorrect",
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Đúng
                        </span>
                      </label>
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Đang lưu..." : modalType === "add" ? "Thêm" : "Lưu"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {modalType === "delete" && selectedQuestion && (
        <Modal title="Xác nhận xóa" onClose={closeModal}>
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Bạn có chắc chắn muốn xóa câu hỏi này?
            </p>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {selectedQuestion.questionText}
              </p>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">
              Thao tác này không thể hoàn tác!
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {modalType === "import" && (
        <Modal
          title={`Import Câu hỏi - ${importedQuestions.length} câu hỏi`}
          onClose={() => {
            setImportedQuestions([]);
            closeModal();
          }}
          size="80%"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Đã đọc được{" "}
                <span className="font-bold">{importedQuestions.length}</span>{" "}
                câu hỏi từ file Excel.
                <br />
                Chủ đề được chọn:{" "}
                <span className="font-bold">
                  {
                    topics.find((t) => t.topicId === parseInt(filters.topicId))
                      ?.name
                  }
                </span>
              </p>
            </div>

            {/* Preview imported questions */}
            <div className="max-h-[500px] overflow-y-auto space-y-3">
              {importedQuestions.map((question, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            DIFFICULTY_LEVELS.find(
                              (d) => d.value === question.difficultyLevel
                            )?.color
                          }`}
                        >
                          {
                            DIFFICULTY_LEVELS.find(
                              (d) => d.value === question.difficultyLevel
                            )?.label
                          }
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {
                            QUESTION_TYPES.find(
                              (t) => t.value === question.questionType
                            )?.label
                          }
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {question.points} điểm
                        </span>
                      </div>
                      <div className="text-gray-900 dark:text-gray-100 mb-2">
                        <LatexText>{question.questionText}</LatexText>
                      </div>
                      {question.options && question.options.length > 0 && (
                        <div className="space-y-1">
                          {question.options.map((option, optIdx) => (
                            <div
                              key={optIdx}
                              className={`flex items-start gap-2 p-2 rounded text-sm ${
                                option.isCorrect
                                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                  : "bg-gray-50 dark:bg-gray-700/50"
                              }`}
                            >
                              <span className="font-medium text-gray-600 dark:text-gray-400">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <div
                                className={`flex-1 ${
                                  option.isCorrect
                                    ? "text-green-900 dark:text-green-300 font-medium"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                <LatexText>{option.optionText}</LatexText>
                              </div>
                              {option.isCorrect && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                  ✓
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setImportedQuestions([]);
                  closeModal();
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmImport}
                // className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-md transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                {/* <Upload className="w-5 h-5" /> */}
                Import ngay {importedQuestions.length} câu hỏi
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageQuestionBank;
