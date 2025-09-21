import React from "react";
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

import { useToast } from "../../contexts/ToastContext";

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

  // Cards thống kê
  const cards = [
    {
      title: "Lớp đang quản lý",
      value: "5",
      color: "bg-blue-500",
      path: "/teacher/classes",
    },
    {
      title: "Buổi dạy tuần này",
      value: "12",
      color: "bg-green-500",
      path: "/teacher/schedule",
    },
    {
      title: "Tổng học sinh",
      value: "150",
      color: "bg-yellow-500",
      path: "/teacher/students",
    },
    {
      title: "Bài tập đã giao",
      value: "25",
      color: "bg-red-500",
      path: "/teacher/assignments",
    },
  ];

  // Data cho biểu đồ cột
  const barData = {
    labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
    datasets: [
      {
        label: "Học sinh mới",
        data: [2, 4, 3, 6, 5, 8],
        backgroundColor: "#3b82f6",
      },
    ],
  };

  // Data cho biểu đồ đường
  const lineData = {
    labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
    datasets: [
      {
        label: "Bài tập đã giao",
        data: [10, 15, 8, 20],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.3)",
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: true } },
  };

  // Hoạt động gần đây
  const activities = [
    { time: "08:00", action: "Dạy Toán lớp 10A1" },
    { time: "09:45", action: "Chấm bài tập Vật Lý lớp 12B" },
    { time: "13:00", action: "Soạn bài Ngữ Văn lớp 11C" },
    { time: "15:30", action: "Họp tổ chuyên môn" },
  ];

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Tiêu đề */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-2">Bảng điều khiển</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Chào mừng bạn đến với trang quản trị!
          </p>
        </div>
      </div>

      {/* Cards thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.path)}
            className="p-4 rounded-lg border bg-white dark:bg-gray-800 shadow-sm cursor-pointer hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* 2 biểu đồ song song */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            📈 Học sinh mới theo tháng
          </h2>
          <Bar data={barData} options={chartOptions} />
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">📉 Số bài tập đã giao</h2>
          <Line data={lineData} options={chartOptions} />
        </div>
      </div>

      {/* Hoạt động gần đây */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">🕒 Hoạt động gần đây</h2>
        <ul className="space-y-3">
          {activities.map((act, idx) => (
            <li
              key={idx}
              className="border-b border-gray-300 dark:border-gray-700 pb-2"
            >
              <span className="font-bold">{act.time}</span> - {act.action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TeacherDashboard;
