import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import topicService from "../../services/topicService";
import aiService from "../../services/aiService";

const themeColors = {
  primary: "#9C27B0",
  secondary: "#7B1FA2",
  background: "#F5F5F5",
  card: "#FFFFFF",
  text: "#333333",
};

export default function AssessmentResultScreen({ route, navigation }) {
  const { user, token } = useContext(AuthContext);
  const { showToast } = useToast();
  const [evaluating, setEvaluating] = useState(false);

  const {
    subjectName,
    questions,
    answers,
    submissionResult,
    score,
    correctCount,
    totalQuestions,
    timeElapsed,
    selectedTopics,
  } = route.params;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  /**
   * Handle improvement evaluation
   * 1. Calculate new results from current questions and answers
   * 2. Fetch topic statistics and map with new results
   * 3. Call Layer 4 API
   * 4. Mark submission as evaluated
   * 5. Navigate to improvement screen
   */
  const handleImprovementEvaluation = async () => {
    try {
      setEvaluating(true);
      showToast("Đang phân tích tiến bộ...", { type: "info" });

      // Step 1: Calculate NEW results from current questions and answers
      const topicMap = {};

      if (questions && Array.isArray(questions)) {
        questions.forEach((q) => {
          const topicName = q.topicName || "Unknown";
          if (!topicMap[topicName]) {
            topicMap[topicName] = { correct: 0, total: 0 };
          }
          topicMap[topicName].total += 1;

          const userAnswer = answers[q.questionId];
          const correctOption = q.options?.find((opt) => opt.isCorrect);
          if (userAnswer === correctOption?.optionId) {
            topicMap[topicName].correct += 1;
          }
        });
      }

      const new_results = Object.keys(topicMap).map((topic) => ({
        topic: topic,
        accuracy: topicMap[topic].correct / topicMap[topic].total,
      }));

      console.log(
        "Calculated new_results:",
        JSON.stringify(new_results, null, 2)
      );

      // Step 2: Fetch topic statistics (all previous topics)
      const statsResult = await topicService.getTopicStatistics(
        user.userId,
        token
      );

      // Create a map of topic name -> accuracy from statistics
      const statsMap = {};
      if (
        statsResult &&
        statsResult.success &&
        Array.isArray(statsResult.data)
      ) {
        statsResult.data.forEach((item) => {
          statsMap[item.topic] = item.accuracy;
        });
      }

      // Step 3: Map previous results with topics from new_results
      // If a topic exists in statistics, use its accuracy; otherwise use 0
      const previous_results = new_results.map((newItem) => ({
        topic: newItem.topic,
        accuracy: statsMap[newItem.topic] || 0, // Default to 0 if no previous data
      }));

      console.log(
        "Mapped previous_results:",
        JSON.stringify(previous_results, null, 2)
      );

      // Step 4: Call Layer 4 API
      const layer4Payload = {
        submission_id: submissionResult.submissionId.toString(),
        subject: subjectName,
        student_id: user.userId,
        previous_results: previous_results,
        new_results: new_results,
      };

      console.log("Layer 4 Payload:", JSON.stringify(layer4Payload, null, 2));

      const evaluationResult = await aiService.layer4(layer4Payload, token);

      if (!evaluationResult || !evaluationResult.success) {
        showToast("Không thể phân tích tiến bộ. Vui lòng thử lại.", {
          type: "error",
        });
        return;
      }

      // Step 5: Mark submission as evaluated
      await topicService.markSubmissionEvaluated(
        submissionResult.submissionId,
        token
      );

      showToast("Đánh giá tiến bộ thành công!", { type: "success" });

      // Step 6: Navigate to improvement screen
      navigation.navigate("AssessmentImprovementScreen", {
        evaluation: evaluationResult.data,
      });
    } catch (error) {
      console.error("Error evaluating improvement:", error);
      showToast("Lỗi khi đánh giá tiến bộ", { type: "error" });
    } finally {
      setEvaluating(false);
    }
  };

  // Use statistics from submission result if available, otherwise calculate
  let topicStats = {};
  let difficultyStats = {};

  if (submissionResult?.statistics) {
    // Use API statistics
    topicStats = submissionResult.statistics.byTopic || {};
    difficultyStats = submissionResult.statistics.byDifficulty || {};
  } else {
    // Fallback: Calculate statistics from questions
    selectedTopics?.forEach((topic) => {
      topicStats[topic.name] = {
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
      };
    });

    questions?.forEach((q) => {
      const topicName = q.topicName;
      if (topicStats[topicName]) {
        topicStats[topicName].totalQuestions++;
        const userAnswer = answers[q.questionId];
        const correctOption = q.options?.find((opt) => opt.isCorrect);
        if (userAnswer === correctOption?.optionId) {
          topicStats[topicName].correctAnswers++;
        }
      }
    });

    // Calculate accuracy
    Object.keys(topicStats).forEach((key) => {
      const stat = topicStats[key];
      stat.accuracy =
        stat.totalQuestions > 0
          ? (stat.correctAnswers / stat.totalQuestions) * 100
          : 0;
    });

    // Calculate difficulty stats
    difficultyStats = {
      EASY: { totalQuestions: 0, correctAnswers: 0, accuracy: 0 },
      MEDIUM: { totalQuestions: 0, correctAnswers: 0, accuracy: 0 },
      HARD: { totalQuestions: 0, correctAnswers: 0, accuracy: 0 },
    };

    questions?.forEach((q) => {
      const difficulty = q.difficultyLevel;
      if (difficultyStats[difficulty]) {
        difficultyStats[difficulty].totalQuestions++;
        const userAnswer = answers[q.questionId];
        const correctOption = q.options?.find((opt) => opt.isCorrect);
        if (userAnswer === correctOption?.optionId) {
          difficultyStats[difficulty].correctAnswers++;
        }
      }
    });

    // Calculate accuracy for difficulty
    Object.keys(difficultyStats).forEach((key) => {
      const stat = difficultyStats[key];
      stat.accuracy =
        stat.totalQuestions > 0
          ? (stat.correctAnswers / stat.totalQuestions) * 100
          : 0;
    });
  }

  // Determine performance level
  const getPerformanceLevel = () => {
    if (score >= 80)
      return { label: "Xuất sắc", color: "#4CAF50", icon: "trophy" };
    if (score >= 70) return { label: "Tốt", color: "#8BC34A", icon: "ribbon" };
    if (score >= 50)
      return { label: "Trung bình", color: "#FF9800", icon: "star-half" };
    return { label: "Cần cố gắng", color: "#F44336", icon: "alert-circle" };
  };

  const performance = getPerformanceLevel();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <Ionicons
            name={performance.icon}
            size={64}
            color={performance.color}
          />
          <Text style={styles.performanceLabel}>{performance.label}</Text>
          <Text style={styles.scoreText}>{score / 10} điểm</Text>
          <Text style={styles.subjectName}>{subjectName}</Text>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Tổng quan</Text>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{correctCount}</Text>
              <Text style={styles.statLabel}>Đúng</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="close-circle" size={24} color="#F44336" />
              <Text style={styles.statValue}>
                {totalQuestions - correctCount}
              </Text>
              <Text style={styles.statLabel}>Sai</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="time" size={24} color="#2196F3" />
              <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
              <Text style={styles.statLabel}>Thời gian</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(correctCount / totalQuestions) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {correctCount}/{totalQuestions} câu đúng (
              {Math.round((correctCount / totalQuestions) * 100)}%)
            </Text>
          </View>
        </View>

        {/* Topic-wise Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Kết quả theo chủ đề</Text>
          {Object.keys(topicStats).length > 0 ? (
            Object.entries(topicStats).map(([topicName, stat], index) => {
              const accuracy = stat.accuracy || 0;
              return (
                <View key={index} style={styles.topicStatRow}>
                  <View style={styles.topicStatLeft}>
                    <Text style={styles.topicStatName}>{topicName}</Text>
                    <Text style={styles.topicStatDetail}>
                      {stat.correctAnswers}/{stat.totalQuestions} câu đúng
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.topicStatPercentage,
                      accuracy >= 80
                        ? styles.percentageHigh
                        : accuracy >= 50
                        ? styles.percentageMedium
                        : styles.percentageLow,
                    ]}
                  >
                    {Math.round(accuracy)}%
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={{ color: "#999", textAlign: "center" }}>
              Không có dữ liệu
            </Text>
          )}
        </View>

        {/* Difficulty-wise Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Kết quả theo mức độ</Text>

          {[
            { key: "EASY", label: "Dễ", color: "#4CAF50" },
            { key: "MEDIUM", label: "Trung bình", color: "#FF9800" },
            { key: "HARD", label: "Khó", color: "#F44336" },
          ].map((item) => {
            const stat = difficultyStats[item.key];
            if (!stat || stat.totalQuestions === 0) return null;

            const accuracy = stat.accuracy || 0;

            return (
              <View key={item.key} style={styles.difficultyStatRow}>
                <View
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: item.color },
                  ]}
                >
                  <Text style={styles.difficultyBadgeText}>{item.label}</Text>
                </View>
                <View style={styles.difficultyStatContent}>
                  <View style={styles.difficultyStatBar}>
                    <View
                      style={[
                        styles.difficultyStatBarFill,
                        {
                          width: `${accuracy}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.difficultyStatText}>
                    {stat.correctAnswers}/{stat.totalQuestions} (
                    {Math.round(accuracy)}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* AI Recommendations from Layer 2 */}
        {submissionResult?.aiRecommendation && (
          <View style={styles.aiRecommendationCard}>
            <View style={styles.aiRecommendationHeader}>
              <Ionicons name="sparkles" size={24} color="#FFD60A" />
              <Text style={styles.aiRecommendationTitle}>Gợi ý từ AI</Text>
            </View>

            {/* Overall Advice */}
            {submissionResult.aiRecommendation.overall_advice && (
              <View style={styles.overallAdviceSection}>
                <Text style={styles.overallAdviceText}>
                  {submissionResult.aiRecommendation.overall_advice}
                </Text>
              </View>
            )}

            {/* Weak Topics */}
            {submissionResult.aiRecommendation.weak_topics &&
              submissionResult.aiRecommendation.weak_topics.length > 0 && (
                <View style={styles.weakTopicsSection}>
                  <Text style={styles.weakTopicsTitle}>
                    Chủ đề cần cải thiện:
                  </Text>
                  {submissionResult.aiRecommendation.weak_topics.map(
                    (topic, index) => (
                      <View key={index} style={styles.weakTopicCard}>
                        <View style={styles.weakTopicHeader}>
                          <Ionicons
                            name="alert-circle"
                            size={20}
                            color="#FF9800"
                          />
                          <Text style={styles.weakTopicName}>
                            {topic.topic}
                          </Text>
                          <Text style={styles.weakTopicPercentage}>
                            {topic.percentage}% sai
                          </Text>
                        </View>

                        {topic.recommendation && (
                          <View style={styles.topicRecommendation}>
                            {topic.recommendation.study_focus && (
                              <View style={styles.recommendationRow}>
                                <Ionicons name="flag" size={16} color="#666" />
                                <Text style={styles.recommendationLabel}>
                                  Tập trung học:
                                </Text>
                                <Text style={styles.recommendationValue}>
                                  {topic.recommendation.study_focus}
                                </Text>
                              </View>
                            )}

                            {topic.recommendation.practice_suggestion && (
                              <View style={styles.recommendationRow}>
                                <Ionicons
                                  name="pencil"
                                  size={16}
                                  color="#666"
                                />
                                <Text style={styles.recommendationLabel}>
                                  Luyện tập:
                                </Text>
                                <Text style={styles.recommendationValue}>
                                  {topic.recommendation.practice_suggestion}
                                </Text>
                              </View>
                            )}

                            {topic.recommendation.resource_hint && (
                              <View style={styles.recommendationRow}>
                                <Ionicons name="book" size={16} color="#666" />
                                <Text style={styles.recommendationLabel}>
                                  Tài liệu:
                                </Text>
                                <Text style={styles.recommendationValue}>
                                  {topic.recommendation.resource_hint}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )
                  )}
                </View>
              )}
          </View>
        )}

        {/* Basic Recommendations (fallback) */}
        <View style={styles.recommendationCard}>
          <View style={styles.recommendationHeader}>
            <Ionicons name="bulb" size={24} color={themeColors.primary} />
            <Text style={styles.recommendationTitle}>Gợi ý cơ bản</Text>
          </View>

          {score != null && score < 80 && (
            <View style={styles.recommendationItem}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#666"
              />
              <Text style={styles.recommendationText}>
                {score < 50
                  ? "Bạn cần ôn lại kiến thức cơ bản của các chủ đề đã chọn"
                  : "Hãy làm thêm bài luyện tập để nâng cao kỹ năng"}
              </Text>
            </View>
          )}

          {topicStats &&
            Object.values(topicStats).some(
              (stat) =>
                stat &&
                stat.totalQuestions > 0 &&
                stat.correctAnswers / stat.totalQuestions < 0.6
            ) && (
              <View style={styles.recommendationItem}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#666"
                />
                <Text style={styles.recommendationText}>
                  Tập trung vào các chủ đề có tỷ lệ đúng dưới 60%
                </Text>
              </View>
            )}

          {difficultyStats?.HARD &&
            difficultyStats.HARD.totalQuestions > 0 &&
            difficultyStats.HARD.correctAnswers /
              difficultyStats.HARD.totalQuestions <
              0.5 && (
              <View style={styles.recommendationItem}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#666"
                />
                <Text style={styles.recommendationText}>
                  Nên luyện tập thêm các câu hỏi mức độ khó
                </Text>
              </View>
            )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() =>
            navigation.navigate("AssessmentReview", {
              questions,
              answers,
              subjectName,
              submissionResult,
            })
          }
        >
          <Ionicons name="eye-outline" size={20} color={themeColors.primary} />
          <Text style={styles.reviewButtonText}>Xem chi tiết</Text>
        </TouchableOpacity>

        {!route.params?.isHistoryView && submissionResult?.aiRecommendation && (
          <>
            {submissionResult?.improvementEvaluated ? (
              // Already evaluated - show disabled button with status
              <View style={styles.improvementButtonDisabled}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.improvementButtonDisabledText}>
                  Đã đánh giá tiến bộ
                </Text>
              </View>
            ) : (
              // Not evaluated yet - show active button
              <TouchableOpacity
                style={styles.improvementButton}
                onPress={handleImprovementEvaluation}
                disabled={evaluating}
              >
                <Ionicons name="trending-up" size={20} color="#fff" />
                <Text style={styles.improvementButtonText}>
                  {evaluating ? "Đang xử lý..." : "Đánh giá tiến bộ"}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate("MainTabs")}
        >
          <Ionicons name="home" size={20} color="#fff" />
          <Text style={styles.homeButtonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    backgroundColor: themeColors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  performanceLabel: {
    fontSize: 24,
    fontWeight: "700",
    color: themeColors.text,
    marginTop: 16,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "800",
    color: themeColors.primary,
    marginTop: 8,
  },
  subjectName: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  statsCard: {
    backgroundColor: themeColors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.text,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: themeColors.text,
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  topicStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  topicStatLeft: {
    flex: 1,
  },
  topicStatName: {
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 4,
  },
  topicStatDetail: {
    fontSize: 13,
    color: "#666",
  },
  topicStatPercentage: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  percentageHigh: {
    color: "#4CAF50",
  },
  percentageMedium: {
    color: "#FF9800",
  },
  percentageLow: {
    color: "#F44336",
  },
  difficultyStatRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  difficultyBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  difficultyStatContent: {
    flex: 1,
    gap: 4,
  },
  difficultyStatBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  difficultyStatBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  difficultyStatText: {
    fontSize: 12,
    color: "#666",
  },
  recommendationCard: {
    backgroundColor: `${themeColors.primary}10`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.primary,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  // AI Recommendation Styles
  aiRecommendationCard: {
    backgroundColor: "#FFF9E6",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFD60A",
  },
  aiRecommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  aiRecommendationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF9800",
  },
  overallAdviceSection: {
    backgroundColor: "#FFFBF0",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FFD60A",
  },
  overallAdviceText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    fontStyle: "italic",
  },
  weakTopicsSection: {
    marginTop: 8,
  },
  weakTopicsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 12,
  },
  weakTopicCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFE4B5",
  },
  weakTopicHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  weakTopicName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.text,
  },
  weakTopicPercentage: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF9800",
  },
  topicRecommendation: {
    gap: 12,
  },
  recommendationRow: {
    flexDirection: "row",
    gap: 8,
  },
  recommendationLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    minWidth: 90,
  },
  recommendationValue: {
    flex: 1,
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    backgroundColor: themeColors.card,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 12,
  },
  reviewButton: {
    flex: 1,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${themeColors.primary}15`,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    borderWidth: 2,
    borderColor: themeColors.primary,
  },
  reviewButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.primary,
  },
  improvementButton: {
    flex: 1,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2ecc71",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  improvementButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  improvementButtonDisabled: {
    flex: 1,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  improvementButtonDisabledText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4CAF50",
  },
  homeButton: {
    flex: 1,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeColors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
