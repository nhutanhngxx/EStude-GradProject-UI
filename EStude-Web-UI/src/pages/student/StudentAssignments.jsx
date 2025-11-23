import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Search,
} from "lucide-react";
import assignmentService from "../../services/assignmentService";
import { useToast } from "../../contexts/ToastContext";

const AssignmentCard = ({ assignment, onClick }) => {
  const daysLeft = Math.ceil(
    (new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = daysLeft < 0;
  const isUrgent = daysLeft >= 0 && daysLeft <= 3;
  const isCompleted = assignment.isCompleted;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-l-4 ${
        isCompleted
          ? "border-green-500"
          : isOverdue
          ? "border-red-500"
          : isUrgent
          ? "border-yellow-500"
          : "border-blue-500"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {assignment.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {assignment.subject?.name || "Không rõ môn"}
          </p>
        </div>
        {isCompleted ? (
          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
        ) : isOverdue ? (
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        ) : (
          <Clock className="w-6 h-6 text-blue-500 flex-shrink-0" />
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          Hạn: {new Date(assignment.dueDate).toLocaleDateString("vi-VN")}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isCompleted
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : isOverdue
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : isUrgent
              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          }`}
        >
          {isCompleted
            ? "Đã nộp"
            : isOverdue
            ? "Quá hạn"
            : isUrgent
            ? "Gấp"
            : `Còn ${daysLeft} ngày`}
        </span>
      </div>

      {assignment.score !== null && assignment.score !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Điểm:
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {assignment.score}/{assignment.maxScore || 10}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentAssignments = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); // all, pending, completed, overdue
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getStudentAssignments(user.userId);
      console.log("📚 Assignments Response:", data);
      console.log("📚 First Assignment:", data?.[0]);
      console.log("📚 First Assignment Subject:", data?.[0]?.subject);
      console.log(
        "📚 First Assignment Subject Name:",
        data?.[0]?.subject?.name
      );

      if (Array.isArray(data)) {
        setAssignments(
          data.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        );
      }
    } catch (error) {
      console.error("Error loading assignments:", error);
      showToast("Lỗi khi tải danh sách bài tập!", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = dueDate < now && !assignment.isCompleted;

    // Status filter
    if (filterStatus === "completed" && !assignment.isCompleted) return false;
    if (filterStatus === "pending" && assignment.isCompleted) return false;
    if (filterStatus === "overdue" && !isOverdue) return false;

    // Search filter
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      return (
        assignment.title.toLowerCase().includes(keyword) ||
        assignment.subject?.name?.toLowerCase().includes(keyword)
      );
    }

    return true;
  });

  const stats = {
    total: assignments.length,
    completed: assignments.filter((a) => a.isCompleted).length,
    pending: assignments.filter(
      (a) => !a.isCompleted && new Date(a.dueDate) >= new Date()
    ).length,
    overdue: assignments.filter(
      (a) => !a.isCompleted && new Date(a.dueDate) < new Date()
    ).length,
  };

  if (loading) {
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Bài tập của tôi
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Quản lý và hoàn thành các bài tập được giao
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Tổng số bài tập
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.total}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Đã hoàn thành
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.completed}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Chưa nộp
          </p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.pending}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Quá hạn
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.overdue}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài tập..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chưa nộp</option>
            <option value="completed">Đã nộp</option>
            <option value="overdue">Quá hạn</option>
          </select>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.assignmentId}
              assignment={assignment}
              onClick={() =>
                navigate(`/student/assignments/${assignment.assignmentId}`)
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Không tìm thấy bài tập nào
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
