import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import topicService from "../../services/topicService";
import aiService from "../../services/aiService";

const themeColors = {
  primary: "#00cc66", // xanh lá chủ đạo
  secondary: "#33cc77", // xanh lá nhạt hơn
  background: "#e6f5ea", // nền xanh rất nhạt / trắng pha xanh
  card: "#FFFFFF", // màu card vẫn trắng
  text: "#006633", // text màu xanh đậm
};

export default function AssessmentHistoryScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);

      const result = await topicService.getStudentSubmissions(
        user.userId,
        token
      );

      if (result && result.success && Array.isArray(result.data)) {
        // Sort by submittedAt descending (newest first)
        const sorted = result.data.sort(
          (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
        );
        setSubmissions(sorted);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      showToast("Lỗi khi tải lịch sử bài làm", { type: "error" });
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle improvement evaluation from history
   * 1. Fetch submission detail to get questions with answers
   * 2. Fetch topic statistics (previous results)
   * 3. Calculate new results from submission detail
   * 4. Map previous results with topic names from new results
   * 5. Call Layer 4 API
   * 6. Mark submission as evaluated
   * 7. Navigate to improvement screen
   */
  const handleImprovementEvaluation = async (submission) => {
    try {
      setEvaluating(true);
      showToast("Đang phân tích tiến bộ...", { type: "info" });

      // Step 1: Fetch submission detail to get full questions data
      const detailResult = await topicService.getSubmissionDetail(
        submission.submissionId,
        token
      );

      if (!detailResult || !detailResult.success || !detailResult.data) {
        showToast("Không thể tải chi tiết bài làm.", { type: "error" });
        return;
      }

      const detailData = detailResult.data;

      // Step 2: Calculate NEW results from submission detail (answers array)
      const topicMap = {};

      if (detailData.answers && Array.isArray(detailData.answers)) {
        detailData.answers.forEach((ans) => {
          const topicName = ans.topicName || "Unknown";
          if (!topicMap[topicName]) {
            topicMap[topicName] = { correct: 0, total: 0 };
          }
          topicMap[topicName].total += 1;
          // Check if answer is correct
          if (ans.chosenOptionId === ans.correctOptionId) {
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

      // Step 3: Fetch topic statistics (all previous topics)
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

      // Step 4: Map previous results with topics from new_results
      // If a topic exists in statistics, use its accuracy; otherwise use 0
      const previous_results = new_results.map((newItem) => ({
        topic: newItem.topic,
        accuracy: statsMap[newItem.topic] || 0, // Default to 0 if no previous data
      }));

      console.log(
        "Mapped previous_results:",
        JSON.stringify(previous_results, null, 2)
      );

      // Step 5: Call Layer 4 API
      const layer4Payload = {
        submission_id: submission.submissionId.toString(),
        subject: submission.subjectName,
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

      // Step 6: Mark submission as evaluated
      await topicService.markSubmissionEvaluated(
        submission.submissionId,
        token
      );

      // Update local state
      setSubmissions((prev) =>
        prev.map((item) =>
          item.submissionId === submission.submissionId
            ? { ...item, improvementEvaluated: true }
            : item
        )
      );

      showToast("Đánh giá tiến bộ thành công!", { type: "success" });

      // Step 7: Navigate to improvement screen
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubmissions();
    setRefreshing(false);
  };

  const handleViewSubmission = async (submission) => {
    try {
      // Show loading toast
      showToast("Đang tải chi tiết bài làm...", { type: "info" });

      // Fetch detailed submission data
      const result = await topicService.getSubmissionDetail(
        submission.submissionId,
        token
      );

      if (result && result.success && result.data) {
        const detailData = result.data;

        // Fetch AI feedback for this assessment
        let aiFeedbackData = null;
        let aiRecommendationData = null;

        try {
          // Fetch Layer 1 feedback
          const aiFeedbackResult = await aiService.getAIFeedbackByAssignmentId(
            detailData.assessmentId,
            token
          );

          console.log("AI Feedback result:", aiFeedbackResult);

          // Extract feedback from the response
          if (Array.isArray(aiFeedbackResult) && aiFeedbackResult.length > 0) {
            // Get the most recent feedback
            const latestFeedback = aiFeedbackResult[0];
            if (latestFeedback.detailedAnalysis) {
              aiFeedbackData = latestFeedback.detailedAnalysis;
            }
          }
        } catch (aiError) {
          console.error("Error fetching AI feedback:", aiError);
          // Continue without AI feedback
        }

        try {
          // Fetch Layer 2 recommendation
          const aiRecommendationResult =
            await aiService.getAIRecommendationByAssignmentId(
              detailData.assessmentId,
              token
            );
          console.log("AssessmentId", detailData.assessmentId);

          console.log("AI Recommendation result:", aiRecommendationResult);

          // Extract recommendation from the response
          if (
            Array.isArray(aiRecommendationResult) &&
            aiRecommendationResult.length > 0
          ) {
            // Get the most recent recommendation
            const latestRecommendation = aiRecommendationResult[0];
            if (latestRecommendation.detailedAnalysis) {
              aiRecommendationData = latestRecommendation.detailedAnalysis;
            }
          }
        } catch (aiError) {
          console.error("Error fetching AI recommendation:", aiError);
          // Continue without AI recommendation
        }

        // Convert answers array to answers object for compatibility
        const answersObj = {};
        detailData.answers.forEach((ans) => {
          answersObj[ans.questionId] = ans.chosenOptionId;
        });

        // Convert answers to questions format for review
        const questions = detailData.answers.map((ans) => {
          // Find AI feedback for this question
          let aiFeedbackForQuestion = null;
          if (aiFeedbackData && aiFeedbackData.feedback) {
            aiFeedbackForQuestion = aiFeedbackData.feedback.find(
              (fb) => fb.question_id === ans.questionId
            );
          }

          return {
            questionId: ans.questionId,
            questionText: ans.questionText,
            topicName: ans.topicName,
            difficultyLevel: ans.difficultyLevel,
            options: [
              {
                optionId: ans.correctOptionId,
                optionText: ans.correctOptionText,
                isCorrect: true,
              },
              // Add the chosen option if different
              ...(ans.chosenOptionId !== ans.correctOptionId
                ? [
                    {
                      optionId: ans.chosenOptionId,
                      optionText: ans.chosenOptionText,
                      isCorrect: false,
                    },
                  ]
                : []),
            ],
            explanation: ans.explanation,
            // Add AI feedback to question if available
            aiFeedback: aiFeedbackForQuestion,
          };
        });

        // Prepare submission result with AI feedback and recommendation
        const submissionResultWithAI = {
          ...detailData,
          aiFeedback: aiFeedbackData, // Add Layer 1 feedback
          aiRecommendation: aiRecommendationData, // Add Layer 2 recommendation
        };

        // Navigate to result screen with full data
        navigation.navigate("AssessmentResult", {
          assessmentId: detailData.assessmentId,
          subjectId: detailData.subjectId,
          subjectName: detailData.subjectName,
          questions: questions,
          answers: answersObj,
          submissionResult: submissionResultWithAI,
          score: detailData.score,
          correctCount: detailData.correctAnswers,
          totalQuestions: detailData.totalQuestions,
          timeElapsed: detailData.timeTaken,
          difficulty: detailData.difficulty,
          isHistoryView: true, // Flag to indicate this is a history view
        });
      }
    } catch (error) {
      console.error("Error fetching submission detail:", error);
      showToast("Lỗi khi tải chi tiết bài làm", { type: "error" });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getPerformanceColor = (level) => {
    switch (level) {
      case "NEEDS_IMPROVEMENT":
        return "#FF5722";
      case "EXCELLENT":
        return "#4CAF50";
      case "GOOD":
        return "#8BC34A";
      case "AVERAGE":
        return "#FF9800";
      case "BELOW_AVERAGE":
        return "#FF5722";
      case "POOR":
        return "#F44336";
      default:
        return "#999";
    }
  };

  const getPerformanceLabel = (level) => {
    switch (level) {
      case "NEEDS_IMPROVEMENT":
        return "Cần cải thiện";
      case "EXCELLENT":
        return "Xuất sắc";
      case "GOOD":
        return "Tốt";
      case "AVERAGE":
        return "Trung bình";
      case "BELOW_AVERAGE":
        return "Yếu";
      case "POOR":
        return "Kém";
      default:
        return level;
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case "EASY":
        return "Dễ";
      case "MEDIUM":
        return "Trung bình";
      case "HARD":
        return "Khó";
      case "MIXED":
        return "Hỗn hợp";
      default:
        return difficulty;
    }
  };

  const renderSubmissionItem = ({ item }) => {
    const performanceColor = getPerformanceColor(item.performanceLevel);
    const performanceLabel = getPerformanceLabel(item.performanceLevel);

    return (
      <View style={styles.submissionCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.subjectInfo}>
            <Ionicons name="book" size={20} color={themeColors.primary} />
            <Text style={styles.subjectName}>{item.subjectName}</Text>
          </View>
          <View
            style={[
              styles.performanceBadge,
              { backgroundColor: performanceColor },
            ]}
          >
            <Text style={styles.performanceText}>{performanceLabel}</Text>
          </View>
        </View>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: performanceColor }]}>
            {(item.score / 10).toFixed(2)} điểm
          </Text>
          <Text style={styles.scoreDetail}>
            {item.correctAnswers}/{item.totalQuestions} câu đúng
          </Text>
        </View>

        {/* Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatDate(item.submittedAt)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{formatTime(item.timeTaken)}</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="stats-chart-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {getDifficultyLabel(item.difficulty)}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.viewDetailButton}
            onPress={() => handleViewSubmission(item)}
          >
            <Ionicons name="eye" size={16} color={themeColors.primary} />
            <Text style={styles.viewDetailButtonText}>Xem chi tiết</Text>
          </TouchableOpacity>

          {item.improvementEvaluated ? (
            // Already evaluated - show status
            <View style={styles.evaluatedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.evaluatedBadgeText}>Đã đánh giá</Text>
            </View>
          ) : (
            // Not evaluated yet - show button
            <TouchableOpacity
              style={styles.evaluateButton}
              onPress={() => handleImprovementEvaluation(item)}
              disabled={evaluating}
            >
              <Ionicons name="trending-up" size={16} color="#fff" />
              <Text style={styles.evaluateButtonText}>
                {evaluating ? "Đang xử lý..." : "Đánh giá tiến bộ"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {submissions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Chưa có bài làm nào</Text>
          <Text style={styles.emptySubtext}>
            Hãy làm bài đánh giá đầu tiên của bạn!
          </Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          renderItem={renderSubmissionItem}
          keyExtractor={(item) => item.submissionId.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeColors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  submissionCard: {
    backgroundColor: themeColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.text,
  },
  performanceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: "700",
  },
  scoreDetail: {
    fontSize: 14,
    color: "#666",
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
  },
  improvementBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F5E9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  improvementBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  viewButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.primary,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  viewDetailButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: themeColors.primary,
    backgroundColor: "#FFF",
  },
  viewDetailButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: themeColors.primary,
  },
  evaluateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
  },
  evaluateButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },
  evaluatedBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#E8F5E9",
    borderWidth: 1.5,
    borderColor: "#A5D6A7",
  },
  evaluatedBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4CAF50",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#BBB",
    textAlign: "center",
  },
});
