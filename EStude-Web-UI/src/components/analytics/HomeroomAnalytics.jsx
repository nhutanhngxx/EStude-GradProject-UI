import React, { useState, useEffect, useContext } from "react";
import {
  Users,
  TrendingUp,
  Award,
  Target,
  AlertCircle,
  School,
  Eye,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import analyticsService from "../../services/analyticsService";
import HomeroomStudentModal from "./HomeroomStudentModal";
import SubjectPerformanceChart from "./SubjectPerformanceChart";

const HomeroomAnalytics = ({ classId, teacherId }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadHomeroomAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, teacherId]);

  const loadHomeroomAnalytics = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading homeroom analytics for class:", classId);

      const data = await analyticsService.getHomeroomClassOverview(
        classId,
        teacherId
      );
      console.log("✅ Homeroom analytics loaded:", data);

      setOverview(data);
    } catch (error) {
      console.error("❌ Error loading homeroom analytics:", error);
      // Chỉ hiển thị toast nếu không phải connection refused
      if (
        !error.message?.includes("Network Error") &&
        !error.message?.includes("ERR_CONNECTION_REFUSED")
      ) {
        showToast("Không thể tải dữ liệu thống kê lớp chủ nhiệm", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
  };

  if (loading) {
    return (
      <div
        className={`p-6 rounded-lg ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } shadow`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
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
          <span>Không có dữ liệu thống kê lớp chủ nhiệm</span>
        </div>
      </div>
    );
  }

  const {
    class_name: className,
    grade_level: gradeLevel,
    homeroom_teacher: homeroomTeacher,
    student_count: studentCount,
    overall_performance: overallPerformance,
    subject_performance: subjectPerformance,
    top_performers: topPerformers,
    at_risk_students: atRiskStudents,
  } = overview;

  return (
    <div
      className={`p-6 rounded-lg ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
      } shadow space-y-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lớp chủ nhiệm: {className}</h2>
          <p
            className={`mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            Khối {gradeLevel} • GVCN: {homeroomTeacher}
          </p>
        </div>
        <School className="w-8 h-8 text-blue-500" />
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
                Sĩ số
              </p>
              <p className="text-2xl font-bold mt-1">{studentCount || 0}</p>
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
                Điểm TB chung
              </p>
              <p className="text-2xl font-bold mt-1">
                {overallPerformance?.avg_score?.toFixed(1) || "0.0"}
              </p>
              {overallPerformance?.comparison_to_school?.avg_score_diff !==
                undefined &&
                overallPerformance.comparison_to_school.avg_score_diff !==
                  0 && (
                  <p
                    className={`text-xs mt-1 ${
                      overallPerformance.comparison_to_school.avg_score_diff > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {overallPerformance.comparison_to_school.avg_score_diff > 0
                      ? "+"
                      : ""}
                    {overallPerformance.comparison_to_school.avg_score_diff.toFixed(
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
                {overallPerformance?.pass_rate?.toFixed(1) || "0.0"}%
              </p>
              {overallPerformance?.comparison_to_school?.pass_rate_diff !==
                undefined &&
                overallPerformance.comparison_to_school.pass_rate_diff !==
                  0 && (
                  <p
                    className={`text-xs mt-1 ${
                      overallPerformance.comparison_to_school.pass_rate_diff > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {overallPerformance.comparison_to_school.pass_rate_diff > 0
                      ? "+"
                      : ""}
                    {overallPerformance.comparison_to_school.pass_rate_diff.toFixed(
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
                {overallPerformance?.excellent_rate?.toFixed(1) || "0.0"}%
              </p>
              {overallPerformance?.comparison_to_school?.excellent_rate_diff !==
                undefined &&
                overallPerformance.comparison_to_school.excellent_rate_diff !==
                  0 && (
                  <p
                    className={`text-xs mt-1 ${
                      overallPerformance.comparison_to_school
                        .excellent_rate_diff > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {overallPerformance.comparison_to_school
                      .excellent_rate_diff > 0
                      ? "+"
                      : ""}
                    {overallPerformance.comparison_to_school.excellent_rate_diff.toFixed(
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

      {/* Subject Performance Chart */}
      {subjectPerformance && subjectPerformance.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Thành tích theo môn học
          </h3>
          <SubjectPerformanceChart data={subjectPerformance} />
        </div>
      )}

      {/* Subject Performance Table */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Chi tiết theo môn học</h3>
        <div className="overflow-x-auto">
          <table
            className={`min-w-full ${
              isDarkMode ? "bg-gray-700" : "bg-white"
            } border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
          >
            <thead className={isDarkMode ? "bg-gray-600" : "bg-gray-100"}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Môn học
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Giáo viên
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {subjectPerformance && subjectPerformance.length > 0 ? (
                subjectPerformance.map((subject, index) => (
                  <tr
                    key={`${subject.subject_name}-${subject.term_name}-${index}`}
                    className={`hover:bg-opacity-50 ${
                      isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{subject.subject_name}</div>
                      <div className="text-xs text-gray-500">
                        {subject.term_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {subject.teacher_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold">
                      {subject.avg_score?.toFixed(1) || "0.0"}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {subject.pass_rate?.toFixed(1) || "0.0"}%
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {subject.excellent_rate?.toFixed(1) || "0.0"}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Không có dữ liệu môn học
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers and At-Risk Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Học sinh xuất sắc
          </h3>
          <div
            className={`rounded-lg border ${
              isDarkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-white border-gray-300"
            }`}
          >
            {topPerformers && topPerformers.length > 0 ? (
              <ul className="divide-y divide-gray-300">
                {topPerformers.map((student, index) => (
                  <li
                    key={student.studentId}
                    className={`p-4 flex items-center justify-between hover:bg-opacity-50 ${
                      isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-white"
                            : index === 1
                            ? "bg-gray-400 text-white"
                            : index === 2
                            ? "bg-orange-600 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {student.rank}
                      </div>
                      <div>
                        <p className="font-medium">{student.student_name}</p>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {student.student_code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-500">
                        {student.overall_score?.toFixed(1) || "0.0"}
                      </p>
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="mt-1 text-xs text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Chi tiết
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-center text-gray-500">Chưa có dữ liệu</p>
            )}
          </div>
        </div>

        {/* At-Risk Students */}
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Học sinh cần hỗ trợ
          </h3>
          <div
            className={`rounded-lg border ${
              isDarkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-white border-gray-300"
            }`}
          >
            {atRiskStudents && atRiskStudents.length > 0 ? (
              <ul className="divide-y divide-gray-300">
                {atRiskStudents.map((student) => (
                  <li
                    key={student.studentId}
                    className={`p-4 flex items-center justify-between hover:bg-opacity-50 ${
                      isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                      <div>
                        <p className="font-medium">{student.student_name}</p>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {student.student_code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-500">
                        {student.overall_score?.toFixed(1) || "0.0"}
                      </p>
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="mt-1 text-xs text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Chi tiết
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-center text-gray-500">
                Không có học sinh cần hỗ trợ
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <HomeroomStudentModal
          studentId={selectedStudent.student_id}
          teacherId={teacherId}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default HomeroomAnalytics;
