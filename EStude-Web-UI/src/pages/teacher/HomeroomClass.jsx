import React, { useState, useEffect } from "react";
import { Users, Filter, Mail, Phone, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import homeroomService from "../../services/homeroomService";
import { useToast } from "../../contexts/ToastContext";
import Pagination from "../../components/common/Pagination";

const GRADE_LEVELS = {
  GRADE_10: "Lớp 10",
  GRADE_11: "Lớp 11",
  GRADE_12: "Lớp 12",
};

const HomeroomClass = () => {
  console.log("[HomeroomClass] Component rendering...");
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [homeroomData, setHomeroomData] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [availableTerms, setAvailableTerms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;

  const fetchHomeroomData = async () => {
    try {
      console.log("[HomeroomClass] Starting fetch homeroom data...");
      setLoading(true);
      setError(null);
      const data = await homeroomService.getHomeroomStudents();
      console.log("[HomeroomClass] Fetched data:", data);

      setHomeroomData(data);

      // Lấy danh sách terms từ dữ liệu
      if (data && data.length > 0 && data[0].terms) {
        const terms = data[0].terms;
        console.log("[HomeroomClass] Available terms:", terms);
        setAvailableTerms(terms);
        // Mặc định chọn term đầu tiên
        if (terms.length > 0) {
          setSelectedTerm(terms[0].termId.toString());
          console.log("[HomeroomClass] Selected term:", terms[0].termId);
        }
      }
    } catch (error) {
      console.error("[HomeroomClass] Error fetching homeroom data:", error);
      const errorMessage =
        error.response?.status === 404
          ? "API endpoint '/api/teachers/{teacherId}/homeroom-students' chưa được triển khai trên server"
          : error.message || "Lỗi khi tải dữ liệu";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
      console.log("[HomeroomClass] Fetch completed");
    }
  };

  useEffect(() => {
    fetchHomeroomData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lọc học sinh theo tìm kiếm
  const getFilteredStudents = () => {
    if (!homeroomData || homeroomData.length === 0) return [];

    const allStudents = homeroomData.flatMap((classData) =>
      classData.students.map((student) => ({
        ...student,
        className: classData.name,
        classId: classData.classId,
        gradeLevel: classData.gradeLevel,
      }))
    );

    if (!searchTerm) return allStudents;

    return allStudents.filter(
      (student) =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.className.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredStudents = getFilteredStudents();
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStudents = filteredStudents.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getTotalStudents = () => {
    return homeroomData.reduce((total, cls) => total + cls.classSize, 0);
  };

  const getSelectedTermName = () => {
    const term = availableTerms.find(
      (t) => t.termId.toString() === selectedTerm
    );
    return term ? term.name : "";
  };

  return (
    <div className="p-6 bg-transparent text-gray-900 dark:text-gray-100">
      {/* <div className="max-w-7xl"> */}
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("teacher.homeroom.title") || "Lớp học chủ nhiệm"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("teacher.homeroom.subtitle") ||
                "Quản lý thông tin học sinh lớp chủ nhiệm"}
            </p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Tính năng chưa khả dụng
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-3">
                {error}
              </p>
              <div className="bg-white dark:bg-gray-800 rounded p-4 text-sm">
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Thông tin cho Backend Developer:
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Cần triển khai API endpoint sau:
                </p>
                <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs text-gray-800 dark:text-gray-200 font-mono">
                  GET /api/teachers/&#123;teacherId&#125;/homeroom-students
                </code>
                <p className="text-gray-700 dark:text-gray-300 mt-3">
                  Response format: Xem file{" "}
                  <code className="text-blue-600 dark:text-blue-400">
                    QUESTION_BANK_API_REFERENCE.md
                  </code>{" "}
                  trong project để biết chi tiết về cấu trúc dữ liệu cần trả về.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tổng số lớp
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {homeroomData.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <User className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tổng số học sinh
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getTotalStudents()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Filter className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Học kỳ hiện tại
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {getSelectedTermName()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("Bộ lọc") || "Bộ lọc"}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Học kỳ
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => {
                setSelectedTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={availableTerms.length === 0}
            >
              {availableTerms.length === 0 ? (
                <option value="">Không có học kỳ</option>
              ) : (
                availableTerms.map((term) => (
                  <option key={term.termId} value={term.termId}>
                    {term.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tìm theo tên, mã HS, email, lớp..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Class Overview */}
      {homeroomData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {homeroomData.map((classData) => (
            <div
              key={classData.classId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border-l-4 border-blue-500"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {classData.name}
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Khối:</span>{" "}
                  {GRADE_LEVELS[classData.gradeLevel]}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Sĩ số:</span>{" "}
                  {classData.classSize} học sinh
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto mb-16">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mã học sinh
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Họ và tên
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Lớp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Số điện thoại
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {t("common.loading") || "Đang tải..."}
                  </td>
                </tr>
              ) : currentStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {searchTerm
                      ? "Không tìm thấy học sinh nào"
                      : "Chưa có học sinh trong lớp chủ nhiệm"}
                  </td>
                </tr>
              ) : (
                currentStudents.map((student, index) => (
                  <tr
                    key={student.studentId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {student.studentCode}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {student.fullName}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                        {student.className}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {student.email}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {student.numberPhone}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            totalItems={filteredStudents.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
    // </div>
  );
};

export default HomeroomClass;
