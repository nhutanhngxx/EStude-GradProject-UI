import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Award,
  Target,
  Users,
} from "lucide-react";
import assignmentService from "../../services/assignmentService";
import attendanceService from "../../services/attendanceService";
import scheduleService from "../../services/scheduleService";
import aiService from "../../services/aiService";
import studentStudyService from "../../services/studentStudyService";
import classSubjectService from "../../services/classSubjectService";
import { useToast } from "../../contexts/ToastContext";

const StatCard = ({ icon: Icon, title, value, subtitle, color, onClick }) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow ${
      onClick ? "cursor-pointer" : ""
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
          {title}
        </p>
        <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div className={`p-2 sm:p-3 rounded-full ${color} flex-shrink-0 ml-2`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    </div>
  </div>
);

const AssignmentCard = ({ assignment, onClick }) => {
  const daysLeft = Math.ceil(
    (new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = daysLeft < 0;
  const isUrgent = daysLeft >= 0 && daysLeft <= 3;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
          {assignment.title}
        </h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            isOverdue
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : isUrgent
              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          }`}
        >
          {isOverdue ? "Quá hạn" : isUrgent ? "Gấp" : `${daysLeft} ngày`}
        </span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        {assignment.subject?.name ||
          assignment.classSubject?.subject?.name ||
          "Không rõ môn"}
      </p>
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
        <Clock className="w-3 h-3 mr-1" />
        Hạn: {new Date(assignment.dueDate).toLocaleDateString("vi-VN")}
      </div>
    </div>
  );
};

const ScheduleItem = ({ schedule }) => (
  <div className="flex items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2">
    <div className="mr-3 flex-shrink-0">
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">Tiết</p>
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {schedule.period}
        </p>
      </div>
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {schedule.subject?.name || "Không rõ"}
      </h4>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        {schedule.teacher?.fullName || "Chưa có giáo viên"}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {schedule.room || "Chưa có phòng"}
      </p>
    </div>
  </div>
);

const StudentDashboard = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    attendanceRate: 0,
    averageScore: 0,
  });
  const [overview, setOverview] = useState(null);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [competencyOverview, setCompetencyOverview] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    console.log("🔄 Starting fetchDashboardData...");
    setLoading(true);

    // Fetch assignments - Giống App
    try {
      console.log("📚 Fetching assignments for user:", user.userId);
      const assignments = await assignmentService.getStudentAssignments(
        user.userId
      );
      if (Array.isArray(assignments) && assignments.length > 0) {
        const sorted = assignments.sort(
          (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
        );

        // Lấy chi tiết assignment giống App
        const detailedAssignments = await Promise.all(
          sorted.slice(0, 6).map(async (a) => {
            try {
              const detail = await assignmentService.getAssignmentById(
                a.assignmentId
              );

              const classSubject = detail?.data?.classSubject || {};
              const teacherName =
                classSubject?.teacher?.fullName ||
                detail?.data?.teacher?.fullName ||
                "Chưa rõ";

              const subjectInfo = {
                classSubjectId:
                  classSubject?.classSubjectId || a.classSubjectId || null,
                classId: classSubject?.classId || a.classId || null,
                className: classSubject?.className || a.className || "Chưa rõ",
                name: classSubject?.subject?.name || "Không rõ",
                semester: classSubject?.semester || "HK1 2025 - 2026",
                teacherName,
                description: `${classSubject?.subject?.name || "Không rõ"} - ${
                  classSubject?.className || "Không rõ"
                }`,
              };

              return {
                ...a,
                teacherName,
                subject: subjectInfo,
              };
            } catch (error) {
              console.warn(
                `Không lấy được chi tiết của assignment ${a.assignmentId}`
              );
              return {
                ...a,
                teacherName: "Chưa rõ",
                subject: {
                  classSubjectId: a.classSubjectId || null,
                  classId: a.classId || null,
                  className: a.className || "Không rõ",
                  name: "Không rõ",
                  semester: "HK1 2025 - 2026",
                  teacherName: "Chưa rõ",
                  description: "Không rõ - Không rõ",
                },
              };
            }
          })
        );

        setRecentAssignments(detailedAssignments);

        const completed = assignments.filter((a) => a.isCompleted).length;
        setStats((prev) => ({
          ...prev,
          totalAssignments: assignments.length,
          completedAssignments: completed,
        }));
      } else {
        setRecentAssignments([]);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setRecentAssignments([]);
    }

    // Fetch attendance - Giống App
    try {
      const subjectsData =
        await classSubjectService.getClassSubjectsByStudentWithDetails({
          studentId: user.userId,
        });
      const subjectsWithSessions = await Promise.all(
        subjectsData.map(async (subject) => {
          const sessions =
            await attendanceService.getAttendanceSessionByClassSubjectForStudent(
              subject.classSubjectId,
              user.userId
            );
          return { ...subject, sessions: sessions || [] };
        })
      );

      const totalPresent = subjectsWithSessions.reduce(
        (sum, s) =>
          sum + s.sessions.filter((sess) => sess.status === "PRESENT").length,
        0
      );
      const totalSessionsCount = subjectsWithSessions.reduce(
        (sum, s) => sum + s.sessions.length,
        0
      );
      const percent = totalSessionsCount
        ? Math.round((totalPresent / totalSessionsCount) * 100)
        : 0;

      setStats((prev) => ({
        ...prev,
        attendanceRate: percent,
      }));
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }

    // Fetch overview - Giống App
    try {
      const overviewData = await studentStudyService.getAcademicRecords(
        user.userId
      );
      if (overviewData) {
        setOverview({
          gpa: overviewData.averageScore ?? 0,
          rank: overviewData.rank ?? "-",
          totalStudents: overviewData.totalStudents ?? "-",
          passedCredits: overviewData.completedSubjects ?? 0,
          requiredCredits: overviewData.totalSubjects ?? 0,
          submissionRate: overviewData.submissionRate ?? 0,
          attendanceRate: overviewData.attendanceRate ?? 0,
        });

        setStats((prev) => ({
          ...prev,
          averageScore: overviewData.averageScore ?? 0,
        }));
      }
    } catch (err) {
      console.error("Load overview failed:", err);
    }

    // Fetch today's schedule - Giống App
    try {
      const schedules = await scheduleService.getSchedulesByStudent(
        user.userId
      );

      if (Array.isArray(schedules) && schedules.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const todaySchedules = schedules.filter((s) => s.date === today);

        const formatted = todaySchedules.map((s) => ({
          id: s.scheduleId,
          subject: {
            name: s.classSubject?.subjectName || "Không rõ",
          },
          teacher: {
            fullName: s.classSubject?.teacher?.fullName || "Chưa có giáo viên",
          },
          period: `${s.startPeriod}${
            s.endPeriod && s.endPeriod !== s.startPeriod
              ? `-${s.endPeriod}`
              : ""
          }`,
          room: s.room || "Không rõ",
          status:
            s.status === "SCHEDULED"
              ? "upcoming"
              : s.status === "ONGOING"
              ? "in_progress"
              : "done",
        }));

        setTodaySchedule(formatted);
      } else {
        setTodaySchedule([]);
      }
    } catch (err) {
      console.error("Error fetching schedule:", err);
      setTodaySchedule([]); // Set empty on error
    }

    // Fetch competency data (if available)
    try {
      const competency = await aiService.getCompetencyMap(user.userId);
      if (competency) {
        setCompetencyOverview(competency);
      }
    } catch (err) {
      console.error("Error fetching competency:", err);
      setCompetencyOverview(null); // Set null on error
    }

    console.log("✅ Finished fetchDashboardData, setting loading to false");
    setLoading(false);
  };

  console.log("🎨 Rendering StudentDashboard, loading:", loading);

  if (loading) {
    console.log("⏳ Showing loading spinner");
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  console.log("✨ Rendering main dashboard content");
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Xin chào, {user.fullName || "Học sinh"}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Đây là tổng quan về quá trình học tập của bạn
        </p>
      </div>

      {/* Academic Overview - Giống App */}
      {overview && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Tổng quan học tập
            </h2>
            <button
              onClick={() => (window.location.href = "/student/detail-study")}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Xem chi tiết
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                GPA
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {overview.gpa.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Xếp hạng
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {overview.rank}/{overview.totalStudents}
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Môn hoàn thành
              </p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {overview.passedCredits}/{overview.requiredCredits}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Tỷ lệ nộp bài
              </p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {overview.submissionRate}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={FileText}
          title="Bài tập"
          value={`${stats.completedAssignments}/${stats.totalAssignments}`}
          subtitle={`${
            stats.totalAssignments > 0
              ? Math.round(
                  (stats.completedAssignments / stats.totalAssignments) * 100
                )
              : 0
          }% hoàn thành`}
          color="bg-blue-500"
          onClick={() => (window.location.href = "/student/assignments")}
        />
        <StatCard
          icon={CheckCircle}
          title="Điểm danh"
          value={`${stats.attendanceRate}%`}
          subtitle="Tỷ lệ có mặt"
          color="bg-green-500"
        />
        <StatCard
          icon={Award}
          title="Điểm trung bình"
          value={stats.averageScore ? stats.averageScore.toFixed(2) : "N/A"}
          subtitle="Tất cả môn học"
          color="bg-yellow-500"
          onClick={() => (window.location.href = "/student/statistics")}
        />
        <StatCard
          icon={BookOpen}
          title="Lịch học hôm nay"
          value={todaySchedule.length}
          subtitle={todaySchedule.length > 0 ? "tiết học" : "Không có lịch"}
          color="bg-purple-500"
          onClick={() => (window.location.href = "/student/schedule")}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assignments */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Bài tập gần đây
              </h2>
              <button
                onClick={() => (window.location.href = "/student/assignments")}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Xem tất cả
              </button>
            </div>
            {recentAssignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.assignmentId}
                    assignment={assignment}
                    onClick={() =>
                      navigate(
                        `/student/assignments/${assignment.assignmentId}`
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Chưa có bài tập nào
              </p>
            )}
          </div>
        </div>

        {/* Today's Schedule */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Lịch học hôm nay
              </h2>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            {todaySchedule.length > 0 ? (
              <div className="space-y-2">
                {todaySchedule.map((schedule, index) => (
                  <ScheduleItem key={index} schedule={schedule} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Không có lịch học hôm nay
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Competency Overview */}
      {competencyOverview && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Tổng quan năng lực
            </h2>
            <button
              onClick={() => (window.location.href = "/student/competency-map")}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Xem chi tiết
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Add competency stats here based on AI data */}
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Điểm mạnh
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {competencyOverview.strengths?.length || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cần cải thiện
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {competencyOverview.weaknesses?.length || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Award className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tiến bộ
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {competencyOverview.progress || 0}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
