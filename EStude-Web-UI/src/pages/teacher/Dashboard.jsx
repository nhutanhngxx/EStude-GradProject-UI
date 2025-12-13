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
import scheduleService from "../../services/scheduleService";
import studentService from "../../services/studentService";
import teacherService from "../../services/teacherService";
import assignmentService from "../../services/assignmentService";
import classSubjectService from "../../services/classSubjectService";
import subjectGradeService from "../../services/subjectGradeService";
import homeroomService from "../../services/homeroomService";
import { useToast } from "../../contexts/ToastContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import {
  Users,
  BookOpen,
  Clock,
  GraduationCap,
  ChartColumn,
  BarChart,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  ArrowRight,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import TeacherAnalytics from "../../components/analytics/TeacherAnalytics";
import HomeroomAnalytics from "../../components/analytics/HomeroomAnalytics";

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

// Component StatCard dengan design modern
const StatCard = ({
  title,
  value,
  icon,
  bgColor,
  onClick,
  note,
  isLoading,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 p-5 sm:p-6 cursor-pointer group ${bgColor} backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          {isLoading ? (
            <div className="mt-2 h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          ) : (
            <p className="text-3xl sm:text-4xl font-bold mt-2 text-gray-900 dark:text-white group-hover:scale-105 transition-transform">
              {value}
            </p>
          )}
          {note && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              {note}
            </p>
          )}
        </div>
        <div className="p-3 sm:p-4 rounded-lg bg-white/20 dark:bg-white/10 text-lg sm:text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
};

// Component Modal Dialog
const ModalDialog = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

// Component Empty State
const EmptyState = ({ message, icon: Icon }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {Icon && (
        <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
      )}
      <p className="text-gray-500 dark:text-gray-400 text-center">{message}</p>
    </div>
  );
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { darkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [gradeStats, setGradeStats] = useState([]);
  const [homeroomClassId, setHomeroomClassId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAssignmentPage, setCurrentAssignmentPage] = useState(1);
  const [currentClassPage, setCurrentClassPage] = useState(1);
  const [modalType, setModalType] = useState(null);

  const itemsPerPage = 10;
  const assignmentsPerPage = 10;
  const classesPerPage = 10;

  const barChartRef = useRef(null);
  const gradeChartRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user.school?.schoolId;
  const teacherId = user.userId;

  // console.log("user: ", user);

  // Fetch homeroom class
  useEffect(() => {
    const fetchHomeroomClass = async () => {
      if (!user.homeroomTeacher || !teacherId) return;

      try {
        const homeroomData = await homeroomService.getHomeroomStudents();
        if (Array.isArray(homeroomData) && homeroomData.length > 0) {
          const classId = homeroomData[0]?.classId;
          if (classId) setHomeroomClassId(classId);
        }
      } catch (error) {
        console.error("Error fetching homeroom class:", error);
      }
    };

    fetchHomeroomClass();
  }, [user.homeroomTeacher, teacherId]);

  // Fetch weekly schedules
  useEffect(() => {
    const fetchWeeklySchedules = async () => {
      if (!teacherId) return;

      try {
        const schedules = await scheduleService.getSchedulesByTeacher(
          teacherId
        );
        if (!schedules) return;

        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const thisWeekSchedules = schedules.filter((s) => {
          const scheduleDate = new Date(s.date);
          return scheduleDate >= weekStart && scheduleDate <= weekEnd;
        });

        setWeeklySchedules(thisWeekSchedules);
      } catch (error) {
        console.error("Error fetching weekly schedules:", error);
      }
    };

    fetchWeeklySchedules();
  }, [teacherId]);

  // Fetch main data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [classRes, studentRes, classSubjectRes] = await Promise.all([
          classService.getClassesBySchoolId(schoolId),
          studentService.getStudentsBySchool(schoolId),
          classSubjectService.getAllClassSubjects(),
        ]);

        if (classRes) setClasses(classRes);
        if (studentRes) setStudents(studentRes);

        const schoolClassSubjects = classSubjectRes.filter((cs) =>
          cs.subject.schools?.some((sch) => sch.schoolId === schoolId)
        );

        const subjectsMap = new Map();
        schoolClassSubjects.forEach((cs) => {
          const { subject } = cs;
          if (!subjectsMap.has(subject.subjectId)) {
            subjectsMap.set(subject.subjectId, { ...subject, classCount: 0 });
          }
          subjectsMap.get(subject.subjectId).classCount += 1;
        });

        setSubjects(Array.from(subjectsMap.values()));

        // Fetch grade statistics
        const teacherClasses = await teacherService.getClassSubjectByTeacherId(
          teacherId
        );
        const gradeStatsPromises = teacherClasses.map(async (cls) => {
          const gradesRes = await Promise.all(
            (
              await studentService.getStudentsByClass(cls.classId)
            ).map((s) =>
              subjectGradeService.getGradesOfStudentByClassSubject(
                s.userId,
                cls.classSubjectId
              )
            )
          );
          const validAverages = gradesRes
            .filter(
              (g) => g?.actualAverage !== undefined && g?.actualAverage !== null
            )
            .map((g) => Number(g.actualAverage));
          const average = validAverages.length
            ? (
                validAverages.reduce((sum, avg) => sum + avg, 0) /
                validAverages.length
              ).toFixed(1)
            : "N/A";
          return {
            classId: cls.classId,
            className: cls.className,
            subjectName: cls.subjectName,
            termName: cls.termName,
            averageGrade: average,
            studentCount: gradesRes.length,
            validGradeCount: validAverages.length,
          };
        });

        const gradeStatsResults = await Promise.all(gradeStatsPromises);

        const groupedStats = Object.values(
          gradeStatsResults.reduce((acc, stat) => {
            const key = `${stat.classId}-${stat.subjectName}`;
            if (!acc[key]) {
              acc[key] = {
                classId: stat.classId,
                className: stat.className,
                subjectName: stat.subjectName,
                totalGrade: 0,
                termCount: 0,
                validGradeCount: 0,
                studentCount: stat.studentCount || 0,
              };
            }

            if (stat.averageGrade !== null && !isNaN(stat.averageGrade)) {
              acc[key].totalGrade += Number(stat.averageGrade);
              acc[key].termCount += 1;
              acc[key].validGradeCount += stat.validGradeCount || 0;
            }
            return acc;
          }, {})
        );

        groupedStats.forEach((g) => {
          g.averageGrade =
            g.termCount > 0 ? (g.totalGrade / g.termCount).toFixed(1) : "N/A";
        });

        setGradeStats(groupedStats);

        // Fetch assignments
        const classMap = new Map(
          classRes.map((cls) => [cls.classId, cls.name])
        );

        const assignmentPromises = schoolClassSubjects.map((cs) =>
          assignmentService
            .getAssignmentsByClassSubjectId(cs.classSubjectId)
            .then((assignments) => {
              if (!assignments) return [];
              return assignments
                .filter((a) => a.teacher?.userId === teacherId)
                .map((a) => ({
                  ...a,
                  className: classMap.get(cs.classId) || "N/A",
                  subjectName: cs.subject.name,
                  termName: cs.term.name,
                }));
            })
        );

        const assignmentResults = await Promise.all(assignmentPromises);
        setAssignments(assignmentResults.flat());
      } catch (error) {
        console.error("Error loading data:", error);
        showToast("Không thể tải dữ liệu!", "error");
      } finally {
        setLoading(false);
      }
    };

    if (schoolId && teacherId) fetchData();
  }, [schoolId, teacherId, showToast]);

  // Pagination
  const handlePageChange = (page) => setCurrentPage(page);
  const handleAssignmentPageChange = (page) => setCurrentAssignmentPage(page);
  const handleClassPageChange = (page) => setCurrentClassPage(page);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return students.slice(startIndex, startIndex + itemsPerPage);
  }, [students, currentPage]);

  const paginatedAssignments = useMemo(() => {
    const startIndex = (currentAssignmentPage - 1) * assignmentsPerPage;
    return assignments.slice(startIndex, startIndex + assignmentsPerPage);
  }, [assignments, currentAssignmentPage]);

  const paginatedClasses = useMemo(() => {
    const startIndex = (currentClassPage - 1) * classesPerPage;
    return classes.slice(startIndex, startIndex + classesPerPage);
  }, [classes, currentClassPage]);

  // Chart data
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

  const newStudentsData = getNewStudentsByMonth();
  const barData = {
    labels: newStudentsData.labels,
    datasets: [
      {
        label: "Học sinh mới",
        data: newStudentsData.data,
        backgroundColor: [
          "#3b82f6",
          "#06b6d4",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
        ],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const gradeChartData = {
    labels: gradeStats
      .slice(0, 8)
      .map((stat) => `${stat.className}\n${stat.subjectName}`),
    datasets: [
      {
        label: "Điểm TB",
        data: gradeStats
          .slice(0, 8)
          .map((stat) =>
            stat.averageGrade !== "N/A" ? Number(stat.averageGrade) : 0
          ),
        backgroundColor: [
          "#3b82f6",
          "#06b6d4",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
          "#14b8a6",
        ],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: darkMode ? "#e5e7eb" : "#374151",
            font: { size: 12, weight: 500 },
            padding: 15,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: darkMode ? "#1f2937" : "#fff",
          titleColor: darkMode ? "#fff" : "#000",
          bodyColor: darkMode ? "#e5e7eb" : "#374151",
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
        },
      },
      scales: {
        x: {
          ticks: {
            color: darkMode ? "#9ca3af" : "#6b7280",
            font: { size: 11 },
          },
          grid: {
            color: darkMode ? "#374151" : "#e5e7eb",
            drawBorder: false,
          },
        },
        y: {
          ticks: {
            color: darkMode ? "#9ca3af" : "#6b7280",
            font: { size: 11 },
          },
          grid: {
            color: darkMode ? "#374151" : "#e5e7eb",
            drawBorder: false,
          },
          min: 0,
          max: 10,
        },
      },
    }),
    [darkMode]
  );

  const gradeLevelMap = {
    GRADE_6: "Khối 6",
    GRADE_7: "Khối 7",
    GRADE_8: "Khối 8",
    GRADE_9: "Khối 9",
    GRADE_10: "Khối 10",
    GRADE_11: "Khối 11",
    GRADE_12: "Khối 12",
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const openModal = (type) => setModalType(type);
  const closeModal = () => setModalType(null);

  return (
    <div className="bg-bg-transparent dark:bg-transparent p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Bảng điều khiển
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Chào mừng trở lại! Đây là tóm tắt hoạt động của bạn trong tuần này.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard
          title="Lớp học quản lý"
          value={classes.length}
          icon={
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          }
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
          onClick={() => openModal("classes")}
          isLoading={loading}
        />
        <StatCard
          title="Buổi dạy tuần này"
          value={weeklySchedules.length}
          icon={
            <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
          }
          bgColor="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
          onClick={() => navigate("/teacher/schedules")}
          isLoading={loading}
        />
        <StatCard
          title="Tổng học sinh"
          value={students.length}
          icon={
            <GraduationCap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          }
          bgColor="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20"
          onClick={() => openModal("students")}
          isLoading={loading}
        />
        <StatCard
          title="Bài tập đã giao"
          value={assignments.length}
          icon={
            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          }
          bgColor="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
          onClick={() => openModal("assignments")}
          isLoading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* New Students Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ChartColumn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Học sinh mới theo tháng
            </h2>
          </div>
          {loading ? (
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ) : (
            <Bar ref={barChartRef} data={barData} options={chartOptions} />
          )}
        </div>

        {/* Grade Statistics Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Điểm TB môn theo lớp (Top 8)
            </h2>
          </div>
          {loading ? (
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ) : gradeStats.length > 0 ? (
            <Bar
              ref={gradeChartRef}
              data={gradeChartData}
              options={chartOptions}
            />
          ) : (
            <EmptyState message="Chưa có dữ liệu điểm" icon={AlertCircle} />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Bài tập gần đây
            </h3>
            <button
              onClick={() => openModal("assignments")}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                ></div>
              ))}
            </div>
          ) : assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.slice(0, 3).map((assignment, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {assignment.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {assignment.className} - {assignment.subjectName}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        assignment.isPublished
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {assignment.isPublished ? "Công khai" : "Nháp"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Chưa có bài tập" />
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Lớp học quản lý
            </h3>
            <button
              onClick={() => openModal("classes")}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                ></div>
              ))}
            </div>
          ) : classes.length > 0 ? (
            <div className="space-y-3">
              {classes.slice(0, 3).map((classItem, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {classItem.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {gradeLevelMap[classItem.gradeLevel]} •{" "}
                        {classItem.classSize || 0} học sinh
                      </p>
                    </div>
                    {/* <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-600" /> */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Chưa có lớp học" />
          )}
        </div>
      </div>

      {/* Analytics Sections */}
      <div className="space-y-8">
        <TeacherAnalytics teacherId={teacherId} />
        {homeroomClassId && (
          <HomeroomAnalytics classId={homeroomClassId} teacherId={teacherId} />
        )}
      </div>

      {/* Modals */}
      <ModalDialog
        isOpen={modalType === "classes"}
        title="Danh sách lớp học quản lý"
        onClose={closeModal}
      >
        {classes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Tên lớp</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Khối lớp
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">Số HS</th>
                  <th className="px-6 py-3 text-left font-semibold">Năm học</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {paginatedClasses.map((classItem) => (
                  <tr
                    key={classItem.classId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                  >
                    <td className="px-6 py-3 text-gray-900 dark:text-gray-200">
                      {classItem.name}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                      {gradeLevelMap[classItem.gradeLevel]}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                      {classItem.classSize || 0}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                      {classItem.terms?.length > 0
                        ? classItem.terms.map((t) => t.name).join(", ")
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Chưa có lớp học nào" />
        )}
        {classes.length > classesPerPage && (
          <div className="mt-6">
            <Pagination
              totalItems={classes.length}
              itemsPerPage={classesPerPage}
              currentPage={currentClassPage}
              onPageChange={handleClassPageChange}
              siblingCount={1}
            />
          </div>
        )}
      </ModalDialog>

      <ModalDialog
        isOpen={modalType === "students"}
        title="Danh sách học sinh quản lý"
        onClose={closeModal}
      >
        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Tên HS</th>
                  <th className="px-6 py-3 text-left font-semibold">Email</th>
                  <th className="px-6 py-3 text-left font-semibold">Số ĐT</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Ngày đăng ký
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {paginatedStudents.map((student) => (
                  <tr
                    key={student.userId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                  >
                    <td className="px-6 py-3 text-gray-900 dark:text-gray-200">
                      {student.fullName}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400 truncate">
                      {student.email}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                      {student.numberPhone || "N/A"}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                      {formatDate(student.enrollmentDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Chưa có học sinh nào" />
        )}
        {students.length > itemsPerPage && (
          <div className="mt-6">
            <Pagination
              totalItems={students.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              siblingCount={1}
            />
          </div>
        )}
      </ModalDialog>

      <ModalDialog
        isOpen={modalType === "assignments"}
        title="Danh sách bài tập đã giao"
        onClose={closeModal}
      >
        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700/50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Tiêu đề</th>
                  <th className="px-6 py-3 text-left font-semibold">Lớp</th>
                  <th className="px-6 py-3 text-left font-semibold">Môn</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {paginatedAssignments.map((assignment) => (
                  <tr
                    key={assignment.assignmentId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                  >
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-200">
                      {assignment.title}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                      {assignment.className}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                      {assignment.subjectName}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                      {formatDate(assignment.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          assignment.isPublished
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {assignment.isPublished ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Công khai
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Nháp
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Chưa có bài tập nào" />
        )}
        {assignments.length > assignmentsPerPage && (
          <div className="mt-6">
            <Pagination
              totalItems={assignments.length}
              itemsPerPage={assignmentsPerPage}
              currentPage={currentAssignmentPage}
              onPageChange={handleAssignmentPageChange}
              siblingCount={1}
            />
          </div>
        )}
      </ModalDialog>
    </div>
  );
};

export default TeacherDashboard;
