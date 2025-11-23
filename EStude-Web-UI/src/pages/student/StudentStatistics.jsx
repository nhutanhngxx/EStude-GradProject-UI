import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  Calendar,
  BookOpen,
  Target,
  Clock,
  CheckCircle,
} from "lucide-react";
import aiService from "../../services/aiService";
import assignmentService from "../../services/assignmentService";
import attendanceService from "../../services/attendanceService";
import studentStudyService from "../../services/studentStudyService";
import classSubjectService from "../../services/classSubjectService";
import { useToast } from "../../contexts/ToastContext";

const StudentStatistics = () => {
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState("month"); // week, month, semester, year
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      const [assignments, competency, overview] = await Promise.all([
        assignmentService.getStudentAssignments(user.userId),
        aiService.getCompetencyMap(user.userId),
        studentStudyService.getAcademicRecords(user.userId),
      ]);

      // Fetch attendance giống App
      let attendanceData = { total: 0, present: 0, absent: 0, late: 0 };
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
        const totalAbsent = subjectsWithSessions.reduce(
          (sum, s) =>
            sum + s.sessions.filter((sess) => sess.status === "ABSENT").length,
          0
        );
        const totalLate = subjectsWithSessions.reduce(
          (sum, s) =>
            sum + s.sessions.filter((sess) => sess.status === "LATE").length,
          0
        );
        const totalSessionsCount = subjectsWithSessions.reduce(
          (sum, s) => sum + s.sessions.length,
          0
        );

        attendanceData = {
          total: totalSessionsCount,
          present: totalPresent,
          absent: totalAbsent,
          late: totalLate,
          rate: totalSessionsCount
            ? (totalPresent / totalSessionsCount) * 100
            : 0,
        };
      } catch (err) {
        console.error("Error fetching attendance:", err);
      }

      // Process data
      const now = new Date();
      const filterDate = getFilterDate(now, timeRange);

      const filteredAssignments = Array.isArray(assignments)
        ? assignments.filter(
            (a) => new Date(a.createdAt || a.dueDate) >= filterDate
          )
        : [];

      const completedAssignments = filteredAssignments.filter(
        (a) => a.isCompleted
      );
      const totalScore = completedAssignments.reduce(
        (sum, a) => sum + (a.score || 0),
        0
      );
      const avgScore =
        completedAssignments.length > 0
          ? totalScore / completedAssignments.length
          : overview?.averageScore || 0;

      setStats({
        assignments: {
          total: filteredAssignments.length,
          completed: completedAssignments.length,
          pending: filteredAssignments.filter(
            (a) => !a.isCompleted && new Date(a.dueDate) > now
          ).length,
          overdue: filteredAssignments.filter(
            (a) => !a.isCompleted && new Date(a.dueDate) <= now
          ).length,
          avgScore: avgScore,
        },
        attendance: attendanceData,
        competency: competency,
        timeRange: timeRange,
      });
    } catch (error) {
      console.error("Error loading statistics:", error);
      showToast("Lỗi khi tải thống kê!", "error");
    } finally {
      setLoading(false);
    }
  };

  const getFilterDate = (now, range) => {
    const date = new Date(now);
    switch (range) {
      case "week":
        date.setDate(date.getDate() - 7);
        break;
      case "month":
        date.setMonth(date.getMonth() - 1);
        break;
      case "semester":
        date.setMonth(date.getMonth() - 6);
        break;
      case "year":
        date.setFullYear(date.getFullYear() - 1);
        break;
      default:
        date.setMonth(date.getMonth() - 1);
    }
    return date;
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, bgColor }) => (
    <div className={`${bgColor} rounded-lg shadow p-6`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </span>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <p className={`text-3xl font-bold ${color} mb-1`}>{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  );

  const ProgressBar = ({ label, value, max, color }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {value}/{max} ({Math.round(percentage)}%)
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Đang tải thống kê...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
            Thống kê học tập
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Theo dõi tiến độ và kết quả học tập của bạn
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTimeRange("week")}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              timeRange === "week"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Tuần
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              timeRange === "month"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Tháng
          </button>
          <button
            onClick={() => setTimeRange("semester")}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              timeRange === "semester"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Học kỳ
          </button>
          <button
            onClick={() => setTimeRange("year")}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              timeRange === "year"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Năm
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* Assignment stats */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Thống kê bài tập
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                title="Tổng bài tập"
                value={stats.assignments.total}
                icon={BookOpen}
                color="text-blue-600 dark:text-blue-400"
                bgColor="bg-white dark:bg-gray-800"
              />
              <StatCard
                title="Đã hoàn thành"
                value={stats.assignments.completed}
                icon={CheckCircle}
                color="text-green-600 dark:text-green-400"
                bgColor="bg-white dark:bg-gray-800"
              />
              <StatCard
                title="Đang làm"
                value={stats.assignments.pending}
                icon={Clock}
                color="text-yellow-600 dark:text-yellow-400"
                bgColor="bg-white dark:bg-gray-800"
              />
              <StatCard
                title="Quá hạn"
                value={stats.assignments.overdue}
                icon={Calendar}
                color="text-red-600 dark:text-red-400"
                bgColor="bg-white dark:bg-gray-800"
              />
              <StatCard
                title="Điểm TB"
                value={stats.assignments.avgScore.toFixed(1)}
                subtitle="/ 10 điểm"
                icon={Award}
                color="text-purple-600 dark:text-purple-400"
                bgColor="bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Assignment progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Tiến độ bài tập
            </h3>
            <ProgressBar
              label="Hoàn thành"
              value={stats.assignments.completed}
              max={stats.assignments.total}
              color="bg-green-500"
            />
            <ProgressBar
              label="Đang làm"
              value={stats.assignments.pending}
              max={stats.assignments.total}
              color="bg-yellow-500"
            />
            <ProgressBar
              label="Quá hạn"
              value={stats.assignments.overdue}
              max={stats.assignments.total}
              color="bg-red-500"
            />
          </div>

          {/* Attendance stats */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Thống kê điểm danh
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Tổng buổi học"
                value={stats.attendance.total}
                icon={Calendar}
                color="text-blue-600 dark:text-blue-400"
                bgColor="bg-white dark:bg-gray-800"
              />
              <StatCard
                title="Có mặt"
                value={stats.attendance.present}
                icon={CheckCircle}
                color="text-green-600 dark:text-green-400"
                bgColor="bg-white dark:bg-gray-800"
              />
              <StatCard
                title="Vắng mặt"
                value={stats.attendance.absent}
                icon={Target}
                color="text-red-600 dark:text-red-400"
                bgColor="bg-white dark:bg-gray-800"
              />
              <StatCard
                title="Tỷ lệ điểm danh"
                value={`${stats.attendance.rate.toFixed(1)}%`}
                icon={TrendingUp}
                color="text-purple-600 dark:text-purple-400"
                bgColor="bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Attendance chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Phân bố điểm danh
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-full h-32 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {stats.attendance.present}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Có mặt
                </p>
              </div>
              <div className="text-center">
                <div className="w-full h-32 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-4xl font-bold text-red-600 dark:text-red-400">
                    {stats.attendance.absent}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vắng mặt
                </p>
              </div>
              <div className="text-center">
                <div className="w-full h-32 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.attendance.late}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Đi muộn
                </p>
              </div>
            </div>
          </div>

          {/* Competency overview */}
          {stats.competency && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Tổng quan năng lực
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Điểm TB
                  </p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.competency.averageScore || 0}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Chủ đề hoàn thành
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.competency.completedTopics || 0}/
                    {stats.competency.totalTopics || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Điểm mạnh
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {stats.competency.strengths?.length || 0}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={() =>
                    (window.location.href = "/student/competency-map")
                  }
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Xem chi tiết bản đồ năng lực
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentStatistics;
