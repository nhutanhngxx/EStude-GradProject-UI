import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp,
  Lightbulb,
  BookOpen,
  Target,
  BarChart3,
  MessageSquare,
  Sparkles,
  Loader2,
  Eye,
  Layers,
  Info,
} from "lucide-react";
import submissionService from "../../services/submissionService";
import aiService from "../../services/aiService";
import { useToast } from "../../contexts/ToastContext";

const StudentAssignmentResult = () => {
  const { id, submissionId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [aiResult, setAiResult] = useState(null); // Layer 1 - Feedback
  const [recommendations, setRecommendations] = useState(null); // Layer 2
  const [activeTab, setActiveTab] = useState("Details");

  // Helper function to match AI feedback with questions
  const getAIQuestionFeedback = (question) => {
    if (!aiResult?.detailedAnalysis?.feedback) return null;

    // Match by question_id first
    const matchById = aiResult.detailedAnalysis.feedback.find(
      (f) => Number(f.question_id) === Number(question.questionId)
    );

    if (matchById) return matchById;

    // Fallback: match by question text
    const matchByText = aiResult.detailedAnalysis.feedback.find(
      (f) =>
        f.question?.trim()?.toLowerCase() ===
        question.questionText?.trim()?.toLowerCase()
    );

    return matchByText || null;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch submission data
        const result = await submissionService.getSubmission(submissionId);
        if (result?.data) {
          setSubmission(result.data);

          const assignmentId = result.data.assignmentId;

          // Fetch AI Feedback (Layer 1)
          const feedbackResults = await aiService.getAIFeedbackByAssignmentId(
            assignmentId,
            token
          );

          if (
            feedbackResults &&
            Array.isArray(feedbackResults) &&
            feedbackResults.length > 0
          ) {
            // Get latest feedback by resultId
            const latestFeedback = feedbackResults.reduce((latest, current) => {
              return current.resultId > latest.resultId ? current : latest;
            }, feedbackResults[0]);

            // Calculate topic_breakdown if not present
            if (
              !latestFeedback?.detailedAnalysis?.topic_breakdown &&
              latestFeedback?.detailedAnalysis?.feedback
            ) {
              const topicMap = {};
              latestFeedback.detailedAnalysis.feedback.forEach((f) => {
                const topic = f.topic || "Không xác định";
                if (!topicMap[topic]) {
                  topicMap[topic] = { correct: 0, total: 0 };
                }
                topicMap[topic].total += 1;
                if (f.is_correct) topicMap[topic].correct += 1;
              });

              latestFeedback.detailedAnalysis.topic_breakdown = Object.keys(
                topicMap
              ).map((topic) => ({
                topic,
                correct: topicMap[topic].correct,
                total: topicMap[topic].total,
                accuracy:
                  topicMap[topic].total > 0
                    ? topicMap[topic].correct / topicMap[topic].total
                    : 0,
              }));
            }

            setAiResult(latestFeedback);
          }

          // Fetch AI Recommendations (Layer 2)
          const recommendationResults =
            await aiService.getAIRecommendationByAssignmentId(
              assignmentId,
              token
            );

          if (
            recommendationResults &&
            Array.isArray(recommendationResults) &&
            recommendationResults.length > 0
          ) {
            // Get latest recommendation by resultId
            const latestRecommendation = recommendationResults.reduce(
              (latest, current) => {
                return current.resultId > latest.resultId ? current : latest;
              },
              recommendationResults[0]
            );
            setRecommendations(
              latestRecommendation.detailedAnalysis || latestRecommendation
            );
          }
        } else {
          showToast("Không tìm thấy dữ liệu bài nộp", "error");
          navigate(`/student/assignments/${id}`);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        showToast("Lỗi khi tải dữ liệu, vui lòng thử lại", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [submissionId, id, token, navigate, showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Award className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Không tìm thấy kết quả bài làm
          </p>
          <button
            onClick={() => navigate(`/student/assignments/${id}`)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-green-600 dark:bg-green-700 rounded-xl shadow-lg p-6 mb-6">
          <button
            onClick={() => navigate(`/student/assignments/${id}`)}
            className="flex items-center gap-2 text-white hover:text-green-100 transition mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <h1 className="text-2xl font-bold text-white mb-2">
            {submission.assignmentName || "Kết quả bài làm"}
          </h1>
          <p className="text-green-100 text-sm">
            Ngày nộp:{" "}
            {new Date(submission.submittedAt).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("Details")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "Details"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Chi tiết bài làm
          </button>
          <button
            onClick={() => setActiveTab("Recommendations")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "Recommendations"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Gợi ý học tập
          </button>
        </div>

        {/* Details Tab */}
        {activeTab === "Details" && (
          <div className="space-y-6">
            {/* Score Summary */}
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-8 text-center shadow-lg">
              <BarChart3 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                Điểm của bạn
              </p>
              <p className="text-5xl font-extrabold text-green-800 dark:text-green-300 mb-6">
                {submission.score !== undefined && submission.score !== null
                  ? submission.score.toFixed(2)
                  : "-"}
              </p>

              {/* Summary Stats */}
              {aiResult?.detailedAnalysis?.summary && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Tổng số câu hỏi:
                      </span>
                    </div>
                    <span className="text-green-700 dark:text-green-400 font-bold">
                      {aiResult.detailedAnalysis.summary.total_questions || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Số câu đúng:
                      </span>
                    </div>
                    <span className="text-green-700 dark:text-green-400 font-bold">
                      {aiResult.detailedAnalysis.summary.correct_count || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Độ chính xác:
                      </span>
                    </div>
                    <span className="text-green-700 dark:text-green-400 font-bold">
                      {aiResult.detailedAnalysis.summary.accuracy_percentage?.toFixed(
                        1
                      ) || 0}
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {submission.answers?.map((answer, idx) => {
                const aiFeedback = getAIQuestionFeedback(answer.question);
                return (
                  <div
                    key={answer.answerId}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                  >
                    {/* Question */}
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Câu {idx + 1}: {answer.question.questionText}
                    </p>

                    {/* Student Answer */}
                    {answer.chosenOption ? (
                      <div className="mb-3">
                        <span className="text-gray-700 dark:text-gray-300">
                          Đáp án bạn chọn:{" "}
                        </span>
                        <span
                          className={`font-semibold ${
                            answer.chosenOption.isCorrect
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {answer.chosenOption.optionText}
                        </span>
                      </div>
                    ) : (
                      <div className="mb-3 text-gray-500 dark:text-gray-400">
                        Đáp án bạn chọn: <span>Chưa trả lời</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                        answer.isCorrect
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {answer.isCorrect ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="font-bold">
                        {answer.isCorrect ? "ĐÚNG" : "SAI"}
                      </span>
                    </div>

                    {/* AI Feedback */}
                    {aiFeedback && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              Đáp án của bạn:
                            </span>{" "}
                            {aiFeedback.student_answer || "Chưa trả lời"}
                          </p>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              Đáp án đúng:
                            </span>{" "}
                            {aiFeedback.correct_answer || "Không có dữ liệu"}
                          </p>
                        </div>

                        <div className="flex items-start gap-2">
                          <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              Giải thích:
                            </span>{" "}
                            {aiFeedback.explanation ||
                              aiFeedback.feedback ||
                              "Không có giải thích."}
                          </p>
                        </div>

                        {(aiFeedback.topic || aiFeedback.subtopic) && (
                          <div className="flex items-start gap-2">
                            <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                Chủ đề:
                              </span>{" "}
                              {aiFeedback.topic}
                              {aiFeedback.subtopic
                                ? ` - ${aiFeedback.subtopic}`
                                : ""}
                            </p>
                          </div>
                        )}

                        {aiFeedback.difficulty_level && (
                          <div className="flex items-start gap-2">
                            <Target className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                Mức độ:
                              </span>{" "}
                              {aiFeedback.difficulty_level}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === "Recommendations" && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Đang tải gợi ý học tập...
                  </p>
                </div>
              </div>
            ) : recommendations ? (
              <>
                {/* Overall Advice */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Gợi ý học tập
                    </h2>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {recommendations.overall_advice ||
                        "Không có gợi ý học tập."}
                    </p>
                  </div>
                </div>

                {/* Weak Topics */}
                {recommendations.weak_topics &&
                  recommendations.weak_topics.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          Chủ đề cần cải thiện
                        </h2>
                      </div>
                      <div className="space-y-3">
                        {recommendations.weak_topics
                          .filter(
                            (topic, index, self) =>
                              index ===
                              self.findIndex(
                                (t) =>
                                  t.topic?.trim().toLowerCase() ===
                                  topic.topic?.trim().toLowerCase()
                              )
                          )
                          .map((topic, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {topic.topic}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  navigate("/student/learning-roadmap")
                                }
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                              >
                                Ôn tập
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-lg text-center">
                <Info className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Không có gợi ý học tập nào hiện tại.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignmentResult;
