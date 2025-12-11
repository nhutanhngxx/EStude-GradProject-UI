import React, { useState, useEffect, useContext } from "react";
import { X, Users, TrendingUp, Award, Eye } from "lucide-react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import analyticsService from "../../services/analyticsService";

const ClassDetailModal = ({ classData, teacherId, onClose }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [classDetails, setClassDetails] = useState(null);

  const gradeMapping = {
    GRADE_6: "Khối 6",
    GRADE_7: "Khối 7",
    GRADE_8: "Khối 8",
    GRADE_9: "Khối 9",
    GRADE_10: "Khối 10",
    GRADE_11: "Khối 11",
    GRADE_12: "Khối 12",
  };

  useEffect(() => {
    loadClassDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData.classId]);

  const loadClassDetails = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading class details for class:", classData.classId);

      const data = await analyticsService.getClassAnalytics(
        classData.classId,
        teacherId
      );
      console.log("✅ Class details loaded:", data);

      setClassDetails(data);
    } catch (error) {
      console.error("❌ Error loading class details:", error);
      showToast("Không thể tải chi tiết lớp học", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        } rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } border-b p-6 flex items-center justify-between`}
        >
          <div>
            <h2 className="text-2xl font-bold">
              Chi tiết lớp {classData.className}
            </h2>
            <p
              className={`mt-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {gradeMapping[classData.gradeLevel] || "Không xác định"}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-opacity-80 ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-gray-300 rounded"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          ) : classDetails ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <p className="text-2xl font-bold mt-1">
                        {classDetails.studentCount || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

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
                        Điểm TB
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {classDetails.avgScore?.toFixed(1) || "0.0"}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>

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
                        {classDetails.passRate?.toFixed(1) || "0.0"}%
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>

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
                        {classDetails.excellentRate?.toFixed(1) || "0.0"}%
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Student List - Mock for now */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Danh sách học sinh
                </h3>
                <div
                  className={`p-4 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <p className="text-center text-gray-500">
                    Dữ liệu chi tiết học sinh sẽ được hiển thị khi backend hoàn
                    tất
                  </p>
                  <p className="text-center text-sm text-gray-400 mt-2">
                    (Nhấn nút "Xem chi tiết" để xem thông tin học sinh cụ thể)
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`sticky bottom-0 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } border-t p-6 flex justify-end`}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailModal;
