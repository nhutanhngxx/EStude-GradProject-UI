import React, { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Users,
  BookOpen,
  Building,
  GraduationCap,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileBarChart,
  BarChart,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import adminService from "../../services/adminService";
import schoolService from "../../services/schoolService";
import classService from "../../services/classService";
import { ThemeContext } from "../../contexts/ThemeContext";
import Pagination from "../../components/common/Pagination";
import AdminAnalytics from "../../components/analytics/AdminAnalytics";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Component StatCard
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

const ModalDialog = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[70vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-4">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex-shrink-0"
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

// Component ActivityCard - Hiển thị hoạt động gọn gàng
const ActivityCard = ({
  log,
  formatTimestamp,
  t,
  getLogTypeColor,
  getLogTypeIcon,
}) => {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-all duration-200 border border-gray-100 dark:border-gray-600/30">
      <div
        className={`p-2 rounded-lg flex-shrink-0 ${
          getLogTypeColor(log.actionType).bg
        }`}
      >
        {getLogTypeIcon(log.actionType)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
            {log.content}
          </p>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
              getLogTypeColor(log.actionType).badge
            }`}
          >
            {t(`dashboard.logTypes.${log.actionType}`) || log.actionType}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            {formatTimestamp(log.timestamp)}
          </span>
          <span>•</span>
          <span className="truncate">
            {log.user?.fullName || t("common.na")}
          </span>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { darkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSchools: 0,
    totalClasses: 0,
    totalStudents: 0,
    totalTeachers: 0,
    newUsersThisMonth: 0,
  });
  const [newUsersData, setNewUsersData] = useState({ labels: [], data: [] });
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [newUsers, setNewUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchLogText, setSearchLogText] = useState("");
  const [filterLogType, setFilterLogType] = useState("all");

  const itemsPerPage = 10;

  const openModal = (type) => {
    setModalType(type);
    setCurrentPage(1);
    setSearchLogText("");
    setFilterLogType("all");
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => setCurrentPage(page);

  // Fetch data
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const usersRes = await adminService.getAllUsers();
        if (usersRes) {
          setUsers(usersRes);
          const studentsList = usersRes.filter((u) => u.role === "STUDENT");
          setStudents(studentsList);
          const teachersList = usersRes.filter((u) => u.role === "TEACHER");
          setTeachers(teachersList);
          const newUsersList = usersRes.filter((u) => {
            if (!u.enrollmentDate) return false;
            const enrollDate = new Date(u.enrollmentDate);
            const now = new Date();
            return (
              enrollDate.getMonth() === now.getMonth() &&
              enrollDate.getFullYear() === now.getFullYear()
            );
          });
          setNewUsers(newUsersList);

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
              usersRes.filter((u) => {
                if (!u.enrollmentDate) return false;
                const enrollDate = new Date(u.enrollmentDate);
                return (
                  enrollDate.getMonth() + 1 === month &&
                  enrollDate.getFullYear() === year
                );
              }).length
          );

          const schoolsRes = await schoolService.getAllSchools();
          setSchools(schoolsRes || []);

          const classesRes = await classService.getAllClasses();
          setClasses(classesRes || []);

          const logsRes = await adminService.getLogs();
          setLogs(
            logsRes
              ? logsRes.sort(
                  (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                )
              : []
          );

          setStats({
            totalUsers: usersRes.length,
            totalSchools: schoolsRes ? schoolsRes.length : 0,
            totalClasses: classesRes ? classesRes.length : 0,
            totalStudents: studentsList.length,
            totalTeachers: teachersList.length,
            newUsersThisMonth: newUsersList.length,
          });
          setNewUsersData({ labels: months.map((m) => m.label), data });
        }
      } catch (error) {
        console.error(t("dashboard.fetchStatsError"), error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [t]);

  // Pagination data
  const paginatedData = useMemo(() => {
    let data = [];
    if (modalType === "users") data = users;
    else if (modalType === "schools") data = schools;
    else if (modalType === "classes") data = classes;
    else if (modalType === "students") data = students;
    else if (modalType === "teachers") data = teachers;
    else if (modalType === "newUsers") data = newUsers;
    else if (modalType === "logs") {
      data = logs.filter((log) => {
        const content = log.content?.toLowerCase() || "";
        const userName = log.user?.fullName?.toLowerCase() || "";
        const matchesSearch =
          content.includes(searchLogText.toLowerCase()) ||
          userName.includes(searchLogText.toLowerCase());
        const matchesType =
          filterLogType === "all" || log.actionType === filterLogType;
        return matchesSearch && matchesType;
      });
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [
    modalType,
    users,
    schools,
    classes,
    students,
    teachers,
    newUsers,
    logs,
    searchLogText,
    filterLogType,
    currentPage,
  ]);

  const totalItems = useMemo(() => {
    if (modalType === "users") return users.length;
    if (modalType === "schools") return schools.length;
    if (modalType === "classes") return classes.length;
    if (modalType === "students") return students.length;
    if (modalType === "teachers") return teachers.length;
    if (modalType === "newUsers") return newUsers.length;
    if (modalType === "logs") {
      return logs.filter((log) => {
        const matchesSearch =
          log.content?.toLowerCase().includes(searchLogText.toLowerCase()) ||
          log.user?.fullName
            ?.toLowerCase()
            .includes(searchLogText.toLowerCase());
        const matchesType =
          filterLogType === "all" || log.actionType === filterLogType;
        return matchesSearch && matchesType;
      }).length;
    }
    return 0;
  }, [
    modalType,
    users,
    schools,
    classes,
    students,
    teachers,
    newUsers,
    logs,
    searchLogText,
    filterLogType,
  ]);

  // Helper functions for activity card
  const getLogTypeColor = (actionType) => {
    const colors = {
      GENERAL: {
        bg: "bg-gray-100 dark:bg-gray-600/30",
        text: "text-gray-600 dark:text-gray-300",
        badge: "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200",
      },
      CREATE: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-600 dark:text-green-400",
        badge:
          "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
      },
      UPDATE: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-600 dark:text-blue-400",
        badge:
          "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300",
      },
      DELETE: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-600 dark:text-red-400",
        badge: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
      },
      GRADE: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-600 dark:text-yellow-400",
        badge:
          "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300",
      },
      all: {
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        text: "text-indigo-600 dark:text-indigo-400",
        badge:
          "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300",
      },
    };
    return colors[actionType] || colors.GENERAL;
  };

  const getLogTypeIcon = (actionType) => {
    const iconMap = {
      CREATE: (
        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
      ),
      UPDATE: <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      DELETE: (
        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
      ),
      GRADE: (
        <BarChart className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
      ),
    };
    return (
      iconMap[actionType] || (
        <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      )
    );
  };

  // Chart options
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
          beginAtZero: true,
        },
      },
    }),
    [darkMode]
  );

  const chartData = {
    labels: newUsersData.labels,
    datasets: [
      {
        label: t("dashboard.newUsers"),
        data: newUsersData.data,
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

  const gradeLevelMap = {
    GRADE_6: t("gradeLevel.GRADE_6"),
    GRADE_7: t("gradeLevel.GRADE_7"),
    GRADE_8: t("gradeLevel.GRADE_8"),
    GRADE_9: t("gradeLevel.GRADE_9"),
    GRADE_10: t("gradeLevel.GRADE_10"),
    GRADE_11: t("gradeLevel.GRADE_11"),
    GRADE_12: t("gradeLevel.GRADE_12"),
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("common.na");
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return t("common.na");
    return new Date(timestamp).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getModalTitle = () => {
    const titles = {
      users: `${t("dashboard.totalUsers")} (${totalItems})`,
      schools: `${t("dashboard.totalSchools")} (${totalItems})`,
      classes: `${t("dashboard.totalClasses")} (${totalItems})`,
      students: `${t("dashboard.totalStudents")} (${totalItems})`,
      teachers: `${t("dashboard.totalTeachers")} (${totalItems})`,
      newUsers: `${t("dashboard.newUsersThisMonth")} (${totalItems})`,
      logs: `${t("dashboard.recentActivities")} (${totalItems})`,
    };
    return titles[modalType] || "";
  };

  const logTypes = [
    "all",
    "GENERAL",
    "UPDATE",
    "CREATE",
    "DELETE",
    "GRADE",
  ].map((type) => ({
    value: type,
    label: t(`dashboard.logTypes.${type}`),
  }));

  const cards = [
    {
      title: t("dashboard.totalUsers"),
      value: stats.totalUsers,
      icon: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      bgColor:
        "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      modalType: "users",
    },
    {
      title: t("dashboard.totalSchools"),
      value: stats.totalSchools,
      icon: <Building className="w-6 h-6 text-green-600 dark:text-green-400" />,
      bgColor:
        "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      modalType: "schools",
    },
    {
      title: t("dashboard.totalClasses"),
      value: stats.totalClasses,
      icon: (
        <BookOpen className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
      ),
      bgColor:
        "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20",
      modalType: "classes",
    },
    {
      title: t("dashboard.totalStudents"),
      value: stats.totalStudents,
      icon: (
        <GraduationCap className="w-6 h-6 text-red-600 dark:text-red-400" />
      ),
      bgColor:
        "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
      modalType: "students",
    },
    {
      title: t("dashboard.totalTeachers"),
      value: stats.totalTeachers,
      icon: (
        <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
      ),
      bgColor:
        "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      modalType: "teachers",
    },
    {
      title: t("dashboard.newUsersThisMonth"),
      value: stats.newUsersThisMonth,
      icon: <TrendingUp className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
      bgColor:
        "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20",
      modalType: "newUsers",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t("dashboard.overview")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("dashboard.welcome")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {cards.map((card, idx) => (
          <StatCard
            key={idx}
            title={card.title}
            value={card.value}
            icon={card.icon}
            bgColor={card.bgColor}
            onClick={() => openModal(card.modalType)}
            isLoading={loading}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* New Users Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("dashboard.newUsersChart")}
            </h2>
          </div>
          {loading ? (
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ) : newUsersData.labels.length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <EmptyState
              message={t("dashboard.noNewUsersData")}
              icon={AlertCircle}
            />
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t("dashboard.recentActivities")}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {logs.length} hoạt động
                </p>
              </div>
            </div>
            <button
              onClick={() => openModal("logs")}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              {t("dashboard.viewMore")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 flex-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          ) : logs.length > 0 ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 pr-2">
                {logs.slice(0, 4).map((log, idx) => (
                  <ActivityCard
                    key={idx}
                    log={log}
                    formatTimestamp={formatTimestamp}
                    t={t}
                    getLogTypeColor={getLogTypeColor}
                    getLogTypeIcon={getLogTypeIcon}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState message={t("dashboard.noData")} icon={AlertCircle} />
            </div>
          )}

          {/* Footer với thống kê hoạt động */}
          {!loading && logs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    label: "Tạo mới",
                    count: logs.filter((l) => l.actionType === "CREATE").length,
                    color: "text-green-600 dark:text-green-400",
                  },
                  {
                    label: "Cập nhật",
                    count: logs.filter((l) => l.actionType === "UPDATE").length,
                    color: "text-blue-600 dark:text-blue-400",
                  },
                  {
                    label: "Xóa",
                    count: logs.filter((l) => l.actionType === "DELETE").length,
                    color: "text-red-600 dark:text-red-400",
                  },
                  {
                    label: "Điểm",
                    count: logs.filter((l) => l.actionType === "GRADE").length,
                    color: "text-yellow-600 dark:text-yellow-400",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <p className={`text-lg font-bold ${stat.color}`}>
                      {stat.count}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
            <FileBarChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {t("dashboard.questionBankAnalytics") ||
              "Thống kê ngân hàng câu hỏi"}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Phân tích chi tiết về câu hỏi, độ khó, và hiệu suất sử dụng
          </p>
        </div>
        <AdminAnalytics />
      </div>

      {/* Modals */}
      <ModalDialog
        isOpen={modalType !== null}
        title={getModalTitle()}
        onClose={closeModal}
      >
        {/* Filters for Logs */}
        {modalType === "logs" && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder={t("dashboard.searchLogsPlaceholder")}
              value={searchLogText}
              onChange={(e) => setSearchLogText(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
            />
            <select
              value={filterLogType}
              onChange={(e) => setFilterLogType(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
            >
              {logTypes.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Table */}
        {totalItems > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700/50">
                <tr>
                  {modalType === "logs" && (
                    <>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("dashboard.timestamp")}
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("dashboard.content")}
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("dashboard.user")}
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("dashboard.logType")}
                      </th>
                    </>
                  )}
                  {(modalType === "users" ||
                    modalType === "students" ||
                    modalType === "teachers" ||
                    modalType === "newUsers") && (
                    <>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("manageAccounts.viewUserModal.fullName")}
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("manageAccounts.viewUserModal.email")}
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("manageAccounts.viewUserModal.role")}
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("dashboard.enrollmentDate")}
                      </th>
                    </>
                  )}
                  {modalType === "schools" && (
                    <>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("fields.name")}
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("fields.address")}
                      </th>
                    </>
                  )}
                  {modalType === "classes" && (
                    <>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("manageClasses.table.name")}
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("manageClasses.table.gradeLevel")}
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        {t("manageClasses.table.classSize")}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {paginatedData.map((item) => (
                  <tr
                    key={
                      item.userId || item.schoolId || item.classId || item.logId
                    }
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                  >
                    {modalType === "logs" && (
                      <>
                        <td className="px-6 py-3 text-gray-900 dark:text-gray-200">
                          {formatTimestamp(item.timestamp)}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                          {item.content || t("common.na")}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                          {item.user?.fullName || t("common.na")}
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {t(`dashboard.logTypes.${item.actionType}`) ||
                              t("common.na")}
                          </span>
                        </td>
                      </>
                    )}
                    {(modalType === "users" ||
                      modalType === "students" ||
                      modalType === "teachers" ||
                      modalType === "newUsers") && (
                      <>
                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-200">
                          {item.fullName || t("common.na")}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400 truncate">
                          {item.email || t("common.na")}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                          {t(
                            `manageAccounts.roles.${item.role.toLowerCase()}`
                          ) || t("common.na")}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                          {formatDate(item.enrollmentDate)}
                        </td>
                      </>
                    )}
                    {modalType === "schools" && (
                      <>
                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-200">
                          {item?.schoolName || t("common.na")}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                          {item.address || t("common.na")}
                        </td>
                      </>
                    )}
                    {modalType === "classes" && (
                      <>
                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-200">
                          {item.name || t("common.na")}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                          {gradeLevelMap[item.gradeLevel] || t("common.na")}
                        </td>
                        <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                          {item.classSize || 0}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message={t("dashboard.noData")} />
        )}

        {/* Pagination */}
        {totalItems > itemsPerPage && (
          <div className="mt-6 flex justify-end">
            <Pagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              siblingCount={1}
            />
          </div>
        )}
      </ModalDialog>
    </div>
  );
};

export default AdminDashboard;
