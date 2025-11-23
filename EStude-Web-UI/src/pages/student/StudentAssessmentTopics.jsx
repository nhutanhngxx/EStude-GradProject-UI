import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  ArrowRight,
  Settings,
  X,
} from "lucide-react";
import topicService from "../../services/topicService";
import { useToast } from "../../contexts/ToastContext";

const StudentAssessmentTopics = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const subjectId = searchParams.get("subjectId");
  const subjectName = searchParams.get("subjectName");
  const gradeLevel = searchParams.get("gradeLevel") || "GRADE_10";

  const [topics, setTopics] = useState([]);
  const [groupedTopics, setGroupedTopics] = useState({});
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [numQuestions, setNumQuestions] = useState(20);
  const [difficulty, setDifficulty] = useState("mixed");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (subjectId) {
      fetchTopics();
    }
  }, [subjectId]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const data = await topicService.getTopics({
        subjectId: parseInt(subjectId),
        gradeLevel,
      });

      if (Array.isArray(data)) {
        setTopics(data);

        // Group by volume then by chapter
        const grouped = {};
        data.forEach((topic) => {
          const volume = topic.volume || 1;
          const chapter = topic.chapter || "Chưa phân loại";

          if (!grouped[volume]) {
            grouped[volume] = {};
          }
          if (!grouped[volume][chapter]) {
            grouped[volume][chapter] = [];
          }

          grouped[volume][chapter].push(topic);
        });

        // Sort topics by orderIndex in each chapter
        Object.keys(grouped).forEach((vol) => {
          Object.keys(grouped[vol]).forEach((chap) => {
            grouped[vol][chap].sort(
              (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
            );
          });
        });

        setGroupedTopics(grouped);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      showToast("Lỗi khi tải danh sách chủ đề!", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topicId) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleContinue = () => {
    if (selectedTopics.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 chủ đề!", "warning");
      return;
    }
    setShowSettingsModal(true);
  };

  const handleStartAssessment = async () => {
    if (numQuestions < selectedTopics.length) {
      showToast(
        `Số câu hỏi phải lớn hơn hoặc bằng số chủ đề (${selectedTopics.length})!`,
        "error"
      );
      return;
    }

    setShowSettingsModal(false);
    setGenerating(true);

    try {
      const payload = {
        studentId: user.userId,
        subjectId: parseInt(subjectId),
        topicIds: selectedTopics,
        numQuestions: numQuestions,
        difficulty: difficulty.toLowerCase(),
        gradeLevel: gradeLevel,
      };

      const response = await topicService.generateAssessmentQuestions(payload);

      if (response.success && response.data) {
        // Navigate to quiz screen
        navigate("/student/assessment/quiz", {
          state: {
            assessmentId: response.data.assessmentId,
            subjectId: parseInt(subjectId),
            subjectName: subjectName,
            questions: response.data.questions,
            totalQuestions: response.data.totalQuestions,
            difficulty: response.data.difficulty,
            selectedTopics: topics.filter((t) =>
              selectedTopics.includes(t.topicId)
            ),
          },
        });
      } else {
        showToast(response.message || "Không thể tạo bài đánh giá!", "error");
      }
    } catch (error) {
      console.error("Error generating assessment:", error);

      let errorMessage = "Lỗi khi tạo bài đánh giá. Vui lòng thử lại.";
      if (error.message) {
        if (error.message.includes("cần ít nhất")) {
          const match = error.message.match(/cần ít nhất (\d+) câu/);
          const minQuestions = match ? match[1] : "4";
          errorMessage = `Cần ít nhất ${minQuestions} câu hỏi cho cài đặt này. Vui lòng tăng số câu hỏi hoặc chọn độ khó khác.`;
        } else if (error.message.includes("Không đủ câu hỏi")) {
          errorMessage =
            "Chủ đề này chưa có đủ câu hỏi. Vui lòng chọn thêm chủ đề hoặc giảm số câu hỏi.";
        } else {
          errorMessage = error.message;
        }
      }
      showToast(errorMessage, "error");
    } finally {
      setGenerating(false);
    }
  };

  const difficultyOptions = [
    {
      key: "easy",
      label: "Dễ",
      color: "bg-green-500 hover:bg-green-600",
      activeColor: "bg-green-600",
    },
    {
      key: "medium",
      label: "Trung bình",
      color: "bg-yellow-500 hover:bg-yellow-600",
      activeColor: "bg-yellow-600",
    },
    {
      key: "hard",
      label: "Khó",
      color: "bg-red-500 hover:bg-red-600",
      activeColor: "bg-red-600",
    },
    {
      key: "mixed",
      label: "Hỗn hợp",
      color: "bg-purple-500 hover:bg-purple-600",
      activeColor: "bg-purple-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Đang tải danh sách chủ đề...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Cài đặt bài đánh giá
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  Số chủ đề đã chọn:{" "}
                  <span className="font-bold">{selectedTopics.length}</span>
                </p>
              </div>

              {/* Số câu hỏi */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Số câu hỏi:
                </label>
                <input
                  type="number"
                  value={numQuestions}
                  onChange={(e) =>
                    setNumQuestions(parseInt(e.target.value) || 20)
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center text-lg font-semibold"
                  min={selectedTopics.length}
                  max={100}
                />
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  * Số câu hỏi phải ≥ số chủ đề ({selectedTopics.length})
                </p>
              </div>

              {/* Mức độ */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Mức độ:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {difficultyOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setDifficulty(option.key)}
                      className={`py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                        difficulty === option.key
                          ? option.activeColor +
                            " ring-2 ring-offset-2 ring-blue-500"
                          : option.color
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                disabled={generating}
              >
                Hủy
              </button>
              <button
                onClick={handleStartAssessment}
                disabled={generating}
                className="flex-2 flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Bắt đầu đánh giá</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <button
          onClick={() => navigate("/student/assessment")}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {subjectName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-3">
          Chọn các chủ đề bạn muốn đánh giá năng lực
        </p>
        <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg font-semibold">
          Đã chọn: {selectedTopics.length} chủ đề
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-6 mb-24">
        {Object.keys(groupedTopics)
          .sort()
          .map((volume) => (
            <div key={volume}>
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                Tập {volume}
              </h2>

              {Object.keys(groupedTopics[volume]).map((chapter) => (
                <div key={chapter} className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 pl-2">
                    {chapter}
                  </h3>

                  <div className="space-y-3">
                    {groupedTopics[volume][chapter].map((topic) => {
                      const isSelected = selectedTopics.includes(topic.topicId);
                      return (
                        <div
                          key={topic.topicId}
                          onClick={() => toggleTopic(topic.topicId)}
                          className={`bg-white dark:bg-gray-800 rounded-xl p-4 cursor-pointer transition-all border-2 ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {isSelected ? (
                                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <Circle className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4
                                className={`font-semibold ${
                                  isSelected
                                    ? "text-blue-700 dark:text-blue-300"
                                    : "text-gray-900 dark:text-gray-100"
                                }`}
                              >
                                {topic.name}
                              </h4>
                              {topic.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {topic.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                Câu hỏi: {topic.totalQuestions || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleContinue}
            disabled={selectedTopics.length === 0}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
          >
            <span>
              Tiếp tục{" "}
              {selectedTopics.length > 0 && `(${selectedTopics.length})`}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentAssessmentTopics;
