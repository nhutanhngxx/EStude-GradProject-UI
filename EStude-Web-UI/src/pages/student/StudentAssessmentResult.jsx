import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  TrendingUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  FileText,
  Loader,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import aiService from "../../services/aiService";
import topicService from "../../services/topicService";

const StudentAssessmentResult_NEW = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const translatePerformanceLevel = (level) => {
    const translations = {
      EXCELLENT: "Xuất sắc",
      GOOD: "Tốt",
      AVERAGE: "Trung bình",
      NEEDS_IMPROVEMENT: "Cần cải thiện",
      POOR: "Yếu",
    };
    return translations[level] || level;
  };

  const {
    subjectName,
    questions,
    answers,
    submissionResult,
    timeElapsed,
    difficulty,
  } = location.state || {};

  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [evaluating, setEvaluating] = useState(false);

  const handleImprovementEvaluation = async () => {
    try {
      setEvaluating(true);
      showToast("Đang phân tích tiến bộ...", "info");

      const token = localStorage.getItem("accessToken");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // Step 1: Calculate NEW results from current questions and answers
      const topicMap = {};

      if (questions && Array.isArray(questions)) {
        questions.forEach((q) => {
          const topicName = q.topicName || "Unknown";
          if (!topicMap[topicName]) {
            topicMap[topicName] = { correct: 0, total: 0 };
          }
          topicMap[topicName].total += 1;

          const userAnswer = answers[q.questionId];
          const correctOption = q.options?.find((opt) => opt.isCorrect);
          if (userAnswer === correctOption?.optionId) {
            topicMap[topicName].correct += 1;
          }
        });
      }

      const new_results = Object.keys(topicMap).map((topic) => ({
        topic: topic,
        accuracy: topicMap[topic].correct / topicMap[topic].total,
      }));

      // Step 2: Fetch topic statistics (all previous topics)
      const statsResult = await topicService.getTopicStatistics(
        user.userId,
        token
      );

      // Create a map of topic name -> accuracy from statistics
      const statsMap = {};
      if (
        statsResult &&
        statsResult.success &&
        Array.isArray(statsResult.data)
      ) {
        statsResult.data.forEach((item) => {
          statsMap[item.topic] = item.accuracy;
        });
      }

      // Step 3: Map previous results
      const previous_results = new_results.map((newItem) => ({
        topic: newItem.topic,
        accuracy: statsMap[newItem.topic] || 0,
      }));

      // Step 4: Call Layer 4 API
      const layer4Payload = {
        submission_id: submissionResult.submissionId.toString(),
        subject: subjectName,
        student_id: user.userId,
        previous_results: previous_results,
        new_results: new_results,
      };

      console.log("Layer 4 Payload:", layer4Payload);

      const evaluationResult = await aiService.layer4(layer4Payload, token);

      if (!evaluationResult || !evaluationResult.success) {
        showToast("Không thể phân tích tiến bộ. Vui lòng thử lại.", "error");
        return;
      }

      // Step 5: Mark submission as evaluated
      await topicService.markSubmissionEvaluated(
        submissionResult.submissionId,
        token
      );

      showToast("Đánh giá tiến bộ thành công!", "success");

      // Step 6: Navigate to improvement screen
      console.log(
        "📤 Navigating to improvement with data:",
        evaluationResult.data
      );
      navigate("/student/assessment/improvement", {
        state: {
          evaluation: evaluationResult.data,
        },
      });
    } catch (error) {
      console.error("Error evaluating improvement:", error);
      showToast("Lỗi khi đánh giá tiến bộ", "error");
    } finally {
      setEvaluating(false);
    }
  };

  if (!submissionResult) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Không tìm thấy kết quả
          </p>
          <button
            onClick={() => navigate("/student/assessment")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  const toggleQuestion = (questionId) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    if (score >= 40) return "orange";
    return "red";
  };

  const performanceColor = getPerformanceColor(submissionResult.score);

  const colorClasses = {
    green: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-400",
      border: "border-green-500",
      icon: "text-green-600",
    },
    yellow: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-400",
      border: "border-yellow-500",
      icon: "text-yellow-600",
    },
    orange: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-700 dark:text-orange-400",
      border: "border-orange-500",
      icon: "text-orange-600",
    },
    red: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-500",
      icon: "text-red-600",
    },
  };

  const colors = colorClasses[performanceColor];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate("/student/assessment")}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại đánh giá</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Kết quả đánh giá
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{subjectName}</p>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Score Card */}
        <div
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border-l-4 ${colors.border}`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center ${colors.bg}`}
              >
                <Award className={`w-12 h-12 ${colors.icon}`} />
              </div>
              <div>
                <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                  {(submissionResult.score / 10).toFixed(1)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  điểm tổng
                </p>
                <p className={`font-semibold mt-2 ${colors.text}`}>
                  {translatePerformanceLevel(submissionResult.performanceLevel)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {submissionResult.correctAnswers}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Câu đúng
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {submissionResult.totalQuestions -
                    submissionResult.correctAnswers}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Câu sai
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tổng câu
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {submissionResult.totalQuestions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Độ khó
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {difficulty === "easy"
                    ? "Dễ"
                    : difficulty === "medium"
                    ? "TB"
                    : difficulty === "hard"
                    ? "Khó"
                    : "Hỗn hợp"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Thời gian
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatTime(timeElapsed)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tỷ lệ đúng
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {(
                    (submissionResult.correctAnswers /
                      submissionResult.totalQuestions) *
                    100
                  ).toFixed(0)}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendation Section */}
        {submissionResult.aiRecommendation && (
          <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl shadow-lg p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Gợi ý học tập từ AI
              </h2>
            </div>

            <div className="space-y-4">
              {/* Overall Recommendation */}
              {submissionResult.aiRecommendation.overall_recommendation && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Khuyến nghị chung:
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {submissionResult.aiRecommendation.overall_recommendation}
                  </p>
                </div>
              )}
              {/* Weak Topics - Layer 2 */}
              {submissionResult.aiRecommendation.weak_topics &&
                Array.isArray(submissionResult.aiRecommendation.weak_topics) &&
                submissionResult.aiRecommendation.weak_topics.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Chủ đề cần cải thiện:
                    </h3>
                    <div className="space-y-4">
                      {submissionResult.aiRecommendation.weak_topics.map(
                        (topic, idx) => (
                          <div
                            key={idx}
                            className="border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-r-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {topic.topic}
                                </h4>
                              </div>
                              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                {topic.percentage}% sai
                              </span>
                            </div>

                            {topic.recommendation && (
                              <div className="space-y-2 mt-3">
                                {topic.recommendation.study_focus && (
                                  <div className="flex items-start gap-2">
                                    <TrendingUp className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Tập trung học:
                                      </p>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {topic.recommendation.study_focus}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {topic.recommendation.practice_suggestion && (
                                  <div className="flex items-start gap-2">
                                    <BookOpen className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Luyện tập:
                                      </p>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {
                                          topic.recommendation
                                            .practice_suggestion
                                        }
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {topic.recommendation.resource_hint && (
                                  <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Tài liệu:
                                      </p>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {topic.recommendation.resource_hint}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              {/* Overall Advice */}
              {submissionResult.aiRecommendation.overall_advice && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Lời khuyên chung:
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {submissionResult.aiRecommendation.overall_advice}
                  </p>
                </div>
              )}{" "}
              {/* Learning Path */}
              {submissionResult.aiRecommendation.learning_path &&
                Array.isArray(
                  submissionResult.aiRecommendation.learning_path
                ) && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Lộ trình học tập được đề xuất:
                    </h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      {submissionResult.aiRecommendation.learning_path.map(
                        (step, idx) => (
                          <li
                            key={idx}
                            className="text-gray-700 dark:text-gray-300"
                          >
                            {typeof step === "string"
                              ? step
                              : step.step || step.description}
                          </li>
                        )
                      )}
                    </ol>
                  </div>
                )}
              {/* Study Tips */}
              {submissionResult.aiRecommendation.study_tips &&
                Array.isArray(submissionResult.aiRecommendation.study_tips) && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Mẹo học tập:
                    </h3>
                    <ul className="space-y-2">
                      {submissionResult.aiRecommendation.study_tips.map(
                        (tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {typeof tip === "string"
                                ? tip
                                : tip.tip || tip.description}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Question Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Chi tiết từng câu hỏi
          </h2>

          <div className="space-y-4">
            {questions?.map((question, index) => {
              const userAnswer = answers[question.questionId];
              const correctOption = question.options?.find(
                (opt) => opt.isCorrect
              );
              const isCorrect = userAnswer === correctOption?.optionId;
              const isExpanded = expandedQuestions.has(question.questionId);

              // Get AI feedback for this question - try from question first, then from submissionResult
              let questionAiFeedback = question.aiFeedback;

              // Fallback: if not in question, try to find from submissionResult.aiFeedback.feedback
              if (
                !questionAiFeedback &&
                submissionResult?.aiFeedback?.feedback
              ) {
                questionAiFeedback = submissionResult.aiFeedback.feedback.find(
                  (fb) => fb.question_id === question.questionId
                );
              }

              return (
                <div
                  key={question.questionId}
                  className={`border-2 rounded-lg overflow-hidden transition-all ${
                    isCorrect ? "border-green-500" : "border-red-500"
                  }`}
                >
                  <button
                    onClick={() => toggleQuestion(question.questionId)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                      )}
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          Câu {index + 1}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {question.topicName}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-gray-900 dark:text-gray-100 font-medium mb-4">
                        {question.questionText}
                      </p>

                      <div className="space-y-2">
                        {question.options?.map((option, optIdx) => {
                          const isUserAnswer = userAnswer === option.optionId;
                          const isCorrectAnswer = option.isCorrect;

                          return (
                            <div
                              key={option.optionId}
                              className={`p-3 rounded-lg border-2 ${
                                isCorrectAnswer
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                  : isUserAnswer
                                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                  : "border-gray-200 dark:border-gray-600"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isCorrectAnswer && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                )}
                                <span className="text-gray-900 dark:text-gray-100">
                                  {String.fromCharCode(65 + optIdx)}.{" "}
                                  {option.optionText}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation for incorrect answers */}
                      {!isCorrect && question.explanation && (
                        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Giải thích:</strong> Đáp án đúng là{" "}
                            {String.fromCharCode(
                              65 +
                                question.options?.findIndex(
                                  (opt) => opt.isCorrect
                                )
                            )}
                            . {question.explanation}
                          </p>
                        </div>
                      )}

                      {/* AI Feedback for this question (Layer 1) */}
                      {questionAiFeedback && (
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 space-y-3">
                              <p className="font-semibold text-purple-900 dark:text-purple-100 text-sm">
                                Phân tích AI cho câu này:
                              </p>

                              {/* Topic & Subtopic */}
                              {(questionAiFeedback.topic ||
                                questionAiFeedback.subtopic) && (
                                <div className="text-sm bg-white dark:bg-gray-800 rounded p-2">
                                  <div className="flex flex-wrap gap-2">
                                    {questionAiFeedback.topic && (
                                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                                        📚 {questionAiFeedback.topic}
                                      </span>
                                    )}
                                    {questionAiFeedback.subtopic && (
                                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                        📖 {questionAiFeedback.subtopic}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Correct Answer Info */}
                              {!isCorrect &&
                                questionAiFeedback.correct_answer && (
                                  <div className="text-sm bg-green-50 dark:bg-green-900/20 rounded p-3 border border-green-200 dark:border-green-800">
                                    <p className="font-medium text-green-700 dark:text-green-400 mb-1">
                                      ✓ Đáp án đúng:
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                      {questionAiFeedback.correct_answer}
                                    </p>
                                  </div>
                                )}

                              {/* AI Explanation */}
                              {questionAiFeedback.explanation && (
                                <div className="text-sm bg-white dark:bg-gray-800 rounded p-3">
                                  <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">
                                    💡 Giải thích từ AI:
                                  </p>
                                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {questionAiFeedback.explanation}
                                  </p>
                                </div>
                              )}

                              {/* Difficulty Level */}
                              {questionAiFeedback.difficulty_level && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Độ khó: {questionAiFeedback.difficulty_level}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pb-8">
          <button
            onClick={() => navigate("/student/assessment")}
            className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Làm bài mới
          </button>
          {submissionResult?.aiRecommendation && (
            <button
              onClick={handleImprovementEvaluation}
              disabled={evaluating}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
            >
              {evaluating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  <span>Đánh giá tiến bộ</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={() => navigate("/student/learning-roadmap")}
            className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Xem lộ trình học tập
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentAssessmentResult_NEW;
