import { useEffect, useState } from "react";
import { Search, Save, FileDown, FileUp, X, ListChecks } from "lucide-react";
import teacherService from "../../services/teacherService";
import studentService from "../../services/studentService";
import subjectGradeService from "../../services/subjectGradeService";
import { useToast } from "../../contexts/ToastContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function TeacherGradeInput() {
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    termName: "all",
    subject: "all",
    className: "all",
    keyword: "",
  });
  const [isImporting, setIsImporting] = useState(false);

  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    studentId: null,
    value: "",
  });

  // Fetch classes
  useEffect(() => {
    const fetchMyClasses = async () => {
      const result = await teacherService.getClassSubjectByTeacherId(
        user.userId
      );
      if (result) setClasses(result);
    };
    fetchMyClasses();
  }, [user.userId]);

  // Check admin status
  useEffect(() => {
    setIsAdmin(user?.admin === true);
  }, [user]);

  // Format date for Vietnamese format
  const formatDateVN = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

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

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const groupedClasses = Object.values(
    classes.reduce((acc, cls) => {
      const key = `${cls.className}-${cls.subjectName}-${cls.termName}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          classId: cls.classId,
          className: cls.className ?? "-",
          subjectName: cls.subjectName,
          termName: cls.termName,
          classSubjectId: cls.classSubjectId,
        };
      }
      return acc;
    }, {})
  );

  const filteredClasses = groupedClasses.filter((cls) => {
    const matchesTerm =
      filters.termName === "all" || cls.termName === filters.termName;
    const matchesSubject =
      filters.subject === "all" ||
      cls.subjectName.toLowerCase().includes(filters.subject.toLowerCase());
    const matchesClass =
      filters.className === "all" ||
      cls.className.toLowerCase().includes(filters.className.toLowerCase());
    const matchesKeyword =
      !filters.keyword.trim() ||
      cls.className.toLowerCase().includes(filters.keyword.toLowerCase()) ||
      cls.subjectName.toLowerCase().includes(filters.keyword.toLowerCase());
    return matchesTerm && matchesSubject && matchesClass && matchesKeyword;
  });

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

  const saveGrade = async (student, { showToastMsg = true } = {}) => {
    const g = grades[student.userId];
    if (!g) return;

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
    }
    return res;
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      await Promise.all(
        students.map((s) => saveGrade(s, { showToastMsg: false }))
      );
      showToast("Đã lưu toàn bộ điểm của lớp", "success");
      // await fetchGrades(selectedClass.classId, selectedClass.classSubjectId);
    } catch (err) {
      console.error(err);
      showToast("Lưu toàn bộ điểm thất bại!", "error");
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleSaveOne = async (student) => {
    try {
      await saveGrade(student);
      await fetchGrades(selectedClass.classId, selectedClass.classSubjectId);
    } catch (err) {
      console.error(err);
      showToast("Lưu điểm thất bại!", "error");
    }
  };

  // Import grades from Excel
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

          const regularScores = [
            row["TX1"] !== undefined && row["TX1"] !== ""
              ? Number(row["TX1"])
              : "",
            row["TX2"] !== undefined && row["TX2"] !== ""
              ? Number(row["TX2"])
              : "",
            row["TX3"] !== undefined && row["TX3"] !== ""
              ? Number(row["TX3"])
              : "",
            row["TX4"] !== undefined && row["TX4"] !== ""
              ? Number(row["TX4"])
              : "",
            row["TX5"] !== undefined && row["TX5"] !== ""
              ? Number(row["TX5"])
              : "",
          ];

          const midtermScore =
            row["GiữaKỳ"] !== undefined && row["GiữaKỳ"] !== ""
              ? Number(row["GiữaKỳ"])
              : "";
          const finalScore =
            row["CuốiKỳ"] !== undefined && row["CuốiKỳ"] !== ""
              ? Number(row["CuốiKỳ"])
              : "";
          const comment = row["NhậnXét"] || "";

          // Validate scores
          const isValidScore = (score) =>
            score === "" ||
            (typeof score === "number" && score >= 0 && score <= 10);
          if (
            regularScores.every(isValidScore) &&
            isValidScore(midtermScore) &&
            isValidScore(finalScore)
          ) {
            newGrades[student.userId] = {
              ...newGrades[student.userId],
              regularScores,
              midtermScore,
              finalScore,
              comment,
              lockedRegular: regularScores.map((score) => !!score),
              lockedMidterm: !!midtermScore,
              lockedFinal: !!finalScore,
              lockedComment: !!comment,
            };
          } else {
            errorCount++;
          }
        });

        setGrades(newGrades);
        if (errorCount > 0) {
          showToast(
            `Nhập điểm thành công, nhưng có ${errorCount} dòng lỗi do mã học sinh không hợp lệ hoặc điểm không đúng định dạng!`,
            "warning"
          );
        } else {
          showToast("Nhập điểm từ file thành công!", "success");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      showToast("Nhập điểm từ file thất bại!", "error");
    } finally {
      setIsImporting(false);
      event.target.value = ""; // Reset file input
    }
  };

  // Export to Excel
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

  // Get unique filter options
  const uniqueTerms = [...new Set(classes.map((cls) => cls.termName))];
  const uniqueSubjects = [...new Set(classes.map((cls) => cls.subjectName))];
  const uniqueClasses = [...new Set(classes.map((cls) => cls.className))];

  return (
    <div className="flex min-h-full bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="pt-2 pl-2 min-h-full">
        <div className="w-full md:w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Bộ lọc
          </h2>

          {/* Search Input */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm lớp hoặc môn..."
              value={filters.keyword}
              onChange={(e) => handleFilterChange("keyword", e.target.value)}
              className="pl-10 pr-3 py-2 w-full border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
            />
          </div>

          {/* Term Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Học kỳ
            </label>
            <select
              value={filters.termName}
              onChange={(e) => handleFilterChange("termName", e.target.value)}
              className="mt-1 px-3 py-2 w-full border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
            >
              <option value="all">Tất cả</option>
              {uniqueTerms.map((termName, idx) => (
                <option key={idx} value={termName}>
                  {termName}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Môn học
            </label>
            <select
              value={filters.subject}
              onChange={(e) => handleFilterChange("subject", e.target.value)}
              className="mt-1 px-3 py-2 w-full border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
            >
              <option value="all">Tất cả</option>
              {uniqueSubjects.map((subject, idx) => (
                <option key={idx} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Lớp học
            </label>
            <select
              value={filters.className}
              onChange={(e) => handleFilterChange("className", e.target.value)}
              className="mt-1 px-3 py-2 w-full border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
            >
              <option value="all">Tất cả</option>
              {uniqueClasses.map((className, idx) => (
                <option key={idx} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          {/* Class List */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Danh sách lớp
            </h3>
            {filteredClasses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                Không có lớp nào phù hợp.
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredClasses.map((cls) => (
                  <li
                    key={cls.key}
                    onClick={() => {
                      setSelectedClass(cls);
                      fetchGrades(cls.classId, cls.classSubjectId);
                    }}
                    className={`p-2 rounded-lg cursor-pointer transition ${
                      selectedClass?.key === cls.key
                        ? "bg-green-100 dark:bg-green-700 text-green-800 dark:text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {cls.className} - {cls.subjectName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {cls.termName}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-2 overflow-auto">
        {selectedClass ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListChecks
                  className="text-blue-600 dark:text-blue-400"
                  size={20}
                />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Nhập điểm - {selectedClass.className} -{" "}
                  {selectedClass.subjectName} ({selectedClass.termName})
                </h2>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveAll}
                  disabled={isSavingAll}
                  className={`flex items-center gap-1 px-3 py-1 rounded transition ${
                    isSavingAll
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isSavingAll ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Lưu tất cả</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition"
                >
                  <FileDown size={16} />
                  <span>Xuất bảng điểm</span>
                </button>
                <label className="flex items-center gap-1 px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 transition cursor-pointer">
                  <FileUp size={16} />
                  <span>{isImporting ? "Đang nhập..." : "Nhập bảng điểm"}</span>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleImportExcel}
                    className="hidden"
                    disabled={isImporting}
                  />
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên hoặc mã học sinh..."
                  className="pl-8 pr-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <Search
                  className="absolute left-2 top-1.5 text-gray-400"
                  size={16}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600">
              <table
                className="w-full text-sm text-left table-auto border-separate"
                style={{ borderSpacing: 0 }}
              >
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Mã học sinh</th>
                    <th className="px-3 py-2">Tên học sinh</th>
                    <th className="px-3 py-2">Ngày sinh</th>
                    <th className="px-3 py-2">Điểm thường xuyên</th>
                    <th className="px-3 py-2">Giữa kỳ</th>
                    <th className="px-3 py-2">Cuối kỳ</th>
                    <th className="px-3 py-2">Trung bình</th>
                    <th className="px-3 py-2">Nhận xét</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {students
                    .filter(
                      (s) =>
                        s.fullName
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        (s.studentCode || "")
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                    )
                    .map((s, index) => {
                      const g = grades[s.userId] || {};
                      return (
                        <tr
                          key={s.userId}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                            {s.studentCode}
                          </td>
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                            {s.fullName}
                          </td>
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                            {formatDateVN(s.dob)}
                          </td>
                          <td className="px-3 py-2">
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
                                    s.userId,
                                    "regularScores",
                                    e.target.value,
                                    i
                                  )
                                }
                                className="w-16 mx-1 px-1 py-0.5 border rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:cursor-not-allowed"
                              />
                            ))}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={g.midtermScore ?? ""}
                              disabled={!isAdmin && g.lockedMidterm}
                              onChange={(e) =>
                                handleChange(
                                  s.userId,
                                  "midtermScore",
                                  e.target.value
                                )
                              }
                              className="w-16 px-1 py-0.5 border rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:cursor-not-allowed"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={g.finalScore ?? ""}
                              disabled={!isAdmin && g.lockedFinal}
                              onChange={(e) =>
                                handleChange(
                                  s.userId,
                                  "finalScore",
                                  e.target.value
                                )
                              }
                              className="w-16 px-1 py-0.5 border rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="w-16 min-h-[28px] px-1 py-0.5 border rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:cursor-not-allowed">
                              {g.actualAverage ?? "\u00A0"}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div
                              onClick={() =>
                                setCommentModal({
                                  isOpen: true,
                                  studentId: s.userId,
                                  value: g.comment ?? "",
                                })
                              }
                              className="cursor-pointer w-full rounded text-gray-900 dark:text-gray-100 overflow-hidden whitespace-nowrap text-ellipsis"
                              style={{ maxWidth: "200px" }}
                            >
                              {g.comment ? g.comment : "Thêm"}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => handleSaveOne(s)}
                              className="flex items-center gap-1 px-3 py-1 text-green-600 dark:text-green-400 rounded transition"
                            >
                              <Save size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              Vui lòng chọn một lớp để nhập điểm.
            </p>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {commentModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-5 shadow-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Nhận xét cho học sinh
            </h3>
            <textarea
              value={commentModal.value}
              onChange={(e) =>
                setCommentModal((prev) => ({ ...prev, value: e.target.value }))
              }
              className="w-full h-32 p-3 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() =>
                  setCommentModal({ isOpen: false, studentId: null, value: "" })
                }
                className="px-4 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
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
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
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
