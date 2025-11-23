import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import subjectGradeService from "../../services/subjectGradeService";
import attendanceService from "../../services/attendanceService";
import assignmentService from "../../services/assignmentService";
import classSubjectService from "../../services/classSubjectService";

const StudentSubjectDetail = () => {
  const { classSubjectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [activeTab, setActiveTab] = useState("Điểm");
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState(null);
  const [grade, setGrade] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const tabs = ["Điểm", "Điểm danh", "Bài tập"];

  const fetchSubjectDetail = useCallback(async () => {
    try {
      setLoading(true);
      // Lấy thông tin môn học
      const studentSubjects =
        await classSubjectService.getClassSubjectsByStudent(user.userId);
      const subjectData = studentSubjects.find(
        (s) => s.classSubjectId === parseInt(classSubjectId)
      );

      if (subjectData) {
        setSubject({
          classSubjectId: subjectData.classSubjectId,
          name: subjectData.subjectName,
          className: subjectData.className,
          teacherName: subjectData.teacherName,
          semester: subjectData.termName,
          beginDate: subjectData.beginDate,
          endDate: subjectData.endDate,
        });
      }
    } catch (error) {
      console.error("Error fetching subject:", error);
      showToast("Lỗi khi tải thông tin môn học!", "error");
    } finally {
      setLoading(false);
    }
  }, [classSubjectId, user.userId, showToast]);

  const loadGrades = async () => {
    try {
      const res = await subjectGradeService.getGradesOfStudentByClassSubject(
        user.userId,
        parseInt(classSubjectId)
      );
      setGrade(res);
    } catch (error) {
      console.error("Error loading grades:", error);
      setGrade(null);
    }
  };

  const loadAttendance = async () => {
    try {
      const res =
        await attendanceService.getAttentanceSessionByClassSubjectForStudent(
          parseInt(classSubjectId),
          user.userId
        );
      setAttendance(res || []);
    } catch (error) {
      console.error("Error loading attendance:", error);
      setAttendance([]);
    }
  };

  const loadAssignments = async () => {
    try {
      const allAssignments = await assignmentService.getStudentAssignments(
        user.userId
      );
      const filtered = allAssignments.filter(
        (a) => a.classSubjectId === parseInt(classSubjectId)
      );

      // Lấy chi tiết từng assignment
      const detailedAssignments = await Promise.all(
        filtered.map(async (a) => {
          try {
            const detail = await assignmentService.getAssignmentById(
              a.assignmentId
            );
            return {
              ...a,
              title: detail?.data?.title || a.title || "Không có tiêu đề",
              description: detail?.data?.description || "",
            };
          } catch {
            return a;
          }
        })
      );

      setAssignments(detailedAssignments);
    } catch (error) {
      console.error("Error loading assignments:", error);
      setAssignments([]);
    }
  };

  const loadTabData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === "Điểm") {
        await loadGrades();
      } else if (activeTab === "Điểm danh") {
        await loadAttendance();
      } else if (activeTab === "Bài tập") {
        await loadAssignments();
      }
    } catch (error) {
      console.error("Error loading tab data:", error);
      showToast("Lỗi khi tải dữ liệu!", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, classSubjectId, user.userId, showToast]);

  useEffect(() => {
    fetchSubjectDetail();
  }, [fetchSubjectDetail]);

  useEffect(() => {
    if (subject) {
      loadTabData();
    }
  }, [subject, loadTabData]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PRESENT: {
        label: "Có mặt",
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        icon: CheckCircle,
      },
      ABSENT: {
        label: "Vắng",
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        icon: XCircle,
      },
      LATE: {
        label: "Trễ",
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: AlertCircle,
      },
    };

    const config = statusMap[status] || {
      label: "Chưa điểm danh",
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      icon: Clock,
    };

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.className}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (loading && !subject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {subject?.name}
            </h1>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>Giáo viên: {subject?.teacherName}</p>
              <p>Lớp: {subject?.className}</p>
              <p>{subject?.semester}</p>
              <p>
                Thời gian: {formatDate(subject?.beginDate)} -{" "}
                {formatDate(subject?.endDate)}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/student/subjects")}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Điểm Tab */}
              {activeTab === "Điểm" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100 dark:bg-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Loại điểm
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Điểm số
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {(grade?.regularScores || ["-", "-", "-"]).map(
                          (score, idx) => (
                            <tr key={`reg-${idx}`}>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                Thường kỳ {idx + 1}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-green-600 dark:text-green-400">
                                {score || "-"}
                              </td>
                            </tr>
                          )
                        )}
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            Giữa kỳ
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600 dark:text-green-400">
                            {grade?.midtermScore || "-"}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            Cuối kỳ
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600 dark:text-green-400">
                            {grade?.finalScore || "-"}
                          </td>
                        </tr>
                        <tr className="bg-gray-100 dark:bg-gray-600">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Điểm trung bình
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-blue-600 dark:text-blue-400">
                            {grade?.actualAverage || "-"}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            Xếp loại
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                            {grade?.rank || "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Điểm danh Tab */}
              {activeTab === "Điểm danh" && (
                <div className="space-y-3">
                  {attendance.length > 0 ? (
                    [...attendance]
                      .sort(
                        (a, b) =>
                          new Date(b.startTime).getTime() -
                          new Date(a.startTime).getTime()
                      )
                      .map((session) => (
                        <div
                          key={session.sessionId}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                              {session.sessionName}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Bắt đầu: {formatDateTime(session.startTime)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Kết thúc: {formatDateTime(session.endTime)}
                            </p>
                          </div>
                          <div>{getStatusBadge(session.status)}</div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Chưa có phiên điểm danh nào
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Bài tập Tab */}
              {activeTab === "Bài tập" && (
                <div className="space-y-3">
                  {assignments.length > 0 ? (
                    [...assignments]
                      .sort(
                        (a, b) =>
                          new Date(b.dueDate).getTime() -
                          new Date(a.dueDate).getTime()
                      )
                      .map((assignment) => {
                        const dueDate = new Date(assignment.dueDate);
                        const now = new Date();
                        const isOverdue =
                          dueDate < now && !assignment.isCompleted;

                        return (
                          <div
                            key={assignment.assignmentId}
                            onClick={() =>
                              navigate(
                                `/student/assignments/${assignment.assignmentId}`
                              )
                            }
                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                  {assignment.title}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                  Hạn nộp: {formatDateTime(assignment.dueDate)}
                                </p>
                                {assignment.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {assignment.description}
                                  </p>
                                )}
                              </div>
                              <div className="ml-4">
                                {assignment.isCompleted ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    <CheckCircle className="w-3 h-3" />
                                    Đã nộp
                                  </span>
                                ) : isOverdue ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    <XCircle className="w-3 h-3" />
                                    Quá hạn
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    <Clock className="w-3 h-3" />
                                    Chưa nộp
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Chưa có bài tập nào
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentSubjectDetail;
