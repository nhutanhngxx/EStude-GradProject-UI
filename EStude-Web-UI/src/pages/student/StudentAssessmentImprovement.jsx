import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  Award,
  BookOpen,
  Sparkles,
  Target,
  ArrowLeft,
  Map,
  Lightbulb,
} from "lucide-react";
import aiService from "../../services/aiService";
import { useToast } from "../../contexts/ToastContext";

/**
 * StudentAssessmentImprovement Component
 * Displays improvement evaluation comparing previous and current assessment results
 * Shows overall progress, topic-by-topic breakdown, and AI recommendations
 */
const StudentAssessmentImprovement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // State from route
  const { evaluation, submissionId } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState(new Set());

  useEffect(() => {
    console.log(
      "📊 StudentAssessmentImprovement - evaluation data:",
      evaluation
    );

    if (!evaluation) {
      console.error("❌ No evaluation data found in location.state");
      showToast("Không tìm thấy dữ liệu đánh giá tiến bộ", "error");
      // Delay navigation to show toast
      setTimeout(() => navigate("/student/assessment"), 1500);
      return;
    }

    // Show motivation banner if improvement > 20%
    if (evaluation?.overall_improvement?.improvement > 20) {
      setShowMotivation(true);
      setTimeout(() => setShowMotivation(false), 5000);
    }
  }, [evaluation, navigate, showToast]);

  const handleViewLearningRoadmap = async () => {
    try {
      setLoading(true);
      showToast("Đang tạo lộ trình học tập...", "info");

      // Bước 1: Lấy feedback mới nhất (câu hỏi làm sai)
      const feedbackResponse = await aiService.getFeedbackLatest(token);

      if (!feedbackResponse || !feedbackResponse.detailedAnalysis) {
        showToast("Không thể lấy thông tin câu hỏi sai!", "error");
        return;
      }

      const feedbackData = feedbackResponse.detailedAnalysis;

      // Transform incorrect questions từ feedback
      const incorrectQuestions = feedbackData.feedback
        ? feedbackData.feedback
            .filter((item) => !item.is_correct)
            .map((item) => ({
              question_id: item.question_id,
              topic: item.topic || "Không xác định",
              subtopic: item.subtopic || "Chung",
              difficulty:
                item.difficulty_level === "Dễ"
                  ? "EASY"
                  : item.difficulty_level === "Trung bình"
                  ? "MEDIUM"
                  : "HARD",
              question_text: item.question || "",
              student_answer: item.student_answer || "",
              correct_answer: item.correct_answer || "",
              error_type: "CONCEPT_MISUNDERSTANDING",
            }))
        : [];

      if (incorrectQuestions.length === 0) {
        showToast(
          "Không tìm thấy câu hỏi sai để tạo lộ trình. Hãy làm thêm bài đánh giá!",
          "warning"
        );
        return;
      }

      // Bước 2: Chuẩn bị payload cho Layer 5
      const payload = {
        submission_id: feedbackData.submission_id || evaluation.submission_id,
        student_id: user.userId,
        subject: feedbackData.subject || evaluation.subject,
        evaluation_data: {
          topics: (evaluation.topics || []).map((topic) => ({
            topic: topic.topic,
            improvement: topic.improvement || 0,
            status: topic.status || "Ổn định",
            previous_accuracy: topic.previous_accuracy || 0.1,
            new_accuracy: topic.new_accuracy || 0.1,
          })),
          overall_improvement: {
            improvement: evaluation.overall_improvement?.improvement || 0,
            previous_average:
              evaluation.overall_improvement?.previous_average || 0.1,
            new_average: evaluation.overall_improvement?.new_average || 0.1,
          },
        },
        incorrect_questions: incorrectQuestions,
        learning_style: "VISUAL",
        available_time_per_day: 30,
      };

      console.log("📤 Generating Roadmap with payload:", payload);

      // Bước 3: POST để tạo roadmap
      const generateResponse = await aiService.generateLearningRoadmap(
        payload,
        token
      );

      if (!generateResponse || !generateResponse.success) {
        showToast("Không thể tạo lộ trình học tập!", "error");
        return;
      }

      showToast("Lộ trình học tập đã được tạo!", "success");

      // Bước 4: Lấy roadmap mới nhất và navigate
      const roadmapResponse = await aiService.getRoadmapLatest(token);

      if (!roadmapResponse || !roadmapResponse.detailedAnalysis) {
        showToast("Không thể tải lộ trình!", "error");
        return;
      }

      // Navigate với data thực
      navigate("/student/learning-roadmap", {
        state: {
          roadmap: roadmapResponse.detailedAnalysis,
          evaluation: evaluation,
        },
      });
    } catch (error) {
      console.error("Error generating roadmap:", error);
      showToast("Lỗi khi tạo lộ trình học tập!", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topicIndex) => {
    setExpandedTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicIndex)) {
        newSet.delete(topicIndex);
      } else {
        newSet.add(topicIndex);
      }
      return newSet;
    });
  };

  const getStatusColor = (status) => {
    const statusMap = {
      "XUẤT SẮC": {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
        border: "border-green-500",
        icon: CheckCircle,
      },
      TỐT: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-500",
        icon: CheckCircle,
      },
      "CẦN CẢI THIỆN": {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-400",
        border: "border-yellow-500",
        icon: AlertCircle,
      },
      YẾU: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-500",
        icon: XCircle,
      },
    };
    return (
      statusMap[status] || {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-700 dark:text-gray-400",
        border: "border-gray-500",
        icon: AlertCircle,
      }
    );
  };

  const getImprovementIcon = (improvement) => {
    if (improvement > 30) return "";
    if (improvement > 15) return "";
    if (improvement > 0) return "";
    if (improvement === 0) return "";
    return "📉";
  };

  const getImprovementColor = (improvement) => {
    if (improvement > 0) return "text-green-600 dark:text-green-500";
    if (improvement === 0) return "text-yellow-600 dark:text-yellow-500";
    return "text-red-600 dark:text-red-500";
  };

  if (!evaluation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Không tìm thấy dữ liệu
          </p>
          <button
            onClick={() => navigate("/student/assessment")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const { overall_improvement, topics, summary, next_action, subject } =
    evaluation;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-purple-900/10 p-6">
      {/* Motivation Banner */}
      {showMotivation && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 mb-6 animate-slide-down">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8" />
            <p className="text-xl font-bold">
              🎉 Xuất sắc! Bạn đã cải thiện rất nhiều! Tiếp tục phát huy nhé! 🚀
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 mb-6">
        <button
          onClick={() => navigate("/student/assessment")}
          className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại đánh giá</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Đánh giá tiến bộ</h1>
            <p className="text-purple-100 mt-1">{subject}</p>
          </div>
        </div>
      </div>

      {/* Overall Improvement Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6 border-l-4 border-purple-600">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-md">
            <Award className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Tổng quan tiến bộ
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              So sánh kết quả học tập của bạn
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Previous Average */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Trước đây
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {overall_improvement.previous_average.toFixed(0)}%
            </p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <ArrowRight className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              <div className="absolute -top-2 -right-2 text-2xl">
                {getImprovementIcon(overall_improvement.improvement)}
              </div>
            </div>
          </div>

          {/* New Average */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-6 text-center border-2 border-purple-500">
            <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
              Hiện tại
            </p>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {overall_improvement.new_average.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Improvement Badge */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl text-center border border-purple-300 dark:border-purple-700">
          <p
            className={`text-2xl font-bold ${getImprovementColor(
              overall_improvement.improvement
            )}`}
          >
            {overall_improvement.improvement > 0 ? "+" : ""}
            {overall_improvement.improvement.toFixed(1)}% (
            {overall_improvement.direction})
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Mức độ cải thiện
          </p>
        </div>
      </div>

      {/* Summary Card */}
      {summary && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Nhận xét chung
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {summary}
          </p>
        </div>
      )}

      {/* Topics Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-600" />
          Chi tiết từng chủ đề
        </h2>

        <div className="space-y-4">
          {topics.map((topic, index) => {
            const statusConfig = getStatusColor(topic.status);
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedTopics.has(index);

            return (
              <div
                key={index}
                className={`border-2 ${statusConfig.border} rounded-xl overflow-hidden transition-all hover:shadow-md`}
              >
                <button
                  onClick={() => toggleTopic(index)}
                  className="w-full p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full ${statusConfig.bg} flex items-center justify-center`}
                    >
                      <StatusIcon className={`w-6 h-6 ${statusConfig.text}`} />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {topic.topic}
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {topic.status}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {topic.previous_accuracy.toFixed(0)}% →{" "}
                          {topic.new_accuracy.toFixed(0)}%
                        </span>
                        <span
                          className={`font-semibold ${getImprovementColor(
                            topic.improvement
                          )}`}
                        >
                          {topic.improvement > 0 ? "+" : ""}
                          {topic.improvement.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Previous vs New */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          So sánh độ chính xác
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-400">
                              Trước đây
                            </span>
                            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              {topic.previous_accuracy.toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-500">
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">
                              Hiện tại
                            </span>
                            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                              {topic.new_accuracy.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Improvement */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          Mức độ tiến bộ
                        </h4>
                        <div className="p-6 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl text-center">
                          <p
                            className={`text-4xl font-bold mb-2 ${getImprovementColor(
                              topic.improvement
                            )}`}
                          >
                            {topic.improvement > 0 ? "+" : ""}
                            {topic.improvement.toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {topic.improvement > 20
                              ? "Tiến bộ vượt bậc!"
                              : topic.improvement > 10
                              ? "Tiến bộ tốt!"
                              : topic.improvement > 0
                              ? "Có cải thiện"
                              : topic.improvement === 0
                              ? "Không thay đổi"
                              : "Cần nỗ lực hơn"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Action Card */}
      {next_action && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl shadow-lg p-6 mb-6 border-2 border-yellow-400 dark:border-yellow-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Bước tiếp theo
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
            {next_action}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-4 pb-8">
        <button
          onClick={handleViewLearningRoadmap}
          disabled={loading}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Đang tạo lộ trình...</span>
            </>
          ) : (
            <>
              <Map className="w-5 h-5" />
              <span>Xem lộ trình học tập</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <button
          onClick={() => navigate("/student/assessment")}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>
      </div>
    </div>
  );
};

export default StudentAssessmentImprovement;
