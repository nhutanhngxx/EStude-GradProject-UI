import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Clock, CheckCircle, Circle, X, Loader } from "lucide-react";
import topicService from "../../services/topicService";
import aiService from "../../services/aiService";
import { useToast } from "../../contexts/ToastContext";

const StudentAssessmentQuiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("accessToken");

  const getPerformanceLabel = (level) => {
    switch (level) {
      case "EXCELLENT":
        return "Xuất sắc";
      case "GOOD":
        return "Tốt";
      case "AVERAGE":
        return "Trung bình";
      case "BELOW_AVERAGE":
        return "Yếu";
      case "POOR":
        return "Kém";
      default:
        return level;
    }
  };

  // Get data from navigation state
  const {
    assessmentId,
    subjectId,
    subjectName,
    questions: generatedQuestions,
    totalQuestions,
    difficulty,
    selectedTopics,
  } = location.state || {};

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [aiFeedbackLoading, setAiFeedbackLoading] = useState(false);

  useEffect(() => {
    // Check if we have questions from navigation
    if (!generatedQuestions || !Array.isArray(generatedQuestions)) {
      showToast("Không có câu hỏi để hiển thị!", "error");
      navigate("/student/assessment");
      return;
    }

    setQuestions(generatedQuestions);
  }, []);

  // Timer
  useEffect(() => {
    if (questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [questions.length]);

  const handleSelectAnswer = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < questions.length) {
      if (
        !window.confirm(
          `Bạn mới trả lời ${answeredCount}/${questions.length} câu. Bạn có chắc muốn nộp bài?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm("Bạn có chắc muốn nộp bài đánh giá?")) {
        return;
      }
    }

    submitAssessment();
  };

  const submitAssessment = async () => {
    try {
      setSubmitting(true);

      // Prepare submission data
      const submissionData = {
        assessmentId: assessmentId,
        studentId: user.userId,
        subjectId: subjectId,
        gradeLevel: questions[0]?.gradeLevel || "GRADE_10",
        difficulty: difficulty?.toUpperCase() || "MIXED",
        answers: Object.keys(answers).map((questionId) => ({
          questionId: parseInt(questionId),
          chosenOptionId: answers[questionId],
        })),
        timeTaken: timeElapsed,
      };

      console.log("Submitting assessment:", submissionData);

      // Call submit API
      const result = await topicService.submitAssessment(submissionData);

      console.log("Submit API result:", result);

      // Extract data from response
      const submissionData_result = result.data || result;

      // Check if result has required data
      if (
        submissionData_result &&
        (submissionData_result.submissionId ||
          submissionData_result.id ||
          submissionData_result.score !== undefined)
      ) {
        // Normalize the result
        const normalizedResult = {
          ...submissionData_result,
          submissionId:
            submissionData_result.submissionId ||
            submissionData_result.id ||
            `temp_${Date.now()}`,
        };

        console.log("Submission successful:", normalizedResult);

        // Close submitting modal
        setSubmitting(false);

        // Wait for submitting modal to close
        setTimeout(() => {
          setSubmissionResult(normalizedResult);
          setShowResultModal(true);

          // Start AI feedback process
          setTimeout(() => {
            requestAIFeedback(normalizedResult);
          }, 1000);
        }, 300);
      } else {
        throw new Error("Không nhận được kết quả từ server.");
      }
    } catch (error) {
      setSubmitting(false);
      console.error("Error submitting assessment:", error);
      showToast(error.message || "Lỗi khi nộp bài. Vui lòng thử lại.", "error");
    }
  };

  const requestAIFeedback = async (submissionResult) => {
    try {
      setAiFeedbackLoading(true);

      // Map questions to AI format
      const aiQuestions = questions.map((q) => {
        const userAnswer = answers[q.questionId];
        const correctOption = q.options?.find((opt) => opt.isCorrect);

        return {
          question_id: q.questionId,
          topic: q.topicName || "Không rõ",
          question: q.questionText,
          options: q.options?.map((opt) => opt.optionText) || [],
          correct_answer: q.options?.findIndex((opt) => opt.isCorrect) || 0,
          student_answer: userAnswer
            ? q.options?.findIndex((opt) => opt.optionId === userAnswer)
            : -1,
        };
      });

      const aiPayload = {
        submission_id: submissionResult.submissionId.toString(),
        assessment_id: assessmentId,
        student_name: user.fullName || user.username || "Học sinh",
        subject: subjectName,
        questions: aiQuestions,
      };

      console.log("Requesting AI Layer 1 feedback:", aiPayload);

      // Call Layer 1 AI API
      const layer1Response = await aiService.layer1(aiPayload, token);

      console.log("AI Layer 1 received:", layer1Response);

      let updatedResult = { ...submissionResult };

      if (layer1Response && layer1Response.success && layer1Response.data) {
        showToast("AI đã phân tích bài làm của bạn!", "success");

        updatedResult.aiFeedback = layer1Response.data;
        setSubmissionResult(updatedResult);

        // Call Layer 2
        console.log("Requesting AI Layer 2 recommendation...");

        const layer2Payload = {
          submission_id: submissionResult.submissionId.toString(),
          feedback_data: layer1Response.data,
        };

        const layer2Response = await aiService.layer2(layer2Payload, token);

        console.log("AI Layer 2 received:", layer2Response);

        if (layer2Response && layer2Response.success && layer2Response.data) {
          showToast("AI đã tạo gợi ý học tập cho bạn!", "success");

          updatedResult.aiRecommendation = layer2Response.data;
          setSubmissionResult(updatedResult);
        }

        // Auto navigate to results after AI processing
        setTimeout(() => {
          handleViewResultsWithData(updatedResult);
        }, 2000);
      } else {
        // If AI fails, auto navigate after 3 seconds
        setTimeout(() => {
          handleViewResultsWithData(updatedResult);
        }, 3000);
      }
    } catch (error) {
      console.error("Error requesting AI feedback:", error);
      // Auto navigate even if AI fails
      setTimeout(() => {
        handleViewResultsWithData(submissionResult);
      }, 3000);
    } finally {
      setAiFeedbackLoading(false);
    }
  };

  const handleViewResultsWithData = (resultData) => {
    setShowResultModal(false);

    // Map AI feedback to each question (Layer 1)
    const questionsWithFeedback = questions.map((question) => {
      let aiFeedbackForQuestion = null;

      // Check if Layer 1 feedback exists
      if (
        resultData.aiFeedback &&
        resultData.aiFeedback.feedback &&
        Array.isArray(resultData.aiFeedback.feedback)
      ) {
        // Find feedback for this question by question_id
        aiFeedbackForQuestion = resultData.aiFeedback.feedback.find(
          (fb) => fb.question_id === question.questionId
        );
      }

      return {
        ...question,
        aiFeedback: aiFeedbackForQuestion, // Add AI feedback to question
      };
    });

    // Navigate to results with all data
    navigate(`/student/assessment/result/${resultData.submissionId}`, {
      state: {
        assessmentId,
        subjectId,
        subjectName,
        questions: questionsWithFeedback, // Use questions with AI feedback
        answers,
        submissionResult: resultData,
        timeElapsed,
        selectedTopics,
        difficulty,
      },
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Result Modal */}
      {showResultModal && submissionResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-8 text-center">
              <div
                className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  submissionResult.score >= 80
                    ? "bg-green-100 dark:bg-green-900/30"
                    : submissionResult.score >= 50
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                <CheckCircle
                  className={`w-12 h-12 ${
                    submissionResult.score >= 80
                      ? "text-green-600"
                      : submissionResult.score >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Bài làm đã được chấm!
              </h2>

              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 my-4">
                {(submissionResult.score / 10).toFixed(1)}
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {submissionResult.correctAnswers}/
                {submissionResult.totalQuestions} câu đúng
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Môn học
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {submissionResult.subjectName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Đánh giá
                  </span>
                  <span
                    className={`font-semibold px-3 py-1 rounded-full text-xs ${
                      submissionResult.score >= 80
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : submissionResult.score >= 50
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {getPerformanceLabel(submissionResult.performanceLevel)}
                  </span>
                </div>
              </div>

              {aiFeedbackLoading && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-3">
                    <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      {submissionResult.aiFeedback
                        ? "Đang tạo gợi ý học tập..."
                        : "Đang phân tích với AI..."}
                    </span>
                  </div>
                </div>
              )}

              {!aiFeedbackLoading && submissionResult.aiRecommendation && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      AI đã hoàn tất phân tích!
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleViewResultsWithData(submissionResult)}
                disabled={aiFeedbackLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {aiFeedbackLoading
                  ? "Đang xử lý AI..."
                  : "Xem chi tiết kết quả"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting Modal */}
      {submitting && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Đang nộp bài...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vui lòng đợi
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {subjectName}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeElapsed)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Nộp bài
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>
                Câu {currentIndex + 1}/{questions.length}
              </span>
              <span>Đã trả lời: {answeredCount}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question panel */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
              {/* Topic & Difficulty badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                  {currentQuestion.topicName}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    currentQuestion.difficultyLevel === "EASY"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : currentQuestion.difficultyLevel === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {currentQuestion.difficultyLevel === "EASY"
                    ? "Dễ"
                    : currentQuestion.difficultyLevel === "MEDIUM"
                    ? "Trung bình"
                    : "Khó"}
                </span>
              </div>

              {/* Question text */}
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6 leading-relaxed">
                {currentQuestion.questionText}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options?.map((option, idx) => {
                  const isSelected =
                    answers[currentQuestion.questionId] === option.optionId;

                  return (
                    <button
                      key={option.optionId}
                      onClick={() =>
                        handleSelectAnswer(
                          currentQuestion.questionId,
                          option.optionId
                        )
                      }
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-gray-100">
                          {String.fromCharCode(65 + idx)}. {option.optionText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === questions.length - 1}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tiếp theo
                </button>
              </div>
            </div>
          </div>

          {/* Question navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Danh sách câu hỏi
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentIndex(index)}
                    className={`aspect-square rounded-lg text-sm font-semibold transition-all ${
                      currentIndex === index
                        ? "bg-blue-600 text-white ring-2 ring-blue-300"
                        : answers[q.questionId]
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Đã trả lời
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Chưa trả lời
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAssessmentQuiz;
