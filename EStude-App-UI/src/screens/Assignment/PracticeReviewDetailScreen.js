import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../contexts/AuthContext";
import aiService from "../../services/aiService";

const themeColors = {
  primary: "#2ecc71",
  secondary: "#27ae60",
  danger: "#c62828",
  card: "#f9f9f9",
  text: "#333",
};

export default function PracticeReviewDetailScreen({ route, navigation }) {
  const { practiceReview } = route.params;
  const { token } = useContext(AuthContext);
  const [improvement, setImprovement] = useState(null);
  const [loadingImprovement, setLoadingImprovement] = useState(true);
  
  if (!practiceReview) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy dữ liệu bài luyện tập</Text>
      </View>
    );
  }

  const detailedAnalysis = practiceReview.detailedAnalysis || {};
  const summary = detailedAnalysis.summary || {};
  const feedback = detailedAnalysis.feedback || [];
  const topicBreakdown = detailedAnalysis.topic_breakdown || [];
  const practiceResultId = practiceReview.resultId; // resultId từ Layer 3.5

  // Fetch improvement data khi component mount
  useEffect(() => {
    const fetchImprovement = async () => {
      try {
        setLoadingImprovement(true);
        const allImprovements = await aiService.getAllUserImprovements(token);
        
        console.log("📊 All Improvements:", JSON.stringify(allImprovements, null, 2));
        console.log("🔍 Looking for result_id:", practiceResultId);
        
        if (allImprovements && Array.isArray(allImprovements)) {
          // Tìm improvement có detailedAnalysis.result_id khớp với practiceResultId
          const matchedImprovement = allImprovements.find(
            (imp) => String(imp.detailedAnalysis?.result_id) === String(practiceResultId)
          );
          
          if (matchedImprovement) {
            console.log("✅ Found matching improvement:", matchedImprovement);
            setImprovement(matchedImprovement.detailedAnalysis);
          } else {
            console.log("⚠️ No matching improvement found for resultId:", practiceResultId);
          }
        }
      } catch (error) {
        console.error("Error fetching improvement:", error);
      } finally {
        setLoadingImprovement(false);
      }
    };

    if (practiceResultId && token) {
      fetchImprovement();
    } else {
      setLoadingImprovement(false);
    }
  }, [practiceResultId, token]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {detailedAnalysis.subject || "Bài luyện tập"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {detailedAnalysis.student_name || "Học sinh"}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Summary Section */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Tóm tắt kết quả</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tổng số câu</Text>
              <Text style={styles.summaryValue}>{summary.total_questions || 0}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Số câu đúng</Text>
              <Text style={[styles.summaryValue, { color: themeColors.primary }]}>
                {summary.correct_count || 0}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Độ chính xác</Text>
              <Text style={[styles.summaryValue, { color: themeColors.secondary }]}>
                {summary.accuracy_percentage?.toFixed(1) || 0}%
              </Text>
            </View>
          </View>
          
          {detailedAnalysis.timestamp && (
            <Text style={styles.timestampText}>
              📅 Ngày làm: {new Date(detailedAnalysis.timestamp).toLocaleString("vi-VN")}
            </Text>
          )}
        </View>

        {/* Topic Breakdown */}
        {topicBreakdown.length > 0 && (
          <View style={styles.topicBreakdownCard}>
            <Text style={styles.sectionTitle}>Phân tích theo chủ đề</Text>
            {topicBreakdown.map((topic, idx) => (
              <View key={idx} style={styles.topicItem}>
                <Text style={styles.topicName}>📚 {topic.topic}</Text>
                <View style={styles.topicStats}>
                  <Text style={styles.topicStat}>
                    Đúng: {topic.correct}/{topic.total}
                  </Text>
                  <Text style={[
                    styles.topicAccuracy,
                    { color: topic.accuracy >= 0.7 ? themeColors.primary : themeColors.danger }
                  ]}>
                    {(topic.accuracy * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Detailed Feedback */}
        <View style={styles.feedbackSection}>
          <Text style={styles.sectionTitle}>Chi tiết từng câu hỏi</Text>
          {feedback.map((fb, idx) => (
            <View
              key={idx}
              style={[
                styles.feedbackCard,
                { borderLeftColor: fb.is_correct ? themeColors.primary : themeColors.danger }
              ]}
            >
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>Câu {idx + 1}</Text>
                <View style={[
                  styles.resultBadge,
                  { backgroundColor: fb.is_correct ? "#e8f5e9" : "#ffebee" }
                ]}>
                  <Text style={[
                    styles.resultText,
                    { color: fb.is_correct ? themeColors.secondary : themeColors.danger }
                  ]}>
                    {fb.is_correct ? "✓ ĐÚNG" : "✗ SAI"}
                  </Text>
                </View>
              </View>

              <Text style={styles.questionText}>{fb.question}</Text>

              <View style={styles.answerInfo}>
                <Text style={styles.answerLabel}>
                  📝 Đáp án của bạn: <Text style={styles.answerValue}>
                    {fb.student_answer ? `Đáp án ${fb.student_answer}` : "Chưa trả lời"}
                  </Text>
                </Text>
                <Text style={styles.answerLabel}>
                  ✅ Đáp án đúng: <Text style={[styles.answerValue, { color: themeColors.primary }]}>
                    {fb.correct_answer ? `Đáp án ${fb.correct_answer}` : "N/A"}
                  </Text>
                </Text>
              </View>

              {fb.explanation && (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationLabel}>
                    <Ionicons name="bulb-outline" size={16} color={themeColors.secondary} /> Giải thích:
                  </Text>
                  <Text style={styles.explanationText}>{fb.explanation}</Text>
                </View>
              )}

              {(fb.topic || fb.subtopic || fb.difficulty_level) && (
                <View style={styles.metaInfo}>
                  {fb.topic && (
                    <View style={styles.metaTag}>
                      <Text style={styles.metaText}>📚 {fb.topic}</Text>
                    </View>
                  )}
                  {fb.subtopic && (
                    <View style={styles.metaTag}>
                      <Text style={styles.metaText}>📖 {fb.subtopic}</Text>
                    </View>
                  )}
                  {fb.difficulty_level && (
                    <View style={styles.metaTag}>
                      <Text style={styles.metaText}>📊 {fb.difficulty_level}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Improvement Evaluation (Layer 4) */}
        {loadingImprovement ? (
          <View style={styles.improvementCard}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={{ textAlign: "center", marginTop: 10, color: "#666" }}>
              Đang tải đánh giá tiến bộ...
            </Text>
          </View>
        ) : improvement ? (
          <View style={styles.improvementCard}>
            <Text style={styles.sectionTitle}>📈 Đánh giá tiến bộ</Text>
            
            {/* Overall Summary */}
            <View style={styles.improvementSummary}>
              <Text style={styles.improvementSubject}>
                {improvement.subject || "Môn học"}
              </Text>
              <Text style={styles.improvementSummaryText}>
                {improvement.summary}
              </Text>
              
              {improvement.overall_improvement && (
                <View style={styles.overallBox}>
                  <View style={styles.overallRow}>
                    <Text style={styles.overallLabel}>Cải thiện:</Text>
                    <Text style={[
                      styles.overallValue,
                      { color: improvement.overall_improvement.improvement >= 0 
                        ? themeColors.primary 
                        : themeColors.danger 
                      }
                    ]}>
                      {improvement.overall_improvement.improvement_percentage}
                    </Text>
                  </View>
                  <View style={styles.overallRow}>
                    <Text style={styles.overallLabel}>Trạng thái:</Text>
                    <Text style={styles.overallValue}>
                      {improvement.overall_improvement.direction}
                    </Text>
                  </View>
                  <View style={styles.overallRow}>
                    <Text style={styles.overallLabel}>Trước:</Text>
                    <Text style={styles.overallValue}>
                      {improvement.overall_improvement.previous_average?.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.overallRow}>
                    <Text style={styles.overallLabel}>Sau:</Text>
                    <Text style={[
                      styles.overallValue,
                      { color: themeColors.primary, fontWeight: "700" }
                    ]}>
                      {improvement.overall_improvement.new_average?.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Topics Breakdown */}
            {Array.isArray(improvement.topics) && improvement.topics.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.improvementSubtitle}>Chi tiết theo chủ đề:</Text>
                {improvement.topics.map((topic, idx) => (
                  <View key={idx} style={styles.topicProgressCard}>
                    <View style={styles.topicProgressHeader}>
                      <Text style={styles.topicProgressName}>{topic.topic}</Text>
                      <View style={[
                        styles.statusBadge,
                        { 
                          backgroundColor: 
                            topic.status === "Đã vững" || topic.status === "Tiến bộ vượt bậc"
                              ? "#4caf50"
                              : topic.status === "Cần luyện thêm"
                              ? "#ff5722"
                              : "#ff9800"
                        }
                      ]}>
                        <Text style={styles.statusBadgeText}>{topic.status}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.accuracyComparison}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.accuracyLabel}>Trước</Text>
                        <View style={styles.progressBarSmall}>
                          <View style={[
                            styles.progressFillSmall,
                            { 
                              width: `${Math.min(topic.previous_accuracy, 100)}%`,
                              backgroundColor: "#9e9e9e"
                            }
                          ]} />
                        </View>
                        <Text style={styles.accuracyValue}>
                          {topic.previous_accuracy?.toFixed(1)}%
                        </Text>
                      </View>
                      
                      <View style={styles.arrowContainer}>
                        <Ionicons 
                          name={topic.improvement >= 0 ? "arrow-forward" : "arrow-back"} 
                          size={20} 
                          color={topic.improvement >= 0 ? themeColors.primary : themeColors.danger} 
                        />
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={styles.accuracyLabel}>Sau</Text>
                        <View style={styles.progressBarSmall}>
                          <View style={[
                            styles.progressFillSmall,
                            { 
                              width: `${Math.min(topic.new_accuracy, 100)}%`,
                              backgroundColor: themeColors.primary
                            }
                          ]} />
                        </View>
                        <Text style={[
                          styles.accuracyValue,
                          { color: themeColors.primary, fontWeight: "700" }
                        ]}>
                          {topic.new_accuracy?.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={[
                      styles.improvementPercentage,
                      { color: topic.improvement >= 0 ? themeColors.primary : themeColors.danger }
                    ]}>
                      {topic.improvement_percentage}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Next Action */}
            {improvement.next_action && (
              <View style={styles.nextActionBox}>
                <Text style={styles.nextActionLabel}>
                  <Ionicons name="bulb" size={16} color="#f57c00" /> Gợi ý tiếp theo:
                </Text>
                <Text style={styles.nextActionText}>{improvement.next_action}</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Next Steps */}
        {detailedAnalysis.next_steps && (
          <View style={styles.nextStepsCard}>
            <Text style={styles.sectionTitle}>Bước tiếp theo</Text>
            <Text style={styles.nextStepsDescription}>
              {detailedAnalysis.next_steps.description}
            </Text>
            {detailedAnalysis.next_steps.weak_topics?.length > 0 && (
              <View style={styles.weakTopics}>
                <Text style={styles.weakTopicsLabel}>Chủ đề cần ôn tập:</Text>
                {detailedAnalysis.next_steps.weak_topics.map((topic, idx) => (
                  <Text key={idx} style={styles.weakTopic}>• {topic}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {practiceReview.comment && (
          <View style={styles.commentCard}>
            <Text style={styles.commentText}>{practiceReview.comment}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: themeColors.secondary,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#d0f0c0",
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 8,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: themeColors.text,
  },
  timestampText: {
    fontSize: 13,
    color: "#666",
    marginTop: 12,
    textAlign: "center",
  },
  topicBreakdownCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  topicItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  topicName: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 6,
  },
  topicStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topicStat: {
    fontSize: 14,
    color: "#666",
  },
  topicAccuracy: {
    fontSize: 16,
    fontWeight: "700",
  },
  feedbackSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  feedbackCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: themeColors.secondary,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultText: {
    fontSize: 12,
    fontWeight: "700",
  },
  questionText: {
    fontSize: 15,
    color: themeColors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  answerInfo: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  answerLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  answerValue: {
    fontWeight: "600",
    color: themeColors.text,
  },
  explanationBox: {
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.secondary,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 14,
    color: themeColors.text,
    lineHeight: 20,
  },
  metaInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaTag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaText: {
    fontSize: 12,
    color: "#666",
  },
  nextStepsCard: {
    backgroundColor: "#fff3e0",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  nextStepsDescription: {
    fontSize: 14,
    color: themeColors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  weakTopics: {
    marginTop: 8,
  },
  weakTopicsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 6,
  },
  weakTopic: {
    fontSize: 14,
    color: themeColors.danger,
    marginLeft: 8,
    marginBottom: 4,
  },
  commentCard: {
    backgroundColor: "#e8f5e9",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  commentText: {
    fontSize: 14,
    color: themeColors.text,
    fontStyle: "italic",
    textAlign: "center",
  },
  // Improvement Evaluation styles
  improvementCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  improvementSummary: {
    marginBottom: 12,
  },
  improvementSubject: {
    fontSize: 16,
    fontWeight: "700",
    color: themeColors.secondary,
    marginBottom: 8,
  },
  improvementSummaryText: {
    fontSize: 14,
    color: themeColors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  improvementSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 10,
  },
  overallBox: {
    backgroundColor: "#f1f8e9",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.primary,
  },
  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  overallLabel: {
    fontSize: 14,
    color: "#666",
  },
  overallValue: {
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.text,
  },
  topicProgressCard: {
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  topicProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  topicProgressName: {
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  accuracyComparison: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  arrowContainer: {
    marginHorizontal: 12,
  },
  accuracyLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  accuracyValue: {
    fontSize: 13,
    fontWeight: "600",
    color: themeColors.text,
    marginTop: 4,
  },
  progressBarSmall: {
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFillSmall: {
    height: "100%",
    borderRadius: 3,
  },
  improvementPercentage: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  nextActionBox: {
    backgroundColor: "#fff3e0",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#f57c00",
  },
  nextActionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f57c00",
    marginBottom: 6,
  },
  nextActionText: {
    fontSize: 13,
    color: themeColors.text,
    lineHeight: 18,
  },
});
