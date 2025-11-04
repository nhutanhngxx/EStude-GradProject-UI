import React, { useContext } from "react";
import { Bar } from "react-chartjs-2";
import { ThemeContext } from "../../contexts/ThemeContext";

const SubjectPerformanceChart = ({ data }) => {
  const { isDarkMode } = useContext(ThemeContext);

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Không có dữ liệu để hiển thị biểu đồ
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => `${item.subject_name} (${item.term_name})`),
    datasets: [
      {
        label: "Điểm TB",
        data: data.map((item) => item.avg_score || 0),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
      {
        label: "Tỷ lệ đạt (%)",
        data: data.map((item) => item.pass_rate || 0),
        backgroundColor: "rgba(34, 197, 94, 0.6)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
      },
      {
        label: "Tỷ lệ giỏi (%)",
        data: data.map((item) => item.excellent_rate || 0),
        backgroundColor: "rgba(168, 85, 247, 0.6)",
        borderColor: "rgba(168, 85, 247, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: isDarkMode ? "#e5e7eb" : "#374151",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              if (context.datasetIndex === 0) {
                // Điểm TB - hiển thị 1 chữ số thập phân
                label += context.parsed.y.toFixed(1);
              } else {
                // Tỷ lệ % - hiển thị 1 chữ số thập phân và thêm %
                label += context.parsed.y.toFixed(1) + "%";
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: isDarkMode ? "#9ca3af" : "#6b7280",
        },
        grid: {
          color: isDarkMode
            ? "rgba(75, 85, 99, 0.3)"
            : "rgba(229, 231, 235, 0.8)",
        },
      },
      x: {
        ticks: {
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div
      className={`p-4 rounded-lg ${
        isDarkMode ? "bg-gray-700" : "bg-white"
      } border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
    >
      <div style={{ height: "400px" }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default SubjectPerformanceChart;
