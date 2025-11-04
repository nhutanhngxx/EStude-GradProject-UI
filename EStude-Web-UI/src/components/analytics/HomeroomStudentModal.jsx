import React, { useState, useEffect, useContext } from "react";
import {
  X,
  User,
  BookOpen,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import analyticsService from "../../services/analyticsService";

const HomeroomStudentModal = ({ studentId, teacherId, onClose }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    loadCompletePerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const loadCompletePerformance = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading complete performance for student:", studentId);

      const data = await analyticsService.getStudentCompletePerformance(
        studentId,
        teacherId
      );
      console.log("✅ Complete performance loaded:", data);

      setPerformance(data);
    } catch (error) {
      console.error("❌ Error loading complete performance:", error);
      showToast("Không thể tải kết quả học tập toàn diện", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        } rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } border-b p-6 flex items-center justify-between z-10`}
        >
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold">
                {performance?.studentName || "Học sinh"}
              </h2>
              <p
                className={`mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Mã: {performance?.studentCode || "N/A"} • Kết quả toàn diện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-opacity-80 ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-gray-300 rounded"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          ) : performance ? (
            <>
              {/* Overall Score */}
              <div
                className={`p-6 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="text-center">
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Điểm trung bình chung
                  </p>
                  <p className="text-5xl font-bold mt-2">
                    {performance.overallScore?.toFixed(1) || "0.0"}
                  </p>
                </div>
              </div>

              {/* Subjects Performance */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                  Kết quả theo môn học
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {performance.topicScores &&
                  performance.topicScores.length > 0 ? (
                    performance.topicScores.map((subject, index) => {
                      const score = subject.score || 0;
                      const isExcellent = score >= 8;
                      const isGood = score >= 6.5;
                      const isPassing = score >= 5;

                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-lg">
                              {subject.topicName}
                            </h4>
                            <span
                              className={`text-2xl font-bold ${
                                isExcellent
                                  ? "text-green-500"
                                  : isGood
                                  ? "text-yellow-500"
                                  : isPassing
                                  ? "text-orange-500"
                                  : "text-red-500"
                              }`}
                            >
                              {score.toFixed(1)}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-gray-300 rounded-full h-2 mb-2">
                            <div
                              className={`h-2 rounded-full ${
                                isExcellent
                                  ? "bg-green-500"
                                  : isGood
                                  ? "bg-yellow-500"
                                  : isPassing
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${(score / 10) * 100}%` }}
                            ></div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span
                              className={
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              {subject.completedAssignments || 0}/
                              {subject.totalAssignments || 0} bài
                            </span>
                            <span
                              className={`font-medium ${
                                isExcellent
                                  ? "text-green-500"
                                  : isGood
                                  ? "text-yellow-600"
                                  : isPassing
                                  ? "text-orange-600"
                                  : "text-red-500"
                              }`}
                            >
                              {isExcellent
                                ? "Giỏi"
                                : isGood
                                ? "Khá"
                                : isPassing
                                ? "Đạt"
                                : "Yếu"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-3 text-center text-gray-500 py-8">
                      Chưa có dữ liệu điểm theo môn học
                    </div>
                  )}
                </div>
              </div>

              {/* Strong and Weak Subjects */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strong Subjects */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Môn học mạnh
                  </h3>
                  <div
                    className={`p-4 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    {performance.strongTopics &&
                    performance.strongTopics.length > 0 ? (
                      <ul className="space-y-2">
                        {performance.strongTopics.map((topic, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="font-medium">{topic}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">Chưa xác định</p>
                    )}
                  </div>
                </div>

                {/* Weak Subjects */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Môn học cần cải thiện
                  </h3>
                  <div
                    className={`p-4 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    {performance.weakTopics &&
                    performance.weakTopics.length > 0 ? (
                      <ul className="space-y-3">
                        {performance.weakTopics.map((topic, index) => (
                          <li key={index}>
                            <div className="flex items-start gap-2">
                              <TrendingDown className="w-4 h-4 text-red-500 mt-1" />
                              <div className="flex-1">
                                <p className="font-medium">{topic.topicName}</p>
                                <p
                                  className={`text-sm ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-600"
                                  }`}
                                >
                                  Điểm: {topic.score?.toFixed(1) || "0.0"}
                                </p>
                                {topic.recommendedResources &&
                                  topic.recommendedResources.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs font-semibold">
                                        Đề xuất:
                                      </p>
                                      <ul className="text-xs mt-1 space-y-1">
                                        {topic.recommendedResources.map(
                                          (resource, idx) => (
                                            <li
                                              key={idx}
                                              className="text-blue-500"
                                            >
                                              • {resource}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        Không có môn học cần cải thiện
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Overall Progress Trend */}
              {performance.progressTrend && (
                <div
                  className={`p-4 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Xu hướng học tập
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        {performance.progressTrend === "IMPROVING" &&
                          "📈 Đang tiến bộ"}
                        {performance.progressTrend === "STABLE" && "➡️ Ổn định"}
                        {performance.progressTrend === "DECLINING" &&
                          "📉 Cần quan tâm"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`sticky bottom-0 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } border-t p-6 flex justify-end`}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeroomStudentModal;
