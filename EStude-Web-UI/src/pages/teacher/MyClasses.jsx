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

export default function MyClasses() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTermId, setSelectedTermId] = useState(null); // Lọc theo termId
  const [classKeyword, setClassKeyword] = useState("");
  const [subjectKeyword, setSubjectKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isAssignmentListOpen, setIsAssignmentListOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schoolTerms, setSchoolTerms] = useState([]); // Học kỳ của trường
  const itemsPerPage = 6;

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
        console.log("getTeacherClassSubjects: ", result);

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
      if (!schoolId) {
        console.warn("Không tìm thấy schoolId");
        return;
      }

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

  // Tạo options cho dropdown học kỳ
  const termOptions = useMemo(() => {
    return schoolTerms.map((term) => ({
      termId: term.termId,
      label: `${term.termName} (${formatDateVN(
        term.beginDate
      )} - ${formatDateVN(term.endDate)})`,
    }));
  }, [schoolTerms]);

  // Tự động chọn học kỳ hiện tại (ngày 10/12/2025 → HK1)
  useEffect(() => {
    if (selectedTermId !== null || termOptions.length === 0) return;

    const today = new Date();
    const currentTerm = schoolTerms.find((term) => {
      const begin = new Date(term.beginDate);
      const end = new Date(term.endDate);
      return today >= begin && today <= end;
    });

    if (currentTerm) {
      setSelectedTermId(currentTerm.termId);
    } else if (termOptions.length > 0) {
      setSelectedTermId(termOptions[0].termId); // Chọn mới nhất nếu không có hiện tại
    }
  }, [termOptions, schoolTerms, selectedTermId]);

  // Flatten classes
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
  }, [selectedTermId, classKeyword, subjectKeyword]);

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

  // Lọc lớp theo termId + từ khóa
  const filteredClasses = useMemo(() => {
    return flattenedClasses.filter((cls) => {
      const termPass = selectedTermId === null || cls.termId === selectedTermId;
      const classPass = fuzzyMatch(cls.className, classKeyword);
      const subjectPass = fuzzyMatch(cls.subjectName, subjectKeyword);
      return termPass && classPass && subjectPass;
    });
  }, [flattenedClasses, selectedTermId, classKeyword, subjectKeyword]);

  // Phân trang
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClasses = filteredClasses.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Lấy label học kỳ hiện tại để hiển thị (tùy chọn)
  const currentTermLabel =
    termOptions.find((opt) => opt.termId === selectedTermId)?.label || "";

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 bg-transparent dark:bg-transparent text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">Lớp giảng dạy</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Danh sách lớp đang giảng dạy của bạn theo
            {selectedTermId && currentTermLabel && (
              <span className="ml-2 font-medium">{currentTermLabel}</span>
            )}
          </p>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        {/* Học kỳ */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTermId ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedTermId(value ? Number(value) : null);
            }}
            className="px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
          >
            <option value="">Chọn học kỳ</option>
            {termOptions.map((option) => (
              <option key={option.termId} value={option.termId}>
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
      {selectedTermId === null ? (
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

                <div className="mt-auto flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedClass({
                        classId: cls.classId,
                        className: cls.className,
                        subjectName: cls.subjectName,
                        termId: cls.termId,
                        termName: cls.termName,
                        classSubjectId: cls.classSubjectId,
                      });
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <Users size={16} /> <span>Nhập điểm</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedClass({
                        classId: cls.classId,
                        className: cls.className,
                        subjectName: cls.subjectName,
                        termId: cls.termId,
                        classSubjectId: cls.classSubjectId,
                      });
                      setIsAttendanceOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transição"
                  >
                    <CheckSquare size={16} /> <span>Điểm danh</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedClass({
                        className: cls.className,
                        subjectName: cls.subjectName,
                        termId: cls.termId,
                        classSubjectId: cls.classSubjectId,
                      });
                      setIsAssignmentListOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
