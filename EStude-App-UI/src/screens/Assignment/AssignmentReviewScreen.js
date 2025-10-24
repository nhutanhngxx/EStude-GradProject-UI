import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import submissionService from "../../services/submissionService";
import { Ionicons } from "@expo/vector-icons";
import aiService from "../../services/aiService";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const themeColors = {
  primary: "#2ecc71",
  secondary: "#27ae60",
  danger: "#c62828",
  card: "#f9f9f9",
  text: "#333",
};

export default function ExamReviewScreen({ route, navigation }) {
  const { submissionId } = route.params;
  const { user, token } = useContext(AuthContext);
  const { showToast } = useToast();
  const [submission, setSubmission] = useState(null);
  const [aiResult, setAiResult] = useState(null); // Layer 1 - Feedback
  const [recommendations, setRecommendations] = useState(null); // Layer 2
  const [practiceReviews, setPracticeReviews] = useState([]); // Layer 3.5 - Lịch sử bài luyện tập
  const [improvements, setImprovements] = useState([]); // Layer 4 - Đánh giá tiến bộ
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Details"); // Tab mặc định

  const getAIQuestionFeedback = (question) => {
    if (!aiResult?.detailedAnalysis?.feedback) return null;

    // Ưu tiên khớp theo question_id
    const matchById = aiResult.detailedAnalysis.feedback.find(
      (f) => Number(f.question_id) === Number(question.questionId)
    );

    if (matchById) {
      // console.log(`✅ Matched by ID - Question ${question.questionId}:`, matchById);
      return matchById;
    }

    // Fallback khớp theo nội dung câu hỏi
    const matchByText = aiResult.detailedAnalysis.feedback.find(
      (f) =>
        f.question?.trim()?.toLowerCase() ===
        question.questionText?.trim()?.toLowerCase()
    );

    if (matchByText) {
      console.log(
        `⚠️ Matched by text - Question ${question.questionId}:`,
        matchByText
      );
      return matchByText;
    }

    console.log(
      `❌ No match found for Question ${question.questionId}:`,
      question.questionText
    );
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await submissionService.getSubmission(submissionId);
        if (result?.data) {
          setSubmission(result.data);

          const assignmentId = result.data.assignmentId;

          // Lấy Feedback layer 1 theo assignment_id (trả về mảng)
          const feedbackResults = await aiService.getAIFeedbackByAssignmentId(
            assignmentId,
            token
          );
          // console.log("Feedback Results:", feedbackResults);

          if (
            feedbackResults &&
            Array.isArray(feedbackResults) &&
            feedbackResults.length > 0
          ) {
            // Lấy kết quả mới nhất (resultId lớn nhất hoặc generatedAt gần nhất)
            const latestFeedback = feedbackResults.reduce((latest, current) => {
              return current.resultId > latest.resultId ? current : latest;
            }, feedbackResults[0]);

            // console.log("Latest Feedback:", latestFeedback);

            // console.log(
            //   "Feedback List:",
            //   latestFeedback?.detailedAnalysis?.feedback
            // );

            // Tính topic_breakdown nếu chưa có
            if (
              !latestFeedback?.detailedAnalysis?.topic_breakdown &&
              latestFeedback?.detailedAnalysis?.feedback
            ) {
              const topicMap = {};
              latestFeedback.detailedAnalysis.feedback.forEach((f) => {
                const topic = f.topic || "Không xác định";
                if (!topicMap[topic]) {
                  topicMap[topic] = { correct: 0, total: 0 };
                }
                topicMap[topic].total += 1;
                if (f.is_correct) topicMap[topic].correct += 1;
              });

              latestFeedback.detailedAnalysis.topic_breakdown = Object.keys(
                topicMap
              ).map((topic) => ({
                topic,
                correct: topicMap[topic].correct,
                total: topicMap[topic].total,
                accuracy:
                  topicMap[topic].total > 0
                    ? topicMap[topic].correct / topicMap[topic].total
                    : 0,
              }));
            }

            setAiResult(latestFeedback);
          }

          // Lấy Recommendation layer 2 theo assignment_id (trả về mảng)
          const recommendationResults =
            await aiService.getAIRecommendationByAssignmentId(
              assignmentId,
              token
            );
          if (
            recommendationResults &&
            Array.isArray(recommendationResults) &&
            recommendationResults.length > 0
          ) {
            // Lấy kết quả mới nhất
            const latestRecommendation = recommendationResults.reduce(
              (latest, current) => {
                return current.resultId > latest.resultId ? current : latest;
              },
              recommendationResults[0]
            );
            setRecommendations(
              latestRecommendation.detailedAnalysis || latestRecommendation
            );
          }

          // Lấy Practice Review layer 3.5 theo assignment_id
          const practiceReviewResult =
            await aiService.getAIPracticeReviewByAssignmentId(
              assignmentId,
              token
            );
          if (practiceReviewResult && Array.isArray(practiceReviewResult)) {
            setPracticeReviews(practiceReviewResult);
          }

          // Lấy Improvement layer 4 theo assignment_id
          const improvementResult =
            await aiService.getAIImprovementByAssignmentId(assignmentId, token);
          if (improvementResult && Array.isArray(improvementResult)) {
            setImprovements(improvementResult);
          }
        }
      } catch (err) {
        console.error("Lỗi khi load dữ liệu:", err);
        showToast("Lỗi khi tải dữ liệu, vui lòng thử lại.", { type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId, token]);

  const handleGeneratePractice = async (rawTopic) => {
    // Kiểm tra aiResult có sẵn không
    if (!aiResult || !aiResult.resultId) {
      showToast("Đang tải dữ liệu phân tích. Vui lòng thử lại sau giây lát.", {
        type: "warning",
      });
      console.warn("⚠️ aiResult not ready:", aiResult);
      return;
    }
    
    console.log("✅ aiResult available with resultId:", aiResult.resultId);
    
    let topic = rawTopic;
    if (!topic) {
      showToast("Chủ đề không hợp lệ, không thể tạo bài luyện tập.", {
        type: "error",
      });
      return;
    }
    if (typeof topic === "object") {
      topic = topic.topic ?? topic.name ?? topic.label ?? null;
    }
    topic = typeof topic === "string" ? topic.trim() : null;

    if (!topic || topic.toLowerCase() === "không xác định") {
      showToast("Chủ đề không rõ — không thể tạo bài luyện tập tự động.", {
        type: "warning",
      });
      return;
    }

    const layer3Payload = {
      assignment_id: submission.assignmentId,
      subject: aiResult?.detailedAnalysis?.subject || submission.assignmentName,
      topics: [topic],
      difficulty: "easy",
      num_questions: 3,
    };

    try {
      setLoading(true);
      const layer3Result = await aiService.layer3(layer3Payload, token);
      const quizData = layer3Result?.data ?? layer3Result;

      if (
        !quizData ||
        !Array.isArray(quizData.questions) ||
        quizData.questions.length === 0
      ) {
        showToast("Không tạo được bài luyện tập (API trả về rỗng).", {
          type: "error",
        });
        setLoading(false);
        return;
      }

      navigation.navigate("PracticeQuiz", {
        quiz: { ...quizData, assignmentId: submission.assignmentId },
        previousFeedback: aiResult, // Truyền toàn bộ object Layer 1 (có resultId, detailedAnalysis)
      });
    } catch (error) {
      console.error("Lỗi gọi Layer 3:", error);
      showToast("Lỗi khi tạo bài luyện tập.", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPractice = (practiceReviewData) => {
    // Hiển thị chi tiết của practice review
    navigation.navigate("PracticeReviewDetail", {
      practiceReview: practiceReviewData,
    });
  };

  const handleEvaluateProgress = async () => {
    if (!improvements || improvements.length === 0) {
      showToast("Chưa có dữ liệu đánh giá tiến bộ.", { type: "warning" });
      return;
    }

    // Lấy đánh giá tiến bộ mới nhất
    const latestImprovement = improvements[0];

    navigation.navigate("Improvement", {
      evaluation: latestImprovement,
      quiz: {
        subject:
          aiResult?.detailedAnalysis?.subject || submission.assignmentName,
        assignmentId: submission.assignmentId,
      },
      previousFeedback: aiResult?.detailedAnalysis?.feedback,
    });
  };

  if (loading && !submission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (!submission) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy dữ liệu bài nộp</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.examTitle}>{submission.assignmentName}</Text>
        <Text style={styles.submittedAt}>
          Ngày nộp: {new Date(submission.submittedAt).toLocaleString("vi-VN")}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "Details" && styles.tabActive]}
          onPress={() => setActiveTab("Details")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Details" && styles.tabTextActive,
            ]}
          >
            Chi tiết bài làm
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "Recommendations" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("Recommendations")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Recommendations" && styles.tabTextActive,
            ]}
          >
            Gợi ý học tập
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "Practice" && styles.tabActive]}
          onPress={() => setActiveTab("Practice")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Practice" && styles.tabTextActive,
            ]}
          >
            Bài luyện tập
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {activeTab === "Details" ? (
        <ScrollView style={{ flex: 1, padding: 12 }}>
          {/* Tóm tắt AI */}
          <View style={styles.aiSummary}>
            <Ionicons
              name="stats-chart-outline"
              size={26}
              color={themeColors.primary}
            />
            <Text style={styles.aiScoreLabel}>Điểm của bạn</Text>
            <Text style={styles.aiScoreValue}>{submission.score ?? "-"}</Text>

            {aiResult?.detailedAnalysis?.summary && (
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Ionicons
                    name="layers-outline"
                    size={18}
                    color={themeColors.secondary}
                  />
                  <Text style={styles.summaryText}>
                    Tổng số câu hỏi:{" "}
                    <Text style={styles.summaryValue}>
                      {aiResult.detailedAnalysis.summary.total_questions || 0}
                    </Text>
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={themeColors.secondary}
                  />

                  <Text style={styles.summaryText}>
                    Số câu đúng:{" "}
                    <Text style={styles.summaryValue}>
                      {aiResult.detailedAnalysis.summary.correct_count || 0}
                    </Text>
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color={themeColors.secondary}
                  />
                  <Text style={styles.summaryText}>
                    Độ chính xác:{" "}
                    <Text style={styles.summaryValue}>
                      {aiResult.detailedAnalysis.summary.accuracy_percentage?.toFixed(
                        1
                      ) || 0}
                      %
                    </Text>
                  </Text>
                </View>
              </View>
            )}

            {/* <Text style={styles.aiRecommend}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={16}
                color="#555"
              />{" "}
              {aiResult?.comment ?? "Không có nhận xét."}
            </Text> */}
          </View>

          {/* Danh sách câu hỏi */}
          {submission.answers?.map((a, idx) => {
            const aiFb = getAIQuestionFeedback(a.question);
            return (
              <View key={a.answerId} style={styles.questionBlock}>
                {/* Câu hỏi */}
                <Text style={styles.questionText}>
                  Câu {idx + 1}: {a.question.questionText}
                </Text>

                {/* Đáp án người dùng chọn */}
                {a.chosenOption ? (
                  <View style={styles.answerRow}>
                    <Text style={styles.answerText}>
                      Đáp án bạn chọn:{" "}
                      <Text
                        style={{
                          color: a.chosenOption.isCorrect
                            ? themeColors.secondary
                            : themeColors.danger,
                          fontWeight: "600",
                        }}
                      >
                        {a.chosenOption.optionText}
                      </Text>
                    </Text>
                  </View>
                ) : (
                  <View style={styles.answerRow}>
                    <Ionicons name="pencil-outline" size={16} color="#999" />
                    <Text style={styles.answerText}>
                      {" "}
                      Đáp án bạn chọn:{" "}
                      <Text style={{ color: "#999" }}>Chưa trả lời</Text>
                    </Text>
                  </View>
                )}

                {/* Trạng thái đúng / sai */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: a.isCorrect ? "#e8f5e9" : "#ffebee",
                    },
                  ]}
                >
                  <Ionicons
                    name={a.isCorrect ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={
                      a.isCorrect ? themeColors.secondary : themeColors.danger
                    }
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: a.isCorrect
                          ? themeColors.secondary
                          : themeColors.danger,
                      },
                    ]}
                  >
                    {a.isCorrect ? "ĐÚNG" : "SAI"}
                  </Text>
                </View>

                {/* Phân tích AI */}
                {aiFb && (
                  <View
                    style={[styles.feedbackBox, { backgroundColor: "#f9f9f9" }]}
                  >
                    <View style={styles.feedbackRow}>
                      <Ionicons
                        name="chatbubble-outline"
                        size={14}
                        color="#333"
                      />
                      <Text style={styles.aiAnalysisComment}>
                        {" "}
                        <Text style={styles.label}>Đáp án của bạn:</Text>{" "}
                        {aiFb.student_answer || "Chưa trả lời"}
                      </Text>
                    </View>

                    <View style={styles.feedbackRow}>
                      <Ionicons
                        name="checkmark-done-outline"
                        size={14}
                        color="#2E7D32"
                      />
                      <Text style={styles.aiAnalysisComment}>
                        {" "}
                        <Text style={styles.label}>Đáp án đúng:</Text>{" "}
                        {aiFb.correct_answer || "Không có dữ liệu"}
                      </Text>
                    </View>

                    <View style={styles.feedbackRow}>
                      <Ionicons
                        name="sparkles-outline"
                        size={14}
                        color="#2E7D32"
                      />
                      <Text style={styles.aiAnalysisComment}>
                        <Text style={styles.label}>Giải thích:</Text>{" "}
                        {aiFb.explanation ||
                          aiFb.feedback ||
                          "Không có giải thích."}
                      </Text>
                    </View>

                    {(aiFb.topic || aiFb.subtopic) && (
                      <View style={styles.feedbackRow}>
                        <Ionicons name="book-outline" size={14} color="#333" />
                        <Text style={styles.aiAnalysisComment}>
                          {" "}
                          <Text style={styles.label}>Chủ đề:</Text> {aiFb.topic}
                          {aiFb.subtopic ? ` - ${aiFb.subtopic}` : ""}
                        </Text>
                      </View>
                    )}

                    {aiFb.difficulty_level && (
                      <View style={styles.feedbackRow}>
                        <Ionicons
                          name="bar-chart-outline"
                          size={14}
                          color="#333"
                        />
                        <Text style={styles.aiAnalysisComment}>
                          {" "}
                          <Text style={styles.label}>Độ khó:</Text>{" "}
                          {aiFb.difficulty_level}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      ) : activeTab === "Recommendations" ? (
        <ScrollView style={{ flex: 1, padding: 12 }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={styles.loadingText}>
                <Ionicons
                  name="sparkles-outline"
                  size={16}
                  color={themeColors.primary}
                />{" "}
                Đang tải gợi ý học tập...
              </Text>
            </View>
          ) : recommendations ? (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="bulb-outline"
                  size={22}
                  color={themeColors.primary}
                />
                <Text style={styles.sectionTitle}>Gợi ý học tập</Text>
              </View>

              <Text style={styles.overallAdvice}>
                {recommendations.overall_advice}
              </Text>

              <View style={styles.subHeader}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#f57c00"
                />
                <Text style={styles.subSectionTitle}>Chủ đề yếu</Text>
              </View>

              {(() => {
                // Loại bỏ duplicate topics (chỉ giữ lại topic đầu tiên)
                const uniqueTopics = [];
                const seenTopics = new Set();
                
                recommendations.weak_topics?.forEach((t) => {
                  const topicName = (t.topic || "").trim().toLowerCase();
                  if (!seenTopics.has(topicName)) {
                    seenTopics.add(topicName);
                    uniqueTopics.push(t);
                  }
                });

                return uniqueTopics.map((t, idx) => (
                  <View key={idx} style={styles.recommendationCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                      <Ionicons
                        name="book-outline"
                        size={18}
                        color="#333"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.recTitle} numberOfLines={2}>
                        {t.topic}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.recButton}
                      onPress={() => handleGeneratePractice(t)}
                    >
                      <Ionicons
                        name="reload-circle-outline"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.recButtonText}>Ôn tập</Text>
                    </TouchableOpacity>
                  </View>
                ));
              })()}
            </>
          ) : (
            <View style={styles.aiSummary}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#777"
              />
              <Text style={{ marginLeft: 6, color: "#777" }}>
                Không có gợi ý học tập nào hiện tại.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1, padding: 12 }}>
          {practiceReviews.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="time-outline"
                  size={22}
                  color={themeColors.primary}
                />
                <Text style={styles.sectionTitle}>
                  Lịch sử bài luyện tập ({practiceReviews.length})
                </Text>
              </View>

              {practiceReviews.map((review, idx) => {
                const detailedAnalysis = review.detailedAnalysis || {};
                const summary = detailedAnalysis.summary || {};
                return (
                  <TouchableOpacity
                    key={review.resultId || idx}
                    style={styles.practiceCard}
                    onPress={() => handleViewPractice(review)}
                  >
                    <Text style={styles.pracTitle}>
                      {detailedAnalysis.subject || "Bài luyện tập"} - Lần{" "}
                      {idx + 1}
                    </Text>
                    <Text style={styles.pracDate}>
                      Ngày:{" "}
                      {detailedAnalysis.timestamp
                        ? new Date(detailedAnalysis.timestamp).toLocaleString(
                            "vi-VN"
                          )
                        : "N/A"}
                    </Text>
                    <View style={{ flexDirection: "row", marginTop: 4 }}>
                      <Text style={styles.pracScore}>
                        Tổng câu hỏi: {summary.total_questions || 0}
                      </Text>
                      <Text style={[styles.pracScore, { marginLeft: 16 }]}>
                        Đúng: {summary.correct_count || 0}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.pracScore,
                        { marginTop: 4, fontWeight: "700" },
                      ]}
                    >
                      Độ chính xác:{" "}
                      {summary.accuracy_percentage?.toFixed(1) || 0}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {/* <TouchableOpacity
                style={[
                  styles.actionBtn,
                  improvements.length === 0
                    ? { backgroundColor: "#ccc" } // xám nếu chưa có dữ liệu
                    : loading
                    ? { backgroundColor: "#66bb6a" } // nhạt hơn khi đang loading
                    : { backgroundColor: "#2e7d32" }, // xanh chính khi sẵn sàng
                ]}
                onPress={handleEvaluateProgress}
                disabled={loading || improvements.length === 0}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.actionText, { color: "#fff" }]}>
                    {improvements.length > 0
                      ? "Xem đánh giá tiến bộ"
                      : "Chưa có đánh giá tiến bộ"}
                  </Text>
                )}
              </TouchableOpacity> */}
            </>
          ) : (
            <View style={styles.aiSummary}>
              <Text>Chưa có bài luyện tập nào.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: themeColors.secondary,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  submittedAt: {
    fontSize: 13,
    color: "#d0f0c0",
    marginTop: 6,
  },

  tabRow: {
    flexDirection: "row",
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECEFF1",
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: themeColors.secondary,
  },
  tabText: {
    fontWeight: "600",
    color: "#444",
    fontSize: 14,
  },
  tabTextActive: {
    color: "#fff",
  },

  aiSummary: {
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 12,
    elevation: 2,
  },
  aiScoreLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.secondary,
    marginTop: 8,
  },
  aiScoreValue: {
    fontSize: 40,
    fontWeight: "800",
    color: "#1B5E20",
    marginVertical: 4,
  },
  aiRecommend: {
    marginTop: 12,
    fontSize: 15,
    fontStyle: "italic",
    color: "#444",
    textAlign: "justify",
  },
  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    width: "100%",
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    fontWeight: "500",
  },

  questionBlock: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#222",
  },
  answerText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 8,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 4,
  },

  feedbackBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  aiAnalysisComment: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginLeft: 6,
    textAlign: "justify",
    flexShrink: 1,
  },
  label: {
    fontWeight: "600",
    color: "#222",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
    color: "#2E7D32",
    marginBottom: 8,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
    color: "#f57c00",
  },
  overallAdvice: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
    backgroundColor: "#F1F8E9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  recommendationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  recButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  recButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
  },

  practiceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  pracTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  pracDate: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  pracScore: {
    fontSize: 14,
    color: themeColors.primary,
    fontWeight: "600",
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  loadingText: {
    color: "#555",
    fontSize: 14,
    marginTop: 8,
  },
  noDataText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginVertical: 20,
  },
  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 6,
    fontWeight: "500",
  },
  summaryValue: {
    fontWeight: "700",
    color: themeColors.secondary,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  feedbackRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
    flexWrap: "wrap",
  },

  label: {
    fontWeight: "600",
    color: "#000",
  },
});
