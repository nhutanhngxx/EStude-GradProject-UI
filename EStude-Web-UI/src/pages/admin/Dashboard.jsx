import React from "react";
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

  // Data mẫu cho biểu đồ
  const chartData = {
    labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
    datasets: [
      {
        label: "Số lượng học sinh mới",
        data: [10, 20, 15, 30, 25, 40],
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
  };

  const cards = [
    {
      title: "Quản lý tài khoản",
      value: "150",
      color: "bg-blue-500",
      path: "/admin/users",
    },
    {
      title: "Quản lý lớp học",
      value: "25",
      color: "bg-green-500",
      path: "/admin/classes",
    },
    {
      title: "Quản lý thông báo",
      value: "45",
      color: "bg-red-500",
      path: "/admin/notifications",
    },
  ];

  const activities = [
    { time: "09:00", action: "Thêm tài khoản mới cho GV Nguyễn Văn A" },
    { time: "10:15", action: "Học sinh Lê Văn B nộp bài tập Toán" },
    { time: "11:00", action: "Cập nhật điểm môn Lý cho lớp 12A" },
    { time: "14:20", action: "Gửi thông báo về lịch thi HK1" },
  ];

  const createReport = () => {
    alert("Báo cáo đã được tạo (giả lập)");
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-gray-600">Chào mừng bạn đến với trang quản trị!</p>
        </div>
        <button
          onClick={createReport}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
        >
          Tạo báo cáo
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.path)}
            className={`p-4 rounded-lg shadow cursor-pointer transition transform hover:scale-105 ${card.color} text-white`}
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Biểu đồ + Hoạt động gần đây */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Thống kê học sinh</h2>
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Hoạt động gần đây */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Hoạt động gần đây</h2>
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
    </div>
  );
};

export default Dashboard;
