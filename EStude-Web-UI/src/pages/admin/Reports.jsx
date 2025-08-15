// src/pages/Reports.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const chartData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Assignment Submissions",
        data: [120, 130, 95, 135],
        borderColor: "rgba(37, 99, 235, 1)",
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        tension: 0.3,
        pointBackgroundColor: "rgba(37, 99, 235, 1)",
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
  };

  const metrics = [
    { name: "Average Grade", value: "8.2/10", change: "+0.3" },
    { name: "Completion Rate", value: "94%", change: "+2%" },
    { name: "Attendance Rate", value: "87.5%", change: "+1.2%" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div className="w-4/6">
          <h1 className="text-2xl font-bold">Phân tích thống kê</h1>
          <p className="text-gray-600">
            Phân tích thống kê trong hệ thống quản lý giáo dục giúp nhà trường
            thu thập, xử lý và diễn giải dữ liệu để đưa ra các quyết định sáng
            suốt nhằm nâng cao chất lượng giáo dục và hiệu quả quản lý.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select className="border rounded px-3 py-2">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📊 Assignment Submissions
          </h2>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Metrics */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🎯 Performance Metrics
          </h2>
          <div className="space-y-4">
            {metrics.map((metric, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border-b pb-2"
              >
                <span>{metric.name}</span>
                <span className="flex gap-2">
                  <strong>{metric.value}</strong>
                  <span className="text-green-600">{metric.change}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
