import React, { useState, useEffect, useContext } from "react";
import {
  Users,
  TrendingUp,
  Award,
  Target,
  AlertCircle,
  BookOpen,
  Eye,
} from "lucide-react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import analyticsService from "../../services/analyticsService";
import TrendIndicator from "./TrendIndicator";
import ClassDetailModal from "./ClassDetailModal";
import StudentPerformanceModal from "./StudentPerformanceModal";

const TeacherAnalytics = ({ teacherId }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("🔍 Loading teacher analytics for teacher:", teacherId);

        const data = await analyticsService.getTeacherOverview(teacherId);
        console.log("✅ Teacher analytics loaded:", data);

        setOverview(data);
      } catch (error) {
        console.error("❌ Error loading teacher analytics:", error);
        // Chỉ hiển thị toast nếu không phải connection refused
        if (
          !error.message?.includes("Network Error") &&
          !error.message?.includes("ERR_CONNECTION_REFUSED")
        ) {
          showToast("Không thể tải dữ liệu thống kê", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [teacherId, showToast]);

  const handleViewClass = (classData) => {
    setSelectedClass(classData);
  };

  const handleViewStudent = (studentData) => {
    setSelectedStudent(studentData);
  };

  if (loading) {
    return (
      <div
        className={`p-6 rounded-lg ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } shadow`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div
        className={`p-6 rounded-lg ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } shadow`}
      >
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle className="w-5 h-5" />
          <span>Không có dữ liệu thống kê</span>
        </div>
      </div>
    );
  }

  const { teacherInfo, overallPerformance, classes } = overview;

  return (
    <div
      className={`p-6 rounded-lg ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
      } shadow space-y-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Thống kê giảng dạy</h2>
          <p
            className={`mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            Môn: {teacherInfo?.subject || "N/A"}
          </p>
        </div>
        <BookOpen className="w-8 h-8 text-blue-500" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-700 border-gray-600"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Tổng học sinh
              </p>
              <p className="text-2xl font-bold mt-1">
                {teacherInfo?.totalStudents || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Average Score */}
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-700 border-gray-600"
              : "bg-green-50 border-green-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Điểm trung bình
              </p>
              <p className="text-2xl font-bold mt-1">
                {overallPerformance?.avgScore?.toFixed(1) || "0.0"}
              </p>
              {overallPerformance?.comparisonToSchool?.avgScoreDiff && (
                <p
                  className={`text-xs mt-1 ${
                    overallPerformance.comparisonToSchool.avgScoreDiff > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {overallPerformance.comparisonToSchool.avgScoreDiff > 0
                    ? "+"
                    : ""}
                  {overallPerformance.comparisonToSchool.avgScoreDiff.toFixed(
                    1
                  )}{" "}
                  so với TB trường
                </p>
              )}
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Pass Rate */}
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-700 border-gray-600"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Tỷ lệ đạt
              </p>
              <p className="text-2xl font-bold mt-1">
                {overallPerformance?.passRate?.toFixed(1) || "0.0"}%
              </p>
              {overallPerformance?.comparisonToSchool?.passRateDiff && (
                <p
                  className={`text-xs mt-1 ${
                    overallPerformance.comparisonToSchool.passRateDiff > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {overallPerformance.comparisonToSchool.passRateDiff > 0
                    ? "+"
                    : ""}
                  {overallPerformance.comparisonToSchool.passRateDiff.toFixed(
                    1
                  )}
                  % so với TB trường
                </p>
              )}
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        {/* Excellence Rate */}
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-700 border-gray-600"
              : "bg-purple-50 border-purple-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Tỷ lệ giỏi
              </p>
              <p className="text-2xl font-bold mt-1">
                {overallPerformance?.excellentRate?.toFixed(1) || "0.0"}%
              </p>
              {overallPerformance?.comparisonToSchool?.excellentRateDiff && (
                <p
                  className={`text-xs mt-1 ${
                    overallPerformance.comparisonToSchool.excellentRateDiff > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {overallPerformance.comparisonToSchool.excellentRateDiff > 0
                    ? "+"
                    : ""}
                  {overallPerformance.comparisonToSchool.excellentRateDiff.toFixed(
                    1
                  )}
                  % so với TB trường
                </p>
              )}
            </div>
            <Award className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Danh sách lớp học</h3>
        <div className="overflow-x-auto">
          <table
            className={`min-w-full ${
              isDarkMode ? "bg-gray-700" : "bg-white"
            } border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
          >
            <thead className={isDarkMode ? "bg-gray-600" : "bg-gray-100"}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Lớp
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Khối
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Sĩ số
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  ĐTB
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Tỷ lệ đạt
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Tỷ lệ giỏi
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Xu hướng
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {classes && classes.length > 0 ? (
                classes.map((cls) => (
                  <tr
                    key={cls.classId}
                    className={`hover:bg-opacity-50 ${
                      isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      {cls.className}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {cls.gradeLevel == "GRADE_10"
                        ? "10"
                        : cls.gradeLevel == "GRADE_11"
                        ? "11"
                        : cls.gradeLevel == "GRADE_12"
                        ? "12"
                        : ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {cls.studentCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold">
                      {cls.avgScore?.toFixed(1) || "0.0"}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {cls.passRate?.toFixed(1) || "0.0"}%
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {cls.excellentRate?.toFixed(1) || "0.0"}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TrendIndicator trend={cls.trend} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewClass(cls)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Không có dữ liệu lớp học
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedClass && (
        <ClassDetailModal
          classData={selectedClass}
          teacherId={teacherId}
          onClose={() => setSelectedClass(null)}
          onViewStudent={handleViewStudent}
        />
      )}

      {selectedStudent && (
        <StudentPerformanceModal
          studentId={selectedStudent.studentId}
          teacherId={teacherId}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default TeacherAnalytics;
