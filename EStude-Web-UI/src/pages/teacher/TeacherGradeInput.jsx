import { useEffect, useState, useContext } from "react";
import {
  Search,
  Save,
  FileDown,
  FileUp,
  ListChecks,
  Loader2,
  Filter,
  X,
  AlertCircle,
} from "lucide-react";
import teacherService from "../../services/teacherService";
import studentService from "../../services/studentService";
import subjectGradeService from "../../services/subjectGradeService";
import { useToast } from "../../contexts/ToastContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import classSubjectService from "../../services/classSubjectService";

export default function TeacherGradeInput() {
  const { showToast } = useToast();
  const { darkMode } = useContext(ThemeContext);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // State
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    studentId: null,
    value: "",
  });

  const [filters, setFilters] = useState({
    termName: "all",
    subject: "all",
  });

  // Hàm normalize chuỗi (loại bỏ dấu tiếng Việt)
  const normalizeString = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
      .toLowerCase() // Chuyển thành chữ thường
      .trim();
  };

  // Kiểm tra điểm có hợp lệ (0-10) hay không
  const isValidScore = (score) => {
    if (score === "" || score === null) return true; // Để trống là hợp lệ
    const num = Number(score);
    return !isNaN(num) && num >= 0 && num <= 10;
  };

  // Lấy danh sách điểm không hợp lệ của một học sinh
  const getInvalidScores = (student) => {
    const g = grades[student.userId];
    if (!g) return [];

    const invalid = [];

    // Kiểm tra điểm thường xuyên
    g.regularScores?.forEach((score, idx) => {
      if (score !== "" && !isValidScore(score)) {
        invalid.push(`Điểm thường xuyên ${idx + 1}: ${score}`);
      }
    });

    // Kiểm tra điểm giữa kỳ
    if (g.midtermScore !== "" && !isValidScore(g.midtermScore)) {
      invalid.push(`Điểm giữa kỳ: ${g.midtermScore}`);
    }

    // Kiểm tra điểm cuối kỳ
    if (g.finalScore !== "" && !isValidScore(g.finalScore)) {
      invalid.push(`Điểm cuối kỳ: ${g.finalScore}`);
    }

    return invalid;
  };

  // Lấy danh sách học sinh có điểm không hợp lệ
  const getStudentsWithInvalidScores = () => {
    return filteredStudents.filter(
      (student) => getInvalidScores(student).length > 0
    );
  };

  // Fetch classes
  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        let rawData;

        if (isAdmin) {
          rawData = await classSubjectService.getAllClassSubjects();
        } else {
          rawData = await teacherService.getClassSubjectByTeacherId(
            user.userId
          );
        }

        if (!rawData || !Array.isArray(rawData)) {
          console.warn("Dữ liệu lớp không hợp lệ");
          setClasses([]);
          return;
        }

        const normalizedClasses = rawData.map((item) => ({
          classId: item.classId,
          className: item.className,
          subjectName:
            item.subject?.name || item.subjectName || "Không xác định",
          termName: item.term?.name || item.termName || "Không xác định",
          classSubjectId: item.classSubjectId,
          teacher: item.teacher || null,
        }));

        setClasses(normalizedClasses);
      } catch (err) {
        console.error("Lỗi khi tải danh sách lớp:", err);
        showToast("Không thể tải danh sách lớp học", "error");
        setClasses([]);
      }
    };

    if (user?.userId) {
      fetchMyClasses();
    }
  }, [user.userId, isAdmin, showToast]);

  useEffect(() => {
    setIsAdmin(user?.isAdmin === true);
  }, [user]);

  // Fetch grades
  const fetchGrades = async (classId, classSubjectId) => {
    const studentsRes = await studentService.getStudentsByClass(classId);
    if (!studentsRes) return;

    setStudents(studentsRes);

    const gradesRes = await Promise.all(
      studentsRes.map((s) =>
        subjectGradeService.getGradesOfStudentByClassSubject(
          s.userId,
          classSubjectId
        )
      )
    );

    const initGrades = {};
    studentsRes.forEach((s, idx) => {
      const g = gradesRes[idx];
      initGrades[s.userId] = {
        regularScores: g?.regularScores || ["", "", "", "", ""],
        midtermScore: g?.midtermScore ?? "",
        finalScore: g?.finalScore ?? "",
        actualAverage: g?.actualAverage ?? "",
        comment: g?.comment ?? "",
        lockedRegular: (g?.regularScores || ["", "", "", "", ""]).map(
          (x) => !!x
        ),
        lockedMidterm: g?.midtermScore ? true : false,
        lockedFinal: g?.finalScore ? true : false,
        lockedComment: g?.comment ? true : false,
      };
    });

    setGrades(initGrades);
  };

  // Handle change
  const handleChange = (userId, field, value, index = null) => {
    setGrades((prev) => {
      const studentGrade = { ...prev[userId] };
      if (field === "regularScores" && index !== null) {
        const scores = [...(studentGrade[field] || [])];
        scores[index] = value === "" ? "" : Number(value);
        studentGrade[field] = scores;
      } else if (field === "midtermScore") {
        studentGrade.midtermScore = value === "" ? "" : Number(value);
      } else if (field === "finalScore") {
        studentGrade.finalScore = value === "" ? "" : Number(value);
      } else if (field === "comment") {
        studentGrade.comment = value;
      }
      return { ...prev, [userId]: studentGrade };
    });
  };

  // Save grade - với kiểm tra điểm hợp lệ
  const saveGrade = async (student, { showToastMsg = true } = {}) => {
    const g = grades[student.userId];
    if (!g) return false;

    // Kiểm tra xem có ít nhất một trường được điền hay không
    const hasRegularScores = g.regularScores.some(
      (score) => score !== "" && score != null
    );
    const hasMidtermScore = g.midtermScore !== "" && g.midtermScore != null;
    const hasFinalScore = g.finalScore !== "" && g.finalScore != null;

    // Nếu tất cả các trường đều rỗng, báo lỗi
    if (!hasRegularScores && !hasMidtermScore && !hasFinalScore) {
      if (showToastMsg) {
        showToast(
          `Không thể lưu điểm cho ${student.fullName} vì chưa có điểm nào được nhập!`,
          "error"
        );
      }
      return false;
    }

    // Kiểm tra điểm có hợp lệ hay không (0-10)
    const invalidScores = getInvalidScores(student);
    if (invalidScores.length > 0) {
      if (showToastMsg) {
        showToast(
          `Không thể lưu điểm cho ${student.fullName} vì có điểm không hợp lệ (phải từ 0-10)!`,
          "error"
        );
      }
      return false;
    }

    const payload = {
      studentId: student.userId,
      classSubjectId: selectedClass.classSubjectId,
      regularScores: g.regularScores.filter((v) => v !== "" && v != null),
      midtermScore: g.midtermScore === "" ? null : g.midtermScore,
      finalScore: g.finalScore === "" ? null : g.finalScore,
      comment: g.comment || null,
    };

    const res = await subjectGradeService.saveGrade(payload);
    if (res && showToastMsg) {
      showToast(`Đã lưu điểm cho ${student.fullName}`, "success");
    } else if (showToastMsg) {
      showToast(`Lưu điểm cho ${student.fullName} thất bại!`, "error");
    }
    return res;
  };

  // Save all
  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      await Promise.all(
        students.map((s) => saveGrade(s, { showToastMsg: false }))
      );
      showToast("Đã lưu toàn bộ điểm của lớp", "success");
      fetchGrades(selectedClass.classId, selectedClass.classSubjectId);
    } catch (err) {
      console.error(err);
      showToast("Lưu toàn bộ điểm thất bại!", "error");
    } finally {
      setIsSavingAll(false);
    }
  };

  // Save one
  const handleSaveOne = async (student) => {
    try {
      await saveGrade(student);
      await fetchGrades(selectedClass.classId, selectedClass.classSubjectId);
    } catch (err) {
      console.error(err);
      showToast("Lưu điểm thất bại!", "error");
    }
  };

  // Import Excel
  const handleImportExcel = async (event) => {
    if (!selectedClass) {
      showToast("Vui lòng chọn một lớp trước khi nhập điểm!", "error");
      return;
    }

    setIsImporting(true);
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const studentMap = new Map(students.map((s) => [s.studentCode, s]));
        const newGrades = { ...grades };

        let errorCount = 0;
        jsonData.forEach((row) => {
          const studentCode = row["MãHS"];
          const student = studentMap.get(studentCode);
          if (!student) {
            errorCount++;
            return;
          }

          newGrades[student.userId] = {
            ...newGrades[student.userId],
            regularScores: [
              row["TX1"] ? Number(row["TX1"]) : "",
              row["TX2"] ? Number(row["TX2"]) : "",
              row["TX3"] ? Number(row["TX3"]) : "",
              row["TX4"] ? Number(row["TX4"]) : "",
              row["TX5"] ? Number(row["TX5"]) : "",
            ],
            midtermScore: row["GiữaKỳ"] ? Number(row["GiữaKỳ"]) : "",
            finalScore: row["CuốiKỳ"] ? Number(row["CuốiKỳ"]) : "",
            comment: row["NhậnXét"] || "",
          };
        });

        setGrades(newGrades);
        if (errorCount > 0) {
          showToast(
            `Nhập thành công nhưng ${errorCount} học sinh không tìm thấy`,
            "warning"
          );
        } else {
          showToast("Nhập dữ liệu thành công!", "success");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      showToast("Nhập điểm từ file thất bại!", "error");
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const data = students.map((s) => {
      const g = grades[s.userId] || {};
      const regular = g.regularScores || [];
      return {
        MãHS: s.studentCode,
        HọTên: s.fullName,
        TX1: regular[0] || "",
        TX2: regular[1] || "",
        TX3: regular[2] || "",
        TX4: regular[3] || "",
        TX5: regular[4] || "",
        GiữaKỳ: g.midtermScore || "",
        CuốiKỳ: g.finalScore || "",
        TBM: g.actualAverage || "",
        NhậnXét: g.comment || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const headerOrder = [
      "MãHS",
      "HọTên",
      "TX1",
      "TX2",
      "TX3",
      "TX4",
      "TX5",
      "GiữaKỳ",
      "CuốiKỳ",
      "TBM",
      "NhậnXét",
    ];
    XLSX.utils.sheet_add_aoa(ws, [headerOrder], { origin: "A1" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BangDiem");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(
      blob,
      `BangDiem_${selectedClass?.className}_${selectedClass?.subjectName}.xlsx`
    );
  };

  // Format date
  const formatDateVN = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get unique terms and subjects
  const uniqueTerms = [...new Set(classes.map((cls) => cls.termName))];
  const uniqueSubjects = [...new Set(classes.map((cls) => cls.subjectName))];

  // Filter classes - chỉ hiển thị khi cả termName và subject không phải "all"
  const isFilterValid = filters.termName !== "all" && filters.subject !== "all";

  const filteredClasses = isFilterValid
    ? classes.filter((cls) => {
        const matchesTerm = cls.termName === filters.termName;
        const matchesSubject =
          cls.subjectName.toLowerCase() === filters.subject.toLowerCase();
        return matchesTerm && matchesSubject;
      })
    : [];

  // Filter students
  const normalizedSearchTerm = normalizeString(searchTerm);
  const filteredStudents = students.filter(
    (s) =>
      normalizeString(s.fullName).includes(normalizedSearchTerm) ||
      normalizeString(s.studentCode || "").includes(normalizedSearchTerm)
  );

  // Lấy danh sách học sinh có điểm không hợp lệ
  const studentsWithInvalidScores = getStudentsWithInvalidScores();

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 lg:p-8 ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Header */}
      <div className="mb-6">
        <h1
          className={`text-3xl sm:text-4xl font-bold mb-2 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Nhập Điểm
        </h1>
        <p
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          Quản lý và nhập điểm cho học sinh
        </p>
      </div>

      {/* Filter Section */}
      <div
        className={`rounded-xl border p-4 sm:p-6 mb-6 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <h2
          className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
            darkMode ? "text-gray-200" : "text-gray-900"
          }`}
        >
          <Filter className="w-5 h-5" />
          Bộ Lọc
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filters.termName}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, termName: e.target.value }))
            }
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-gray-200 hover:border-gray-500"
                : "bg-white border-gray-300 text-gray-900 hover:border-gray-400"
            }`}
          >
            <option value="all">📚 Chọn Học Kỳ</option>
            {uniqueTerms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>

          <select
            value={filters.subject}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, subject: e.target.value }))
            }
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-gray-200 hover:border-gray-500"
                : "bg-white border-gray-300 text-gray-900 hover:border-gray-400"
            }`}
          >
            <option value="all">📖 Chọn Môn Học</option>
            {uniqueSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>

          {/* Info text */}
          {isFilterValid && (
            <div
              className={`ml-auto text-sm font-medium px-3 py-2 rounded-lg ${
                darkMode
                  ? "bg-blue-900/30 text-blue-300"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {filteredClasses.length} lớp
            </div>
          )}
        </div>

        {/* Message when not selected */}
        {!isFilterValid && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              darkMode
                ? "bg-yellow-900/20 text-yellow-300 border border-yellow-700/30"
                : "bg-yellow-100 text-yellow-800 border border-yellow-300"
            }`}
          >
            Vui lòng chọn cả <strong>Học Kỳ</strong> và <strong>Môn Học</strong>{" "}
            để xem danh sách lớp
          </div>
        )}
      </div>

      {/* Class Selection */}
      {isFilterValid && filteredClasses.length > 0 && (
        <div
          className={`rounded-xl border p-4 sm:p-6 mb-6 ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h2
            className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              darkMode ? "text-gray-200" : "text-gray-900"
            }`}
          >
            <ListChecks className="w-5 h-5" />
            Chọn Lớp Học ({filteredClasses.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredClasses.map((cls) => (
              <button
                key={cls.classSubjectId}
                onClick={() => {
                  setSelectedClass(cls);
                  fetchGrades(cls.classId, cls.classSubjectId);
                  setSearchTerm("");
                }}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-left text-sm ${
                  selectedClass?.classSubjectId === cls.classSubjectId
                    ? darkMode
                      ? "bg-blue-900/40 border-blue-600 ring-1 ring-blue-500"
                      : "bg-blue-100 border-blue-500 ring-1 ring-blue-400"
                    : darkMode
                    ? "bg-gray-700/50 border-gray-600 hover:border-gray-500 hover:bg-gray-700"
                    : "bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
                }`}
              >
                <div
                  className={`font-semibold line-clamp-1 ${
                    darkMode ? "text-blue-300" : "text-blue-900"
                  }`}
                >
                  {cls.className}
                </div>
                <div
                  className={`text-xs mt-1 line-clamp-1 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {cls.subjectName}
                </div>
                <div
                  className={`text-xs mt-1 opacity-75 ${
                    darkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  {cls.termName}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State - khi lọc hợp lệ nhưng không có lớp */}
      {isFilterValid && filteredClasses.length === 0 && (
        <div
          className={`rounded-xl border p-12 text-center mb-6 ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <AlertCircle
            className={`w-12 h-12 mx-auto mb-4 ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          />
          <p
            className={`text-lg font-medium ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Không có lớp nào trong lựa chọn này
          </p>
        </div>
      )}

      {/* Grade Input Section */}
      {selectedClass ? (
        <div
          className={`rounded-xl border ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 sm:px-6 py-4 border-b ${
              darkMode
                ? "border-gray-700 bg-gray-800/50"
                : "border-gray-200 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2
                  className={`text-lg font-semibold ${
                    darkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {selectedClass.className} - {selectedClass.subjectName}
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {selectedClass.termName}
                </p>
              </div>
              <div
                className={`text-sm font-medium px-3 py-2 rounded-lg ${
                  darkMode
                    ? "bg-blue-900/30 text-blue-300"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {students.length} học sinh
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div
            className={`px-4 sm:px-6 py-4 border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } flex items-center justify-between gap-3 flex-wrap`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSaveAll}
                disabled={isSavingAll || students.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isSavingAll || students.length === 0
                    ? darkMode
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : darkMode
                    ? "bg-green-600/20 text-green-300 border border-green-600/50 hover:bg-green-600/30"
                    : "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                }`}
              >
                {isSavingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu Tất Cả</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportExcel}
                disabled={students.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border ${
                  students.length === 0
                    ? darkMode
                      ? "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed"
                      : "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                    : darkMode
                    ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <FileDown className="w-4 h-4" />
                <span>Xuất Excel</span>
              </button>

              <label
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border cursor-pointer ${
                  isImporting
                    ? darkMode
                      ? "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed"
                      : "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                    : darkMode
                    ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <FileUp className="w-4 h-4" />
                <span>{isImporting ? "Đang nhập..." : "Nhập Excel"}</span>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleImportExcel}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên hoặc mã..."
                className={`pl-10 pr-4 py-2 rounded-lg border text-sm transition-all ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                }`}
              />
            </div>
          </div>

          {/* Warning Banner - Hiển thị cảnh báo khi có điểm không hợp lệ */}
          {studentsWithInvalidScores.length > 0 && (
            <div
              className={`px-4 sm:px-6 py-4 border-b ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  darkMode
                    ? "bg-red-900/20 border border-red-700/50 text-red-300"
                    : "bg-red-100 border border-red-300 text-red-800"
                }`}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold mb-2">
                    ⚠️ Phát hiện {studentsWithInvalidScores.length} học sinh có
                    điểm không hợp lệ (phải từ 0-10):
                  </p>
                  <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                    {studentsWithInvalidScores.map((student) => (
                      <li key={student.userId}>
                        • <strong>{student.fullName}</strong>:{" "}
                        {getInvalidScores(student).join(", ")}
                      </li>
                    ))}
                  </ul>
                  <p
                    className={`text-xs mt-3 ${
                      darkMode ? "text-red-400" : "text-red-700"
                    }`}
                  >
                    Vui lòng chỉnh sửa các điểm trên trước khi lưu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className={`w-full text-sm border-collapse`}>
              <thead
                className={`${darkMode ? "bg-gray-700/50" : "bg-gray-100"}`}
              >
                <tr>
                  <th
                    className={`px-4 py-3 text-left font-semibold border-b ${
                      darkMode
                        ? "border-gray-700 text-gray-300"
                        : "border-gray-200 text-gray-900"
                    }`}
                  >
                    #
                  </th>
                  <th
                    className={`px-4 py-3 text-left font-semibold border-b ${
                      darkMode
                        ? "border-gray-700 text-gray-300"
                        : "border-gray-200 text-gray-900"
                    }`}
                  >
                    Mã đăng nhập
                  </th>
                  <th
                    className={`px-4 py-3 text-left font-semibold border-b ${
                      darkMode
                        ? "border-gray-700 text-gray-300"
                        : "border-gray-200 text-gray-900"
                    }`}
                  >
                    Tên Học Sinh
                  </th>
                  <th
                    className={`px-4 py-3 text-left font-semibold border-b ${
                      darkMode
                        ? "border-gray-700 text-gray-300"
                        : "border-gray-200 text-gray-900"
                    }`}
                  >
                    Ngày Sinh
                  </th>
                  <th
                    className={`px-4 py-3 text-center font-semibold border-b ${
                      darkMode
                        ? "border-gray-700 text-gray-300"
                        : "border-gray-200 text-gray-900"
                    }`}
                  >
                    Thường Xuyên
                  </th>
                  <th
                    className={`px-4 py-3 text-center font-semibold border-b ${
                      darkMode
                        ? "border-gray-700 text-gray-300"
                        : "border-gray-200 text-gray-900"
                    }`}
                  >
                    Giữa Kỳ
                  </th>
                  <th
                    className={`px-4 py-3 text-center font-semibold border-b ${
                      darkMode
                        ? "border-gray-700 text-gray-300"
                        : "border-gray-200 text-gray-900"
                    }`}
                  >
                    Cuối Kỳ
                  </th>
                  <th
                    className={`px-4 py-3 text-center font-semibold border-b ${
                      darkMode
                        ? "border-gray-700 text-gray-300"
                        : "border-gray-200 text-gray-900"
                    }`}
                  >
                    Trung Bình
                  </th>
                  <th
                    className={`px-4 py-3 text-left font-semibold border-b ${
                      darkMode
                        ? "border-gray-700 text-gray-300"
                        : "border-gray-200 text-gray-900"
                    }`}
                  >
                    Nhận Xét
                  </th>
                  <th
                    className={`px-4 py-3 text-center font-semibold border-b ${
                      darkMode
                        ? "border-gray-700 text-gray-300"
                        : "border-gray-200 text-gray-900"
                    }`}
                  >
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-6">
                      <div
                        className={`flex flex-col items-center justify-center gap-2 ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        <AlertCircle className="w-8 h-8" />
                        <p>Không tìm thấy học sinh phù hợp</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => {
                    const g = grades[student.userId] || {};
                    const hasInvalidScore =
                      getInvalidScores(student).length > 0;

                    return (
                      <tr
                        key={student.userId}
                        className={`border-b transition-colors ${
                          hasInvalidScore
                            ? darkMode
                              ? "bg-red-900/10 hover:bg-red-900/20 border-red-700/30"
                              : "bg-red-50 hover:bg-red-100 border-red-200"
                            : darkMode
                            ? "border-gray-700 hover:bg-gray-700/30"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <td
                          className={`px-4 py-3 text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          {student.studentCode}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          {student.fullName}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {formatDateVN(student.dob)}
                        </td>
                        <td className={`px-4 py-3`}>
                          <div className="flex gap-1 justify-center flex-wrap">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <input
                                key={i}
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={g.regularScores?.[i] ?? ""}
                                disabled={!isAdmin && g.lockedRegular?.[i]}
                                onChange={(e) =>
                                  handleChange(
                                    student.userId,
                                    "regularScores",
                                    e.target.value,
                                    i
                                  )
                                }
                                className={`w-12 h-9 px-2 rounded border text-center text-sm transition-all ${
                                  hasInvalidScore &&
                                  !isValidScore(g.regularScores?.[i])
                                    ? darkMode
                                      ? "bg-red-700 border-red-600 text-red-100"
                                      : "bg-red-200 border-red-400 text-red-900"
                                    : darkMode
                                    ? "bg-gray-700 border-gray-600 text-gray-100"
                                    : "bg-white border-gray-300 text-gray-900"
                                } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className={`px-4 py-3`}>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={g.midtermScore ?? ""}
                            disabled={!isAdmin && g.lockedMidterm}
                            onChange={(e) =>
                              handleChange(
                                student.userId,
                                "midtermScore",
                                e.target.value
                              )
                            }
                            className={`w-16 h-9 px-2 rounded border text-center text-sm transition-all ${
                              hasInvalidScore && !isValidScore(g.midtermScore)
                                ? darkMode
                                  ? "bg-red-700 border-red-600 text-red-100"
                                  : "bg-red-200 border-red-400 text-red-900"
                                : darkMode
                                ? "bg-gray-700 border-gray-600 text-gray-100"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                          />
                        </td>
                        <td className={`px-4 py-3`}>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={g.finalScore ?? ""}
                            disabled={!isAdmin && g.lockedFinal}
                            onChange={(e) =>
                              handleChange(
                                student.userId,
                                "finalScore",
                                e.target.value
                              )
                            }
                            className={`w-16 h-9 px-2 rounded border text-center text-sm transition-all ${
                              hasInvalidScore && !isValidScore(g.finalScore)
                                ? darkMode
                                  ? "bg-red-700 border-red-600 text-red-100"
                                  : "bg-red-200 border-red-400 text-red-900"
                                : darkMode
                                ? "bg-gray-700 border-gray-600 text-gray-100"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                          />
                        </td>
                        <td
                          className={`px-4 py-3 text-center text-sm font-medium ${
                            darkMode ? "text-blue-300" : "text-blue-700"
                          }`}
                        >
                          {g.actualAverage || "-"}
                        </td>
                        <td className={`px-4 py-3`}>
                          <button
                            onClick={() =>
                              setCommentModal({
                                isOpen: true,
                                studentId: student.userId,
                                value: g.comment ?? "",
                              })
                            }
                            className={`px-3 py-1 text-sm rounded transition-all truncate max-w-[100px] ${
                              g.comment
                                ? darkMode
                                  ? "bg-blue-900/30 text-blue-300"
                                  : "bg-blue-100 text-blue-700"
                                : darkMode
                                ? "text-gray-400 hover:text-gray-300"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            {g.comment || "Thêm"}
                          </button>
                        </td>
                        <td className={`px-4 py-3 text-center`}>
                          <button
                            onClick={() => handleSaveOne(student)}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded transition-all ${
                              darkMode
                                ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                            title="Lưu"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-xl border p-12 text-center ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <AlertCircle
            className={`w-12 h-12 mx-auto mb-4 ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          />
          <p
            className={`text-lg font-medium ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Vui lòng chọn một lớp để nhập điểm
          </p>
        </div>
      )}

      {/* Comment Modal */}
      {commentModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-xl shadow-2xl w-full max-w-md p-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold ${
                  darkMode ? "text-gray-200" : "text-gray-900"
                }`}
              >
                Nhận Xét
              </h3>
              <button
                onClick={() =>
                  setCommentModal({ isOpen: false, studentId: null, value: "" })
                }
                className={`p-1 rounded transition-all ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={commentModal.value}
              onChange={(e) =>
                setCommentModal((prev) => ({ ...prev, value: e.target.value }))
              }
              placeholder="Nhập nhận xét..."
              className={`w-full h-32 p-3 rounded-lg border resize-none transition-all text-sm ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() =>
                  setCommentModal({ isOpen: false, studentId: null, value: "" })
                }
                className={`px-4 py-2 rounded-lg font-medium transition-all border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200"
                }`}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  handleChange(
                    commentModal.studentId,
                    "comment",
                    commentModal.value
                  );
                  setCommentModal({
                    isOpen: false,
                    studentId: null,
                    value: "",
                  });
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-white ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
