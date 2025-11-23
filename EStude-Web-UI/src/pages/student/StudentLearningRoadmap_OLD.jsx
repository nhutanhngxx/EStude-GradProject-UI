import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import aiService from "../../services/aiService";
import { useToast } from "../../contexts/ToastContext";

const StudentLearningRoadmap = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const [activeTab, setActiveTab] = useState("current");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapHistory, setRoadmapHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState([0]);
  const [completedTasks, setCompletedTasks] = useState([]);

  const fetchRoadmapLatest = useCallback(async () => {
    try {
      setLoading(true);
      const response = await aiService.getAllRoadmaps(token);

      // API returns array, get first item
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
  }, [token, showToast]);

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

  const markTaskCompleted = (taskId) => {
    if (completedTasks.includes(taskId)) {
      setCompletedTasks(completedTasks.filter((id) => id !== taskId));
      showToast("Đã bỏ đánh dấu hoàn thành", "info");
    } else {
      setCompletedTasks([...completedTasks, taskId]);
      showToast("Đã hoàn thành nhiệm vụ!", "success");
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
        return <BookOpen className="w-4 h-4" />;
      case "LUYỆN_TẬP":
      case "PRACTICE":
        return <Pencil className="w-4 h-4" />;
      case "KIỂM_TRA":
      case "ASSESSMENT":
        return <FileText className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const renderProgressBar = () => {
    if (!roadmap) return null;

    // Use API progress_tracking if available
    const progressTracking = roadmap.progress_tracking;
    const apiProgress = progressTracking?.completion_percent || 0;
    const apiCompletedPhases = progressTracking?.completed_phases || 0;
    const apiTotalPhases =
      progressTracking?.total_phases || roadmap.phases?.length || 0;

    // Calculate from completed tasks
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

    // Use API progress if available, otherwise use calculated
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

        {/* Stats Grid */}
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

  const renderPhase = (phase, index) => {
    const isExpanded = expandedPhases.includes(index);
    const priorityColors = getPriorityColor(phase.priority);

    // Calculate phase progress
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
    const phaseProgress =
      phaseTasksTotal > 0 ? (phaseTasksCompleted / phaseTasksTotal) * 100 : 0;

    return (
      <div
        key={index}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 border-l-4 border-green-600"
      >
        <button
          onClick={() => togglePhase(index)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition rounded-t-xl"
        >
          <div className="flex items-center flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mr-4 shadow-md">
              <span className="text-xl font-bold text-white">
                {phase.phase_number}
              </span>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                {phase.phase_name}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{phase.duration_days} ngày</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors.bg} ${priorityColors.text}`}
                >
                  {priorityColors.label}
                </span>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  <span>
                    {phaseTasksCompleted}/{phaseTasksTotal}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-6 h-6 text-green-600" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="p-6 pt-0 border-t border-gray-200 dark:border-gray-700">
            {/* Topics */}
            {phase.topics && phase.topics.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Chủ đề học tập:
                </h4>
                {phase.topics.map((topic, topicIndex) => (
                  <div
                    key={topicIndex}
                    className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <p className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      {topic.topic}
                    </p>
                    {topic.subtopics?.map((subtopic, subIndex) => (
                      <div
                        key={subIndex}
                        className="ml-4 mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {subtopic.name || subtopic.subtopic}
                          </p>
                          <div className="group relative">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 cursor-help flex items-center">
                              {subtopic.current_accuracy}% →{" "}
                              {subtopic.target_accuracy}%
                              <Info className="w-3.5 h-3.5 ml-1 opacity-50" />
                            </span>
                            {/* Tooltip */}
                            <div className="invisible group-hover:visible absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg z-10">
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-300">
                                    Độ chính xác hiện tại:
                                  </span>
                                  <span className="font-bold text-red-400">
                                    {subtopic.current_accuracy}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-300">
                                    Mục tiêu cần đạt:
                                  </span>
                                  <span className="font-bold text-green-400">
                                    {subtopic.target_accuracy}%
                                  </span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-gray-600">
                                  <span className="text-gray-300">
                                    Cần cải thiện:
                                  </span>
                                  <span className="font-bold text-yellow-400">
                                    +
                                    {subtopic.target_accuracy -
                                      subtopic.current_accuracy}
                                    %
                                  </span>
                                </div>
                              </div>
                              {/* Arrow */}
                              <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45"></div>
                            </div>
                          </div>
                        </div>
                        {subtopic.focus_areas &&
                          subtopic.focus_areas.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Trọng tâm:
                              </p>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                {subtopic.focus_areas.map((area, areaIndex) => (
                                  <li key={areaIndex}>• {area}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        {subtopic.learning_resources &&
                          subtopic.learning_resources.length > 0 && (
                            <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-2">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Tài nguyên học tập:
                              </p>
                              <div className="space-y-2">
                                {subtopic.learning_resources.map(
                                  (resource, resIndex) => (
                                    <a
                                      key={resIndex}
                                      href={resource.url || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`block p-2 bg-blue-50 dark:bg-blue-900/30 rounded transition ${
                                        resource.url
                                          ? "hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                                          : "opacity-50 cursor-not-allowed"
                                      }`}
                                      onClick={(e) =>
                                        !resource.url && e.preventDefault()
                                      }
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center">
                                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 mr-2">
                                              {resource.type === "VIDEO"
                                                ? "🎥"
                                                : "📖"}{" "}
                                              {resource.type}
                                            </span>
                                            {resource.url && (
                                              <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                            )}
                                          </div>
                                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                                            {resource.title}
                                          </p>
                                          {resource.description && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                              {resource.description}
                                            </p>
                                          )}
                                        </div>
                                        {resource.estimated_time_minutes && (
                                          <div className="ml-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                            ⏱️ {resource.estimated_time_minutes}
                                            p
                                          </div>
                                        )}
                                      </div>
                                    </a>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        {subtopic.practice_exercises && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            📝 {subtopic.practice_exercises} bài tập luyện tập
                          </div>
                        )}
                        {subtopic.incorrect_questions_review &&
                          subtopic.incorrect_questions_review.length > 0 && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs">
                              <p className="font-semibold text-red-700 dark:text-red-400 mb-1">
                                ⚠️ Câu hỏi cần ôn lại:{" "}
                                {subtopic.incorrect_questions_review.length}
                              </p>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Phase Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tiến độ giai đoạn
                </span>
                <span className="text-sm font-bold text-green-600 dark:text-green-500">
                  {phaseTasksCompleted}/{phaseTasksTotal} nhiệm vụ
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                  style={{ width: `${phaseProgress}%` }}
                />
              </div>
            </div>

            {/* Daily Tasks */}
            {phase.daily_tasks && phase.daily_tasks.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-green-600" />
                  Nhiệm vụ hàng ngày
                </h4>
                {phase.daily_tasks.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">
                            {day.day}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Ngày {day.day}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                        <Timer className="w-4 h-4 mr-1" />
                        {day.tasks?.reduce(
                          (sum, t) => sum + (t.duration_minutes || 0),
                          0
                        ) || 0}{" "}
                        phút
                      </span>
                    </div>
                    <div className="space-y-3">
                      {day.tasks?.map((task, taskIndex) => {
                        const isCompleted =
                          task.completed ||
                          completedTasks.includes(task.task_id);
                        return (
                          <div
                            key={taskIndex}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isCompleted
                                ? "border-green-500 bg-white dark:bg-gray-800 shadow-sm"
                                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-start">
                              <button
                                onClick={() => markTaskCompleted(task.task_id)}
                                className="mr-3 mt-1 transition-transform hover:scale-110"
                              >
                                {isCompleted ? (
                                  <CircleCheck className="w-6 h-6 text-green-600" />
                                ) : (
                                  <Circle className="w-6 h-6 text-gray-400 hover:text-green-500" />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <p
                                    className={`font-medium ${
                                      isCompleted
                                        ? "text-gray-500 line-through"
                                        : "text-gray-900 dark:text-gray-100"
                                    }`}
                                  >
                                    {task.title}
                                  </p>
                                  {isCompleted && (
                                    <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                      Hoàn thành
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 text-sm">
                                  <div
                                    className={`flex items-center ${
                                      isCompleted
                                        ? "text-gray-400"
                                        : "text-gray-600 dark:text-gray-400"
                                    }`}
                                  >
                                    <span className="mr-1">
                                      {getTaskIcon(task.type)}
                                    </span>
                                    <span className="font-medium">
                                      {task.type === "HỌC"
                                        ? "Học"
                                        : task.type === "LUYỆN_TẬP"
                                        ? "Luyện tập"
                                        : task.type === "KIỂM_TRA"
                                        ? "Kiểm tra"
                                        : task.type}
                                    </span>
                                  </div>
                                  <div
                                    className={`flex items-center ${
                                      isCompleted
                                        ? "text-gray-400"
                                        : "text-gray-600 dark:text-gray-400"
                                    }`}
                                  >
                                    <Timer className="w-4 h-4 mr-1" />
                                    <span>{task.duration_minutes} phút</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Milestone */}
            {phase.milestone && (
              <div className="mt-6 p-6 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-amber-300 dark:border-amber-700 shadow-md">
                <div className="flex items-start mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mr-3 shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">
                      {phase.milestone.name}
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <Target className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {phase.milestone.criteria}
                        </p>
                      </div>
                      {phase.milestone.assessment_type && (
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full font-semibold">
                            {phase.milestone.assessment_type}
                          </span>
                          {phase.milestone.num_questions && (
                            <span className="text-gray-600 dark:text-gray-400">
                              {phase.milestone.num_questions} câu hỏi
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCurrentTab = () => {
    if (!roadmap) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-6">
            <MapPin className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">
            Chưa có lộ trình học tập
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md px-4">
            AI chưa tạo lộ trình học tập cho bạn. Hãy làm bài đánh giá để AI
            phân tích và tạo lộ trình cá nhân hóa.
          </p>
          <button
            onClick={() => navigate("/student/assessment")}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition shadow-lg font-semibold flex items-center"
          >
            <Target className="w-5 h-5 mr-2" />
            Làm bài đánh giá ngay
          </button>
        </div>
      );
    }

    return (
      <div>
        {/* Overall Goal */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg p-6 mb-6 border-l-4 border-green-600">
          <div className="flex items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mr-4 shadow-md">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Mục tiêu tổng thể
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {roadmap.overall_goal}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600 dark:text-green-500" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Thời gian
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {roadmap.estimated_completion_days} ngày
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Flag className="w-5 h-5 mr-2 text-green-600 dark:text-green-500" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Giai đoạn
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {roadmap.phases?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-green-600 dark:text-green-500" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Môn học
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {roadmap.subject}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Note */}
        <div className="mb-6 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
            <span className="font-semibold">Lưu ý:</span> Lộ trình được thiết kế
            bởi AI, nên có thể một số đường dẫn tài liệu bị sai. Học sinh có thể
            tự tìm tài liệu theo tên hiển thị.
          </p>
        </div>

        {renderProgressBar()}

        {/* Adaptive Hints */}
        {roadmap.adaptive_hints && (
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl shadow-lg p-6 mb-6 border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mr-3 shadow-md">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Gợi ý học tập thông minh
              </h3>
            </div>
            <div className="space-y-4">
              {roadmap.adaptive_hints.learning_style_match && (
                <div className="flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-lg">🎨</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {roadmap.adaptive_hints.learning_style_match}
                  </p>
                </div>
              )}
              {roadmap.adaptive_hints.time_management && (
                <div className="flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-lg">⏰</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {roadmap.adaptive_hints.time_management}
                  </p>
                </div>
              )}
              {roadmap.adaptive_hints.difficulty_progression && (
                <div className="flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-lg">📈</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {roadmap.adaptive_hints.difficulty_progression}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Motivational Tips */}
        {roadmap.motivational_tips && roadmap.motivational_tips.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-lg p-6 mb-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3 shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Lời khuyên động viên
              </h3>
            </div>
            <div className="space-y-3">
              {roadmap.motivational_tips.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phases */}
        <div className="flex items-center mb-6">
          <Flag className="w-6 h-6 mr-3 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Các giai đoạn học tập
          </h2>
        </div>
        {roadmap.phases &&
          roadmap.phases.map((phase, index) => renderPhase(phase, index))}
      </div>
    );
  };

  const renderHistoryTab = () => {
    if (loadingHistory) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Đang tải lịch sử...
            </p>
          </div>
        </div>
      );
    }

    if (roadmapHistory.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Clock className="w-20 h-20 text-gray-400 mb-4" />
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Chưa có lịch sử lộ trình
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            Các lộ trình bạn đã tạo sẽ hiển thị ở đây
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {roadmapHistory.map((item, index) => {
          const createdDate = new Date(
            item.createdAt || item.created_at || Date.now()
          );
          const subject =
            item.detailedAnalysis?.subject || item.subject || "Môn học";
          const overallGoal =
            item.detailedAnalysis?.overall_goal ||
            item.overall_goal ||
            "Mục tiêu học tập";

          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() => navigate("/student/learning-roadmap")}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <BookOpen className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">
                      {subject}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {createdDate.toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400 transform rotate-[-90deg]" />
              </div>
              <p className="text-gray-700 dark:text-gray-300">{overallGoal}</p>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-green-200 dark:border-green-800 border-t-green-600 dark:border-t-green-500 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            Đang tải lộ trình học tập...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 dark:from-gray-900 dark:to-green-900/10 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                Lộ trình Học tập
              </h1>
              <p className="text-green-100 mt-1">
                Lộ trình học tập được AI tạo dựa trên năng lực của bạn
              </p>
            </div>
          </div>
          {activeTab === "current" && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-3 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-6 h-6 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-2 shadow">
        <button
          onClick={() => setActiveTab("current")}
          className={`flex-1 px-6 py-3 font-semibold transition rounded-lg ${
            activeTab === "current"
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <div className="flex items-center justify-center">
            <Flag className="w-5 h-5 mr-2" />
            <span>Mục tiêu tổng thể</span>
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            if (roadmapHistory.length === 0) {
              fetchRoadmapHistory();
            }
          }}
          className={`flex-1 px-6 py-3 font-semibold transition rounded-lg ${
            activeTab === "history"
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <div className="flex items-center justify-center">
            <Clock className="w-5 h-5 mr-2" />
            <span>Lịch sử</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "current" ? renderCurrentTab() : renderHistoryTab()}
    </div>
  );
};

export default StudentLearningRoadmap;
