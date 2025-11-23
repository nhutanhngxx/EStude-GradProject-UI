import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  Clock,
  CheckCircle,
  Circle,
  AlertTriangle,
  Send,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import submissionService from "../../services/submissionService";
import aiService from "../../services/aiService";
import { useToast } from "../../contexts/ToastContext";

const StudentAssignmentQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { assignment } = location.state || {};
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("accessToken");

  const [activeTab, setActiveTab] = useState("doing"); // doing | review
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState((assignment?.timeLimit || 15) * 60);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    if (!assignment) {
      showToast("Không tìm thấy thông tin bài tập", "error");
      navigate(`/student/assignments/${id}`);
      return;
    }

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1 && !autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSelectAnswer = (questionId, optionText) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionText,
    }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      setShowSubmitModal(false);
    }

    setSubmitting(true);

    try {
      const userAnswers = assignment.questions.map((q) => ({
        questionId: q.questionId,
        questionText: q.questionText,
        userAnswer: answers[q.questionId] || "",
        correctAnswer: q.correctAnswer || "",
        isCorrect:
          q.correctAnswer &&
          answers[q.questionId]?.trim().toLowerCase() ===
            q.correctAnswer.trim().toLowerCase(),
      }));

      const submission = {
        assignmentId: assignment.assignmentId,
        studentId: user.userId,
        classSubjectId: assignment.classSubjectId,
        submittedAt: new Date().toISOString(),
        status: "SUBMITTED",
        answers: userAnswers,
      };

      const result = await submissionService.addSubmission(submission);

      if (result) {
        showToast(
          isAutoSubmit
            ? "Đã tự động nộp bài khi hết giờ"
            : "Nộp bài thành công!",
          "success"
        );

        // Call AI to evaluate
        await callAIEvaluation(result, userAnswers);
      } else {
        showToast("Nộp bài thất bại", "error");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      showToast("Có lỗi xảy ra khi nộp bài", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const callAIEvaluation = async (submissionResult, userAnswers) => {
    try {
      const correctCount = userAnswers.filter((a) => a.isCorrect).length;
      const totalQuestions = assignment.questions.length;
      const score =
        (correctCount / totalQuestions) * (assignment.maxScore || 10);

      // Prepare data for AI
      const evaluationData = {
        submissionId: submissionResult.submissionId || submissionResult.id,
        studentId: user.userId,
        assignmentId: assignment.assignmentId,
        score: score,
        totalQuestions: totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: totalQuestions - correctCount,
        answers: userAnswers,
        subject: assignment.subject?.name || "Không rõ",
      };

      // Call AI service
      const aiResult = await aiService.evaluateSubmission(
        token,
        evaluationData
      );

      // Navigate to result page
      navigate(
        `/student/assignment/${id}/result/${
          submissionResult.submissionId || submissionResult.id
        }`,
        {
          state: {
            submission: submissionResult,
            aiResult: aiResult,
            score: score,
            assignment: assignment,
          },
        }
      );
    } catch (error) {
      console.error("Error calling AI:", error);
      // Still navigate even if AI fails
      navigate(`/student/assignments/${id}`);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = assignment?.questions?.length || 0;
  const progress =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  if (!assignment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/student/assignments/${id}`)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Quay lại</span>
            </button>
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold">{assignment.title}</h1>
              <p className="text-sm text-green-100 mt-1">
                {assignment.classSubject.subject?.name || "Không rõ môn"}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Clock className="w-5 h-5" />
              <span className="text-lg font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>
                Đã trả lời: {answeredCount}/{totalQuestions}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow">
          <button
            onClick={() => setActiveTab("doing")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === "doing"
                ? "bg-green-600 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Làm bài
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
              activeTab === "review"
                ? "bg-green-600 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Xem lại ({answeredCount}/{totalQuestions})
          </button>
        </div>
      </div>

      {/* Question Navigation Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
        <button
          onClick={() => setShowQuestionNav(!showQuestionNav)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition"
        >
          {showQuestionNav ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {showQuestionNav ? "Ẩn" : "Hiện"} danh sách câu hỏi
          </span>
        </button>

        {showQuestionNav && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
              Danh sách câu hỏi
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {assignment.questions.map((q, index) => (
                <button
                  key={q.questionId}
                  onClick={() => {
                    document
                      .getElementById(`question-${index}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className={`w-10 h-10 rounded-lg font-semibold transition ${
                    answers[q.questionId]
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-32">
        {assignment.questions.map((question, index) => (
          <div
            key={question.questionId}
            id={`question-${index}`}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {question.questionText}
                </h3>
                {question.topic && (
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                    {question.topic.name}
                  </span>
                )}
              </div>
              {answers[question.questionId] && (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              )}
            </div>

            {/* Options */}
            {question.type === "MULTIPLE_CHOICE" && question.options ? (
              <div className="space-y-3 ml-11">
                {question.options.map((option, optIndex) => {
                  const isSelected =
                    answers[question.questionId] === option.optionText;
                  return (
                    <button
                      key={optIndex}
                      onClick={() =>
                        handleSelectAnswer(
                          question.questionId,
                          option.optionText
                        )
                      }
                      className={`w-full text-left p-4 rounded-lg border-2 transition ${
                        isSelected
                          ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span
                          className={`${
                            isSelected
                              ? "font-semibold text-green-900 dark:text-green-100"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {option.optionText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="ml-11">
                <textarea
                  value={answers[question.questionId] || ""}
                  onChange={(e) =>
                    handleSelectAnswer(question.questionId, e.target.value)
                  }
                  placeholder="Nhập câu trả lời của bạn..."
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-600 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={4}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {answeredCount}/{totalQuestions} câu
                </span>
              </div>
              {answeredCount < totalQuestions && (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Còn {totalQuestions - answeredCount} câu chưa trả lời
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => showToast("Đã lưu nháp", "success")}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
              >
                <Save className="w-5 h-5" />
                Lưu nháp
              </button>
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-medium disabled:opacity-50 shadow-lg"
              >
                <Send className="w-5 h-5" />
                {submitting ? "Đang nộp..." : "Nộp bài"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Xác nhận nộp bài
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Bạn đã trả lời {answeredCount}/{totalQuestions} câu hỏi.
                </p>
                {answeredCount < totalQuestions && (
                  <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                    Còn {totalQuestions - answeredCount} câu chưa trả lời!
                  </p>
                )}
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Bạn có chắc chắn muốn nộp bài không?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
              >
                {submitting ? "Đang nộp..." : "Nộp bài"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentQuiz;
