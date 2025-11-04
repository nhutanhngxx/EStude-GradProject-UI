import React, { useContext } from "react";
import { Bar } from "react-chartjs-2";
import { ThemeContext } from "../../contexts/ThemeContext";

/**
 * Component hiển thị biểu đồ phân bố câu hỏi theo môn học
 * @param {Object} data - Object với key là tên môn, value là số lượng
 */
const SubjectDistributionChart = ({ data }) => {
  const { darkMode } = useContext(ThemeContext);

  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: "Số câu hỏi",
        data: Object.values(data),
        backgroundColor: darkMode ? "#3b82f6" : "#2563eb",
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed.y / total) * 100).toFixed(1);
            return `${context.parsed.y} câu hỏi (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: darkMode ? "#fff" : "#1f2937",
          maxRotation: 45,
          minRotation: 45,
        },
        grid: { color: darkMode ? "#374151" : "#e5e7eb" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: darkMode ? "#fff" : "#1f2937" },
        grid: { color: darkMode ? "#374151" : "#e5e7eb" },
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default SubjectDistributionChart;
