import React, { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Users,
  BookOpen,
  Bell,
  FileBarChart,
  Clock,
  Building,
  GraduationCap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import adminService from "../../services/adminService";
import schoolService from "../../services/schoolService";
import classService from "../../services/classService";
import { ThemeContext } from "../../contexts/ThemeContext";
import Pagination from "../../components/common/Pagination";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
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
  const [modalType, setModalType] = useState(null); // null | "users" | "schools" | "classes" | "students" | "teachers" | "newUsers" | "logs"
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [searchLogText, setSearchLogText] = useState("");
  const [filterLogType, setFilterLogType] = useState("all");

  const openModal = (type) => {
    setModalType(type);
    setCurrentPage(1);
  };
  const closeModal = () => setModalType(null);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
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
    itemsPerPage,
  ]);

  const totalItems = useMemo(() => {
    if (modalType === "users") return users.length;
    else if (modalType === "schools") return schools.length;
    else if (modalType === "classes") return classes.length;
    else if (modalType === "students") return students.length;
    else if (modalType === "teachers") return teachers.length;
    else if (modalType === "newUsers") return newUsers.length;
    else if (modalType === "logs") {
      return logs.filter((log) => {
        const matchesSearch =
          log.content.toLowerCase().includes(searchLogText.toLowerCase()) ||
          log.user.fullName.toLowerCase().includes(searchLogText.toLowerCase());
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

  const gradeLevelMap = {
    GRADE_6: t("gradeLevel.GRADE_6"),
    GRADE_7: t("gradeLevel.GRADE_7"),
    GRADE_8: t("gradeLevel.GRADE_8"),
    GRADE_9: t("gradeLevel.GRADE_9"),
    GRADE_10: t("gradeLevel.GRADE_10"),
    GRADE_11: t("gradeLevel.GRADE_11"),
    GRADE_12: t("gradeLevel.GRADE_12"),
  };

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

          const totalUsers = usersRes.length;
          const totalStudents = studentsList.length;
          const totalTeachers = teachersList.length;
          const newUsersThisMonth = newUsersList.length;

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
          const totalSchools = schoolsRes ? schoolsRes.length : 0;

          const classesRes = await classService.getAllClasses();
          setClasses(classesRes || []);
          const totalClasses = classesRes ? classesRes.length : 0;

          const logsRes = await adminService.getLogs();
          setLogs(
            logsRes
              ? logsRes.sort(
                  (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                )
              : []
          );

          setStats({
            totalUsers,
            totalSchools,
            totalClasses,
            totalStudents,
            totalTeachers,
            newUsersThisMonth,
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

  const chartData = {
    labels: newUsersData.labels,
    datasets: [
      {
        label: t("dashboard.newUsers"),
        data: newUsersData.data,
        backgroundColor: darkMode ? "#818cf8" : "#6366f1",
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            return value === 0
              ? t("common.na")
              : `${context.dataset.label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: darkMode ? "#fff" : "#1f2937" },
        grid: { color: darkMode ? "#4b5563" : "#e5e7eb" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: darkMode ? "#fff" : "#1f2937" },
        grid: { color: darkMode ? "#4b5563" : "#e5e7eb" },
      },
    },
  };

  const cards = [
    {
      title: t("dashboard.totalUsers"),
      value: stats.totalUsers.toString() || "150",
      icon: <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      path: "/admin/users",
      note: stats.totalUsers === 0 ? t("dashboard.sampleData") : "",
      bgLight: "bg-blue-100",
      bgDark: "dark:bg-blue-900",
      showDetails: true,
      modalType: "users",
    },
    {
      title: t("dashboard.totalSchools"),
      value: stats.totalSchools.toString() || "10",
      icon: <Building className="w-6 h-6 text-green-600 dark:text-green-400" />,
      path: "/admin/schools",
      note: stats.totalSchools === 0 ? t("dashboard.sampleData") : "",
      bgLight: "bg-green-100",
      bgDark: "dark:bg-green-900",
      showDetails: true,
      modalType: "schools",
    },
    {
      title: t("dashboard.totalClasses"),
      value: stats.totalClasses.toString() || "50",
      icon: (
        <BookOpen className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
      ),
      path: "/admin/classes",
      note: stats.totalClasses === 0 ? t("dashboard.sampleData") : "",
      bgLight: "bg-yellow-100",
      bgDark: "dark:bg-yellow-900",
      showDetails: true,
      modalType: "classes",
    },
    {
      title: t("dashboard.totalStudents"),
      value: stats.totalStudents.toString() || "120",
      icon: (
        <GraduationCap className="w-6 h-6 text-red-600 dark:text-red-400" />
      ),
      path: "/admin/students",
      note: stats.totalStudents === 0 ? t("dashboard.sampleData") : "",
      bgLight: "bg-red-100",
      bgDark: "dark:bg-red-900",
      showDetails: true,
      modalType: "students",
    },
    {
      title: t("dashboard.totalTeachers"),
      value: stats.totalTeachers.toString() || "30",
      icon: <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      path: "/admin/teachers",
      note: stats.totalTeachers === 0 ? t("dashboard.sampleData") : "",
      bgLight: "bg-purple-100",
      bgDark: "dark:bg-purple-900",
      showDetails: true,
      modalType: "teachers",
    },
    {
      title: t("dashboard.newUsersThisMonth"),
      value: stats.newUsersThisMonth.toString() || "15",
      icon: <Clock className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
      path: "/admin/new-users",
      note: stats.newUsersThisMonth === 0 ? t("dashboard.sampleData") : "",
      bgLight: "bg-teal-100",
      bgDark: "dark:bg-teal-900",
      showDetails: true,
      modalType: "newUsers",
    },
  ];

  const createReport = () => {
    alert(t("dashboard.reportCreated"));
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
    return t(`dashboard.modalTitles.${modalType}`) || "";
  };

  const logTypes = [
    "all",
    "GENERAL",
    "LOGIN",
    "UPDATE",
    "CREATE",
    "DELETE",
  ].map((type) => ({
    value: type,
    label: t(`dashboard.logTypes.${type}`),
  }));

  const logStats = useMemo(() => {
    if (modalType !== "logs") return null;

    const typeCounts = logTypes.reduce((acc, { value }) => {
      acc[value] = logs.filter(
        (log) => value === "all" || log.actionType === value
      ).length;
      return acc;
    }, {});

    const recentLogs = logs.slice(0, 10).reduce((acc, log) => {
      const date = new Date(log.timestamp).toLocaleDateString("vi-VN");
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return { typeCounts, recentLogs };
  }, [logs, modalType, t]);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-transparent text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t("dashboard.overview")}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            {t("dashboard.welcome")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={createReport}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-700 hover:bg-green-800 rounded-lg text-white text-sm sm:text-base shadow"
          >
            <FileBarChart className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t("dashboard.createReport")}
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border bg-white dark:bg-gray-700 shadow-sm animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(card.modalType);
                      }}
                      className="mt-2 text-sm text-gray-900 dark:text-gray-100 underline hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {t("dashboard.viewDetails")}
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

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            {t("dashboard.newUsersChart")}
          </h2>
          {loading ? (
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : newUsersData.labels.length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t("dashboard.noNewUsersData")}
            </p>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {t("dashboard.recentActivities")}
            </h2>
            <button
              onClick={() => openModal("logs")}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t("dashboard.viewMore")}
            </button>
          </div>
          <ul className="space-y-3">
            {loading
              ? [...Array(5)].map((_, idx) => (
                  <li key={idx} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  </li>
                ))
              : logs.slice(0, 7).map((log, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0"
                  >
                    <Clock className="w-4 h-4 mt-1 text-gray-500 dark:text-gray-400" />
                    <div>
                      <span className="font-semibold">
                        {formatTimestamp(log.timestamp)}
                      </span>{" "}
                      - <span>{log.content}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        ({log.user?.fullName || t("common.na")})
                      </span>
                    </div>
                  </li>
                ))}
          </ul>
        </div>
      </div>

      {/* Modals */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 sm:p-8 w-11/12 h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getModalTitle()}{" "}
                <span className="text-gray-500 dark:text-gray-400">
                  ({totalItems})
                </span>
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Close modal"
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

            {/* Logs Modal Content */}
            {modalType === "logs" && (
              <>
                {/* Log Stats Section */}
                <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t("dashboard.logStatsByType")}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(logStats.typeCounts).map(
                      ([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between text-sm bg-white dark:bg-gray-700 rounded-md px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150 min-w-[120px]"
                        >
                          <span className="text-gray-700 dark:text-gray-200">
                            {t(`dashboard.logTypes.${type}`)}
                          </span>
                          <span className="font-medium text-indigo-600 dark:text-indigo-400 ml-2">
                            {count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <input
                    type="text"
                    placeholder={t("dashboard.searchLogsPlaceholder")}
                    value={searchLogText}
                    onChange={(e) => setSearchLogText(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none transition-shadow duration-200"
                  />
                  <select
                    value={filterLogType}
                    onChange={(e) => setFilterLogType(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none transition-shadow duration-200"
                  >
                    {logTypes.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Table */}
            {totalItems > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm text-left text-gray-900 dark:text-gray-100 table-fixed">
                  <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <tr>
                      {modalType === "logs" && (
                        <>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/4 font-semibold"
                          >
                            {t("dashboard.timestamp")}
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/2 font-semibold"
                          >
                            {t("dashboard.content")}
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/6 font-semibold"
                          >
                            {t("dashboard.user")}
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/6 font-semibold"
                          >
                            {t("dashboard.logType")}
                          </th>
                        </>
                      )}
                      {(modalType === "users" ||
                        modalType === "students" ||
                        modalType === "teachers" ||
                        modalType === "newUsers") && (
                        <>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/4 font-semibold"
                          >
                            {t("manageAccounts.viewUserModal.fullName")}
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/4 font-semibold"
                          >
                            {t("manageAccounts.viewUserModal.email")}
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/6 font-semibold"
                          >
                            {t("manageAccounts.viewUserModal.role")}
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/3 font-semibold"
                          >
                            {t("dashboard.enrollmentDate")}
                          </th>
                        </>
                      )}
                      {modalType === "schools" && (
                        <>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/2 font-semibold"
                          >
                            {t("fields.name")}
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/2 font-semibold"
                          >
                            {t("fields.address")}
                          </th>
                        </>
                      )}
                      {modalType === "classes" && (
                        <>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/3 font-semibold"
                          >
                            {t("manageClasses.table.name")}
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/3 font-semibold"
                          >
                            {t("manageClasses.table.gradeLevel")}
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 w-1/3 font-semibold"
                          >
                            {t("manageClasses.table.classSize")}
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item) => (
                      <tr
                        key={
                          item.userId ||
                          item.schoolId ||
                          item.classId ||
                          item.logId
                        }
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                      >
                        {modalType === "logs" && (
                          <>
                            <td className="px-4 py-2.5 truncate text-gray-700 dark:text-gray-200">
                              {formatTimestamp(item.timestamp)}
                            </td>
                            <td className="px-4 py-2.5 truncate text-gray-700 dark:text-gray-200">
                              {item.content || t("common.na")}
                            </td>
                            <td className="px-4 py-2.5 truncate text-gray-700 dark:text-gray-200">
                              {item.user?.fullName || t("common.na")}
                            </td>
                            <td className="px-4 py-2.5 truncate">
                              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
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
                            <td className="px-4 py-2.5 truncate text-gray-700 dark:text-gray-200">
                              {item.user.fullName || t("common.na")}
                            </td>
                            <td className="px-4 py-2.5 truncate text-gray-700 dark:text-gray-200">
                              {item.email || t("common.na")}
                            </td>
                            <td className="px-4 py-2.5 truncate text-gray-700 dark:text-gray-200">
                              {t(
                                `manageAccounts.roles.${item.role.toLowerCase()}`
                              ) || t("common.na")}
                            </td>
                            <td className="px-4 py-2.5 truncate text-gray-700 dark:text-gray-200">
                              {formatDate(item.enrollmentDate)}
                            </td>
                          </>
                        )}
                        {modalType === "schools" && (
                          <>
                            <td className="px-4 py-2.5 truncate text-gray-700 dark:text-gray-200">
                              {item.name || item.schoolName || t("common.na")}
                            </td>
                            <td className="px-4 py-2.5 truncate text-gray-700 dark:text-gray-200">
                              {item.address || t("common.na")}
                            </td>
                          </>
                        )}
                        {modalType === "classes" && (
                          <>
                            <td className="px-4 py-2.5 truncate text-gray-700 dark:text-gray-200">
                              {item.name || t("common.na")}
                            </td>
                            <td className="px-4 py-2.5 truncate text-gray-700 dark:text-gray-200">
                              {gradeLevelMap[item.gradeLevel] || t("common.na")}
                            </td>
                            <td className="px-4 py-2.5 truncate text-gray-700 dark:text-gray-200">
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
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {t("dashboard.noData")}
              </p>
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
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 p-2"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
