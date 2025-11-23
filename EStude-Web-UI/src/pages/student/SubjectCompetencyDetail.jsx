import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Trophy,
  TrendingUp,
  BookOpen,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";

const SubjectCompetencyDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { subjectData } = location.state || {};
  const [selectedTab, setSelectedTab] = useState("roadmap");

  if (!subjectData) {
    return (
      <div className="p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Không có dữ liệu môn học
        </p>
        <button
          onClick={() => navigate("/student/competency-map")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const getStatusColor = (avgImprovement) => {
    if (avgImprovement >= 20)
      return { label: "Tiến bộ rõ rệt", color: "#4CAF50" };
    if (avgImprovement >= 5) return { label: "Có cải thiện", color: "#2196F3" };
    if (avgImprovement >= -4) return { label: "Ổn định", color: "#9E9E9E" };
    if (avgImprovement >= -19) return { label: "Giảm nhẹ", color: "#FF9800" };
    return { label: "Cần cải thiện gấp", color: "#F44336" };
  };

  const getAccuracyLevel = (accuracy) => {
    if (accuracy >= 80) return { label: "Vững vàng", color: "#4CAF50" };
    if (accuracy >= 60) return { label: "Nâng cao", color: "#2196F3" };
    if (accuracy >= 40) return { label: "Trung bình", color: "#FF9800" };
    return { label: "Cơ bản", color: "#F44336" };
  };

  const sortedTopics = [...subjectData.topics].sort(
    (a, b) => b.avgAccuracy - a.avgAccuracy
  );

  const sortedEvaluations = [...subjectData.evaluations].sort(
    (a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/student/competency-map")}
          className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {subjectData.subject}
        </h1>
      </div>

      {/* Overview Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Tổng quan Năng lực
        </h2>

        <div className="text-center mb-6">
          <p className="text-5xl font-bold text-green-600 dark:text-green-400">
            {subjectData.avgAccuracy}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Tỷ lệ đạt trung bình
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Trophy className="w-7 h-7 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {subjectData.mastered}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Chủ đề vững
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <TrendingUp className="w-7 h-7 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {subjectData.progressing}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Đang tiến bộ
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <BookOpen className="w-7 h-7 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {subjectData.needsWork}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Cần luyện thêm
            </p>
          </div>
        </div>

        {subjectData.overallImprovement !== undefined && (
          <div
            className={`flex items-center justify-center p-3 rounded-lg ${
              subjectData.overallImprovement > 0
                ? "bg-green-50 dark:bg-green-900/20"
                : "bg-red-50 dark:bg-red-900/20"
            }`}
          >
            {subjectData.overallImprovement > 0 ? (
              <ArrowUp className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            ) : (
              <ArrowDown className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            )}
            <span
              className={`font-semibold ${
                subjectData.overallImprovement > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {subjectData.overallImprovement > 0 ? "+" : ""}
              {subjectData.overallImprovement.toFixed(1)}% so với lần trước
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 mb-6">
        <button
          onClick={() => setSelectedTab("roadmap")}
          className={`flex-1 py-2 px-4 rounded-lg transition ${
            selectedTab === "roadmap"
              ? "bg-green-600 text-white"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          Lộ trình
        </button>
        <button
          onClick={() => setSelectedTab("topics")}
          className={`flex-1 py-2 px-4 rounded-lg transition ${
            selectedTab === "topics"
              ? "bg-green-600 text-white"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          Chủ đề ({subjectData.totalTopics})
        </button>
        <button
          onClick={() => setSelectedTab("history")}
          className={`flex-1 py-2 px-4 rounded-lg transition ${
            selectedTab === "history"
              ? "bg-green-600 text-white"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          Lịch sử ({subjectData.evaluations.length})
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === "roadmap" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Lộ trình học tập
          </h3>
          <div className="space-y-4">
            {/* Roadmap visualization */}
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />

              {/* Step 1 */}
              <div className="flex items-start mb-6">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    subjectData.avgAccuracy >= 40
                      ? "bg-green-500"
                      : "bg-gray-300"
                  } text-white font-bold z-10`}
                >
                  1
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Nền tảng cơ bản (40%+)
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hiểu được các khái niệm cơ bản
                  </p>
                  {subjectData.avgAccuracy >= 40 && (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                      ✓ Đã hoàn thành
                    </span>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start mb-6">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    subjectData.avgAccuracy >= 60
                      ? "bg-green-500"
                      : subjectData.avgAccuracy >= 40
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  } text-white font-bold z-10`}
                >
                  2
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Nâng cao kiến thức (60%+)
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vận dụng kiến thức vào bài tập
                  </p>
                  {subjectData.avgAccuracy >= 60 ? (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                      ✓ Đã hoàn thành
                    </span>
                  ) : subjectData.avgAccuracy >= 40 ? (
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                      Đang thực hiện
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    subjectData.avgAccuracy >= 80
                      ? "bg-green-500"
                      : subjectData.avgAccuracy >= 60
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  } text-white font-bold z-10`}
                >
                  3
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Thành thạo (80%+)
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nắm vững và áp dụng linh hoạt
                  </p>
                  {subjectData.avgAccuracy >= 80 ? (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                      ✓ Đã hoàn thành
                    </span>
                  ) : subjectData.avgAccuracy >= 60 ? (
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                      Đang thực hiện
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === "topics" && (
        <div className="space-y-4">
          {sortedTopics.map((topic, index) => {
            const level = getAccuracyLevel(topic.avgAccuracy);
            const status = getStatusColor(topic.avgImprovement || 0);

            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                    {topic.topic}
                  </h3>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold ml-2"
                    style={{
                      backgroundColor: `${status.color}20`,
                      color: status.color,
                    }}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center mb-4">
                  <div className="text-center mr-6">
                    <p
                      className="text-3xl font-bold"
                      style={{ color: level.color }}
                    >
                      {Math.round(topic.avgAccuracy)}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {level.label}
                    </p>
                  </div>

                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${topic.avgAccuracy}%`,
                          backgroundColor: level.color,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Trend Chart */}
                {topic.improvementHistory &&
                  topic.improvementHistory.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Xu hướng cải thiện:
                      </p>
                      <div className="flex items-end justify-around h-24">
                        {topic.improvementHistory.slice(-6).map((imp, idx) => {
                          const barColor =
                            imp > 5
                              ? "#4CAF50"
                              : imp < -5
                              ? "#F44336"
                              : "#FF9800";
                          const barHeight = Math.abs(imp);
                          const maxHeight = 100;
                          const heightPercent = Math.min(
                            (barHeight / maxHeight) * 100,
                            100
                          );

                          return (
                            <div
                              key={idx}
                              className="flex flex-col items-center"
                            >
                              <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {imp > 0 ? "+" : ""}
                                {imp.toFixed(1)}%
                              </span>
                              <div
                                className="w-8 rounded-t"
                                style={{
                                  height: `${heightPercent}px`,
                                  backgroundColor: barColor,
                                  minHeight: "4px",
                                }}
                              />
                              <span className="text-xs text-gray-500 mt-1">
                                T{idx}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-center gap-4 mt-3 text-xs">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-1" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Tốt (&gt;5%)
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-orange-500 mr-1" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Ổn định
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-1" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Giảm (&lt;-5%)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}

      {selectedTab === "history" && (
        <div className="space-y-4">
          {sortedEvaluations.map((evaluation, index) => {
            const evalData = evaluation.detailedAnalysis;
            const overallImp = evalData?.overall_improvement?.improvement || 0;

            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {new Date(evaluation.generatedAt).toLocaleDateString(
                        "vi-VN",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(evaluation.generatedAt).toLocaleTimeString(
                        "vi-VN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      overallImp > 0
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        overallImp > 0
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {overallImp > 0 ? "+" : ""}
                      {overallImp.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {evalData?.summary && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {evalData.summary}
                  </p>
                )}

                {evalData?.topics && evalData.topics.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Chi tiết chủ đề:
                    </p>
                    {evalData.topics.map((topic, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-0"
                      >
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {topic.topic}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            topic.improvement > 0
                              ? "text-green-600 dark:text-green-400"
                              : topic.improvement < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {topic.new_accuracy}% (
                          {topic.improvement > 0 ? "+" : ""}
                          {topic.improvement}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubjectCompetencyDetail;
