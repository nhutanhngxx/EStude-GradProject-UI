import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import classService from "../../services/classService";
import subjectService from "../../services/subjectService";
import studentService from "../../services/studentService";
import teacherService from "../../services/teacherService";
import assignmentService from "../../services/assignmentService";
import classSubjectService from "../../services/classSubjectService";
import { useToast } from "../../contexts/ToastContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import {
  Users,
  BookOpen,
  Bell,
  FileBarChart,
  Clock,
  GraduationCap,
  ChartLine,
  ChartColumn,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { darkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activityFilter, setActivityFilter] = useState("today");
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classSizes, setClassSizes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAssignmentPage, setCurrentAssignmentPage] = useState(1);
  const [currentClassPage, setCurrentClassPage] = useState(1);
  const itemsPerPage = 10;
  const assignmentsPerPage = 10;
  const classesPerPage = 10;

  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const subjectChartRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user.school?.schoolId;
  const teacherId = user.userId;

  // Phân trang cho học sinh
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return students.slice(startIndex, endIndex);
  }, [students, currentPage, itemsPerPage]);

  // Phân trang cho bài tập
  const handleAssignmentPageChange = (page) => {
    setCurrentAssignmentPage(page);
  };

  const paginatedAssignments = useMemo(() => {
    const startIndex = (currentAssignmentPage - 1) * assignmentsPerPage;
    const endIndex = startIndex + assignmentsPerPage;
    return assignments.slice(startIndex, endIndex);
  }, [assignments, currentAssignmentPage, assignmentsPerPage]);

  // Phân trang cho lớp học
  const handleClassPageChange = (page) => {
    setCurrentClassPage(page);
  };

  const paginatedClasses = useMemo(() => {
    const startIndex = (currentClassPage - 1) * classesPerPage;
    const endIndex = startIndex + classesPerPage;
    return classes.slice(startIndex, endIndex);
  }, [classes, currentClassPage, classesPerPage]);

  const gradeLevelMap = {
    GRADE_6: "Khối 6",
    GRADE_7: "Khối 7",
    GRADE_8: "Khối 8",
    GRADE_9: "Khối 9",
    GRADE_10: "Khối 10",
    GRADE_11: "Khối 11",
    GRADE_12: "Khối 12",
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        if (!schoolId) return;
        const classDetails = await Promise.all(
          classes.map(async (c) => {
            const res = await classService.getClassById(c.classId);
            return res;
          })
        );
        setClasses(classDetails);
      } catch (error) {
        console.error("Lỗi khi tải chi tiết lớp:", error);
        showToast("Không thể tải dữ liệu lớp!", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [schoolId, showToast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [classRes, studentRes, classSubjectRes] = await Promise.all([
          classService.getClassesBySchoolId(schoolId),
          studentService.getStudentsBySchool(schoolId),
          classSubjectService.getAllClassSubjects(),
        ]);

        // console.log("classRes:", classRes);
        // console.log("studentRes:", studentRes);
        // console.log("classSubjectRes:", classSubjectRes);

        if (classRes) setClasses(classRes);
        if (studentRes) setStudents(studentRes);

        const schoolClassSubjects = classSubjectRes.filter((cs) =>
          cs.subject.schools?.some((sch) => sch.schoolId === schoolId)
        );

        // console.log("schoolClassSubjects:", schoolClassSubjects);

        const subjectsMap = new Map();
        schoolClassSubjects.forEach((cs) => {
          const { subject } = cs;
          if (!subjectsMap.has(subject.subjectId)) {
            subjectsMap.set(subject.subjectId, { ...subject, classCount: 0 });
          }
          subjectsMap.get(subject.subjectId).classCount += 1;
        });

        setSubjects(Array.from(subjectsMap.values()));

        // Tạo map từ classId sang tên lớp để ánh xạ
        const classMap = new Map(
          classRes.map((cls) => [cls.classId, cls.name])
        );

        const assignmentPromises = schoolClassSubjects.map((cs) =>
          assignmentService
            .getAssignmentsByClassSubjectId(cs.classSubjectId)
            .then((assignments) => {
              if (!assignments) return [];
              return assignments
                .filter((a) => a.teacher?.userId === teacherId) // Lọc bài tập theo userId của giáo viên
                .map((a) => ({
                  ...a,
                  className: classMap.get(cs.classId) || "Không xác định",
                  subjectName: cs.subject.name,
                  termName: cs.term.name,
                }));
            })
        );

        // console.log("assignmentPromises:", assignmentPromises);

        const assignmentResults = await Promise.all(assignmentPromises);
        // console.log("assignmentResults:", assignmentResults);
        setAssignments(assignmentResults.flat());
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        showToast("Không thể tải dữ liệu!", "error");
      } finally {
        setLoading(false);
      }
    };

    if (schoolId && teacherId) fetchData();
  }, [schoolId, teacherId, showToast]);

  const getNewStudentsByMonth = () => {
    const now = new Date();
    const months = Array(6)
      .fill()
      .map((_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return {
          label: date.toLocaleString("vi-VN", {
            month: "short",
            year: "numeric",
          }),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
        };
      })
      .reverse();

    const data = months.map(
      ({ month, year }) =>
        students.filter((s) => {
          if (!s.enrollmentDate) return false;
          const enrollDate = new Date(s.enrollmentDate);
          return (
            enrollDate.getMonth() + 1 === month &&
            enrollDate.getFullYear() === year
          );
        }).length
    );

    return { labels: months.map((m) => m.label), data };
  };

  const getAssignmentsByWeek = () => {
    const now = new Date();
    const weeks = Array(4)
      .fill()
      .map((_, i) => {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - i * 7);
        return {
          label: `Tuần ${4 - i}`,
          start: new Date(weekStart.setHours(0, 0, 0, 0)),
          end: new Date(weekStart.setDate(weekStart.getDate() + 6)),
        };
      })
      .reverse();

    const data = weeks.map(
      ({ start, end }) =>
        assignments.filter((a) => {
          if (!a.createdAt) return false;
          const createdDate = new Date(a.createdAt);
          return createdDate >= start && createdDate <= end;
        }).length
    );

    return { labels: weeks.map((w) => w.label), data };
  };

  const cards = [
    {
      title: "Lớp học quản lý",
      value: classes.length.toString(),
      icon: <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      path: "/teacher/classes",
      note: classes.length === 0 ? "*Dữ liệu mẫu" : "",
      bgLight: "bg-blue-100",
      bgDark: "dark:bg-blue-900",
      showDetails: true,
    },
    {
      title: "Buổi dạy tuần này",
      value: "12",
      icon: <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />,
      path: "/teacher/schedule",
      note: "*Dữ liệu mẫu",
      bgLight: "bg-green-100",
      bgDark: "dark:bg-green-900",
    },
    {
      title: "Tổng học sinh",
      value: students.length.toString(),
      icon: (
        <GraduationCap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
      ),
      path: "/teacher/users",
      note: students.length === 0 ? "*Dữ liệu mẫu" : "",
      bgLight: "bg-yellow-100",
      bgDark: "dark:bg-yellow-900",
      showDetails: true,
    },
    {
      title: "Bài tập đã giao",
      value: assignments.length.toString(),
      icon: <FileBarChart className="w-6 h-6 text-red-600 dark:text-red-400" />,
      path: "/teacher/assignments",
      note: assignments.length === 0 ? "*Dữ liệu mẫu" : "",
      bgLight: "bg-red-100",
      bgDark: "dark:bg-red-900",
      showDetails: true,
    },
  ];

  const newStudentsData = getNewStudentsByMonth();
  const barData = {
    labels: newStudentsData.labels,
    datasets: [
      {
        label: "Học sinh mới",
        data: newStudentsData.data,
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const assignmentData = getAssignmentsByWeek();
  const lineData = {
    labels: assignmentData.labels,
    datasets: [
      {
        label: "Bài tập đã giao",
        data: assignmentData.data,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.3)",
        tension: 0.3,
      },
    ],
  };

  const subjectClassData = {
    labels: subjects.map((s) => s.name),
    datasets: [
      {
        label: "Số lớp",
        data: subjects.map((s) => s.classCount || 0),
        backgroundColor: "#f59e0b",
        borderColor: "#d97706",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: { color: darkMode ? "#ffffff" : "#1f2937" },
        },
      },
      scales: {
        x: {
          ticks: { color: darkMode ? "#fff" : "#1f2937" },
          grid: { color: darkMode ? "#4b5563" : "#e5e7eb" },
        },
        y: {
          ticks: { color: darkMode ? "#fff" : "#1f2937" },
          grid: { color: darkMode ? "#4b5563" : "#e5e7eb" },
        },
      },
    }),
    [darkMode]
  );

  const activities = [
    { time: "08:00", action: "Dạy Toán lớp 10A1", date: "2025-09-22" },
    {
      time: "09:45",
      action: "Chấm bài tập Vật Lý lớp 12B",
      date: "2025-09-22",
    },
    { time: "13:00", action: "Soạn bài Ngữ Văn lớp 11C", date: "2025-09-21" },
    { time: "15:30", action: "Họp tổ chuyên môn", date: "2025-09-20" },
  ];

  const filteredActivities = activities.filter((act) => {
    if (activityFilter === "today") return act.date === "2025-09-22";
    else if (activityFilter === "week") {
      const today = new Date("2025-09-22");
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const actDate = new Date(act.date);
      return actDate >= weekAgo && actDate <= today;
    }
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      // hour: "2-digit",
      // minute: "2-digit",
    });
  };

  return (
    <div className="p-6 bg-transparent text-gray-900 dark:text-gray-100">
      {/* Tiêu đề */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">Tổng quan</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tổng quan về lớp học, học sinh và hoạt động của bạn
          </p>
        </div>
      </div>

      {/* Cards thống kê */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border bg-white dark:bg-gray-800 shadow-sm animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              onClick={() => !card.showDetails && navigate(card.path)}
              className={`p-4 rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition ${card.bgLight} ${card.bgDark}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {card.title}
                  </h2>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {card.value}
                  </p>
                  {card.note && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {card.note}
                    </p>
                  )}
                  {card.showDetails && (
                    <button
                      onClick={() => {
                        if (card.title === "Bài tập đã giao")
                          setIsAssignmentModalOpen(true);
                        if (card.title === "Tổng học sinh")
                          setIsStudentModalOpen(true);
                        if (card.title === "Lớp học quản lý")
                          setIsClassModalOpen(true);
                      }}
                      className="mt-2 text-sm text-gray-900 dark:text-gray-100 underline hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Xem chi tiết
                    </button>
                  )}
                </div>
                <div className="p-2 bg-white/20 dark:bg-gray-800/20 rounded-lg">
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal chi tiết bài tập */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-10/12 h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Chi tiết bài tập đã giao</h2>
              <button
                onClick={() => setIsAssignmentModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {assignments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm text-left text-gray-900 dark:text-gray-100">
                  <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 w-64">Tiêu đề</th>
                      <th className="px-4 py-3 w-32">Lớp</th>
                      <th className="px-4 py-3 w-32">Môn học</th>
                      <th className="px-4 py-3 w-32">Học kỳ</th>
                      <th className="px-4 py-3 w-48">Ngày tạo</th>
                      <th className="px-4 py-3 w-48">Ngày hết hạn</th>
                      <th className="px-4 py-3 w-24">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssignments.map((assignment) => (
                      <tr
                        key={assignment.assignmentId}
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <td className="px-4 py-2">{assignment.title}</td>
                        <td className="px-4 py-2">
                          {assignment.className || "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          {assignment.subjectName || "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          {assignment.termName || "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          {formatDate(assignment.createdAt)}
                        </td>
                        <td className="px-4 py-2">
                          {formatDate(assignment.dueDate)}
                        </td>
                        <td className="px-4 py-2">
                          {assignment.isPublished ? (
                            <span className="text-green-500">Công khai</span>
                          ) : (
                            <span className="text-red-500">
                              Không công khai
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Chưa có bài tập nào được giao.
              </p>
            )}
            {assignments.length > assignmentsPerPage && (
              <div className="mt-4">
                <Pagination
                  totalItems={assignments.length}
                  itemsPerPage={assignmentsPerPage}
                  currentPage={currentAssignmentPage}
                  onPageChange={handleAssignmentPageChange}
                  siblingCount={1}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal chi tiết học sinh */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-10/12 h-[70vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold">Chi tiết học sinh quản lý</h2>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-sm text-left text-gray-900 dark:text-gray-100">
                    <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 w-48">Tên học sinh</th>
                        <th className="px-4 py-3 w-72">Email</th>
                        <th className="px-4 py-3 w-32">Số điện thoại</th>
                        <th className="px-4 py-3 w-48">Ngày đăng ký</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.map((student) => (
                        <tr
                          key={student.userId}
                          className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          <td className="px-4 py-2 ">
                            {student.fullName || "N/A"}
                          </td>
                          <td className="px-4 py-2">
                            {student.email || "N/A"}
                          </td>
                          <td className="px-4 py-2">
                            {student.numberPhone || "N/A"}
                          </td>
                          <td className="px-4 py-2">
                            {formatDate(student.enrollmentDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Chưa có học sinh nào.
                </p>
              )}
              {/* Thêm Pagination */}
              {students.length > itemsPerPage && (
                <div className="mt-4">
                  <Pagination
                    totalItems={students.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    siblingCount={1}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết lớp học */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-10/12 h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Chi tiết lớp học quản lý</h2>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {classes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-900 dark:text-gray-100">
                  <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2">Tên lớp</th>
                      <th className="px-4 py-2">Khối lớp</th>
                      <th className="px-4 py-2">Số học sinh</th>
                      <th className="px-4 py-2">Năm học</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* {classes.map((classItem) => ( */}
                    {paginatedClasses.map((classItem) => (
                      <tr
                        key={classItem.classId}
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <td className="px-4 py-2">{classItem.name || "N/A"}</td>
                        <td className="px-4 py-2">
                          {gradeLevelMap[classItem.gradeLevel] || "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          {classItem.classSize ?? 0}
                        </td>
                        <td className="px-4 py-2">
                          {classItem.terms?.length > 0
                            ? classItem.terms.map((term, index) => (
                                <span key={term.termId}>
                                  {term.name}
                                  {index < classItem.terms.length - 1 && <br />}
                                </span>
                              ))
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Chưa có lớp học nào.
              </p>
            )}
            {classes.length > classesPerPage && (
              <div className="mt-4">
                <Pagination
                  totalItems={classes.length}
                  itemsPerPage={classesPerPage}
                  currentPage={currentClassPage}
                  onPageChange={handleClassPageChange}
                  siblingCount={1}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <ChartColumn />
            <h2 className="text-xl font-semibold">Học sinh mới theo tháng</h2>
          </div>
          {loading ? (
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <Bar ref={barChartRef} data={barData} options={chartOptions} />
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <ChartLine />
            <h2 className="text-xl font-semibold">Số bài tập đã giao</h2>
          </div>
          {loading ? (
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <Line ref={lineChartRef} data={lineData} options={chartOptions} />
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-4">
            <ChartColumn />
            <h2 className="text-xl font-semibold">Số lớp theo môn học</h2>
          </div>
          {loading ? (
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : subjects.length > 0 ? (
            <Bar
              ref={subjectChartRef}
              data={subjectClassData}
              options={chartOptions}
            />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Chưa có dữ liệu môn học
            </p>
          )}
        </div>
      </div>

      {/* Hoạt động gần đây */}
      {/* <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🕒 Hoạt động gần đây</h2>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 text-sm"
          >
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="all">Tất cả</option>
          </select>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="border-b border-gray-300 dark:border-gray-700 pb-2 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length > 0 ? (
          <ul className="space-y-3">
            {filteredActivities.map((act, idx) => (
              <li
                key={idx}
                className="border-b border-gray-300 dark:border-gray-700 pb-2"
              >
                <span className="font-bold">{act.time}</span> - {act.action} (
                {act.date})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Không có hoạt động nào trong khoảng thời gian này
          </p>
        )}
      </div> */}
    </div>
  );
};

export default TeacherDashboard;
