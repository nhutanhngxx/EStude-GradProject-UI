import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../../contexts/ToastContext";
import aiService from "../../services/aiService";
import { useAuth } from "../../contexts/AuthContext";

const themeColors = {
  primary: "#4CAF50", // Xanh lá chủ đạo
  secondary: "#43A047", // Xanh lá đậm hơn để phối
  accent: "#B2FF59", // Xanh neon accent nổi bật

  success: "#4CAF50", // Thành công = màu chủ đạo
  warning: "#FFB300", // Vàng cảnh báo
  error: "#E53935", // Đỏ cảnh báo

  background: "#FFFFFF", // Nền trắng
  card: "#F4FFF5", // Trắng pha xanh rất nhẹ, tạo chiều sâu

  text: "#1B5E20", // Xanh lá đậm (dễ đọc)
  textLight: "#4C8C4A", // Xanh lá nhạt hơn cho subtitle
};

const { width } = Dimensions.get("window");

/**
 * Màn hình Lộ Trình Học Tập Cá Nhân Hóa với 2 Tabs
 * Tab 1: Mục tiêu tổng thể (Current Roadmap)
 * Tab 2: Lịch sử (All Roadmaps)
 *
 * Props:
 * - route.params.roadmap: Dữ liệu lộ trình từ API (đã được fetch sẵn)
 * - route.params.evaluation: Dữ liệu đánh giá từ Layer 4
 * - route.params.resultId: AI Analysis Result ID (dùng để update progress)
 */

export default function AssessmentLearningRoadmapScreen({ route, navigation }) {
  const { roadmap: initialRoadmap, evaluation, resultId } = route.params;
  const { showToast } = useToast();
  const { token } = useAuth();

  console.log("🔍 AssessmentLearningRoadmapScreen params:", {
    hasInitialRoadmap: !!initialRoadmap,
    resultId: resultId,
    hasEvaluation: !!evaluation,
  });

  const [roadmap, setRoadmap] = useState(initialRoadmap || null);
  const [loading, setLoading] = useState(!initialRoadmap);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [expandedPhases, setExpandedPhases] = useState([0]); // Phase đầu mở mặc định
  const [updatingTask, setUpdatingTask] = useState(null); // Track task being updated

  // Tab navigation state
  const [activeTab, setActiveTab] = useState("current"); // "current" | "history"
  const [roadmapHistory, setRoadmapHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal state for incorrect question details
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionModalVisible, setQuestionModalVisible] = useState(false);

  // Modal state for task details
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);

  // Modal state for practice quiz
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Modal state for quiz result
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      title: "Lộ trình Học Tập",
      headerStyle: {
        backgroundColor: themeColors.primary,
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    });

    // Nếu không có roadmap từ params, fetch từ API
    if (!initialRoadmap && resultId) {
      fetchRoadmapProgress();
    } else if (!initialRoadmap) {
      showToast("Không có dữ liệu lộ trình!", { type: "error" });
      setLoading(false);
      // Fallback to mock data for demo
      setTimeout(() => {
        setRoadmap(MOCK_ROADMAP_DATA);
        setLoading(false);
      }, 1000);
    } else {
      // Extract completed tasks from roadmap data
      extractCompletedTasks(initialRoadmap);
      setLoading(false);
    }
  }, [navigation, initialRoadmap, resultId]);

  /**
   * Fetch full roadmap with progress từ Backend
   */
  const fetchRoadmapProgress = async () => {
    try {
      setLoading(true);

      // Gọi API getRoadmapLatest để lấy full data
      // Response: { resultId, detailedAnalysis: { subject, phases, roadmap_id, ... } }
      const response = await aiService.getRoadmapLatest(token);

      if (response && response.detailedAnalysis) {
        console.log("✅ Fetched roadmap data:", response);

        // Use detailedAnalysis directly as it already has correct structure
        const roadmapData = {
          ...response.detailedAnalysis,
          resultId: response.resultId, // Add resultId for API calls
        };

        setRoadmap(roadmapData);
        extractCompletedTasks(roadmapData);
      } else {
        showToast("Không thể tải lộ trình học tập", { type: "error" });
        // Fallback to mock
        setRoadmap(MOCK_ROADMAP_DATA);
      }
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      showToast("Lỗi khi tải lộ trình", { type: "error" });
      // Fallback to mock
      setRoadmap(MOCK_ROADMAP_DATA);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Extract danh sách task_id đã completed từ roadmap
   */
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
    console.log("📋 Extracted completed tasks:", completed);
  };

  /**
   * Fetch all roadmaps history
   */
  const fetchRoadmapHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await aiService.getAllRoadmaps(token);

      if (response && Array.isArray(response)) {
        console.log("✅ Fetched roadmap history:", response.length, "items");
        setRoadmapHistory(response);
      } else {
        setRoadmapHistory([]);
      }
    } catch (error) {
      console.error("Error fetching roadmap history:", error);
      showToast("Lỗi khi tải lịch sử lộ trình", { type: "error" });
      setRoadmapHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const togglePhase = (phaseIndex) => {
    if (expandedPhases.includes(phaseIndex)) {
      setExpandedPhases(expandedPhases.filter((i) => i !== phaseIndex));
    } else {
      setExpandedPhases([...expandedPhases, phaseIndex]);
    }
  };

  const markTaskCompleted = async (taskId, completionData = {}) => {
    // Get resultId from params or roadmap object
    const effectiveResultId =
      resultId || roadmap?.resultId || roadmap?.result_id;

    // Nếu không có resultId, chỉ update local state
    if (!effectiveResultId) {
      if (completedTasks.includes(taskId)) {
        setCompletedTasks(completedTasks.filter((id) => id !== taskId));
        showToast("Đã bỏ đánh dấu hoàn thành", { type: "info" });
      } else {
        setCompletedTasks([...completedTasks, taskId]);
        showToast("Đã hoàn thành nhiệm vụ! 🎉", { type: "success" });
      }
      return;
    }

    // Call API để update progress
    try {
      setUpdatingTask(taskId);

      const isCurrentlyCompleted = completedTasks.includes(taskId);

      if (isCurrentlyCompleted) {
        // Uncomplete task
        setCompletedTasks(completedTasks.filter((id) => id !== taskId));
        showToast("Đã bỏ đánh dấu hoàn thành", { type: "info" });
        setUpdatingTask(null);
        return;
      }

      // Optimistic update - Update UI trước
      setCompletedTasks([...completedTasks, taskId]);
      showToast("Đã hoàn thành nhiệm vụ! 🎉", { type: "success" });

      // Gọi API update (nếu có)
      try {
        const response = await aiService.markTaskComplete(
          effectiveResultId,
          taskId,
          {
            actualTimeSpent: completionData.time_spent || 30,
            score: completionData.score || 10,
            accuracy: completionData.accuracy || 1.0,
          },
          token
        );

        console.log("✅ Task marked complete on backend:", response);

        // Refresh roadmap nếu Backend trả về success
        if (response && response.success) {
          // Optional: Có thể refresh để sync với Backend
          // await fetchRoadmapProgress();
        }
      } catch (apiError) {
        console.log("⚠️ API call failed, but local state updated:", apiError);
        // Vẫn giữ local update ngay cả khi API fail
      }
    } catch (error) {
      console.error("Error marking task completed:", error);
      showToast("Lỗi khi cập nhật task", { type: "error" });
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleOpenResource = async (resource) => {
    const resourceUrl = resource.url || resource.resource_url;
    const resourceTitle = resource.title;
    const resourceType = resource.type;

    // Nếu không có URL
    if (!resourceUrl) {
      Alert.alert(
        "Link không khả dụng",
        `Tài liệu "${resourceTitle}" chưa có link.\n\n💡 Bạn có thể tự tìm kiếm:\n- Trên Google: "${resourceTitle}"\n- Trên YouTube (nếu là video)\n- Trên các trang giáo dục trực tuyến`,
        [{ text: "Đã hiểu" }]
      );
      return;
    }

    Alert.alert(
      resourceTitle,
      `Loại: ${resourceType}\nThời gian: ${resource.duration_minutes} phút\n\nBạn có muốn mở tài liệu này không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Mở",
          onPress: async () => {
            try {
              // Kiểm tra xem URL có thể mở được không
              const canOpen = await Linking.canOpenURL(resourceUrl);

              if (canOpen) {
                // Mở URL trong trình duyệt
                await Linking.openURL(resourceUrl);
                showToast(`Đang mở: ${resourceTitle}`, { type: "success" });
              } else {
                // URL không hợp lệ hoặc không thể mở
                Alert.alert(
                  "Link bị hỏng",
                  `Không thể mở link này.\n\nURL: ${resourceUrl}\n\n💡 Gợi ý:\n- Tìm kiếm "${resourceTitle}" trên Google\n- Tìm video tương tự trên YouTube\n- Kiểm tra tài liệu trên trang web giáo dục`,
                  [
                    { text: "Đóng", style: "cancel" },
                    {
                      text: "Tìm trên Google",
                      onPress: () => {
                        const searchQuery = encodeURIComponent(resourceTitle);
                        Linking.openURL(
                          `https://www.google.com/search?q=${searchQuery}`
                        );
                      },
                    },
                  ]
                );
              }
            } catch (error) {
              console.error("Error opening URL:", error);
              // Lỗi khi mở URL
              Alert.alert(
                "Không thể mở link",
                `Link có vẻ bị hỏng hoặc không tồn tại.\n\n💡 Bạn có thể:\n1. Tìm kiếm "${resourceTitle}" trên Google\n2. Tìm video tương tự trên YouTube\n3. Hỏi giáo viên về tài liệu thay thế`,
                [
                  { text: "Đóng", style: "cancel" },
                  {
                    text: "Tìm trên Google",
                    onPress: () => {
                      const searchQuery = encodeURIComponent(resourceTitle);
                      Linking.openURL(
                        `https://www.google.com/search?q=${searchQuery}`
                      );
                    },
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const handleStartPractice = (task) => {
    // Check if has practice_set
    if (task.practice_set && task.practice_set.length > 0) {
      // Start practice quiz
      setSelectedTask(task);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setQuizStartTime(Date.now());
      setQuizModalVisible(true);
    } else {
      // Show task detail modal if no practice set
      setSelectedTask(task);
      setTaskModalVisible(true);
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
      // Calculate results
      const totalQuestions = selectedTask.practice_set.length;
      let correctCount = 0;

      selectedTask.practice_set.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        // Normalize answers: remove dot and trim ("A." -> "A", "C" -> "C")
        const normalizedUserAnswer = userAnswer?.replace(".", "").trim();
        const normalizedCorrectAnswer = question.correct_answer
          ?.replace(".", "")
          .trim();

        console.log(`Question ${index + 1}:`, {
          userAnswer,
          normalizedUserAnswer,
          correctAnswer: question.correct_answer,
          normalizedCorrectAnswer,
          isCorrect: normalizedUserAnswer === normalizedCorrectAnswer,
        });

        if (normalizedUserAnswer === normalizedCorrectAnswer) {
          correctCount++;
        }
      });

      const accuracy = correctCount / totalQuestions;
      const score = Math.round(accuracy * 10); // Score out of 10
      const timeSpentMinutes = Math.round((Date.now() - quizStartTime) / 60000);

      // Close quiz modal and show result modal
      setQuizModalVisible(false);

      // Store result data
      setQuizResult({
        score,
        accuracy,
        timeSpentMinutes,
        correctCount,
        totalQuestions,
        passed: score >= 5,
      });

      // Show result modal
      setResultModalVisible(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      showToast("Lỗi khi nộp bài", { type: "error" });
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleViewIncorrectQuestion = (question) => {
    setSelectedQuestion(question);
    setQuestionModalVisible(true);
  };

  const renderOverallGoal = () => {
    if (!roadmap) return null;

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Ionicons name="flag" size={28} color={themeColors.primary} />
          <Text style={styles.goalTitle}>Mục tiêu tổng thể</Text>
        </View>
        <Text style={styles.goalText}>{roadmap.overall_goal}</Text>
        <View style={styles.goalStats}>
          <View style={styles.goalStatItem}>
            <Ionicons name="calendar" size={20} color={themeColors.primary} />
            <Text style={styles.goalStatText}>
              {roadmap.estimated_completion_days} ngày
            </Text>
          </View>
          <View style={styles.goalStatItem}>
            <Ionicons name="layers" size={20} color={themeColors.primary} />
            <Text style={styles.goalStatText}>
              {roadmap.phases?.length || 0} giai đoạn
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderProgressBar = () => {
    if (!roadmap) return null;

    // Tính progress real-time từ completedTasks state
    let totalTasks = 0;
    let totalPhases = roadmap.phases?.length || 0;
    let completedPhases = 0;

    // Đếm tổng tasks và tasks đã hoàn thành
    if (roadmap.phases) {
      roadmap.phases.forEach((phase) => {
        let phaseTasksTotal = 0;
        let phaseTasksCompleted = 0;

        if (phase.daily_tasks) {
          phase.daily_tasks.forEach((day) => {
            if (day.tasks) {
              phaseTasksTotal += day.tasks.length;
              day.tasks.forEach((task) => {
                if (completedTasks.includes(task.task_id)) {
                  phaseTasksCompleted++;
                }
              });
            }
          });
        }

        totalTasks += phaseTasksTotal;

        // Nếu tất cả tasks trong phase đã hoàn thành
        if (phaseTasksTotal > 0 && phaseTasksCompleted === phaseTasksTotal) {
          completedPhases++;
        }
      });
    }

    const tasksCompleted = completedTasks.length;

    // Use progress from progress_tracking if available, otherwise calculate
    let progress = 0;
    if (roadmap.progress_tracking) {
      progress =
        roadmap.progress_tracking.completion_percent ||
        roadmap.progress_tracking.completion_percentage ||
        0;
    }

    // Fallback to calculated progress if not provided
    if (progress === 0 && totalTasks > 0) {
      progress = (tasksCompleted / totalTasks) * 100;
    }

    console.log("📊 Progress calculation:", {
      completedTasks: completedTasks,
      tasksCompleted,
      totalTasks,
      progress: progress.toFixed(1),
      completedPhases,
      totalPhases,
    });

    return (
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Tiến độ hoàn thành</Text>
          <Text style={styles.progressPercentage}>{progress.toFixed(0)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.progressStats}>
          <Text style={styles.progressStatText}>
            {tasksCompleted} / {totalTasks} nhiệm vụ
          </Text>
          <Text style={styles.progressStatText}>
            {completedPhases} / {totalPhases} giai đoạn
          </Text>
        </View>
      </View>
    );
  };

  const renderPhase = (phase, index) => {
    const isExpanded = expandedPhases.includes(index);
    const isCurrentPhase = index === currentPhase;

    const getPriorityColor = (priority) => {
      switch (priority) {
        case "HIGH":
          return themeColors.error;
        case "MEDIUM":
          return themeColors.warning;
        case "LOW":
          return themeColors.success;
        default:
          return themeColors.textLight;
      }
    };

    return (
      <View key={index} style={styles.phaseCard}>
        <TouchableOpacity
          style={styles.phaseHeader}
          onPress={() => togglePhase(index)}
        >
          <View style={styles.phaseHeaderLeft}>
            <View
              style={[
                styles.phaseNumber,
                isCurrentPhase && styles.phaseNumberActive,
              ]}
            >
              <Text
                style={[
                  styles.phaseNumberText,
                  isCurrentPhase && styles.phaseNumberTextActive,
                ]}
              >
                {phase.phase_number}
              </Text>
            </View>
            <View style={styles.phaseInfo}>
              <Text style={styles.phaseName}>{phase.phase_name}</Text>
              <View style={styles.phaseMeta}>
                <Ionicons name="time" size={14} color={themeColors.textLight} />
                <Text style={styles.phaseMetaText}>
                  {phase.duration_days} ngày
                </Text>
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor: `${getPriorityColor(phase.priority)}20`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      { color: getPriorityColor(phase.priority) },
                    ]}
                  >
                    {phase.priority}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={themeColors.textLight}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.phaseContent}>
            {/* Topics */}
            {phase.topics &&
              phase.topics.map((topic, topicIndex) => (
                <View key={topicIndex} style={styles.topicSection}>
                  <Text style={styles.topicTitle}>{topic.topic}</Text>

                  {/* Subtopics */}
                  {topic.subtopics &&
                    topic.subtopics.map((subtopic, subIndex) => (
                      <View key={subIndex} style={styles.subtopicCard}>
                        <View style={styles.subtopicHeader}>
                          <Ionicons
                            name="bookmark"
                            size={16}
                            color={themeColors.primary}
                          />
                          <Text style={styles.subtopicName}>
                            {subtopic.name || subtopic.subtopic}
                          </Text>
                        </View>

                        <View style={styles.accuracyRow}>
                          <Text style={styles.accuracyLabel}>
                            Độ chính xác:
                          </Text>
                          <Text style={styles.accuracyValue}>
                            {subtopic.current_accuracy}% →{" "}
                            {subtopic.target_accuracy}%
                          </Text>
                        </View>

                        {/* Focus Areas */}
                        {subtopic.focus_areas &&
                          subtopic.focus_areas.length > 0 && (
                            <View style={styles.focusSection}>
                              <Text style={styles.focusTitle}>
                                Điểm cần tập trung:
                              </Text>
                              {subtopic.focus_areas.map((area, areaIndex) => (
                                <View key={areaIndex} style={styles.focusItem}>
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={themeColors.success}
                                  />
                                  <Text style={styles.focusText}>{area}</Text>
                                </View>
                              ))}
                            </View>
                          )}

                        {/* Learning Resources */}
                        {subtopic.learning_resources &&
                          subtopic.learning_resources.length > 0 && (
                            <View style={styles.resourcesSection}>
                              <Text style={styles.resourcesTitle}>
                                Tài liệu học tập:
                              </Text>
                              <View style={styles.aiNoteBox}>
                                <Ionicons
                                  name="information-circle-outline"
                                  size={18}
                                  color="#1565c0"
                                />
                                <Text style={styles.aiNoteText}>
                                  Lộ trình được thiết kế bởi AI, nên có thể một
                                  số đường dẫn tài liệu bị sai. Học sinh có thể
                                  tự tìm tài liệu theo tên hiển thị.
                                </Text>
                              </View>
                              {subtopic.learning_resources.map(
                                (resource, resIndex) => (
                                  <TouchableOpacity
                                    key={resIndex}
                                    style={styles.resourceItem}
                                    onPress={() => handleOpenResource(resource)}
                                  >
                                    <Ionicons
                                      name={
                                        resource.type === "VIDEO"
                                          ? "play-circle"
                                          : resource.type === "ARTICLE"
                                          ? "document-text"
                                          : "game-controller"
                                      }
                                      size={20}
                                      color={themeColors.primary}
                                    />
                                    <View style={styles.resourceInfo}>
                                      <Text style={styles.resourceTitle}>
                                        {resource.title}
                                      </Text>
                                      <Text style={styles.resourceMeta}>
                                        {resource.type} •{" "}
                                        {resource.estimated_time_minutes ||
                                          resource.duration_minutes ||
                                          0}{" "}
                                        phút
                                      </Text>
                                    </View>
                                    <Ionicons
                                      name="open-outline"
                                      size={18}
                                      color={themeColors.textLight}
                                    />
                                  </TouchableOpacity>
                                )
                              )}
                            </View>
                          )}

                        {/* Incorrect Questions Review */}
                        {subtopic.incorrect_questions_review &&
                          subtopic.incorrect_questions_review.length > 0 && (
                            <View style={styles.reviewSection}>
                              <Text style={styles.reviewTitle}>
                                Ôn lại câu sai:
                              </Text>
                              {subtopic.incorrect_questions_review.map(
                                (q, qIndex) => (
                                  <TouchableOpacity
                                    key={qIndex}
                                    style={styles.reviewItem}
                                    onPress={() =>
                                      handleViewIncorrectQuestion(q)
                                    }
                                  >
                                    <View style={styles.reviewIcon}>
                                      <Ionicons
                                        name="close-circle"
                                        size={20}
                                        color={themeColors.error}
                                      />
                                    </View>
                                    <View style={styles.reviewInfo}>
                                      <Text
                                        style={styles.reviewQuestion}
                                        numberOfLines={2}
                                      >
                                        {q.question_text}
                                      </Text>
                                      <Text style={styles.reviewTip}>
                                        💡 {q.tip}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                )
                              )}
                            </View>
                          )}
                      </View>
                    ))}
                </View>
              ))}

            {/* Daily Tasks */}
            <View style={styles.dailyTasksSection}>
              <Text style={styles.dailyTasksTitle}>Nhiệm vụ hàng ngày</Text>
              {phase.daily_tasks &&
                phase.daily_tasks.map((day, dayIndex) => (
                  <View key={dayIndex} style={styles.dayCard}>
                    <View style={styles.dayHeader}>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={themeColors.primary}
                      />
                      <Text style={styles.dayTitle}>Ngày {day.day}</Text>
                      <Text style={styles.dayTime}>
                        {day.total_time_minutes} phút
                      </Text>
                    </View>

                    {day.tasks &&
                      day.tasks.map((task, taskIndex) => {
                        const isCompleted = completedTasks.includes(
                          task.task_id
                        );
                        const isUpdating = updatingTask === task.task_id;

                        return (
                          <TouchableOpacity
                            key={taskIndex}
                            style={[
                              styles.taskItem,
                              isCompleted && styles.taskItemCompleted,
                            ]}
                            disabled={isUpdating}
                            onPress={() => {
                              if (
                                task.type === "PRACTICE" ||
                                task.type === "ASSESSMENT"
                              ) {
                                handleStartPractice(task);
                              } else if (
                                task.type === "WATCH_VIDEO" ||
                                task.type === "READ_ARTICLE"
                              ) {
                                handleOpenResource({
                                  title: task.title,
                                  type: task.type,
                                  duration_minutes: task.duration_minutes,
                                  url: task.resource_url,
                                });
                              } else if (task.type === "LEARN") {
                                // Show learning content modal or navigate
                                handleViewLearningContent(task);
                              } else {
                                markTaskCompleted(task.task_id);
                              }
                            }}
                          >
                            <TouchableOpacity
                              style={styles.taskCheckbox}
                              disabled={isUpdating}
                              onPress={() => markTaskCompleted(task.task_id)}
                            >
                              {isUpdating ? (
                                <ActivityIndicator
                                  size="small"
                                  color={themeColors.primary}
                                />
                              ) : (
                                <Ionicons
                                  name={
                                    isCompleted
                                      ? "checkmark-circle"
                                      : "ellipse-outline"
                                  }
                                  size={24}
                                  color={
                                    isCompleted
                                      ? themeColors.success
                                      : themeColors.textLight
                                  }
                                />
                              )}
                            </TouchableOpacity>

                            <View style={styles.taskInfo}>
                              <Text
                                style={[
                                  styles.taskTitle,
                                  isCompleted && styles.taskTitleCompleted,
                                ]}
                              >
                                {task.title}
                              </Text>
                              <View style={styles.taskMeta}>
                                <Ionicons
                                  name={
                                    task.type === "WATCH_VIDEO"
                                      ? "play"
                                      : task.type === "PRACTICE"
                                      ? "pencil"
                                      : task.type === "ASSESSMENT"
                                      ? "clipboard"
                                      : task.type === "LEARN"
                                      ? "bulb"
                                      : "book"
                                  }
                                  size={12}
                                  color={themeColors.textLight}
                                />
                                <Text style={styles.taskMetaText}>
                                  {task.duration_minutes || 0} phút
                                </Text>
                                {task.score && (
                                  <Text style={styles.taskScore}>
                                    {" "}
                                    • Điểm: {task.score}
                                  </Text>
                                )}
                              </View>
                            </View>

                            <Ionicons
                              name="chevron-forward"
                              size={18}
                              color={themeColors.textLight}
                            />
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                ))}
            </View>

            {/* Milestone */}
            {phase.milestone && (
              <View style={styles.milestoneCard}>
                <View style={styles.milestoneHeader}>
                  <Ionicons
                    name="trophy"
                    size={24}
                    color={themeColors.accent}
                  />
                  <Text style={styles.milestoneTitle}>Mốc đánh giá</Text>
                </View>
                <Text style={styles.milestoneName}>{phase.milestone.name}</Text>
                <Text style={styles.milestoneCriteria}>
                  🎯 {phase.milestone.criteria}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderMotivationTips = () => {
    if (!roadmap || !roadmap.motivational_tips) return null;

    return (
      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Ionicons name="sparkles" size={20} color={themeColors.accent} />
          <Text style={styles.tipsTitle}>Lời khuyên động viên</Text>
        </View>
        {roadmap.motivational_tips &&
          roadmap.motivational_tips.map((tip, index) => (
            <Text key={index} style={styles.tipText}>
              • {tip}
            </Text>
          ))}
      </View>
    );
  };

  /**
   * Render Tab Buttons
   */
  const renderTabs = () => {
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "current" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("current")}
        >
          <Ionicons
            name="flag"
            size={20}
            color={
              activeTab === "current"
                ? themeColors.primary
                : themeColors.textLight
            }
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "current" && styles.tabButtonTextActive,
            ]}
          >
            Mục tiêu tổng thể
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "history" && styles.tabButtonActive,
          ]}
          onPress={() => {
            setActiveTab("history");
            if (roadmapHistory.length === 0) {
              fetchRoadmapHistory();
            }
          }}
        >
          <Ionicons
            name="time"
            size={20}
            color={
              activeTab === "history"
                ? themeColors.primary
                : themeColors.textLight
            }
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "history" && styles.tabButtonTextActive,
            ]}
          >
            Lịch sử
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render History Item
   */
  const renderHistoryItem = ({ item }) => {
    const createdDate = new Date(
      item.createdAt || item.created_at || Date.now()
    );
    const formattedDate = createdDate.toLocaleDateString("vi-VN");
    const subject = item.detailedAnalysis?.subject || item.subject || "Môn học";
    const overallGoal =
      item.detailedAnalysis?.overall_goal ||
      item.overall_goal ||
      "Mục tiêu học tập";

    // Tính progress (support both old and new structure)
    let progress = 0;
    if (item.detailedAnalysis?.progress_tracking) {
      progress =
        item.detailedAnalysis.progress_tracking.completion_percent ||
        item.detailedAnalysis.progress_tracking.completion_percentage ||
        0;
    }

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => {
          // Navigate to detail with this roadmap
          const roadmapData = {
            roadmap_id: `roadmap_${item.resultId}`,
            result_id: item.resultId,
            subject: subject,
            overall_goal: overallGoal,
            phases: item.detailedAnalysis?.phases || [],
            motivational_tips: item.detailedAnalysis?.motivational_tips || [],
            estimated_completion_days:
              item.detailedAnalysis?.estimated_completion_days || 7,
            progress_tracking: item.detailedAnalysis?.progress_tracking || {},
          };

          navigation.push("AssessmentLearningRoadmap", {
            roadmap: roadmapData,
            resultId: item.resultId,
            evaluation: null,
          });
        }}
      >
        <View style={styles.historyHeader}>
          <View style={styles.historyLeft}>
            <Ionicons
              name="document-text"
              size={24}
              color={themeColors.primary}
            />
            <View style={styles.historyInfo}>
              <Text style={styles.historySubject}>{subject}</Text>
              <Text style={styles.historyDate}>{formattedDate}</Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={themeColors.textLight}
          />
        </View>

        <Text style={styles.historyGoal} numberOfLines={2}>
          {overallGoal}
        </Text>

        {progress > 0 && (
          <View style={styles.historyProgressContainer}>
            <Text style={styles.historyProgressText}>
              Tiến độ: {progress.toFixed(0)}%
            </Text>
            <View style={styles.historyProgressBar}>
              <View
                style={[styles.historyProgressFill, { width: `${progress}%` }]}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render History Tab Content
   */
  const renderHistoryTab = () => {
    if (loadingHistory) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
        </View>
      );
    }

    if (roadmapHistory.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="folder-open-outline"
            size={64}
            color={themeColors.textLight}
          />
          <Text style={styles.emptyText}>Chưa có lịch sử lộ trình</Text>
          <Text style={styles.emptySubtext}>
            Các lộ trình bạn đã tạo sẽ hiển thị ở đây
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={roadmapHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) =>
          item.resultId?.toString() || index.toString()
        }
        contentContainerStyle={styles.historyList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  /**
   * Render Practice Quiz Modal
   */
  const renderPracticeQuizModal = () => {
    if (
      !selectedTask ||
      !selectedTask.practice_set ||
      selectedTask.practice_set.length === 0
    ) {
      return null;
    }

    const currentQuestion = selectedTask.practice_set[currentQuestionIndex];
    const totalQuestions = selectedTask.practice_set.length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const canProceed = userAnswers[currentQuestionIndex] !== undefined;

    return (
      <Modal
        visible={quizModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          Alert.alert(
            "Thoát bài tập?",
            "Bạn có chắc muốn thoát? Tiến trình sẽ không được lưu.",
            [
              { text: "Ở lại", style: "cancel" },
              {
                text: "Thoát",
                style: "destructive",
                onPress: () => {
                  setQuizModalVisible(false);
                  setUserAnswers({});
                },
              },
            ]
          );
        }}
      >
        <View style={styles.quizContainer}>
          {/* Header */}
          <View style={styles.quizHeader}>
            <View style={styles.quizHeaderTop}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Thoát bài tập?",
                    "Bạn có chắc muốn thoát? Tiến trình sẽ không được lưu.",
                    [
                      { text: "Ở lại", style: "cancel" },
                      {
                        text: "Thoát",
                        style: "destructive",
                        onPress: () => {
                          setQuizModalVisible(false);
                          setUserAnswers({});
                        },
                      },
                    ]
                  );
                }}
                style={styles.quizCloseButton}
              >
                <Ionicons name="close" size={28} color={themeColors.text} />
              </TouchableOpacity>
              <Text style={styles.quizTitle}>{selectedTask.title}</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Progress Bar */}
            <View style={styles.quizProgressContainer}>
              <Text style={styles.quizProgressText}>
                Câu {currentQuestionIndex + 1}/{totalQuestions}
              </Text>
              <View style={styles.quizProgressBar}>
                <View
                  style={[styles.quizProgressFill, { width: `${progress}%` }]}
                />
              </View>
            </View>
          </View>

          {/* Question Content */}
          <ScrollView
            style={styles.quizContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={styles.questionNumberBadge}>
                  <Text style={styles.questionNumberText}>
                    {currentQuestionIndex + 1}
                  </Text>
                </View>
                <Text style={styles.questionHeaderText}>Câu hỏi</Text>
              </View>
              <Text style={styles.questionTextLarge}>
                {currentQuestion.question_text}
              </Text>
            </View>

            {/* Choices */}
            <View style={styles.choicesContainer}>
              <Text style={styles.choicesLabel}>Chọn đáp án:</Text>
              {currentQuestion.choices &&
                currentQuestion.choices.map((choice, index) => {
                  const choiceLetter = choice.substring(0, 2); // "A.", "B.", etc.
                  const choiceText = choice.substring(3); // Text after "A. "
                  const letterOnly = choiceLetter.replace(".", "").trim(); // "A", "B", etc.
                  const isSelected =
                    userAnswers[currentQuestionIndex] === letterOnly;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.choiceButton,
                        isSelected && styles.choiceButtonSelected,
                      ]}
                      onPress={() => {
                        // Store only the letter without dot ("A." -> "A")
                        setUserAnswers({
                          ...userAnswers,
                          [currentQuestionIndex]: letterOnly,
                        });
                      }}
                    >
                      <View
                        style={[
                          styles.choiceRadio,
                          isSelected && styles.choiceRadioSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.choiceRadioInner} />}
                      </View>
                      <View style={styles.choiceContent}>
                        <Text
                          style={[
                            styles.choiceLetter,
                            isSelected && styles.choiceLetterSelected,
                          ]}
                        >
                          {choiceLetter}
                        </Text>
                        <Text
                          style={[
                            styles.choiceText,
                            isSelected && styles.choiceTextSelected,
                          ]}
                        >
                          {choiceText}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </View>

            <View style={styles.modalBottomSpacer} />
          </ScrollView>

          {/* Footer Navigation */}
          <View style={styles.quizFooter}>
            <TouchableOpacity
              style={[
                styles.quizNavButton,
                currentQuestionIndex === 0 && styles.quizNavButtonDisabled,
              ]}
              disabled={currentQuestionIndex === 0}
              onPress={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={
                  currentQuestionIndex === 0 ? "#ccc" : themeColors.primary
                }
              />
              <Text
                style={[
                  styles.quizNavButtonText,
                  currentQuestionIndex === 0 &&
                    styles.quizNavButtonTextDisabled,
                ]}
              >
                Câu trước
              </Text>
            </TouchableOpacity>

            {isLastQuestion ? (
              <TouchableOpacity
                style={[
                  styles.quizSubmitButton,
                  (!canProceed || quizSubmitting) &&
                    styles.quizSubmitButtonDisabled,
                ]}
                disabled={!canProceed || quizSubmitting}
                onPress={handleSubmitQuiz}
              >
                {quizSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.quizSubmitButtonText}>Nộp bài</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.quizNavButton,
                  !canProceed && styles.quizNavButtonDisabled,
                ]}
                disabled={!canProceed}
                onPress={() =>
                  setCurrentQuestionIndex(currentQuestionIndex + 1)
                }
              >
                <Text
                  style={[
                    styles.quizNavButtonText,
                    !canProceed && styles.quizNavButtonTextDisabled,
                  ]}
                >
                  Câu tiếp
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={!canProceed ? "#ccc" : themeColors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  /**
   * Render Quiz Result Modal
   */
  const renderQuizResultModal = () => {
    if (!quizResult) return null;

    const isPassed = quizResult.passed;
    const percentage = (quizResult.accuracy * 100).toFixed(0);

    return (
      <Modal
        visible={resultModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setResultModalVisible(false)}
      >
        <View style={styles.resultModalOverlay}>
          <View style={styles.resultModalContainer}>
            {/* Icon and Status */}
            {/* <View
              style={[
                styles.resultIconContainer,
                isPassed ? styles.resultIconSuccess : styles.resultIconFail,
              ]}
            >
              <Ionicons
                name={isPassed ? "checkmark-circle" : "close-circle"}
                size={80}
                color="#fff"
              />
            </View> */}

            <Text style={styles.resultTitle}>
              {isPassed ? "🎉 Xuất sắc!" : " Chưa đạt yêu cầu"}
            </Text>

            <Text style={styles.resultSubtitle}>
              {isPassed
                ? "Chúc mừng! Bạn đã hoàn thành bài luyện tập"
                : "Hãy ôn lại lý thuyết và thử lại nhé! 💪"}
            </Text>

            {/* Score Display */}
            <View style={styles.resultScoreCard}>
              <View style={styles.resultScoreMain}>
                <Text style={styles.resultScoreLabel}>Điểm số</Text>
                <Text
                  style={[
                    styles.resultScoreValue,
                    isPassed
                      ? styles.resultScoreSuccess
                      : styles.resultScoreFail,
                  ]}
                >
                  {quizResult.score}/10
                </Text>
              </View>

              <View style={styles.resultDivider} />

              <View style={styles.resultStatsGrid}>
                <View style={styles.resultStatItem}>
                  <Ionicons
                    name="checkmark-done"
                    size={20}
                    color={themeColors.success}
                  />
                  <Text style={styles.resultStatLabel}>Câu đúng</Text>
                  <Text style={styles.resultStatValue}>
                    {quizResult.correctCount}/{quizResult.totalQuestions}
                  </Text>
                </View>

                <View style={styles.resultStatItem}>
                  <Ionicons
                    name="stats-chart"
                    size={20}
                    color={themeColors.primary}
                  />
                  <Text style={styles.resultStatLabel}>Độ chính xác</Text>
                  <Text style={styles.resultStatValue}>{percentage}%</Text>
                </View>

                <View style={styles.resultStatItem}>
                  <Ionicons name="time" size={20} color={themeColors.warning} />
                  <Text style={styles.resultStatLabel}>Thời gian</Text>
                  <Text style={styles.resultStatValue}>
                    {quizResult.timeSpentMinutes} phút
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            {!isPassed ? (
              <View style={styles.resultButtonsContainer}>
                <TouchableOpacity
                  style={styles.resultButtonSecondary}
                  onPress={() => {
                    setResultModalVisible(false);
                    handleViewLearningContent(selectedTask);
                  }}
                >
                  <Ionicons name="book" size={20} color={themeColors.primary} />
                  <Text style={styles.resultButtonSecondaryText}>
                    Ôn lại lý thuyết
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resultButtonPrimary}
                  onPress={() => {
                    setResultModalVisible(false);
                    // Reset and restart quiz
                    setCurrentQuestionIndex(0);
                    setUserAnswers({});
                    setQuizStartTime(Date.now());
                    setQuizModalVisible(true);
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.resultButtonPrimaryText}>Làm lại</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.resultButtonSuccess}
                onPress={async () => {
                  setResultModalVisible(false);

                  // Mark task as completed
                  await markTaskCompleted(selectedTask.task_id, {
                    time_spent: quizResult.timeSpentMinutes,
                    score: quizResult.score,
                    accuracy: quizResult.accuracy,
                  });

                  // Close task detail modal
                  setTaskModalVisible(false);

                  showToast(
                    `Hoàn thành bài tập! Điểm: ${quizResult.score}/10`,
                    "success"
                  );
                }}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.resultButtonSuccessText}>Hoàn thành</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  /**
   * Render Task Detail Modal
   */
  const renderTaskDetailModal = () => {
    if (!selectedTask) return null;

    const isLearning = selectedTask.type === "LEARN";
    const isPractice =
      selectedTask.type === "PRACTICE" || selectedTask.type === "ASSESSMENT";

    return (
      <Modal
        visible={taskModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTaskModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setTaskModalVisible(false)}
                style={styles.modalCloseButtonAbsolute}
              >
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
              <View style={styles.modalHeaderLeft}>
                <Ionicons
                  name={isLearning ? "bulb" : isPractice ? "pencil" : "book"}
                  size={28}
                  color={themeColors.primary}
                />
                <Text style={styles.modalTitle} numberOfLines={3}>
                  {selectedTask.title}
                </Text>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Learning Summary */}
              {selectedTask.learning_summary && (
                <View style={styles.taskModalSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color={themeColors.primary}
                    />
                    <Text style={styles.sectionLabel}>Tổng quan</Text>
                  </View>
                  <Text style={styles.taskModalText}>
                    {selectedTask.learning_summary}
                  </Text>
                </View>
              )}

              {/* Theory Explanation */}
              {selectedTask.theory_explanation && (
                <View style={styles.taskModalSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons
                      name="book"
                      size={20}
                      color={themeColors.primary}
                    />
                    <Text style={styles.sectionLabel}>Lý thuyết</Text>
                  </View>
                  <View style={styles.theoryBox}>
                    <Text style={styles.theoryText}>
                      {selectedTask.theory_explanation}
                    </Text>
                  </View>
                </View>
              )}

              {/* Key Points */}
              {selectedTask.key_points &&
                selectedTask.key_points.length > 0 && (
                  <View style={styles.taskModalSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons
                        name="key"
                        size={20}
                        color={themeColors.success}
                      />
                      <Text style={styles.sectionLabel}>
                        Điểm chính cần nhớ
                      </Text>
                    </View>
                    {selectedTask.key_points.map((point, index) => (
                      <View key={index} style={styles.keyPointItem}>
                        <View style={styles.keyPointBullet}>
                          <Text style={styles.keyPointNumber}>{index + 1}</Text>
                        </View>
                        <Text style={styles.keyPointText}>{point}</Text>
                      </View>
                    ))}
                  </View>
                )}

              {/* Example */}
              {selectedTask.example && (
                <View style={styles.taskModalSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons
                      name="bulb-outline"
                      size={20}
                      color={themeColors.warning}
                    />
                    <Text style={styles.sectionLabel}>Ví dụ minh họa</Text>
                  </View>
                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleLabel}>Câu hỏi:</Text>
                    <Text style={styles.exampleQuestion}>
                      {selectedTask.example.question}
                    </Text>
                    <Text style={[styles.exampleLabel, { marginTop: 12 }]}>
                      Giải:
                    </Text>
                    <Text style={styles.exampleSolution}>
                      {selectedTask.example.solution}
                    </Text>
                  </View>
                </View>
              )}

              {/* Tips */}
              {selectedTask.tips && selectedTask.tips.length > 0 && (
                <View style={styles.taskModalSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons
                      name="sparkles"
                      size={20}
                      color={themeColors.accent}
                    />
                    <Text style={styles.sectionLabel}>Mẹo học tập</Text>
                  </View>
                  {selectedTask.tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={themeColors.accent}
                      />
                      <Text style={styles.tipItemText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Practice Set Preview */}
              {selectedTask.practice_set &&
                selectedTask.practice_set.length > 0 && (
                  <View style={styles.taskModalSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons
                        name="clipboard"
                        size={20}
                        color={themeColors.primary}
                      />
                      <Text style={styles.sectionLabel}>Bài tập luyện tập</Text>
                    </View>
                    <View style={styles.practiceInfoBox}>
                      <View style={styles.practiceInfoRow}>
                        <Ionicons
                          name="document-text"
                          size={18}
                          color={themeColors.primary}
                        />
                        <Text style={styles.practiceInfoText}>
                          Số câu hỏi: {selectedTask.practice_set.length}
                        </Text>
                      </View>
                      <View style={styles.practiceInfoRow}>
                        <Ionicons
                          name="time"
                          size={18}
                          color={themeColors.primary}
                        />
                        <Text style={styles.practiceInfoText}>
                          Thời gian: {selectedTask.duration_minutes || 0} phút
                        </Text>
                      </View>
                      {selectedTask.expected_accuracy && (
                        <View style={styles.practiceInfoRow}>
                          <Ionicons
                            name="trophy"
                            size={18}
                            color={themeColors.warning}
                          />
                          <Text style={styles.practiceInfoText}>
                            Độ chính xác mong đợi:{" "}
                            {(selectedTask.expected_accuracy * 100).toFixed(0)}%
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

              {/* Recommended Resources */}
              {selectedTask.recommended_resources &&
                selectedTask.recommended_resources.length > 0 && (
                  <View style={styles.taskModalSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons
                        name="library"
                        size={20}
                        color={themeColors.primary}
                      />
                      <Text style={styles.sectionLabel}>
                        Tài liệu tham khảo
                      </Text>
                    </View>
                    {selectedTask.recommended_resources.map(
                      (resource, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.resourceItemModal}
                          onPress={() => {
                            setTaskModalVisible(false);
                            handleOpenResource(resource);
                          }}
                        >
                          <Ionicons
                            name={
                              resource.type === "VIDEO"
                                ? "play-circle"
                                : "document-text"
                            }
                            size={24}
                            color={themeColors.primary}
                          />
                          <View style={styles.resourceInfoModal}>
                            <Text style={styles.resourceTitleModal}>
                              {resource.title}
                            </Text>
                            <Text style={styles.resourceMetaModal}>
                              {resource.type} •{" "}
                              {resource.estimated_time_minutes ||
                                resource.duration_minutes ||
                                0}{" "}
                              phút
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={themeColors.textLight}
                          />
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                )}

              <View style={styles.modalBottomSpacer} />
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.modalFooter}>
              {isLearning ? (
                <TouchableOpacity
                  style={styles.completeTaskButton}
                  onPress={() => {
                    markTaskCompleted(selectedTask.task_id);
                    setTaskModalVisible(false);
                  }}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.completeTaskButtonText}>
                    Đã học xong ✓
                  </Text>
                </TouchableOpacity>
              ) : isPractice ? (
                <TouchableOpacity
                  style={styles.startPracticeButton}
                  onPress={() => {
                    setTaskModalVisible(false);
                    // Open quiz modal
                    if (
                      selectedTask.practice_set &&
                      selectedTask.practice_set.length > 0
                    ) {
                      setCurrentQuestionIndex(0);
                      setUserAnswers({});
                      setQuizStartTime(Date.now());
                      setQuizModalVisible(true);
                    } else {
                      showToast("Bài tập chưa có câu hỏi", { type: "info" });
                    }
                  }}
                >
                  <Ionicons name="play" size={24} color="#fff" />
                  <Text style={styles.startPracticeButtonText}>
                    Bắt đầu luyện tập
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.completeTaskButton}
                  onPress={() => {
                    markTaskCompleted(selectedTask.task_id);
                    setTaskModalVisible(false);
                  }}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.completeTaskButtonText}>
                    Đánh dấu hoàn thành
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  /**
   * Render Incorrect Question Detail Modal
   */
  const renderQuestionDetailModal = () => {
    if (!selectedQuestion) return null;

    return (
      <Modal
        visible={questionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setQuestionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setQuestionModalVisible(false)}
                style={styles.modalCloseButtonAbsolute}
              >
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
              <View style={styles.modalHeaderLeft}>
                <Ionicons
                  name="alert-circle"
                  size={28}
                  color={themeColors.error}
                />
                <Text style={styles.modalTitle}>Chi tiết câu sai</Text>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Question Text */}
              <View style={styles.questionSection}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons
                    name="help-circle"
                    size={20}
                    color={themeColors.primary}
                  />
                  <Text style={styles.sectionLabel}>Câu hỏi</Text>
                </View>
                <Text style={styles.questionText}>
                  {selectedQuestion.question_text}
                </Text>
              </View>

              {/* Your Answer (Wrong) */}
              <View style={styles.answerSection}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={themeColors.error}
                  />
                  <Text style={[styles.sectionLabel, styles.errorLabel]}>
                    Câu trả lời của bạn
                  </Text>
                </View>
                <View style={styles.answerBox}>
                  <Text style={styles.yourAnswer}>
                    {selectedQuestion.your_answer}
                  </Text>
                </View>
              </View>

              {/* Correct Answer */}
              <View style={styles.answerSection}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={themeColors.success}
                  />
                  <Text style={[styles.sectionLabel, styles.successLabel]}>
                    Đáp án đúng
                  </Text>
                </View>
                <View style={[styles.answerBox, styles.correctAnswerBox]}>
                  <Text style={styles.correctAnswer}>
                    {selectedQuestion.correct_answer}
                  </Text>
                </View>
              </View>

              {/* Explanation */}
              <View style={styles.explanationSection}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="book" size={20} color={themeColors.primary} />
                  <Text style={styles.sectionLabel}>Giải thích</Text>
                </View>
                <Text style={styles.explanationText}>
                  {selectedQuestion.explanation}
                </Text>
              </View>

              {/* Common Mistake */}
              {selectedQuestion.common_mistake && (
                <View style={styles.mistakeSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons
                      name="warning"
                      size={20}
                      color={themeColors.warning}
                    />
                    <Text style={styles.sectionLabel}>Lỗi phổ biến</Text>
                  </View>
                  <Text style={styles.mistakeText}>
                    {selectedQuestion.common_mistake}
                  </Text>
                </View>
              )}

              {/* Tip */}
              {selectedQuestion.tip && (
                <View style={styles.tipSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons
                      name="bulb"
                      size={20}
                      color={themeColors.accent}
                    />
                    <Text style={styles.sectionLabel}>💡 Mẹo ghi nhớ</Text>
                  </View>
                  <Text style={styles.tipDetailText}>
                    {selectedQuestion.tip}
                  </Text>
                </View>
              )}

              <View style={styles.modalBottomSpacer} />
            </ScrollView>

            {/* Footer Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.understoodButton}
                onPress={() => setQuestionModalVisible(false)}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.understoodButtonText}>Đã hiểu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={styles.loadingText}>Đang tạo lộ trình học tập...</Text>
      </View>
    );
  }

  if (!roadmap) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={themeColors.error} />
        <Text style={styles.errorText}>Không thể tạo lộ trình học tập</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigator */}
      {renderTabs()}

      {/* Tab Content */}
      {activeTab === "current" ? (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {renderOverallGoal()}
          {renderProgressBar()}
          {renderMotivationTips()}

          <Text style={styles.sectionTitle}>Các giai đoạn học tập</Text>
          {roadmap.phases &&
            roadmap.phases.map((phase, index) => renderPhase(phase, index))}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : (
        renderHistoryTab()
      )}

      {/* Practice Quiz Modal */}
      {renderPracticeQuizModal()}

      {/* Quiz Result Modal */}
      {renderQuizResultModal()}

      {/* Task Detail Modal */}
      {renderTaskDetailModal()}

      {/* Question Detail Modal */}
      {renderQuestionDetailModal()}
    </View>
  );
} // ============================================
// ============================================
// MOCK DATA - Chỉ dùng khi API lỗi hoặc không có data
// Thường thì roadmap sẽ được truyền từ route.params
// ============================================
const MOCK_ROADMAP_DATA = {
  roadmap_id: "roadmap_53_11_20251031",
  student_id: 53,
  subject: "Toán",
  created_at: "2025-10-31T08:30:00Z",
  estimated_completion_days: 5,
  overall_goal: "Nâng độ chính xác trung bình từ 80% lên 90%",
  phases: [
    {
      phase_number: 1,
      phase_name: "Ôn lại kiến thức yếu",
      duration_days: 2,
      priority: "HIGH",
      topics: [
        {
          topic: "Tập hợp và các phép toán trên tập hợp.",
          subtopics: [
            {
              subtopic: "Phép giao tập hợp",
              current_accuracy: 40,
              target_accuracy: 80,
              focus_areas: [
                "Hiểu khái niệm giao tập hợp",
                "Phân biệt giao và hợp",
                "Vẽ sơ đồ Venn",
              ],
              learning_resources: [
                {
                  type: "VIDEO",
                  title: "Phép giao tập hợp - Khái niệm cơ bản",
                  url: "https://youtube.com/watch?v=xxxxx",
                  duration_minutes: 10,
                  priority: 1,
                },
                {
                  type: "ARTICLE",
                  title: "Bài giảng Phép giao - Sách giáo khoa",
                  url: "https://docs.example.com/tap-hop-giao",
                  duration_minutes: 15,
                  priority: 2,
                },
              ],
              incorrect_questions_review: [
                {
                  question_id: 10,
                  question_text: "Cho A = {1,2,3}, B = {2,3,4}. A ∩ B = ?",
                  your_answer: "{1,2,3,4}",
                  correct_answer: "{2,3}",
                  explanation:
                    "Phép giao A ∩ B chỉ lấy các phần tử CHUNG của cả hai tập hợp...",
                  common_mistake: "Nhầm lẫn giữa phép giao (∩) và phép hợp (∪)",
                  tip: "Nhớ: ∩ giống chữ 'n' trong 'and' (và) → lấy chung",
                },
              ],
              practice_exercises: {
                easy: { count: 5 },
                medium: { count: 3 },
              },
            },
          ],
        },
      ],
      daily_tasks: [
        {
          day: 1,
          tasks: [
            {
              task_id: "task_1_1",
              type: "WATCH_VIDEO",
              title: "Xem video: Phép giao tập hợp",
              duration_minutes: 10,
              resource_url: "https://youtube.com/watch?v=xxxxx",
              completed: false,
            },
            {
              task_id: "task_1_2",
              type: "REVIEW_MISTAKES",
              title: "Ôn lại 3 câu sai về Phép giao",
              duration_minutes: 15,
              question_ids: [10, 12, 15],
              completed: false,
            },
            {
              task_id: "task_1_3",
              type: "PRACTICE",
              title: "Làm 5 bài tập dễ về Phép giao",
              duration_minutes: 20,
              num_questions: 5,
              difficulty: "EASY",
              topic: "Phép giao tập hợp",
              completed: false,
            },
          ],
          total_time_minutes: 45,
        },
        {
          day: 2,
          tasks: [
            {
              task_id: "task_2_1",
              type: "READ_ARTICLE",
              title: "Đọc bài giảng Phép hợp",
              duration_minutes: 10,
              resource_url: "https://docs.example.com/tap-hop-hop",
              completed: false,
            },
            {
              task_id: "task_2_2",
              type: "PRACTICE",
              title: "Làm 3 bài tập trung bình về Phép hợp",
              duration_minutes: 25,
              num_questions: 3,
              difficulty: "MEDIUM",
              topic: "Phép hợp tập hợp",
              completed: false,
            },
          ],
          total_time_minutes: 35,
        },
      ],
      milestone: {
        name: "Hoàn thành ôn tập Tập hợp",
        criteria: "Đạt 80% trong bài luyện tập",
        assessment_type: "PRACTICE_QUIZ",
        num_questions: 10,
        topics: ["Phép giao", "Phép hợp"],
      },
    },
    {
      phase_number: 2,
      phase_name: "Củng cố kiến thức Mệnh đề",
      duration_days: 2,
      priority: "MEDIUM",
      topics: [
        {
          topic: "Mệnh đề",
          subtopics: [
            {
              subtopic: "Mệnh đề phủ định",
              current_accuracy: 50,
              target_accuracy: 85,
              focus_areas: [
                "Hiểu cách phủ định lượng từ",
                "Phân biệt 'Mọi' và 'Tồn tại'",
              ],
              learning_resources: [
                {
                  type: "VIDEO",
                  title: "Mệnh đề phủ định - Lượng từ",
                  url: "https://youtube.com/watch?v=zzzzz",
                  duration_minutes: 12,
                  priority: 1,
                },
              ],
              incorrect_questions_review: [
                {
                  question_id: 15,
                  question_text: "Phủ định của 'Mọi x > 0' là:",
                  your_answer: "Mọi x ≤ 0",
                  correct_answer: "Tồn tại x ≤ 0",
                  explanation:
                    "Khi phủ định mệnh đề có lượng từ 'Mọi', ta đổi thành 'Tồn tại' và phủ định vế sau.",
                  common_mistake: "Giữ nguyên lượng từ 'Mọi' khi phủ định",
                  tip: "Công thức: ¬(∀x, P(x)) = ∃x, ¬P(x)",
                },
              ],
              practice_exercises: {
                easy: { count: 5 },
                medium: { count: 4 },
              },
            },
          ],
        },
      ],
      daily_tasks: [
        {
          day: 3,
          tasks: [
            {
              task_id: "task_3_1",
              type: "WATCH_VIDEO",
              title: "Xem video: Mệnh đề phủ định",
              duration_minutes: 12,
              resource_url: "https://youtube.com/watch?v=zzzzz",
              completed: false,
            },
            {
              task_id: "task_3_2",
              type: "REVIEW_MISTAKES",
              title: "Ôn lại câu sai về Phủ định mệnh đề",
              duration_minutes: 10,
              question_ids: [15],
              completed: false,
            },
            {
              task_id: "task_3_3",
              type: "PRACTICE",
              title: "Làm 5 bài tập dễ về Phủ định",
              duration_minutes: 20,
              num_questions: 5,
              difficulty: "EASY",
              topic: "Mệnh đề phủ định",
              completed: false,
            },
          ],
          total_time_minutes: 42,
        },
      ],
      milestone: {
        name: "Hoàn thành ôn tập Mệnh đề",
        criteria: "Đạt 85% trong bài luyện tập",
        assessment_type: "PRACTICE_QUIZ",
        num_questions: 8,
        topics: ["Mệnh đề phủ định", "Lượng từ"],
      },
    },
    {
      phase_number: 3,
      phase_name: "Đánh giá lại toàn bộ",
      duration_days: 1,
      priority: "HIGH",
      topics: [
        {
          topic: "Tổng hợp",
          subtopics: [],
        },
      ],
      daily_tasks: [
        {
          day: 5,
          tasks: [
            {
              task_id: "task_5_1",
              type: "ASSESSMENT",
              title: "Làm lại bài đánh giá đầy đủ",
              duration_minutes: 40,
              num_questions: 20,
              topics: ["Tập hợp", "Mệnh đề"],
              difficulty: "MIXED",
              completed: false,
            },
          ],
          total_time_minutes: 40,
        },
      ],
      milestone: {
        name: "Đạt mục tiêu 90%",
        criteria: "Đạt ≥ 90% trong bài đánh giá lại",
        assessment_type: "FULL_ASSESSMENT",
        num_questions: 20,
        topics: ["Tập hợp", "Mệnh đề"],
      },
    },
  ],
  progress_tracking: {
    completion_percentage: 0,
    phases_completed: 0,
    total_phases: 3,
    tasks_completed: 0,
    total_tasks: 8,
    estimated_time_remaining_minutes: 162,
    actual_time_spent_minutes: 0,
  },
  motivational_tips: [
    "Bạn đã tiến bộ 30%! Tiếp tục phát huy nhé! 🚀",
    "Mỗi ngày học 30 phút sẽ giúp bạn đạt mục tiêu trong 5 ngày.",
    "Đừng bỏ qua việc ôn lại câu sai - đó là chìa khóa để tiến bộ!",
  ],
  adaptive_hints: {
    learning_style_match:
      "Bạn học tốt qua hình ảnh, nên xem video trước khi làm bài tập.",
    time_management:
      "Với 30 phút/ngày, bạn có thể hoàn thành lộ trình trong 5 ngày.",
    difficulty_progression:
      "Bắt đầu từ DỄ, sau đó tăng dần lên TRUNG BÌNH và KHÓ.",
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: themeColors.primary,
  },
  tabButtonText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.textLight,
  },
  tabButtonTextActive: {
    color: themeColors.primary,
  },
  // History List Styles
  historyList: {
    padding: 16,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  historySubject: {
    fontSize: 16,
    fontWeight: "700",
    color: themeColors.text,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: themeColors.textLight,
  },
  historyGoal: {
    fontSize: 14,
    color: themeColors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  historyProgressContainer: {
    marginTop: 8,
  },
  historyProgressText: {
    fontSize: 12,
    color: themeColors.primary,
    fontWeight: "600",
    marginBottom: 4,
  },
  historyProgressBar: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    overflow: "hidden",
  },
  historyProgressFill: {
    height: "100%",
    backgroundColor: themeColors.primary,
    borderRadius: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: themeColors.text,
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: themeColors.textLight,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: themeColors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: themeColors.text,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: themeColors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  goalCard: {
    margin: 16,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  goalTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.text,
  },
  goalText: {
    fontSize: 15,
    lineHeight: 22,
    color: themeColors.text,
    marginBottom: 16,
  },
  goalStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  goalStatItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalStatText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.text,
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: themeColors.text,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: "700",
    color: themeColors.primary,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: "#eee",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: themeColors.primary,
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressStatText: {
    fontSize: 13,
    color: themeColors.textLight,
  },
  tipsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: `${themeColors.accent}15`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.accent,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipsTitle: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: themeColors.text,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: themeColors.text,
    marginTop: 4,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.text,
  },
  phaseCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  phaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  phaseHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  phaseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  phaseNumberActive: {
    backgroundColor: themeColors.primary,
  },
  phaseNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: themeColors.text,
  },
  phaseNumberTextActive: {
    color: "#fff",
  },
  phaseInfo: {
    flex: 1,
  },
  phaseName: {
    fontSize: 16,
    fontWeight: "700",
    color: themeColors.text,
    marginBottom: 4,
  },
  phaseMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  phaseMetaText: {
    marginLeft: 4,
    marginRight: 12,
    fontSize: 13,
    color: themeColors.textLight,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700",
  },
  phaseContent: {
    padding: 16,
    paddingTop: 0,
  },
  topicSection: {
    marginBottom: 16,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: themeColors.primary,
    marginBottom: 12,
  },
  subtopicCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: themeColors.card,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: themeColors.primary,
  },
  subtopicHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  subtopicName: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "700",
    color: themeColors.text,
  },
  accuracyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  accuracyLabel: {
    fontSize: 13,
    color: themeColors.textLight,
  },
  accuracyValue: {
    fontSize: 13,
    fontWeight: "600",
    color: themeColors.primary,
  },
  focusSection: {
    marginTop: 8,
  },
  focusTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 6,
  },
  focusItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  focusText: {
    marginLeft: 6,
    fontSize: 13,
    color: themeColors.text,
  },
  resourcesSection: {
    marginTop: 12,
  },
  resourcesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 8,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 6,
  },
  resourceInfo: {
    flex: 1,
    marginLeft: 10,
  },
  resourceTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 2,
  },
  resourceMeta: {
    fontSize: 11,
    color: themeColors.textLight,
  },
  reviewSection: {
    marginTop: 12,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: themeColors.error,
    marginBottom: 8,
  },
  reviewItem: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: `${themeColors.error}10`,
    borderRadius: 8,
    marginBottom: 6,
  },
  reviewIcon: {
    marginRight: 10,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewQuestion: {
    fontSize: 13,
    color: themeColors.text,
    marginBottom: 4,
  },
  reviewTip: {
    fontSize: 12,
    color: themeColors.textLight,
    fontStyle: "italic",
  },
  dailyTasksSection: {
    marginTop: 8,
  },
  dailyTasksTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: themeColors.text,
    marginBottom: 12,
  },
  dayCard: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: themeColors.card,
    borderRadius: 12,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  dayTitle: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: themeColors.text,
  },
  dayTime: {
    fontSize: 13,
    color: themeColors.primary,
    fontWeight: "600",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
  },
  taskItemCompleted: {
    opacity: 0.6,
  },
  taskCheckbox: {
    marginRight: 10,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 3,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: themeColors.textLight,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskMetaText: {
    marginLeft: 4,
    fontSize: 11,
    color: themeColors.textLight,
  },
  taskScore: {
    fontSize: 11,
    color: themeColors.success,
    fontWeight: "600",
  },
  milestoneCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: `${themeColors.accent}15`,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: themeColors.accent,
  },
  milestoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  milestoneTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: themeColors.text,
  },
  milestoneName: {
    fontSize: 15,
    fontWeight: "700",
    color: themeColors.text,
    marginBottom: 6,
  },
  milestoneCriteria: {
    fontSize: 13,
    color: themeColors.textLight,
  },
  bottomSpacer: {
    height: 32,
  },
  // Question Detail Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    height: "80%",
    maxWidth: 500,
    maxHeight: "85%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    position: "relative",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 40,
  },
  modalTitle: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: "700",
    color: themeColors.text,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseButtonAbsolute: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  questionSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: themeColors.text,
  },
  errorLabel: {
    color: themeColors.error,
  },
  successLabel: {
    color: themeColors.success,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.text,
    backgroundColor: themeColors.card,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.primary,
  },
  answerSection: {
    marginBottom: 20,
  },
  answerBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: `${themeColors.error}10`,
    borderWidth: 2,
    borderColor: `${themeColors.error}40`,
  },
  correctAnswerBox: {
    backgroundColor: `${themeColors.success}10`,
    borderColor: `${themeColors.success}40`,
  },
  yourAnswer: {
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.error,
  },
  correctAnswer: {
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.success,
  },
  explanationSection: {
    marginBottom: 20,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
    color: themeColors.text,
    backgroundColor: `${themeColors.primary}08`,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.primary,
  },
  mistakeSection: {
    marginBottom: 20,
  },
  mistakeText: {
    fontSize: 15,
    lineHeight: 22,
    color: themeColors.text,
    backgroundColor: `${themeColors.warning}10`,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.warning,
  },
  tipSection: {
    marginBottom: 20,
  },
  tipDetailText: {
    fontSize: 15,
    lineHeight: 22,
    color: themeColors.text,
    backgroundColor: `${themeColors.accent}15`,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.accent,
    fontStyle: "italic",
  },
  modalBottomSpacer: {
    height: 20,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  understoodButton: {
    flexDirection: "row",
    backgroundColor: themeColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  understoodButtonText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  aiNoteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    backgroundColor: "#e3f2fd", // xanh nhẹ
    borderLeftWidth: 4,
    borderLeftColor: "#1565c0",
    borderRadius: 6,
    marginBottom: 12,
  },

  aiNoteText: {
    flex: 1,
    color: "#0d47a1",
    fontSize: 13,
  },

  // Quiz Result Modal Styles
  resultModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    padding: 32,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  resultIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  resultIconSuccess: {
    backgroundColor: themeColors.success,
  },
  resultIconFail: {
    backgroundColor: themeColors.error,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: themeColors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  resultSubtitle: {
    fontSize: 16,
    color: themeColors.textLight,
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 24,
  },
  resultScoreCard: {
    width: "100%",
    backgroundColor: themeColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 2,
    borderColor: "#eee",
  },
  resultScoreMain: {
    alignItems: "center",
    marginBottom: 20,
  },
  resultScoreLabel: {
    fontSize: 14,
    color: themeColors.textLight,
    marginBottom: 8,
    fontWeight: "600",
  },
  resultScoreValue: {
    fontSize: 48,
    fontWeight: "700",
  },
  resultScoreSuccess: {
    color: themeColors.success,
  },
  resultScoreFail: {
    color: themeColors.error,
  },
  resultDivider: {
    height: 1,
    backgroundColor: "#ddd",
    marginBottom: 16,
  },
  resultStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  resultStatItem: {
    flex: 1,
    alignItems: "center",
  },
  resultStatLabel: {
    fontSize: 11,
    color: themeColors.textLight,
    marginTop: 6,
    marginBottom: 4,
    textAlign: "center",
  },
  resultStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: themeColors.text,
    textAlign: "center",
  },
  resultButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  resultButtonPrimary: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: themeColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultButtonPrimaryText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  resultButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: themeColors.primary,
  },
  resultButtonSecondaryText: {
    marginLeft: 8,
    color: themeColors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  resultButtonSuccess: {
    flexDirection: "row",
    backgroundColor: themeColors.success,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultButtonSuccessText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Task Detail Modal Styles
  taskModalSection: {
    marginBottom: 24,
  },
  taskModalText: {
    fontSize: 15,
    lineHeight: 24,
    color: themeColors.text,
    backgroundColor: themeColors.card,
    padding: 16,
    borderRadius: 12,
  },
  theoryBox: {
    backgroundColor: `${themeColors.primary}08`,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.primary,
  },
  theoryText: {
    fontSize: 15,
    lineHeight: 24,
    color: themeColors.text,
  },
  keyPointItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: themeColors.success,
  },
  keyPointBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: themeColors.success,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  keyPointNumber: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: themeColors.text,
  },
  exampleBox: {
    backgroundColor: `${themeColors.warning}10`,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.warning,
  },
  exampleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: themeColors.text,
    marginBottom: 6,
  },
  exampleQuestion: {
    fontSize: 15,
    lineHeight: 22,
    color: themeColors.text,
    fontStyle: "italic",
  },
  exampleSolution: {
    fontSize: 15,
    lineHeight: 22,
    color: themeColors.text,
    fontWeight: "600",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: `${themeColors.accent}15`,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  tipItemText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 22,
    color: themeColors.text,
  },
  practiceInfoBox: {
    backgroundColor: themeColors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: themeColors.primary,
  },
  practiceInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  practiceInfoText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.text,
  },
  resourceItemModal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  resourceInfoModal: {
    flex: 1,
    marginLeft: 12,
  },
  resourceTitleModal: {
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 4,
  },
  resourceMetaModal: {
    fontSize: 12,
    color: themeColors.textLight,
  },
  completeTaskButton: {
    flexDirection: "row",
    backgroundColor: themeColors.success,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completeTaskButtonText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  startPracticeButton: {
    flexDirection: "row",
    backgroundColor: themeColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startPracticeButtonText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Practice Quiz Modal Styles
  quizContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  quizHeader: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  quizCloseButton: {
    padding: 4,
  },
  quizTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.text,
    textAlign: "center",
    marginHorizontal: 8,
  },
  quizProgressContainer: {
    marginTop: 8,
  },
  quizProgressText: {
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.primary,
    marginBottom: 8,
  },
  quizProgressBar: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  quizProgressFill: {
    height: "100%",
    backgroundColor: themeColors.primary,
    borderRadius: 4,
  },
  quizContent: {
    flex: 1,
    padding: 20,
  },
  questionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  questionNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: themeColors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  questionNumberText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  questionHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: themeColors.text,
  },
  questionTextLarge: {
    fontSize: 16,
    lineHeight: 26,
    color: themeColors.text,
  },
  choicesContainer: {
    marginBottom: 20,
  },
  choicesLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 12,
  },
  choiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#eee",
  },
  choiceButtonSelected: {
    borderColor: themeColors.primary,
    backgroundColor: `${themeColors.primary}08`,
  },
  choiceRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  choiceRadioSelected: {
    borderColor: themeColors.primary,
  },
  choiceRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: themeColors.primary,
  },
  choiceContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  choiceLetter: {
    fontSize: 16,
    fontWeight: "700",
    color: themeColors.textLight,
    marginRight: 8,
    minWidth: 24,
  },
  choiceLetterSelected: {
    color: themeColors.primary,
  },
  choiceText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: themeColors.text,
  },
  choiceTextSelected: {
    fontWeight: "600",
    color: themeColors.text,
  },
  quizFooter: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    justifyContent: "space-between",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizNavButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: themeColors.primary,
  },
  quizNavButtonDisabled: {
    borderColor: "#ccc",
  },
  quizNavButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.primary,
    marginHorizontal: 8,
  },
  quizNavButtonTextDisabled: {
    color: "#ccc",
  },
  quizSubmitButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.success,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quizSubmitButtonDisabled: {
    backgroundColor: "#ccc",
    elevation: 0,
  },
  quizSubmitButtonText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
