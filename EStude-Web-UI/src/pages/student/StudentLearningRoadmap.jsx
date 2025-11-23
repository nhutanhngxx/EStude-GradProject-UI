import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MapPin,
  Flag,
  Clock,
  Calendar,
  CheckCircle,
  Trophy,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  BookOpen,
  Pencil,
  FileText,
  ExternalLink,
  Target,
  Lightbulb,
  Award,
  Timer,
  CircleCheck,
  Circle,
  AlertCircle,
  Info,
  Brain,
  X,
  PlayCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import aiService from "../../services/aiService";
import { useToast } from "../../contexts/ToastContext";

/**
 * StudentLearningRoadmap Component
 * Cải thiện từ App với đầy đủ tính năng:
 * - View incorrect questions detail
 * - Task detail modal with learning content
 * - Practice quiz modal
 * - Quiz result modal
 * - Mark task completed with API integration
 */
const StudentLearningRoadmap = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("accessToken");

  // Tab navigation state
  const [activeTab, setActiveTab] = useState("current");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Roadmap data
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapHistory, setRoadmapHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // UI state
  const [expandedPhases, setExpandedPhases] = useState([0]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [updatingTask, setUpdatingTask] = useState(null);

  // Modal states
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);

  // Quiz modal states
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Result modal states
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const fetchRoadmapLatest = useCallback(async () => {
    try {
      setLoading(true);

      // Check if roadmap passed from route params (from Improvement screen)
      if (location.state?.roadmap) {
        const roadmapData = location.state.roadmap;
        setRoadmap(roadmapData);
        extractCompletedTasks(roadmapData);
        setLoading(false);
        return;
      }

      const response = await aiService.getAllRoadmaps(token);

      if (response && Array.isArray(response) && response.length > 0) {
        const latestRoadmap = response[0];
        const detailedAnalysis = latestRoadmap.detailedAnalysis;

        if (!detailedAnalysis) {
          setRoadmap(null);
          return;
        }

        const roadmapData = {
          roadmap_id:
            detailedAnalysis.roadmap_id || `roadmap_${latestRoadmap.resultId}`,
          result_id: latestRoadmap.resultId,
          subject: detailedAnalysis.subject,
          created_at: latestRoadmap.generatedAt || new Date().toISOString(),
          estimated_completion_days:
            detailedAnalysis.estimated_completion_days || 7,
          overall_goal:
            detailedAnalysis.overall_goal || "Cải thiện kết quả học tập",
          phases: detailedAnalysis.phases || [],
          motivational_tips: detailedAnalysis.motivational_tips || [],
          adaptive_hints: detailedAnalysis.adaptive_hints || null,
          progress_tracking: detailedAnalysis.progress_tracking || {
            completion_percent: 0,
            completed_phases: 0,
            total_phases: detailedAnalysis.phases?.length || 0,
          },
        };

        setRoadmap(roadmapData);
        extractCompletedTasks(roadmapData);
      } else {
        setRoadmap(null);
      }
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      showToast("Không thể tải lộ trình học tập", "error");
      setRoadmap(null);
    } finally {
      setLoading(false);
    }
  }, [token, showToast, location.state]);

  const extractCompletedTasks = (roadmapData) => {
    if (!roadmapData || !roadmapData.phases) return;

    const completed = [];
    roadmapData.phases.forEach((phase) => {
      phase.daily_tasks?.forEach((day) => {
        day.tasks?.forEach((task) => {
          if (task.completed === true || task.status === "COMPLETED") {
            completed.push(task.task_id);
          }
        });
      });
    });

    setCompletedTasks(completed);
  };

  const fetchRoadmapHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await aiService.getAllRoadmaps(token);

      if (response && Array.isArray(response)) {
        setRoadmapHistory(response);
      } else {
        setRoadmapHistory([]);
      }
    } catch (error) {
      console.error("Error fetching roadmap history:", error);
      showToast("Lỗi khi tải lịch sử lộ trình", "error");
      setRoadmapHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchRoadmapLatest();
  }, [fetchRoadmapLatest]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRoadmapLatest();
    setRefreshing(false);
  };

  const togglePhase = (phaseIndex) => {
    if (expandedPhases.includes(phaseIndex)) {
      setExpandedPhases(expandedPhases.filter((i) => i !== phaseIndex));
    } else {
      setExpandedPhases([...expandedPhases, phaseIndex]);
    }
  };

  const markTaskCompleted = async (taskId, completionData = {}) => {
    const effectiveResultId = roadmap?.result_id || roadmap?.resultId;

    // Nếu không có resultId, chỉ update local state
    if (!effectiveResultId) {
      if (completedTasks.includes(taskId)) {
        setCompletedTasks(completedTasks.filter((id) => id !== taskId));
        showToast("Đã bỏ đánh dấu hoàn thành", "info");
      } else {
        setCompletedTasks([...completedTasks, taskId]);
        showToast("Đã hoàn thành nhiệm vụ!", "success");
      }
      return;
    }

    // Call API để update progress
    try {
      setUpdatingTask(taskId);

      const response = await aiService.markTaskComplete(
        effectiveResultId,
        taskId,
        completionData,
        token
      );

      if (response && response.success) {
        // Update local state
        if (completedTasks.includes(taskId)) {
          setCompletedTasks(completedTasks.filter((id) => id !== taskId));
          showToast("Đã bỏ đánh dấu hoàn thành", "info");
        } else {
          setCompletedTasks([...completedTasks, taskId]);
          showToast("Đã hoàn thành nhiệm vụ!", "success");
        }

        // Optionally refresh roadmap to get updated progress
        if (response.data?.progress_tracking) {
          setRoadmap((prev) => ({
            ...prev,
            progress_tracking: response.data.progress_tracking,
          }));
        }
      } else {
        showToast("Không thể cập nhật trạng thái", "error");
      }
    } catch (error) {
      console.error("Error marking task completed:", error);
      showToast("Lỗi khi cập nhật nhiệm vụ", "error");
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleOpenResource = (resource) => {
    const resourceUrl = resource.url || resource.resource_url;

    if (!resourceUrl) {
      showToast(
        "Tài liệu không có đường dẫn. Vui lòng tự tìm theo tên.",
        "warning"
      );
      return;
    }

    // Open in new tab
    window.open(resourceUrl, "_blank", "noopener,noreferrer");
  };

  const handleViewIncorrectQuestion = (question) => {
    setSelectedQuestion(question);
    setQuestionModalVisible(true);
  };

  const handleStartPractice = (task) => {
    if (task.practice_set && task.practice_set.length > 0) {
      setSelectedTask(task);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setQuizStartTime(Date.now());
      setQuizModalVisible(true);
    } else {
      showToast("Bài luyện tập chưa có câu hỏi", "warning");
    }
  };

  const handleViewLearningContent = (task) => {
    setSelectedTask(task);
    setTaskModalVisible(true);
  };

  const handleSubmitQuiz = async () => {
    if (!selectedTask || !selectedTask.practice_set) return;

    setQuizSubmitting(true);

    try {
      const endTime = Date.now();
      const timeTakenSeconds = Math.floor((endTime - quizStartTime) / 1000);

      // Calculate score
      let correctCount = 0;
      selectedTask.practice_set.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = q.correct_answer;
        // So sánh theo format "A", "B", "C", "D" hoặc full text
        const correctChoice = q.choices?.find((c, idx) => {
          const choiceText = typeof c === "string" ? c : c.choice_text || c;
          return (
            choiceText === correctAnswer ||
            String.fromCharCode(65 + idx) === correctAnswer
          ); // A, B, C, D
        });
        const correctText =
          typeof correctChoice === "string"
            ? correctChoice
            : correctChoice?.choice_text || correctChoice;
        if (userAnswer === correctText) {
          correctCount++;
        }
      });

      const totalQuestions = selectedTask.practice_set.length;
      const score = (correctCount / totalQuestions) * 100;

      const result = {
        correct: correctCount,
        total: totalQuestions,
        score: score,
        timeTaken: timeTakenSeconds,
        passed: score >= 70,
      };

      setQuizResult(result);
      setQuizModalVisible(false);
      setResultModalVisible(true);

      // Mark task as completed if passed
      if (result.passed && selectedTask.task_id) {
        await markTaskCompleted(selectedTask.task_id, {
          score: score,
          time_taken: timeTakenSeconds,
        });
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      showToast("Lỗi khi nộp bài", "error");
    } finally {
      setQuizSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CAO":
      case "HIGH":
        return {
          bg: "bg-red-100 dark:bg-red-900/30",
          text: "text-red-700 dark:text-red-400",
          label: "Ưu tiên cao",
        };
      case "TRUNG BÌNH":
      case "MEDIUM":
        return {
          bg: "bg-yellow-100 dark:bg-yellow-900/30",
          text: "text-yellow-700 dark:text-yellow-400",
          label: "Ưu tiên trung bình",
        };
      case "THẤP":
      case "LOW":
        return {
          bg: "bg-green-100 dark:bg-green-900/30",
          text: "text-green-700 dark:text-green-400",
          label: "Ưu tiên thấp",
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-gray-700",
          text: "text-gray-700 dark:text-gray-400",
          label: priority,
        };
    }
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case "HỌC":
      case "READ":
      case "WATCH_VIDEO":
      case "READ_ARTICLE":
        return <BookOpen className="w-4 h-4" />;
      case "LUYỆN_TẬP":
      case "PRACTICE":
        return <Pencil className="w-4 h-4" />;
      case "KIỂM_TRA":
      case "ASSESSMENT":
      case "REVIEW_MISTAKES":
        return <FileText className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTaskTypeLabel = (type) => {
    const labels = {
      WATCH_VIDEO: "Xem video",
      READ_ARTICLE: "Đọc bài",
      READ: "Đọc",
      HỌC: "Học",
      PRACTICE: "Luyện tập",
      LUYỆN_TẬP: "Luyện tập",
      REVIEW_MISTAKES: "Ôn câu sai",
      ASSESSMENT: "Đánh giá",
      KIỂM_TRA: "Kiểm tra",
    };
    return labels[type] || type;
  };

  // ... renderProgressBar giữ nguyên như cũ ...
  const renderProgressBar = () => {
    if (!roadmap) return null;

    const progressTracking = roadmap.progress_tracking;
    const apiProgress = progressTracking?.completion_percent || 0;
    const apiCompletedPhases = progressTracking?.completed_phases || 0;
    const apiTotalPhases =
      progressTracking?.total_phases || roadmap.phases?.length || 0;

    let totalTasks = 0;
    let totalPhases = roadmap.phases?.length || 0;
    let completedPhases = 0;

    if (roadmap.phases) {
      roadmap.phases.forEach((phase) => {
        let phaseTasksTotal = 0;
        let phaseTasksCompleted = 0;

        if (phase.daily_tasks) {
          phase.daily_tasks.forEach((day) => {
            if (day.tasks) {
              phaseTasksTotal += day.tasks.length;
              day.tasks.forEach((task) => {
                if (task.completed || completedTasks.includes(task.task_id)) {
                  phaseTasksCompleted++;
                }
              });
            }
          });
        }

        totalTasks += phaseTasksTotal;

        if (phaseTasksTotal > 0 && phaseTasksCompleted === phaseTasksTotal) {
          completedPhases++;
        }
      });
    }

    const tasksCompleted = completedTasks.length;
    const calculatedProgress =
      totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

    const progress = apiProgress > 0 ? apiProgress : calculatedProgress;
    const displayCompletedPhases =
      apiCompletedPhases > 0 ? apiCompletedPhases : completedPhases;
    const displayTotalPhases =
      apiTotalPhases > 0 ? apiTotalPhases : totalPhases;

    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg p-6 mb-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mr-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Tiến độ hoàn thành
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Theo dõi quá trình học tập
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 40 * (1 - progress / 100)
                  }`}
                  className="text-green-600 dark:text-green-500 transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600 dark:text-green-500">
                  {progress.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Nhiệm vụ
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {tasksCompleted}/{totalTasks}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flag className="w-5 h-5 text-blue-600 dark:text-blue-500 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Giai đoạn
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {displayCompletedPhases}/{displayTotalPhases}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-500 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Thời gian
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {roadmap.estimated_completion_days} ngày
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-500 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Môn học
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {roadmap.subject}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderPhase = (phase, phaseIndex) => {
    const isExpanded = expandedPhases.includes(phaseIndex);
    const priority = getPriorityColor(phase.priority);

    let phaseTasks = 0;
    let phaseCompleted = 0;

    if (phase.daily_tasks) {
      phase.daily_tasks.forEach((day) => {
        if (day.tasks) {
          phaseTasks += day.tasks.length;
          day.tasks.forEach((task) => {
            if (task.completed || completedTasks.includes(task.task_id)) {
              phaseCompleted++;
            }
          });
        }
      });
    }

    const phaseProgress =
      phaseTasks > 0 ? (phaseCompleted / phaseTasks) * 100 : 0;
    const allCompleted = phaseTasks > 0 && phaseCompleted === phaseTasks;

    return (
      <div
        key={phaseIndex}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6 border border-gray-200 dark:border-gray-700"
      >
        {/* Phase Header */}
        <button
          onClick={() => togglePhase(phaseIndex)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
        >
          <div className="flex items-center space-x-4 flex-1">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                allCompleted
                  ? "bg-green-600"
                  : "bg-gradient-to-br from-blue-500 to-purple-600"
              }`}
            >
              {allCompleted ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <Flag className="w-6 h-6 text-white" />
              )}
            </div>

            <div className="flex-1 text-left">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Giai đoạn {phaseIndex + 1}: {phase.phase_name}
                </h3>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${priority.bg} ${priority.text} font-medium`}
                >
                  {priority.label}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {phase.description}
              </p>

              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{phase.duration_days} ngày</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>
                    {phaseCompleted}/{phaseTasks} nhiệm vụ
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    allCompleted
                      ? "bg-green-600"
                      : "bg-gradient-to-r from-blue-500 to-purple-600"
                  }`}
                  style={{ width: `${phaseProgress}%` }}
                />
              </div>
            </div>
          </div>

          {isExpanded ? (
            <ChevronUp className="w-6 h-6 text-gray-400 ml-4" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-400 ml-4" />
          )}
        </button>

        {/* Phase Content */}
        {isExpanded && (
          <div className="p-6 pt-0 border-t border-gray-100 dark:border-gray-700">
            {phase.daily_tasks && phase.daily_tasks.length > 0 ? (
              phase.daily_tasks.map((day, dayIndex) =>
                renderDay({ ...day, phase }, dayIndex)
              )
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Chưa có nhiệm vụ nào
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDay = (dayItem, dayIndex) => {
    return (
      <div key={dayIndex} className="mb-6 last:mb-0">
        <div className="flex items-center mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mr-3">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Ngày {dayItem.day || dayIndex + 1}
            </h4>
          </div>
        </div>

        <div className="ml-13 space-y-3">
          {dayItem.tasks && dayItem.tasks.length > 0 ? (
            dayItem.tasks.map((task, taskIndex) =>
              renderTask(task, taskIndex, dayItem.phase)
            )
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Không có nhiệm vụ
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderTask = (task, taskIndex, phase) => {
    const isCompleted =
      task.completed === true || completedTasks.includes(task.task_id);
    const isUpdating = updatingTask === task.task_id;
    const priority = getPriorityColor(task.priority);

    return (
      <div
        key={taskIndex}
        className={`group relative bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-l-4 transition-all duration-200 hover:shadow-md ${
          isCompleted
            ? "border-green-600 bg-green-50 dark:bg-green-900/20"
            : "border-blue-500"
        }`}
      >
        <div className="flex items-start space-x-3">
          {/* Checkbox */}
          <button
            onClick={() => markTaskCompleted(task.task_id)}
            disabled={isUpdating}
            className={`flex-shrink-0 mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
              isCompleted
                ? "bg-green-600 border-green-600"
                : "bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 hover:border-green-600"
            } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isUpdating ? (
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : null}
          </button>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className={`flex items-center space-x-1 px-2 py-1 rounded ${priority.bg}`}
                  >
                    {getTaskIcon(task.type)}
                    <span className={`text-xs font-medium ${priority.text}`}>
                      {getTaskTypeLabel(task.type)}
                    </span>
                  </div>
                  {task.estimated_duration && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Timer className="w-3 h-3 mr-1" />
                      {task.estimated_duration}
                    </div>
                  )}
                </div>

                <h5
                  className={`text-base font-semibold mb-1 ${
                    isCompleted
                      ? "text-gray-500 dark:text-gray-400 line-through"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {task.title}
                </h5>

                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            {/* AI Note */}
            {task.ai_note && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3 flex items-start space-x-2">
                <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {task.ai_note}
                </p>
              </div>
            )}

            {/* Resources */}
            {task.recommended_resources &&
              task.recommended_resources.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tài liệu tham khảo:
                  </p>
                  <div className="space-y-2">
                    {task.recommended_resources.map((resource, resIndex) => (
                      <button
                        key={resIndex}
                        onClick={() => handleOpenResource(resource)}
                        className="w-full flex items-center justify-between bg-white dark:bg-gray-600 rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {resource.title}
                          </span>
                        </div>
                        {resource.description && (
                          <div className="group relative">
                            <Info className="w-4 h-4 text-blue-500" />
                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded p-2 w-48 z-10">
                              {resource.description}
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Incorrect Questions - từ subtopics */}
            {phase?.topics?.some((topic) =>
              topic.subtopics?.some(
                (sub) => sub.incorrect_questions_review?.length > 0
              )
            ) && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-1" />
                  Các câu sai cần ôn:
                </p>
                <div className="space-y-2">
                  {phase.topics.flatMap(
                    (topic) =>
                      topic.subtopics?.flatMap(
                        (sub) =>
                          sub.incorrect_questions_review?.map(
                            (question, qIndex) => (
                              <button
                                key={`${sub.name}-${qIndex}`}
                                onClick={() =>
                                  handleViewIncorrectQuestion(question)
                                }
                                className="w-full text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                              >
                                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-1">
                                  {question.question_text}
                                </p>
                                {question.tip && (
                                  <div className="flex items-start space-x-1 mt-2">
                                    <Lightbulb className="w-3 h-3 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {question.tip}
                                    </p>
                                  </div>
                                )}
                              </button>
                            )
                          ) || []
                      ) || []
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 mt-3">
              {(task.theory_explanation ||
                task.key_points ||
                task.recommended_resources) && (
                <button
                  onClick={() => handleViewLearningContent(task)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Xem nội dung</span>
                </button>
              )}

              {task.practice_set && task.practice_set.length > 0 && (
                <button
                  onClick={() => handleStartPractice(task)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Làm bài luyện tập</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIncorrectQuestionModal = () => {
    if (!questionModalVisible || !selectedQuestion) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-gradient-to-r from-red-200 to-white text-gray-800 p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-xl font-bold">Chi tiết câu hỏi sai</h3>
              </div>
              <button
                onClick={() => setQuestionModalVisible(false)}
                className="text-gray-800 hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {/* Question */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Câu hỏi:
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {selectedQuestion.question_text}
              </p>
            </div>

            {/* Your Answer and Correct Answer */}
            <div className="space-y-3 mb-6">
              {selectedQuestion.your_answer && (
                <div className="p-4 rounded-lg border-2 bg-red-50 dark:bg-red-900/20 border-red-600">
                  <div className="flex items-center space-x-2 mb-1">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      Câu trả lời của bạn:
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 ml-7">
                    {selectedQuestion.your_answer}
                  </p>
                </div>
              )}

              {selectedQuestion.correct_answer && (
                <div className="p-4 rounded-lg border-2 bg-green-50 dark:bg-green-900/20 border-green-600">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Đáp án đúng:
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 ml-7">
                    {selectedQuestion.correct_answer}
                  </p>
                </div>
              )}

              {selectedQuestion.common_mistake && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-1">
                        Lỗi thường gặp:
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-400">
                        {selectedQuestion.common_mistake}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Explanation */}
            {selectedQuestion.explanation && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                      Giải thích:
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      {selectedQuestion.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tip */}
            {selectedQuestion.tip && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-1">
                      Gợi ý:
                    </p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-400">
                      {selectedQuestion.tip}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
            <button
              onClick={() => setQuestionModalVisible(false)}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTaskDetailModal = () => {
    if (!taskModalVisible || !selectedTask) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-6 h-6" />
                <h3 className="text-xl font-bold">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setTaskModalVisible(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {selectedTask.theory_explanation ||
            selectedTask.key_points ||
            selectedTask.recommended_resources ? (
              <>
                {/* Learning Summary */}
                {selectedTask.learning_summary && (
                  <div className="mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-gray-800 dark:text-gray-200">
                        {selectedTask.learning_summary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Theory */}
                {selectedTask.theory_explanation && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Lý thuyết
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {selectedTask.theory_explanation}
                      </p>
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {selectedTask.key_points &&
                  selectedTask.key_points.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                        Điểm chính cần nhớ
                      </h4>
                      <div className="space-y-2">
                        {selectedTask.key_points.map((point, index) => (
                          <div
                            key={index}
                            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start space-x-2"
                          >
                            <CheckCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-800 dark:text-gray-200">
                              {point}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Example */}
                {selectedTask.example && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <Pencil className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                      Ví dụ minh họa
                    </h4>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      {selectedTask.example.question && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Câu hỏi:
                          </p>
                          <p className="text-gray-800 dark:text-gray-200">
                            {selectedTask.example.question}
                          </p>
                        </div>
                      )}
                      {selectedTask.example.solution && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Lời giải:
                          </p>
                          <p className="text-gray-800 dark:text-gray-200">
                            {selectedTask.example.solution}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {selectedTask.tips && selectedTask.tips.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                      Mẹo học tập
                    </h4>
                    <div className="space-y-2">
                      {selectedTask.tips.map((tip, index) => (
                        <div
                          key={index}
                          className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3"
                        >
                          <p className="text-gray-800 dark:text-gray-200">
                            {tip}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Resources */}
                {selectedTask.recommended_resources &&
                  selectedTask.recommended_resources.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                        <ExternalLink className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Tài liệu tham khảo
                      </h4>
                      <div className="space-y-2">
                        {selectedTask.recommended_resources.map(
                          (resource, index) => (
                            <button
                              key={index}
                              onClick={() => handleOpenResource(resource)}
                              className="w-full text-left bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {resource.title}
                                </span>
                                <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              {resource.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {resource.description}
                                </p>
                              )}
                              {resource.estimated_time_minutes && (
                                <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  <Timer className="w-3 h-3 mr-1" />
                                  {resource.estimated_time_minutes} phút
                                </div>
                              )}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nội dung học tập đang được cập nhật
              </p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl flex justify-between">
            <button
              onClick={() => setTaskModalVisible(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Đóng
            </button>
            {selectedTask.practice_set &&
              selectedTask.practice_set.length > 0 && (
                <button
                  onClick={() => {
                    setTaskModalVisible(false);
                    handleStartPractice(selectedTask);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>Bắt đầu luyện tập</span>
                </button>
              )}
          </div>
        </div>
      </div>
    );
  };

  const renderQuizModal = () => {
    if (!quizModalVisible || !selectedTask || !selectedTask.practice_set)
      return null;

    const questions = selectedTask.practice_set;
    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(userAnswers).length;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <PlayCircle className="w-6 h-6" />
                <h3 className="text-xl font-bold">Bài luyện tập</h3>
              </div>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Bạn có chắc muốn thoát? Tiến trình sẽ không được lưu."
                    )
                  ) {
                    setQuizModalVisible(false);
                  }
                }}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between text-sm">
              <span>
                Câu {currentQuestionIndex + 1}/{totalQuestions}
              </span>
              <span>
                Đã trả lời: {answeredCount}/{totalQuestions}
              </span>
            </div>
            <div className="mt-2 w-full bg-white/30 rounded-full h-2">
              <div
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((currentQuestionIndex + 1) / totalQuestions) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {/* Question */}
            <div className="mb-6">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {currentQuestion.question_text}
              </p>

              {/* Choices */}
              <div className="space-y-3">
                {currentQuestion.choices?.map((choice, index) => {
                  const choiceText =
                    typeof choice === "string"
                      ? choice
                      : choice.choice_text || choice;
                  const isSelected =
                    userAnswers[currentQuestionIndex] === choiceText;

                  return (
                    <button
                      key={index}
                      onClick={() =>
                        setUserAnswers({
                          ...userAnswers,
                          [currentQuestionIndex]: choiceText,
                        })
                      }
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-600"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-blue-600 bg-blue-600"
                              : "border-gray-400"
                          }`}
                        >
                          {isSelected && (
                            <Circle className="w-3 h-3 text-white fill-white" />
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-gray-100">
                          {choiceText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Navigation */}
            <div className="flex flex-wrap gap-2 mb-4">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    index === currentQuestionIndex
                      ? "bg-blue-600 text-white"
                      : userAnswers[index] !== undefined
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-600"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl flex justify-between">
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                }
              }}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Câu trước</span>
            </button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={() =>
                  setCurrentQuestionIndex(currentQuestionIndex + 1)
                }
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={quizSubmitting || answeredCount < totalQuestions}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {quizSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Đang nộp...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Nộp bài</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResultModal = () => {
    if (!resultModalVisible || !quizResult) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
          {/* Modal Header */}
          <div
            className={`p-6 rounded-t-xl ${
              quizResult.passed
                ? "bg-gradient-to-r from-green-600 to-teal-600"
                : "bg-gradient-to-r from-red-600 to-pink-600"
            }`}
          >
            <div className="text-center text-white">
              {quizResult.passed ? (
                <Award className="w-16 h-16 mx-auto mb-4" />
              ) : (
                <AlertCircle className="w-16 h-16 mx-auto mb-4" />
              )}
              <h3 className="text-2xl font-bold mb-2">
                {quizResult.passed ? "Chúc mừng! 🎉" : "Hãy cố gắng hơn! 💪"}
              </h3>
              <p className="text-lg">
                {quizResult.passed
                  ? "Bạn đã hoàn thành xuất sắc!"
                  : "Đừng nản chí, hãy thử lại nhé!"}
              </p>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {quizResult.score.toFixed(0)}%
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {quizResult.correct}/{quizResult.total} câu đúng
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {quizResult.correct}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Câu đúng
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {quizResult.total - quizResult.correct}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Câu sai
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-center space-x-2 text-gray-700 dark:text-gray-300">
              <Timer className="w-5 h-5" />
              <span>
                Thời gian: {Math.floor(quizResult.timeTaken / 60)}:
                {String(quizResult.timeTaken % 60).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl flex justify-between">
            <button
              onClick={() => {
                setResultModalVisible(false);
                setSelectedTask(null);
              }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Đóng
            </button>
            {!quizResult.passed && (
              <button
                onClick={() => {
                  setResultModalVisible(false);
                  handleStartPractice(selectedTask);
                }}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Làm lại</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMotivationalTips = () => {
    if (
      !roadmap ||
      !roadmap.motivational_tips ||
      roadmap.motivational_tips.length === 0
    ) {
      return null;
    }

    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 mb-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center mb-4">
          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-2" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Lời khuyên động viên
          </h3>
        </div>
        <div className="space-y-2">
          {roadmap.motivational_tips.map((tip, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 text-gray-700 dark:text-gray-300"
            >
              <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
              <p className="text-sm">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAdaptiveHints = () => {
    if (!roadmap || !roadmap.adaptive_hints) return null;

    const hints = roadmap.adaptive_hints;

    return (
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-6 mb-6 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center mb-4">
          <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400 mr-2" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Gợi ý học tập thông minh
          </h3>
        </div>

        <div className="space-y-4">
          {hints.weakest_topics && hints.weakest_topics.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Chủ đề cần cải thiện:
              </p>
              <div className="flex flex-wrap gap-2">
                {hints.weakest_topics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hints.recommended_focus && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tập trung vào:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hints.recommended_focus}
              </p>
            </div>
          )}

          {hints.time_management_tip && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Quản lý thời gian:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hints.time_management_tip}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => {
    if (loadingHistory) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      );
    }

    if (roadmapHistory.length === 0) {
      return (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Chưa có lịch sử lộ trình học tập
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {roadmapHistory.map((item, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {item.detailedAnalysis?.subject || "Không có môn"}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(item.generatedAt).toLocaleDateString("vi-VN")}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {item.detailedAnalysis?.overall_goal || "Không có mục tiêu"}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Flag className="w-4 h-4 mr-1" />
                  <span>
                    {item.detailedAnalysis?.phases?.length || 0} giai đoạn
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>
                    {item.detailedAnalysis?.estimated_completion_days || 0} ngày
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setRoadmap({
                    roadmap_id:
                      item.detailedAnalysis?.roadmap_id ||
                      `roadmap_${item.resultId}`,
                    result_id: item.resultId,
                    subject: item.detailedAnalysis?.subject,
                    created_at: item.generatedAt,
                    estimated_completion_days:
                      item.detailedAnalysis?.estimated_completion_days || 7,
                    overall_goal: item.detailedAnalysis?.overall_goal,
                    phases: item.detailedAnalysis?.phases || [],
                    motivational_tips:
                      item.detailedAnalysis?.motivational_tips || [],
                    adaptive_hints:
                      item.detailedAnalysis?.adaptive_hints || null,
                    progress_tracking: item.detailedAnalysis
                      ?.progress_tracking || {
                      completion_percent: 0,
                      completed_phases: 0,
                      total_phases: item.detailedAnalysis?.phases?.length || 0,
                    },
                  });
                  extractCompletedTasks({
                    phases: item.detailedAnalysis?.phases || [],
                  });
                  setActiveTab("current");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Đang tải lộ trình học tập...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Lộ trình học tập cá nhân hóa
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Theo dõi tiến trình và hoàn thành các nhiệm vụ của bạn
              </p>
            </div>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("current")}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === "current"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Lộ trình hiện tại
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                if (roadmapHistory.length === 0) {
                  fetchRoadmapHistory();
                }
              }}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === "history"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Lịch sử
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "current" ? (
          <>
            {roadmap ? (
              <>
                {renderProgressBar()}
                {renderMotivationalTips()}
                {renderAdaptiveHints()}

                {/* Phases */}
                <div>
                  {roadmap.phases && roadmap.phases.length > 0 ? (
                    roadmap.phases.map((phase, index) =>
                      renderPhase(phase, index)
                    )
                  ) : (
                    <div className="text-center py-12">
                      <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Không có giai đoạn nào trong lộ trình
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Bạn chưa có lộ trình học tập nào
                </p>
                <button
                  onClick={() => navigate("/student/assessment")}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Làm bài đánh giá để tạo lộ trình
                </button>
              </div>
            )}
          </>
        ) : (
          renderHistoryTab()
        )}
      </div>

      {/* Modals */}
      {renderIncorrectQuestionModal()}
      {renderTaskDetailModal()}
      {renderQuizModal()}
      {renderResultModal()}
    </div>
  );
};

export default StudentLearningRoadmap;
