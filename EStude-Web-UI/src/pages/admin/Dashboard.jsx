import React, { useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const users = await adminService.getAllUsers();
        if (users) {
          const totalUsers = users.length;
          const totalStudents = users.filter(
            (u) => u.role === "STUDENT"
          ).length;
          const totalTeachers = users.filter(
            (u) => u.role === "TEACHER"
          ).length;
          const newUsersThisMonth = users.filter((u) => {
            if (!u.dob) return false;
            const enrollDate = new Date(u.dob);
            const now = new Date("2025-09-23");
            return (
              enrollDate.getMonth() === now.getMonth() &&
              enrollDate.getFullYear() === now.getFullYear()
            );
          }).length;

          const schools = await schoolService.getAllSchools();
          const totalSchools = schools ? schools.length : 0;

          const classes = await classService.getAllClasses();
          const totalClasses = classes ? classes.length : 0;

          setStats({
            totalUsers,
            totalSchools,
            totalClasses,
            totalStudents,
            totalTeachers,
            newUsersThisMonth,
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải thống kê:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartData = {
    labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
    datasets: [
      {
        label: t("dashboard.newUsers"),
        data: [10, 20, 15, 30, 25, 40],
        backgroundColor: darkMode ? "#818cf8" : "#6366f1",
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const cards = [
    {
      title: t("dashboard.totalUsers"),
      value: stats.totalUsers.toString() || "150",
      icon: <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      path: "/admin/users",
      note: stats.totalUsers === 0 ? "*Dữ liệu mẫu" : "",
      bgLight: "bg-blue-100",
      bgDark: "dark:bg-blue-900",
    },
    {
      title: t("dashboard.totalSchools"),
      value: stats.totalSchools.toString() || "10",
      icon: <Building className="w-6 h-6 text-green-600 dark:text-green-400" />,
      path: "/admin/schools",
      note: stats.totalSchools === 0 ? "*Dữ liệu mẫu" : "",
      bgLight: "bg-green-100",
      bgDark: "dark:bg-green-900",
    },
    {
      title: t("dashboard.totalClasses"),
      value: stats.totalClasses.toString() || "50",
      icon: (
        <BookOpen className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
      ),
      path: "/admin/classes",
      note: stats.totalClasses === 0 ? "*Dữ liệu mẫu" : "",
      bgLight: "bg-yellow-100",
      bgDark: "dark:bg-yellow-900",
    },
    {
      title: t("dashboard.totalStudents"),
      value: stats.totalStudents.toString() || "120",
      icon: (
        <GraduationCap className="w-6 h-6 text-red-600 dark:text-red-400" />
      ),
      path: "/admin/students",
      note: stats.totalStudents === 0 ? "*Dữ liệu mẫu" : "",
      bgLight: "bg-red-100",
      bgDark: "dark:bg-red-900",
    },
    {
      title: t("dashboard.totalTeachers"),
      value: stats.totalTeachers.toString() || "30",
      icon: <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      path: "/admin/teachers",
      note: stats.totalTeachers === 0 ? "*Dữ liệu mẫu" : "",
      bgLight: "bg-purple-100",
      bgDark: "dark:bg-purple-900",
    },
    {
      title: t("dashboard.newUsersThisMonth"),
      value: stats.newUsersThisMonth.toString() || "15",
      icon: <Clock className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
      path: "/admin/new-users",
      note: stats.newUsersThisMonth === 0 ? "*Dữ liệu mẫu" : "",
      bgLight: "bg-teal-100",
      bgDark: "dark:bg-teal-900",
    },
  ];

  const activities = [
    { time: "09:00", action: t("dashboard.activity1"), date: "2025-09-23" },
    { time: "10:15", action: t("dashboard.activity2"), date: "2025-09-23" },
    { time: "11:00", action: t("dashboard.activity3"), date: "2025-09-22" },
    { time: "14:20", action: t("dashboard.activity4"), date: "2025-09-21" },
  ];

  const createReport = () => {
    alert(t("dashboard.reportCreated"));
  };

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
              onClick={() => navigate(card.path)}
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
        {/* Biểu đồ */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            {t("dashboard.newUsersChart")}
          </h2>
          {loading ? (
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>

        {/* Hoạt động gần đây */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            {t("dashboard.recentActivities")}
          </h2>
          <ul className="space-y-3">
            {activities.map((act, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0"
              >
                <Clock className="w-4 h-4 mt-1 text-gray-500 dark:text-gray-400" />
                <div>
                  <span className="font-semibold">{act.time}</span> -{" "}
                  <span>{act.action}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    ({act.date})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
