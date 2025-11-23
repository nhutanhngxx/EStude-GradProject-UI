import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Filter, Grid, List } from "lucide-react";
import classSubjectService from "../../services/classSubjectService";
import { useToast } from "../../contexts/ToastContext";

const SubjectCard = ({ subject, onClick }) => {
  const today = new Date();
  const begin = new Date(subject.beginDate);
  const end = new Date(subject.endDate);

  let status = "Đang diễn ra";
  let statusColor =
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

  if (begin > today) {
    status = "Sắp diễn ra";
    statusColor =
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  } else if (end < today) {
    status = "Đã học xong";
    statusColor =
      "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-4 sm:p-6 cursor-pointer border-l-4 border-blue-500"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
          {subject.name}
        </h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${statusColor} whitespace-nowrap flex-shrink-0`}
        >
          {status}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
        Giáo viên: {subject.teacherName || "Chưa có"}
      </p>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
        Lớp: {subject.className}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {subject.semester}
      </p>
    </div>
  );
};

const StudentSubjects = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("Đang diễn ra");
  const [semesterFilter, setSemesterFilter] = useState("HK1"); // Mặc định HK1
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const studentSubjects =
        await classSubjectService.getClassSubjectsByStudent(user.userId);

      if (!Array.isArray(studentSubjects)) {
        setSubjects([]);
        setLoading(false);
        return;
      }

      // API trả về đầy đủ dữ liệu, không cần gọi getAllClassSubjects
      const detailedSubjects = studentSubjects.map((s) => ({
        classSubjectId: s.classSubjectId,
        classId: s.classId,
        className: s.className,
        name: s.subjectName,
        teacherName: s.teacherName || "Chưa có",
        semester: s.termName || "",
        beginDate: s.beginDate || null,
        endDate: s.endDate || null,
      }));

      setSubjects(detailedSubjects);

      // Tự động xác định học kỳ hiện tại
      const today = new Date();
      const currentSemester = detailedSubjects.find((s) => {
        const begin = new Date(s.beginDate);
        const end = new Date(s.endDate);
        return begin <= today && today <= end;
      });

      if (currentSemester) {
        if (currentSemester.semester.includes("HK2")) {
          setSemesterFilter("HK2");
        } else if (currentSemester.semester.includes("HK1")) {
          setSemesterFilter("HK1");
        }
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      showToast("Lỗi khi tải danh sách môn học!", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const today = new Date();
    const begin = new Date(subject.beginDate);
    const end = new Date(subject.endDate);

    // Status filter
    if (statusFilter === "Sắp diễn ra" && begin <= today) return false;
    if (statusFilter === "Đang diễn ra" && !(begin <= today && today <= end))
      return false;
    if (statusFilter === "Đã học xong" && end >= today) return false;

    // Semester filter
    if (
      semesterFilter !== "Tất cả" &&
      !subject.semester.includes(semesterFilter)
    )
      return false;

    // Search filter
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      return subject.name.toLowerCase().includes(keyword);
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Môn học của tôi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý và theo dõi các môn học bạn đang tham gia
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${
              viewMode === "grid"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-400"
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${
              viewMode === "list"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-400"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm môn học..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="Đang diễn ra">Đang diễn ra</option>
            <option value="Sắp diễn ra">Sắp diễn ra</option>
            <option value="Đã học xong">Đã học xong</option>
          </select>
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Tất cả">Tất cả học kỳ</option>
            <option value="HK1">Học kỳ 1</option>
            <option value="HK2">Học kỳ 2</option>
          </select>
        </div>
      </div>

      {/* Subjects List */}
      {filteredSubjects.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredSubjects.map((subject) => (
            <SubjectCard
              key={subject.classSubjectId}
              subject={subject}
              onClick={() =>
                navigate(`/student/subjects/${subject.classSubjectId}`)
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Không tìm thấy môn học nào
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentSubjects;
