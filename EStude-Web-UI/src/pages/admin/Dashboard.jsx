import React, { useEffect, useState } from "react";
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
import { Users, BookOpen, Bell, FileBarChart, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  const [darkMode, setDarkMode] = useState(false);

  // Load dark mode từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Data biểu đồ
  const chartData = {
    labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
    datasets: [
      {
        label: t("dashboard.newStudents"),
        data: [10, 20, 15, 30, 25, 40],
        backgroundColor: "#6366f1",
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
      title: t("dashboard.manageAccounts"),
      value: "150",
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      path: "/admin/users",
    },
    {
      title: t("dashboard.manageClasses"),
      value: "25",
      icon: <BookOpen className="w-6 h-6 text-green-600" />,
      path: "/admin/classes",
    },
    {
      title: t("dashboard.manageNotifications"),
      value: "45",
      icon: <Bell className="w-6 h-6 text-red-600" />,
      path: "/admin/notifications",
    },
  ];

  // Hoạt động gần đây
  const activities = [
    { time: "09:00", action: t("dashboard.activity1") },
    { time: "10:15", action: t("dashboard.activity2") },
    { time: "11:00", action: t("dashboard.activity3") },
    { time: "14:20", action: t("dashboard.activity4") },
  ];

  const createReport = () => {
    alert(t("dashboard.reportCreated"));
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.overview")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("dashboard.welcome")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Nút báo cáo */}
          <button
            onClick={createReport}
            className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-indigo-700 rounded-lg text-white text-sm shadow"
          >
            <FileBarChart className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t("dashboard.createReport")}
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.path)}
            className="p-4 rounded-lg border bg-white dark:bg-gray-800 shadow-sm cursor-pointer hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {card.title}
                </h2>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            {t("dashboard.studentStats")}
          </h2>
          <Bar data={chartData} options={chartOptions} />
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
