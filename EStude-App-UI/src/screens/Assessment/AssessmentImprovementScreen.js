import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useToast } from "../../contexts/ToastContext";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../contexts/AuthContext";
import aiService from "../../services/aiService";

const themeColors = {
  primary: "#7C3AED",
  secondary: "#6D28D9",
  accent: "#FFD60A",
  background: "#fff",
  card: "#f9f9f9",
  text: "#333",
};

const { width } = Dimensions.get("window");

export default function AssessmentImprovementScreen({ navigation, route }) {
  const { evaluation } = route.params; // evaluation từ Layer 4
  const { showToast } = useToast();
  const { user, token } = useContext(AuthContext);
  const [showMotivation, setShowMotivation] = useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  console.log(
    "🎯 Assessment Improvement Screen - evaluation:",
    JSON.stringify(evaluation, null, 2)
  );

  useEffect(() => {
    navigation.setOptions({
      title: "Đánh giá tiến bộ",
      headerStyle: {
        backgroundColor: themeColors.primary,
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    });

    // Kiểm tra evaluation trước khi sử dụng
    if (!evaluation) {
      showToast("Không có dữ liệu đánh giá tiến bộ.", { type: "error" });
      navigation.goBack();
      return;
    }

    // Hiển thị thông báo động viên nếu cải thiện tổng thể > 20%
    if (evaluation?.overall_improvement?.improvement > 20) {
      setShowMotivation(true);
      setTimeout(() => setShowMotivation(false), 5000); // Tắt sau 5s
    }
  }, [navigation, evaluation]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleViewLearningRoadmap = async () => {
    try {
      setGeneratingRoadmap(true);
      showToast("Đang tạo lộ trình học tập...", { type: "info" });

      // Bước 1: Lấy feedback mới nhất (câu hỏi làm sai)
      const feedbackResponse = await aiService.getFeedbackLatest(token);
      if (!feedbackResponse || !feedbackResponse.detailedAnalysis) {
        showToast("Không thể lấy thông tin câu hỏi sai!", { type: "error" });
        return;
      }

      // Bước 2: Lấy improvement mới nhất (đã có sẵn từ evaluation params)
      const improvementData = evaluation;

      // Bước 3: Chuẩn bị payload cho Layer 5
      const feedbackData = feedbackResponse.detailedAnalysis;

      // Transform incorrect questions từ feedback
      const incorrectQuestions = feedbackData.feedback
        .filter((item) => !item.is_correct)
        .map((item) => ({
          question_id: item.question_id,
          topic: item.topic,
          subtopic: item.subtopic,
          difficulty:
            item.difficulty_level === "Dễ"
              ? "EASY"
              : item.difficulty_level === "Trung bình"
              ? "MEDIUM"
              : "HARD",
          question_text: item.question,
          student_answer: item.student_answer,
          correct_answer: item.correct_answer,
          error_type: "CONCEPT_MISUNDERSTANDING", // Default value
        }));

      const payload = {
        submission_id: feedbackData.submission_id,
        student_id: user.userId,
        subject: feedbackData.subject,
        evaluation_data: {
          topics: improvementData.topics || [],
          overall_improvement: improvementData.overall_improvement || {},
        },
        incorrect_questions: incorrectQuestions,
        learning_style: "VISUAL", // TODO: Có thể lấy từ user profile
        available_time_per_day: 30, // TODO: Có thể lấy từ user profile (phút)
      };

      console.log("📤 Generating Roadmap with payload:", payload);

      // Bước 4: POST để tạo roadmap
      const generateResponse = await aiService.generateLearningRoadmap(
        payload,
        token
      );

      if (!generateResponse || !generateResponse.success) {
        showToast("Không thể tạo lộ trình học tập!", { type: "error" });
        return;
      }

      showToast("Lộ trình học tập đã được tạo!", { type: "success" });

      // Bước 5: Lấy roadmap mới nhất và navigate
      const roadmapResponse = await aiService.getRoadmapLatest(token);

      if (!roadmapResponse || !roadmapResponse.detailedAnalysis) {
        showToast("Không thể tải lộ trình!", { type: "error" });
        return;
      }

      // Navigate với data thực
      navigation.navigate("AssessmentLearningRoadmap", {
        roadmap: roadmapResponse.detailedAnalysis,
        evaluation: evaluation,
      });
    } catch (error) {
      console.error("❌ Error generating roadmap:", error);
      showToast("Lỗi khi tạo lộ trình học tập!", { type: "error" });
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Đã vững":
        return "#4CAF50";
      case "Tiến bộ rõ rệt":
        return "#2196F3";
      case "Cần cải thiện":
        return "#FF9800";
      case "Chưa tiến bộ":
        return "#F44336";
      default:
        return "#999";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Đã vững":
        return "checkmark-circle";
      case "Tiến bộ rõ rệt":
        return "trending-up";
      case "Cần cải thiện":
        return "alert-circle";
      case "Chưa tiến bộ":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const getImprovementIcon = (improvement) => {
    if (improvement > 30) return "rocket";
    if (improvement > 15) return "trending-up";
    if (improvement > 0) return "arrow-up";
    if (improvement === 0) return "remove";
    return "arrow-down";
  };

  const renderOverallImprovement = () => {
    if (!evaluation?.overall_improvement) return null;

    console.log("📈 Overall improvement data:", evaluation.overall_improvement);

    // Safe destructuring with defaults
    const {
      improvement = 0,
      direction = "Không thay đổi",
      previous_average = 0,
      new_average = 0,
    } = evaluation.overall_improvement || {};

    return (
      <View style={styles.overallCard}>
        <View style={styles.overallHeader}>
          <Ionicons
            name={getImprovementIcon(improvement)}
            size={32}
            color={
              improvement > 0
                ? "#4CAF50"
                : improvement === 0
                ? "#FF9800"
                : "#F44336"
            }
          />
          <Text style={styles.overallTitle}>Tổng quan tiến bộ</Text>
        </View>

        <View style={styles.overallStats}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Trước đây</Text>
            <Text style={styles.statValue}>{previous_average.toFixed(0)}%</Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={24}
            color={themeColors.primary}
          />

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Hiện tại</Text>
            <Text style={[styles.statValue, { color: themeColors.primary }]}>
              {new_average.toFixed(0)}%
            </Text>
          </View>
        </View>

        <View style={styles.improvementBadge}>
          <Text
            style={[
              styles.improvementText,
              {
                color:
                  improvement > 0
                    ? "#4CAF50"
                    : improvement === 0
                    ? "#FF9800"
                    : "#F44336",
              },
            ]}
          >
            {improvement > 0 ? "+" : ""}
            {improvement.toFixed(1)}% ({direction})
          </Text>
        </View>
      </View>
    );
  };

  const renderSummary = () => {
    if (!evaluation?.summary) return null;

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons
            name="document-text"
            size={24}
            color={themeColors.primary}
          />
          <Text style={styles.summaryTitle}>Nhận xét chung</Text>
        </View>
        <Text style={styles.summaryText}>{evaluation.summary}</Text>
      </View>
    );
  };

  const renderTopicProgress = () => {
    if (!evaluation?.topics || evaluation.topics.length === 0) return null;

    console.log("🔍 Topics data:", evaluation.topics);

    return (
      <View style={styles.topicsContainer}>
        <Text style={styles.sectionTitle}>Chi tiết từng chủ đề</Text>

        {evaluation.topics.map((topic, index) => {
          // Safe guard cho undefined/null values
          console.log(`📊 Topic ${index}:`, {
            improvement: topic.improvement,
            previous: topic.previous_accuracy,
            new: topic.new_accuracy,
          });

          const safeImprovement = Number(topic.improvement) || 0;
          const safePreviousAccuracy = Number(topic.previous_accuracy) || 0;
          const safeNewAccuracy = Number(topic.new_accuracy) || 0;
          const safeStatus = topic.status || "Chưa đánh giá";

          return (
            <View key={index} style={styles.topicCard}>
              <View style={styles.topicHeader}>
                <View style={styles.topicTitleRow}>
                  <Ionicons
                    name={getStatusIcon(safeStatus)}
                    size={20}
                    color={getStatusColor(safeStatus)}
                  />
                  <Text style={styles.topicName}>{topic.topic}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(safeStatus)}15` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(safeStatus) },
                    ]}
                  >
                    {safeStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.accuracyComparison}>
                <View style={styles.accuracyBox}>
                  <Text style={styles.accuracyLabel}>Trước</Text>
                  <Text style={styles.accuracyValue}>
                    {safePreviousAccuracy.toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.improvementArrow}>
                  <Ionicons
                    name={
                      safeImprovement > 0
                        ? "arrow-forward"
                        : safeImprovement === 0
                        ? "remove"
                        : "arrow-back"
                    }
                    size={20}
                    color={
                      safeImprovement > 0
                        ? "#4CAF50"
                        : safeImprovement === 0
                        ? "#FF9800"
                        : "#F44336"
                    }
                  />
                  <Text
                    style={[
                      styles.improvementValue,
                      {
                        color:
                          safeImprovement > 0
                            ? "#4CAF50"
                            : safeImprovement === 0
                            ? "#FF9800"
                            : "#F44336",
                      },
                    ]}
                  >
                    {safeImprovement > 0 ? "+" : ""}
                    {safeImprovement.toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.accuracyBox}>
                  <Text style={styles.accuracyLabel}>Sau</Text>
                  <Text
                    style={[
                      styles.accuracyValue,
                      { color: themeColors.primary },
                    ]}
                  >
                    {safeNewAccuracy.toFixed(0)}%
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderNextAction = () => {
    if (!evaluation?.next_action) return null;

    return (
      <View style={styles.nextActionCard}>
        <View style={styles.nextActionHeader}>
          <Ionicons name="bulb" size={24} color="#FFD60A" />
          <Text style={styles.nextActionTitle}>Bước tiếp theo</Text>
        </View>
        <Text style={styles.nextActionText}>{evaluation.next_action}</Text>
      </View>
    );
  };

  const renderMotivationBanner = () => {
    if (!showMotivation) return null;

    return (
      <View style={styles.motivationBanner}>
        <Ionicons name="trophy" size={32} color="#FFD60A" />
        <Text style={styles.motivationText}>
          🎉 Xuất sắc! Bạn đã tiến bộ rất nhiều!
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderMotivationBanner()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subject Header */}
        {evaluation?.subject && (
          <View style={styles.subjectHeader}>
            <Ionicons name="book" size={24} color={themeColors.primary} />
            <Text style={styles.subjectText}>{evaluation.subject}</Text>
          </View>
        )}

        {/* Overall Improvement */}
        {renderOverallImprovement()}

        {/* Summary */}
        {renderSummary()}

        {/* Topic Progress */}
        {renderTopicProgress()}

        {/* Next Action */}
        {renderNextAction()}

        {/* Learning Roadmap Button */}
        <TouchableOpacity
          style={[
            styles.roadmapButton,
            generatingRoadmap && styles.roadmapButtonDisabled,
          ]}
          onPress={handleViewLearningRoadmap}
          activeOpacity={0.8}
          disabled={generatingRoadmap}
        >
          {generatingRoadmap ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.roadmapButtonText}>Đang tạo lộ trình...</Text>
            </>
          ) : (
            <>
              <Ionicons name="map" size={22} color="#fff" />
              <Text style={styles.roadmapButtonText}>Xem lộ trình học tập</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  motivationBanner: {
    backgroundColor: themeColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  motivationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectText: {
    fontSize: 18,
    fontWeight: "bold",
    color: themeColors.text,
    flex: 1,
  },
  overallCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overallHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  overallTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: themeColors.text,
  },
  overallStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statBox: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: themeColors.text,
  },
  improvementBadge: {
    backgroundColor: "#F0F0F0",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  improvementText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: themeColors.text,
  },
  summaryText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 24,
  },
  topicsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: themeColors.text,
    marginBottom: 12,
  },
  topicCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  topicTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.text,
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  accuracyComparison: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  accuracyBox: {
    alignItems: "center",
  },
  accuracyLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  accuracyValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: themeColors.text,
  },
  improvementArrow: {
    alignItems: "center",
    gap: 4,
  },
  improvementValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  nextActionCard: {
    backgroundColor: "#FFF9E6",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFD60A",
  },
  nextActionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  nextActionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: themeColors.text,
  },
  nextActionText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 24,
  },
  roadmapButton: {
    backgroundColor: themeColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  roadmapButtonDisabled: {
    backgroundColor: "#999",
    shadowColor: "#999",
  },
  roadmapButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  backButton: {
    backgroundColor: themeColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
