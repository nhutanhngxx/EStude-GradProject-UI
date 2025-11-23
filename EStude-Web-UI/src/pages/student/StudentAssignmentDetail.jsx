import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Download,
  Upload,
  Award,
  RefreshCw,
  Info,
  TrendingUp,
} from "lucide-react";
import assignmentService from "../../services/assignmentService";
import submissionService from "../../services/submissionService";
import { useToast } from "../../contexts/ToastContext";

const StudentAssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssignmentDetail = async () => {
    try {
      setLoading(true);
      const response = await assignmentService.getAssignmentById(id);
      console.log("📋 Assignment Response:", response);
      console.log("📋 Assignment Data:", response?.data);
      console.log("📚 Subject:", response?.data?.subject);
      console.log("📚 Subject Name:", response?.data?.subject?.name);
      if (response && response.data) {
        setAssignment(response.data);
      } else {
        showToast("Không tìm thấy bài tập", "error");
        navigate("/student/assignments");
      }
    } catch (error) {
      console.error("Error loading assignment:", error);
      showToast("Lỗi khi tải thông tin bài tập", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const result =
        await submissionService.getSubmissionByStudentIdAndAssignmentId(
          user.userId,
          id
        );

      if (result) {
        setSubmissions(Array.isArray(result) ? result : result ? [result] : []);
        console.log("Submitsion", submissions);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      console.error("Error loading submissions:", error);
      setSubmissions([]);
    }
  };

  useEffect(() => {
    fetchAssignmentDetail();
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAssignmentDetail(), fetchSubmissions()]);
    setRefreshing(false);
    showToast("Đã làm mới dữ liệu", "success");
  };

  const handleStartAssignment = () => {
    if (assignment.type === "QUIZ") {
      // Navigate to quiz screen
      navigate(`/student/assignment/${id}/quiz`, {
        state: { assignment },
      });
    } else {
      // Navigate to essay submission screen
      navigate(`/student/assignment/${id}/submit`, {
        state: { assignment },
      });
    }
  };

  const handleViewSubmission = (submission) => {
    navigate(`/student/assignment/${id}/result/${submission.submissionId}`, {
      state: { submission, assignment },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Không tìm thấy bài tập
          </p>
          <button
            onClick={() => navigate("/student/assignments")}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;
  const isUrgent = daysLeft >= 0 && daysLeft <= 3;
  const hasSubmitted = submissions.length > 0;

  const submissionLimit = assignment.submissionLimit || null;
  const remainingAttempts = submissionLimit
    ? Math.max(submissionLimit - submissions.length, 0)
    : "Không giới hạn";

  const canSubmit =
    (!isOverdue || assignment.allowLateSubmission) &&
    (submissionLimit === null || submissions.length < submissionLimit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/student/assignments")}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Assignment Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border-t-4 border-green-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {assignment.title}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {assignment.description || "Không có mô tả"}
              </p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                  {assignment.classSubject.subject?.name || "Không rõ môn"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    assignment.type === "QUIZ"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  }`}
                >
                  {assignment.type === "QUIZ" ? "Trắc nghiệm" : "Tự luận"}
                </span>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-lg text-center ${
                hasSubmitted
                  ? "bg-green-100 dark:bg-green-900/30"
                  : isOverdue
                  ? "bg-red-100 dark:bg-red-900/30"
                  : isUrgent
                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                  : "bg-blue-100 dark:bg-blue-900/30"
              }`}
            >
              {hasSubmitted ? (
                <CheckCircle
                  className={`w-8 h-8 mx-auto mb-1 text-green-600 dark:text-green-400`}
                />
              ) : isOverdue ? (
                <AlertCircle
                  className={`w-8 h-8 mx-auto mb-1 text-red-600 dark:text-red-400`}
                />
              ) : (
                <Clock
                  className={`w-8 h-8 mx-auto mb-1 ${
                    isUrgent
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                />
              )}
              <p
                className={`text-sm font-semibold ${
                  hasSubmitted
                    ? "text-green-700 dark:text-green-400"
                    : isOverdue
                    ? "text-red-700 dark:text-red-400"
                    : isUrgent
                    ? "text-yellow-700 dark:text-yellow-400"
                    : "text-blue-700 dark:text-blue-400"
                }`}
              >
                {hasSubmitted
                  ? "Đã nộp"
                  : isOverdue
                  ? "Quá hạn"
                  : isUrgent
                  ? "Gấp"
                  : `Còn ${daysLeft} ngày`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Hạn nộp
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {dueDate.toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Số lần nộp còn lại
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {remainingAttempts}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Điểm tối đa
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {assignment.maxScore || 10} điểm
                </p>
              </div>
            </div>
          </div>

          {/* Attachment */}
          {assignment.attachmentUrl && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Tài liệu đính kèm
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Click để tải xuống
                    </p>
                  </div>
                </div>
                <a
                  href={assignment.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Download className="w-4 h-4" />
                  Tải xuống
                </a>
              </div>
            </div>
          )}

          {/* Action Button */}
          {canSubmit && (
            <button
              onClick={handleStartAssignment}
              className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow-lg hover:shadow-xl font-semibold"
            >
              <Upload className="w-5 h-5" />
              {hasSubmitted ? "Nộp bài lại" : "Làm bài ngay"}
            </button>
          )}

          {!canSubmit && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Không thể nộp bài
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {isOverdue && !assignment.allowLateSubmission
                    ? "Bài tập đã quá hạn nộp"
                    : "Bạn đã hết số lần nộp bài cho phép"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submissions History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            Bài nộp của bạn ({submissions.length})
          </h2>

          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Chưa có bài nộp nào
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Hãy làm bài tập để nộp lần đầu tiên
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission, index) => (
                <div
                  key={submission.submissionId}
                  className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-bold">
                          LẦN {submissions.length - index}
                        </span>
                        {submission.score !== null &&
                          submission.score !== undefined && (
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {submission.score}/{assignment.maxScore || 10}
                            </span>
                          )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>
                          Nộp lúc:{" "}
                          {new Date(submission.submittedAt).toLocaleString(
                            "vi-VN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      {submission.feedback && (
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 italic">
                          Nhận xét: {submission.feedback}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleViewSubmission(submission)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignmentDetail;
