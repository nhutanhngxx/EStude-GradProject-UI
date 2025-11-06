import React, { useState, useEffect, useContext } from "react";
import {
  X,
  User,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import analyticsService from "../../services/analyticsService";
import TrendIndicator from "./TrendIndicator";

const StudentPerformanceModal = ({ studentId, teacherId, onClose }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    loadStudentPerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const loadStudentPerformance = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading student performance for student:", studentId);

      const data = await analyticsService.getStudentPerformance(
        studentId,
        teacherId
      );
      console.log("✅ Student performance loaded:", data);

      setPerformance(data);
    } catch (error) {
      console.error("❌ Error loading student performance:", error);
      showToast("Không thể tải kết quả học tập", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        } rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } border-b p-6 flex items-center justify-between`}
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
                Mã: {performance?.studentCode || "N/A"}
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
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Điểm tổng kết
                    </p>
                    <p className="text-4xl font-bold mt-2">
                      {performance.overallScore?.toFixed(1) || "0.0"}
                    </p>
                  </div>
                  <TrendIndicator trend={performance.progressTrend} />
                </div>
              </div>

              {/* Topic Scores */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Điểm theo chủ đề</h3>
                <div className="space-y-3">
                  {performance.topicScores &&
                  performance.topicScores.length > 0 ? (
                    performance.topicScores.map((topic, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{topic.topicName}</p>
                            <p
                              className={`text-sm mt-1 ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Hoàn thành: {topic.completedAssignments}/
                              {topic.totalAssignments} bài
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-2xl font-bold ${
                                topic.score >= 8
                                  ? "text-green-500"
                                  : topic.score >= 6.5
                                  ? "text-yellow-500"
                                  : topic.score >= 5
                                  ? "text-orange-500"
                                  : "text-red-500"
                              }`}
                            >
                              {topic.score?.toFixed(1) || "0.0"}
                            </p>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 w-full bg-gray-300 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              topic.score >= 8
                                ? "bg-green-500"
                                : topic.score >= 6.5
                                ? "bg-yellow-500"
                                : topic.score >= 5
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${(topic.score / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      Chưa có dữ liệu điểm theo chủ đề
                    </p>
                  )}
                </div>
              </div>

              {/* Strong and Weak Topics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Strong Topics */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Điểm mạnh
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
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">Chưa xác định</p>
                    )}
                  </div>
                </div>

                {/* Weak Topics */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Cần cải thiện
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
                                        Tài liệu đề xuất:
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
                        Không có chủ đề cần cải thiện
                      </p>
                    )}
                  </div>
                </div>
              </div>
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

export default StudentPerformanceModal;
