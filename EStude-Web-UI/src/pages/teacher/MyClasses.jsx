import { useEffect, useState, useMemo } from "react";
import classSubjectService from "../../services/classSubjectService";
import classService from "../../services/classService";
import ClassStudentModal from "./ClassStudentModal";
import CreateAssignmentModal from "./CreateAssignmentModal";
import {
  BookOpen,
  Users,
  Calendar,
  FileText,
  CheckSquare,
  Search,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import AttendanceModal from "./AttendanceModal";
import AssignmentListModal from "./AssignmentListModal";
import debounce from "lodash/debounce";

// Format ngày kiểu Việt Nam
const formatDateVN = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

// Kiểm tra xem lớp học có ở tương lai không (chưa bắt đầu)
const isClassInFuture = (beginDate) => {
  if (!beginDate) return false;
  const classBeginDate = new Date(beginDate);
  // Set thời gian về đầu ngày để so sánh công bằng
  classBeginDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return classBeginDate > today;
};

export default function MyClasses() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  // Bộ lọc theo tên học kỳ (giống ManageClasses)
  const [selectedTermName, setSelectedTermName] = useState(null);
  const [schoolTerms, setSchoolTerms] = useState([]);

  // Tìm kiếm
  const [classKeyword, setClassKeyword] = useState("");
  const [subjectKeyword, setSubjectKeyword] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isAssignmentListOpen, setIsAssignmentListOpen] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Loading & error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce tìm kiếm
  const debouncedSetClassKeyword = useMemo(
    () => debounce((value) => setClassKeyword(value), 200),
    []
  );
  const debouncedSetSubjectKeyword = useMemo(
    () => debounce((value) => setSubjectKeyword(value), 200),
    []
  );

  // Tải lớp giảng dạy của giáo viên
  useEffect(() => {
    const fetchMyClasses = async () => {
      if (!user.userId) return;
      setIsLoading(true);
      setError(null);
      try {
        const result = await classSubjectService.getTeacherClassSubjects(
          user.userId
        );
        if (result) setClasses(result);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách lớp học. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyClasses();
  }, [user.userId]);

  // Tải học kỳ của toàn trường
  useEffect(() => {
    const fetchSchoolTerms = async () => {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const schoolId = userData.schoolId || userData.school?.schoolId;
      if (!schoolId) return;

      try {
        setIsLoading(true);
        const schoolClasses = await classService.getClassesBySchoolId(schoolId);
        if (!schoolClasses || !Array.isArray(schoolClasses)) return;

        const termMap = new Map();
        schoolClasses.forEach((cls) => {
          if (cls.terms && Array.isArray(cls.terms)) {
            cls.terms.forEach((term) => {
              if (!termMap.has(term.termId)) {
                termMap.set(term.termId, {
                  termId: term.termId,
                  termName: term.name,
                  beginDate: term.beginDate,
                  endDate: term.endDate,
                });
              }
            });
          }
        });

        const uniqueTermsList = Array.from(termMap.values()).sort(
          (a, b) => new Date(b.beginDate) - new Date(a.beginDate)
        );
        setSchoolTerms(uniqueTermsList);
      } catch (err) {
        console.error("Lỗi tải học kỳ trường:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolTerms();
  }, []);

  // Danh sách học kỳ unique theo tên (cho dropdown)
  const termNameOptions = useMemo(() => {
    const uniqueNames = new Set();
    const options = [];

    const sortedTerms = [...schoolTerms].sort(
      (a, b) => new Date(b.beginDate) - new Date(a.beginDate)
    );

    sortedTerms.forEach((term) => {
      if (!uniqueNames.has(term.termName)) {
        uniqueNames.add(term.termName);
        options.push({
          label: term.termName,
          termName: term.termName,
        });
      }
    });

    return options;
  }, [schoolTerms]);

  // Flatten classes để dễ lọc
  const flattenedClasses = useMemo(() => {
    return classes.map((cls) => ({
      key: `${cls.classId}-${cls.subjectName}-${cls.termId}`,
      classId: cls.classId,
      className: cls.className ?? "-",
      subjectName: cls.subjectName,
      classSubjectId: cls.classSubjectId,
      termId: cls.termId,
      termName: cls.termName,
      beginDate: cls.beginDate,
      endDate: cls.endDate,
    }));
  }, [classes]);

  // Reset trang khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTermName, classKeyword, subjectKeyword]);

  // Tìm kiếm không dấu
  const fuzzyMatch = (str, pattern) => {
    if (!pattern.trim()) return true;
    const normalizedStr = str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const normalizedPattern = pattern
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return normalizedStr.includes(normalizedPattern);
  };

  // Lọc lớp theo tên học kỳ + từ khóa
  const filteredClasses = useMemo(() => {
    return flattenedClasses.filter((cls) => {
      const termPass =
        selectedTermName === null || cls.termName === selectedTermName;
      const classPass = fuzzyMatch(cls.className, classKeyword);
      const subjectPass = fuzzyMatch(cls.subjectName, subjectKeyword);
      return termPass && classPass && subjectPass;
    });
  }, [flattenedClasses, selectedTermName, classKeyword, subjectKeyword]);

  // Phân trang
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClasses = filteredClasses.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Label học kỳ hiện tại
  const currentTermLabel = selectedTermName || "";

  return (
    <div className="bg-bg-transparent dark:bg-transparent p-4 sm:p-6 lg:p-8">
      {/* <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">Lớp giảng dạy</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Danh sách lớp đang giảng dạy của bạn theo
            {selectedTermName && (
              <span className="ml-2 font-medium">{currentTermLabel}</span>
            )}
          </p>
        </div>
      </div> */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Lớp giảng dạy của bạn
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Danh sách lớp đang giảng dạy của bạn theo
          {selectedTermName && (
            <span className="ml-2 font-medium">{currentTermLabel}</span>
          )}
        </p>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        {/* Học kỳ */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTermName ?? ""}
            onChange={(e) => setSelectedTermName(e.target.value || null)}
            className="px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
          >
            <option value="">Chọn học kỳ</option>
            {termNameOptions.map((option) => (
              <option key={option.termName} value={option.termName}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tên lớp */}
        <div className="relative flex-1 max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm tên lớp (VD: 12A1, 11A2...)"
            onChange={(e) => debouncedSetClassKeyword(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
          />
        </div>

        {/* Môn học */}
        <div className="relative flex-1 max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm môn học (VD: Toán, Lý...)"
            onChange={(e) => debouncedSetSubjectKeyword(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Danh sách lớp */}
      {selectedTermName === null ? (
        <p className="text-gray-500 dark:text-gray-400 mt-4">
          Vui lòng chọn học kỳ để xem danh sách lớp học.
        </p>
      ) : isLoading ? (
        <p className="text-gray-500 dark:text-gray-400 mt-4">Đang tải...</p>
      ) : error ? (
        <p className="text-red-500 dark:text-red-400 mt-4">{error}</p>
      ) : filteredClasses.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 mt-4">
          Không có lớp nào trong học kỳ này.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {paginatedClasses.map((cls) => (
              <div
                key={cls.key}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col"
              >
                <div className="mb-4 flex items-center gap-3">
                  <BookOpen
                    className="text-green-600 dark:text-green-400"
                    size={22}
                  />
                  <div>
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                      {cls.className}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{cls.subjectName}</span>
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Học kỳ: <span className="font-medium">{cls.termName}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <Calendar
                    size={16}
                    className="text-gray-400 dark:text-gray-500"
                  />
                  {`${formatDateVN(cls.beginDate)} - ${formatDateVN(
                    cls.endDate
                  )}`}
                </p>

                {/* Thông báo nếu lớp ở tương lai */}
                {isClassInFuture(cls.beginDate) && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    Lớp học chưa bắt đầu. Các chức năng nhập điểm, điểm danh sẽ
                    được kích hoạt khi lớp bắt đầu.
                  </p>
                )}

                <div className="mt-auto flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (!isClassInFuture(cls.beginDate)) {
                        setSelectedClass({
                          classId: cls.classId,
                          className: cls.className,
                          subjectName: cls.subjectName,
                          termId: cls.termId,
                          termName: cls.termName,
                          classSubjectId: cls.classSubjectId,
                        });
                        setIsModalOpen(true);
                      }
                    }}
                    disabled={isClassInFuture(cls.beginDate)}
                    title={
                      isClassInFuture(cls.beginDate)
                        ? "Lớp học chưa bắt đầu"
                        : "Nhập điểm cho học sinh"
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                      isClassInFuture(cls.beginDate)
                        ? "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed opacity-60"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    }`}
                  >
                    <Users size={16} /> <span>Nhập điểm</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!isClassInFuture(cls.beginDate)) {
                        setSelectedClass({
                          classId: cls.classId,
                          className: cls.className,
                          subjectName: cls.subjectName,
                          termId: cls.termId,
                          classSubjectId: cls.classSubjectId,
                        });
                        setIsAttendanceOpen(true);
                      }
                    }}
                    disabled={isClassInFuture(cls.beginDate)}
                    title={
                      isClassInFuture(cls.beginDate)
                        ? "Lớp học chưa bắt đầu"
                        : "Ghi nhận điểm danh"
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                      isClassInFuture(cls.beginDate)
                        ? "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed opacity-60"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    }`}
                  >
                    <CheckSquare size={16} /> <span>Điểm danh</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!isClassInFuture(cls.beginDate)) {
                        setSelectedClass({
                          className: cls.className,
                          subjectName: cls.subjectName,
                          termId: cls.termId,
                          classSubjectId: cls.classSubjectId,
                        });
                        setIsAssignmentListOpen(true);
                      }
                    }}
                    disabled={isClassInFuture(cls.beginDate)}
                    title={
                      isClassInFuture(cls.beginDate)
                        ? "Lớp học chưa bắt đầu"
                        : "Quản lý bài tập"
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                      isClassInFuture(cls.beginDate)
                        ? "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed opacity-60"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    }`}
                  >
                    <FileText size={16} /> <span>Bài tập</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            totalItems={filteredClasses.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}

      {/* Các modal */}
      <ClassStudentModal
        classId={selectedClass?.classId}
        classSubjectId={selectedClass?.classSubjectId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <CreateAssignmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultType="QUIZ"
        classContext={null}
        onCreated={(assignment) => {
          console.log("Assignment đã được tạo:", assignment);
        }}
      />

      <AttendanceModal
        teacherId={user.userId}
        classSubjectId={selectedClass?.classSubjectId}
        classId={selectedClass?.classId}
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
      />

      <AssignmentListModal
        classSubjectId={selectedClass?.classSubjectId}
        isOpen={isAssignmentListOpen}
        onClose={() => setIsAssignmentListOpen(false)}
      />
    </div>
  );
}
