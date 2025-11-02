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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../../contexts/ToastContext";
import aiService from "../../services/aiService";
import { useAuth } from "../../contexts/AuthContext";

const themeColors = {
  primary: "#7C3AED",
  secondary: "#6D28D9",
  accent: "#FFD60A",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  background: "#fff",
  card: "#f9f9f9",
  text: "#333",
  textLight: "#666",
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
      // Response: { resultId, detailedAnalysis: { subject, phases, ... } }
      const response = await aiService.getRoadmapLatest(token);

      if (response && response.detailedAnalysis) {
        console.log("✅ Fetched roadmap data:", response);

        // Map response structure sang roadmap format
        const roadmapData = {
          roadmap_id: `roadmap_${response.resultId}`,
          result_id: response.resultId,
          student_id: null, // Backend không trả về
          subject: response.detailedAnalysis.subject,
          created_at: new Date().toISOString(),
          estimated_completion_days:
            response.detailedAnalysis.estimated_completion_days || 7,
          overall_goal:
            response.detailedAnalysis.overall_goal ||
            "Cải thiện kết quả học tập",
          phases: response.detailedAnalysis.phases || [],
          motivational_tips: response.detailedAnalysis.motivational_tips || [],
          progress_tracking: response.detailedAnalysis.progress_tracking || {
            completion_percentage: 0,
            phases_completed: 0,
            total_phases: response.detailedAnalysis.phases?.length || 0,
            tasks_completed: 0,
            total_tasks: 0,
          },
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
    // Nếu không có resultId, chỉ update local state
    if (!resultId) {
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
          resultId,
          taskId,
          {
            actual_time_spent_minutes: completionData.time_spent || 0,
            score: completionData.score,
            accuracy: completionData.accuracy,
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

  const handleOpenResource = (resource) => {
    Alert.alert(
      resource.title,
      `Loại: ${resource.type}\nThời gian: ${resource.duration_minutes} phút\n\nBạn có muốn mở tài liệu này không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Mở",
          onPress: () => {
            // TODO: Open URL in browser
            showToast(`Đang mở: ${resource.title}`, { type: "info" });
          },
        },
      ]
    );
  };

  const handleStartPractice = (task) => {
    Alert.alert(
      "Bắt đầu luyện tập",
      `${task.title}\n\nSố câu: ${task.num_questions}\nĐộ khó: ${task.difficulty}\n\nBạn có sẵn sàng không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bắt đầu",
          onPress: () => {
            // TODO: Navigate to practice screen
            showToast("Tính năng đang phát triển", { type: "info" });
          },
        },
      ]
    );
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
    const progress = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

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
                            {subtopic.subtopic}
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
                                        {resource.duration_minutes} phút
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
                                      : "book"
                                  }
                                  size={12}
                                  color={themeColors.textLight}
                                />
                                <Text style={styles.taskMetaText}>
                                  {task.duration_minutes} phút
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

    // Tính progress
    let progress = 0;
    if (item.detailedAnalysis?.progress_tracking) {
      progress =
        item.detailedAnalysis.progress_tracking.completion_percentage || 0;
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
              <View style={styles.modalHeaderLeft}>
                <Ionicons
                  name="alert-circle"
                  size={28}
                  color={themeColors.error}
                />
                <Text style={styles.modalTitle}>Chi tiết câu sai</Text>
              </View>
              <TouchableOpacity
                onPress={() => setQuestionModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={28} color={themeColors.text} />
              </TouchableOpacity>
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

      {/* Question Detail Modal */}
      {renderQuestionDetailModal()}
    </View>
  );
}

// ============================================
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
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalTitle: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: "700",
    color: themeColors.text,
  },
  modalCloseButton: {
    padding: 4,
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
});
