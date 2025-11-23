import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import classSubjectService from "../../services/classSubjectService";
import topicService from "../../services/topicService";
import aiService from "../../services/aiService";
import { useToast } from "../../contexts/ToastContext";

const StudentAssessment = () => {
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
  const { showToast } = useToast();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [activeTab, setActiveTab] = useState("new"); // "new" or "history"
  const [subjects, setSubjects] = useState([]);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(null); // Track which submission is being evaluated
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchSubjects();
    fetchAssessmentHistory();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await classSubjectService.getClassSubjectsByStudent(
        user.userId
      );

      if (Array.isArray(data) && data.length > 0) {
        // Group by subject to avoid duplicates
        const subjectMap = {};
        data.forEach((cs) => {
          const subjectId = cs.subjectId || cs.subject?.subjectId;
          const subjectName = cs.subjectName || cs.subject?.name || "Không rõ";

          if (!subjectMap[subjectId]) {
            subjectMap[subjectId] = {
              subjectId,
              subjectName,
              gradeLevel: cs.gradeLevel || "GRADE_10",
              className: cs.className || "Không rõ",
              semester: cs.termName || "HK1 2025-2026",
              teacherName: cs.teacherName || "Chưa rõ",
              classSubjectId: cs.classSubjectId,
            };
          }
        });

        setSubjects(Object.values(subjectMap));
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showToast("Lỗi khi tải danh sách môn học!", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessmentHistory = async () => {
    try {
      const history = await topicService.getStudentSubmissions(user.userId);

      if (history.success && Array.isArray(history.data)) {
        setAssessmentHistory(history.data);
      } else if (Array.isArray(history)) {
        setAssessmentHistory(history);
      }
    } catch (error) {
      console.error("Error loading assessment history:", error);
      // Don't show error, history is optional
    }
  };

  const handleSelectSubject = (subject) => {
    navigate(
      `/student/assessment/topics?subjectId=${
        subject.subjectId
      }&subjectName=${encodeURIComponent(subject.subjectName)}&gradeLevel=${
        subject.gradeLevel
      }`
    );
  };

  const handleViewResult = async (submission) => {
    try {
      setLoading(true);
      showToast("Đang tải chi tiết bài làm...", "info");

      // Step 1: Fetch detailed submission data
      const detailResult = await topicService.getSubmissionDetail(
        submission.submissionId
      );

      if (!detailResult || !detailResult.success || !detailResult.data) {
        showToast("Không thể tải chi tiết bài làm!", "error");
        return;
      }

      const detailData = detailResult.data;

      // Step 2: Fetch AI feedback for this assessment (Layer 1)
      let aiFeedbackData = null;
      let aiRecommendationData = null;

      try {
        // Fetch Layer 1 feedback
        const aiFeedbackResult = await aiService.getAIFeedbackByAssignmentId(
          detailData.assessmentId,
          token
        );

        console.log("AI Feedback result:", aiFeedbackResult);

        // Extract feedback from the response
        if (Array.isArray(aiFeedbackResult) && aiFeedbackResult.length > 0) {
          // Get the most recent feedback
          const latestFeedback = aiFeedbackResult[0];
          if (latestFeedback.detailedAnalysis) {
            aiFeedbackData = latestFeedback.detailedAnalysis;
          }
        }
      } catch (aiError) {
        console.error("Error fetching AI feedback:", aiError);
        // Continue without AI feedback
      }

      try {
        // Fetch Layer 2 recommendation
        const aiRecommendationResult =
          await aiService.getAIRecommendationByAssignmentId(
            detailData.assessmentId,
            token
          );
        console.log("AssessmentId", detailData.assessmentId);
        console.log("AI Recommendation result:", aiRecommendationResult);

        // Extract recommendation from the response
        if (
          Array.isArray(aiRecommendationResult) &&
          aiRecommendationResult.length > 0
        ) {
          // Get the most recent recommendation
          const latestRecommendation = aiRecommendationResult[0];
          if (latestRecommendation.detailedAnalysis) {
            aiRecommendationData = latestRecommendation.detailedAnalysis;
          }
        }
      } catch (aiError) {
        console.error("Error fetching AI recommendation:", aiError);
        // Continue without AI recommendation
      }

      // Step 3: Convert answers array to answers object for compatibility
      const answersObj = {};
      detailData.answers.forEach((ans) => {
        answersObj[ans.questionId] = ans.chosenOptionId;
      });

      // Step 4: Convert answers to questions format for review
      const questions = detailData.answers.map((ans) => {
        // Find AI feedback for this question
        let aiFeedbackForQuestion = null;
        if (aiFeedbackData && aiFeedbackData.feedback) {
          aiFeedbackForQuestion = aiFeedbackData.feedback.find(
            (fb) => fb.question_id === ans.questionId
          );
        }

        return {
          questionId: ans.questionId,
          questionText: ans.questionText,
          topicName: ans.topicName,
          difficultyLevel: ans.difficultyLevel,
          options: [
            {
              optionId: ans.correctOptionId,
              optionText: ans.correctOptionText,
              isCorrect: true,
            },
            // Add the chosen option if different
            ...(ans.chosenOptionId !== ans.correctOptionId
              ? [
                  {
                    optionId: ans.chosenOptionId,
                    optionText: ans.chosenOptionText,
                    isCorrect: false,
                  },
                ]
              : []),
          ],
          explanation: ans.explanation,
          // Add AI feedback to question if available
          aiFeedback: aiFeedbackForQuestion,
        };
      });

      // Step 5: Prepare submission result with AI feedback and recommendation
      const submissionResultWithAI = {
        ...detailData,
        aiFeedback: aiFeedbackData, // Add Layer 1 feedback
        aiRecommendation: aiRecommendationData, // Add Layer 2 recommendation
      };

      // Step 6: Navigate to result screen with full data
      navigate(`/student/assessment/result/${submission.submissionId}`, {
        state: {
          assessmentId: detailData.assessmentId,
          subjectId: detailData.subjectId,
          subjectName: detailData.subjectName,
          questions: questions,
          answers: answersObj,
          submissionResult: submissionResultWithAI,
          score: detailData.score,
          correctCount: detailData.correctAnswers,
          totalQuestions: detailData.totalQuestions,
          timeElapsed: detailData.timeTaken,
          difficulty: detailData.difficulty,
          isHistoryView: true, // Flag to indicate this is a history view
        },
      });
    } catch (error) {
      console.error("Error fetching submission detail:", error);
      showToast("Lỗi khi tải chi tiết bài làm!", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle improvement evaluation from history (similar to App)
   * 1. Fetch submission detail to get questions with answers
   * 2. Fetch topic statistics (previous results)
   * 3. Calculate new results from submission detail
   * 4. Map previous results with topic names from new results
   * 5. Call Layer 4 API
   * 6. Mark submission as evaluated
   * 7. Navigate to improvement screen
   */
  const handleImprovementEvaluation = async (submission) => {
    try {
      setEvaluating(submission.submissionId);
      showToast("Đang phân tích tiến bộ...", "info");

      // Step 1: Fetch submission detail to get full questions data
      const detailResult = await topicService.getSubmissionDetail(
        submission.submissionId
      );

      if (!detailResult || !detailResult.success || !detailResult.data) {
        showToast("Không thể tải chi tiết bài làm!", "error");
        return;
      }

      const detailData = detailResult.data;

      // Step 2: Calculate NEW results from submission detail (answers array)
      const topicMap = {};

      if (detailData.answers && Array.isArray(detailData.answers)) {
        detailData.answers.forEach((ans) => {
          const topicName = ans.topicName;
          if (!topicMap[topicName]) {
            topicMap[topicName] = { correct: 0, total: 0 };
          }
          topicMap[topicName].total++;
          if (ans.isCorrect) {
            topicMap[topicName].correct++;
          }
        });
      }

      const new_results = Object.keys(topicMap).map((topic) => ({
        topic: topic,
        accuracy: topicMap[topic].correct / topicMap[topic].total,
      }));

      console.log("📊 Calculated new_results:", new_results);

      // Step 3: Fetch topic statistics (all previous topics)
      const statsResult = await topicService.getTopicStatistics(user.userId);

      // Create a map of topic name -> accuracy from statistics
      const statsMap = {};
      if (
        statsResult &&
        statsResult.success &&
        Array.isArray(statsResult.data)
      ) {
        statsResult.data.forEach((stat) => {
          statsMap[stat.topicName] = stat.accuracy;
        });
      }

      // Step 4: Map previous results with topics from new_results
      const previous_results = new_results.map((newItem) => ({
        topic: newItem.topic,
        accuracy: statsMap[newItem.topic] || 0,
      }));

      console.log("📊 Calculated previous_results:", previous_results);

      // Step 5: Call Layer 4 API (Improvement Evaluation)
      const layer4Payload = {
        submission_id: submission.submissionId,
        student_id: user.userId,
        subject: detailData.subjectName,
        previous_results: previous_results,
        new_results: new_results,
      };

      console.log("🚀 Calling Layer 4 with payload:", layer4Payload);

      const evaluationResult = await aiService.layer4(layer4Payload, token);

      if (!evaluationResult || !evaluationResult.success) {
        showToast("Không thể đánh giá tiến bộ", "error");
        return;
      }

      console.log("✅ Layer 4 result:", evaluationResult);

      // Step 6: Mark submission as evaluated
      await topicService.markSubmissionEvaluated(submission.submissionId);

      // Refresh history to show evaluated badge
      await fetchAssessmentHistory();

      showToast("Đánh giá tiến bộ thành công!", "success");

      // Step 7: Navigate to improvement screen
      navigate("/student/assessment/improvement", {
        state: {
          evaluation: evaluationResult.data || evaluationResult,
          submissionId: submission.submissionId,
        },
      });
    } catch (error) {
      console.error("❌ Error in improvement evaluation:", error);
      showToast("Lỗi khi đánh giá tiến bộ", "error");
    } finally {
      setEvaluating(null);
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100 dark:bg-green-900/30";
    if (score >= 60)
      return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
    if (score >= 40)
      return "text-orange-600 bg-orange-100 dark:bg-orange-900/30";
    return "text-red-600 bg-red-100 dark:bg-red-900/30";
  };

  const SubjectCard = ({ subject }) => (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-6 cursor-pointer border-2 border-transparent hover:border-blue-500"
      onClick={() => handleSelectSubject(subject)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {subject.subjectName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lớp {subject.className}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              GV: {subject.teacherName}
            </p>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-gray-400" />
      </div>
    </div>
  );

  const HistoryCard = ({ submission }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${getPerformanceColor(
              submission.score
            )}`}
          >
            {submission.score >= 50 ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {submission.subjectName || "Không rõ môn"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(submission.submittedAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {(submission.score / 10).toFixed(1)}
          </div>
          <p className="text-xs text-gray-500">điểm</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Câu đúng</p>
          <p className="text-lg font-semibold text-green-600">
            {submission.correctAnswers}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Tổng câu</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {submission.totalQuestions}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Độ khó</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {submission.difficulty === "EASY"
              ? "Dễ"
              : submission.difficulty === "MEDIUM"
              ? "TB"
              : submission.difficulty === "HARD"
              ? "Khó"
              : "Hỗn hợp"}
          </p>
        </div>
      </div>

      {submission.performanceLevel && (
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Đánh giá
            </span>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${getPerformanceColor(
                submission.score
              )}`}
            >
              {translatePerformanceLevel(submission.performanceLevel)}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewResult(submission);
          }}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition font-semibold disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Xem chi tiết</span>
        </button>

        {submission.improvementEvaluated ? (
          <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 text-green-700 dark:text-green-400 rounded-lg font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>Đã đánh giá</span>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleImprovementEvaluation(submission);
            }}
            disabled={evaluating === submission.submissionId}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold disabled:opacity-50"
          >
            {evaluating === submission.submissionId ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Đánh giá tiến bộ</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 relative">
      {/* Loading Overlay */}
      {loading && activeTab === "history" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300 text-center">
              Đang tải bài làm...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Đánh giá năng lực
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {activeTab === "new"
            ? "Chọn môn học để làm bài đánh giá"
            : "Xem lại các bài đánh giá đã làm"}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
              activeTab === "new"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            onClick={() => setActiveTab("new")}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Làm bài mới</span>
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all ${
              activeTab === "history"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            onClick={() => setActiveTab("history")}
          >
            <Clock className="w-5 h-5" />
            <span>Lịch sử</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "new" ? (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Không có môn học nào
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject) => (
              <SubjectCard key={subject.subjectId} subject={subject} />
            ))}
          </div>
        )
      ) : (
        <div>
          {assessmentHistory.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Chưa có bài đánh giá nào
              </p>
              <button
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setActiveTab("new")}
              >
                Làm bài mới
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessmentHistory.map((submission) => (
                <HistoryCard
                  key={submission.submissionId}
                  submission={submission}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAssessment;
