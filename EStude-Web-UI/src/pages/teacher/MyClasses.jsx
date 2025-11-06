import { useEffect, useState, useMemo } from "react";
import classSubjectService from "../../services/classSubjectService";
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
  const [selectedTermIdMap, setSelectedTermIdMap] = useState({});
  const [filterTerm, setFilterTerm] = useState("all");
  const [classKeyword, setClassKeyword] = useState("");
  const [subjectKeyword, setSubjectKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isAssignmentListOpen, setIsAssignmentListOpen] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    const fetchMyClasses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await classSubjectService.getTeacherClassSubjects(
          user.userId
        );
        console.log("Teacher's classes data:", result);
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

  // Gom nhóm lớp theo tên lớp + môn học
  const groupedClasses = useMemo(() => {
    return Object.values(
      classes.reduce((acc, cls) => {
        const key = `${cls.className}-${cls.subjectName}`;
        if (!acc[key]) {
          acc[key] = {
            key,
            classId: cls.classId,
            className: cls.className ?? "-",
            subjectName: cls.subjectName,
            termList: [],
          };
        }
        acc[key].termList.push({
          classId: cls.classId,
          classSubjectId: cls.classSubjectId,
          termId: cls.termId,
          termName: cls.termName,
          beginDate: cls.beginDate,
          endDate: cls.endDate,
        });
        return acc;
      }, {})
    );
  }, [classes]);

  // Flatten
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

  // Đồng bộ selectedTermIdMap khi filterTerm thay đổi
  useEffect(() => {
    if (filterTerm === "all") return;
    if (!groupedClasses || groupedClasses.length === 0) return;

    const newSelectedTermIdMap = {};
    groupedClasses.forEach((cls) => {
      const classKey = cls.key;
      const matchedTerm = cls.termList.find(
        (t) =>
          `${t.termName} (${formatDateVN(t.beginDate)} - ${formatDateVN(
            t.endDate
          )})` === filterTerm
      );
      newSelectedTermIdMap[classKey] = matchedTerm
        ? matchedTerm.termId
        : cls.termList[0]?.termId ?? null;
    });
    setSelectedTermIdMap(newSelectedTermIdMap);
  }, [filterTerm, groupedClasses]);

  // Reset trang khi filter/từ khóa thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [classKeyword, subjectKeyword, filterTerm]);

  // Tìm kiếm không dấu
  const fuzzyMatch = (str, pattern) => {
    if (!pattern.trim()) return true;
    str = str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    pattern = pattern
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return str.includes(pattern);
  };

  // Lấy danh sách học kỳ duy nhất
  const uniqueTerms = useMemo(() => {
    return Array.from(
      new Set(
        classes.map(
          (cls) =>
            `${cls.termName} (${formatDateVN(cls.beginDate)} - ${formatDateVN(
              cls.endDate
            )})`
        )
      )
    );
  }, [classes]);

  // Lọc lớp (không còn lọc theo status)
  const filteredClasses = useMemo(() => {
    return flattenedClasses.filter((cls) => {
      const termPass =
        filterTerm === "all" ||
        `${cls.termName} (${formatDateVN(cls.beginDate)} - ${formatDateVN(
          cls.endDate
        )})` === filterTerm;

      const classPass = fuzzyMatch(cls.className, classKeyword);
      const subjectPass = fuzzyMatch(cls.subjectName, subjectKeyword);

      return termPass && classPass && subjectPass;
    });
  }, [flattenedClasses, filterTerm, classKeyword, subjectKeyword]);

  // Phân trang
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClasses = filteredClasses.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 bg-transparent dark:bg-transparent text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">Lớp giảng dạy</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Danh sách lớp đang giảng dạy của bạn.
          </p>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        {/* Học kỳ */}
        <div className="flex items-center gap-2">
          <select
            required
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
          >
            <option value="all">Chọn học kỳ</option>
            {uniqueTerms.map((term) => (
              <option key={term} value={term}>
                {term}
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

      {/* Danh sách */}
      {!filterTerm || filterTerm === "all" ? (
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
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
        classContext={ctx}
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
