import React, { useContext } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { ThemeContext } from "../../contexts/ThemeContext";

ChartJS.register(ArcElement, Tooltip, Legend);

const DIFFICULTY_COLORS = {
  EASY: { light: "#10b981", dark: "#34d399" },
  MEDIUM: { light: "#f59e0b", dark: "#fbbf24" },
  HARD: { light: "#ef4444", dark: "#f87171" },
  EXPERT: { light: "#8b5cf6", dark: "#a78bfa" },
};

const DIFFICULTY_LABELS = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
  EXPERT: "Chuyên gia",
};

/**
 * Component hiển thị biểu đồ phân bố câu hỏi theo độ khó
 * @param {Object} data - Object với keys: EASY, MEDIUM, HARD, EXPERT
 */
const DifficultyChart = ({ data }) => {
  const { darkMode } = useContext(ThemeContext);

  const chartData = {
    labels: Object.keys(data).map((key) => DIFFICULTY_LABELS[key] || key),
    datasets: [
      {
        data: Object.values(data),
        backgroundColor: Object.keys(data).map(
          (key) => DIFFICULTY_COLORS[key]?.[darkMode ? "dark" : "light"]
        ),
        borderWidth: 2,
        borderColor: darkMode ? "#1f2937" : "#fff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: darkMode ? "#fff" : "#1f2937",
          padding: 15,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default DifficultyChart;
