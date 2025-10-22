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
  const [aiResult, setAiResult] = useState(null); // Layer 1
  const [recommendations, setRecommendations] = useState(null); // Layer 2
  const [practiceSubmissions, setPracticeSubmissions] = useState([]); // Lịch sử bài luyện tập
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Details"); // Tab mặc định

  const getAIQuestionFeedback = (question) => {
    if (!aiResult?.detailedAnalysis?.feedback) return null;

    // Ưu tiên khớp theo question_id
    const matchById = aiResult.detailedAnalysis.feedback.find(
      (f) => Number(f.question_id) === Number(question.questionId)
    );
    if (matchById) return matchById;

    // Fallback khớp theo nội dung câu hỏi
    return aiResult.detailedAnalysis.feedback.find(
      (f) =>
        f.question?.trim()?.toLowerCase() ===
        question.questionText?.trim()?.toLowerCase()
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await submissionService.getSubmission(submissionId);
        if (result?.data) {
          setSubmission(result.data);

          const ai = await aiService.getAIAnalysisResultOfSubmission(
            result.data.studentId,
            result.data.assignmentId
          );
          if (ai) setAiResult(ai);

          // const layer2Result = await aiService.getAIRecommendations(
          //   result.data.studentId,
          //   result.data.assignmentId
          // );
          // if (layer2Result)
          //   setRecommendations(layer2Result.data || layer2Result);

          // const practiceResults =
          //   await submissionService.getAllSubmissionsByStudentId(user.userId);
          // const filteredPractices = practiceResults.filter(
          //   (sub) =>
          //     sub.assignmentType === "PRACTICE" &&
          //     sub.relatedAssignmentId === result.data.assignmentId
          // );
          // setPracticeSubmissions(filteredPractices);
        }
      } catch (err) {
        console.error("Lỗi khi load dữ liệu:", err);
        showToast("Lỗi khi tải dữ liệu, vui lòng thử lại.", { type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId, user.userId]);

  const handleGeneratePractice = async (rawTopic) => {
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
        quiz: quizData,
        previousFeedback: aiResult?.detailedAnalysis?.feedback,
      });
    } catch (error) {
      console.error("Lỗi gọi Layer 3:", error);
      showToast("Lỗi khi tạo bài luyện tập.", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPractice = (practiceSubmissionId) => {
    navigation.navigate("ExamReview", { submissionId: practiceSubmissionId });
  };

  const handleEvaluateProgress = async () => {
    const previousResults =
      aiResult?.detailedAnalysis?.feedback?.map((f) => ({
        topic: f.topic,
        accuracy: f.is_correct ? 100 : 0,
      })) || [];

    const practiceResults = practiceSubmissions.flatMap((sub) =>
      sub.answers.map((a) => ({
        topic: a.question.topic || "Chưa xác định",
        accuracy: a.isCorrect ? 100 : 0,
      }))
    );

    const layer4Payload = {
      subject: aiResult?.detailedAnalysis?.subject || submission.assignmentName,
      student_id: user.userId,
      previous_results: previousResults,
      new_results: practiceResults,
    };

    try {
      setLoading(true);
      const layer4Result = await aiService.layer4(layer4Payload, token);
      navigation.navigate("Improvement", {
        evaluation: layer4Result,
        quiz: {
          subject:
            aiResult?.detailedAnalysis?.subject || submission.assignmentName,
          assignmentId: submission.assignmentId,
        },
        previousFeedback: aiResult?.detailedAnalysis?.feedback,
      });
    } catch (error) {
      console.error("Lỗi gọi Layer 4:", error);
      showToast("Lỗi khi đánh giá tiến bộ.", { type: "error" });
    } finally {
      setLoading(false);
    }
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
          <View style={styles.aiSummary}>
            <Text style={styles.aiScoreLabel}>Điểm của bạn</Text>
            <Text style={styles.aiScoreValue}>{submission.score ?? "-"}</Text>
            <Text style={styles.aiRecommend}>
              {aiResult?.comment ?? "Không có nhận xét."}
            </Text>
          </View>
          {submission.answers?.map((a, idx) => {
            const aiFb = getAIQuestionFeedback(a.question);
            return (
              <View key={a.answerId} style={styles.questionBlock}>
                <Text style={styles.questionText}>
                  Câu {idx + 1}: {a.question.questionText}
                </Text>
                {a.chosenOption ? (
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
                ) : (
                  <Text style={styles.answerText}>
                    Đáp án bạn chọn:{" "}
                    <Text style={{ color: "#999" }}>Chưa trả lời</Text>
                  </Text>
                )}
                <View
                  style={[
                    styles.feedbackBox,
                    { backgroundColor: a.isCorrect ? "#e8f5e9" : "#ffebee" },
                  ]}
                >
                  <Text
                    style={{
                      color: a.isCorrect
                        ? themeColors.secondary
                        : themeColors.danger,
                      fontStyle: "italic",
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {a.isCorrect ? "ĐÚNG" : "SAI"}
                  </Text>
                </View>
                {/* {aiFb && (
                  <View
                    style={[styles.feedbackBox, { backgroundColor: "#fff" }]}
                  >
                    <Text style={styles.aiAnalysisComment}>
                      Đáp án của bạn: {aiFb.student_answer || "Chưa trả lời"}
                    </Text>
                    <Text style={styles.aiAnalysisComment}>
                      Đáp án đúng: {aiFb.correct_answer || "Không có dữ liệu"}
                    </Text>
                    <Text style={styles.aiAnalysisComment}>
                      <Ionicons name="sparkles" size={15} color="green" /> Giải
                      thích:{" "}
                      {aiFb.explanation ||
                        aiFb.feedback ||
                        "Không có giải thích."}
                    </Text>
                  </View>
                )} */}
              </View>
            );
          })}
        </ScrollView>
      ) : activeTab === "Recommendations" ? (
        <ScrollView style={{ flex: 1, padding: 12 }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={styles.loadingText}>Đang tải gợi ý học tập...</Text>
            </View>
          ) : recommendations ? (
            <>
              <Text style={styles.sectionTitle}>Gợi ý học tập</Text>
              <Text style={styles.overallAdvice}>
                {recommendations.overall_advice}
              </Text>
              <Text style={styles.subSectionTitle}>Chủ đề yếu</Text>
              {recommendations.weak_topics?.map((t, idx) => (
                <View key={idx} style={styles.recommendationCard}>
                  <Text style={styles.recTitle}>{t.topic}</Text>
                  <TouchableOpacity onPress={() => handleGeneratePractice(t)}>
                    <Text style={styles.actionText}>Ôn tập {t.topic}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.aiSummary}>
              <Text>Không có gợi ý học tập nào hiện tại.</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1, padding: 12 }}>
          {practiceSubmissions.length > 0 ? (
            <>
              {practiceSubmissions.map((prac, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.practiceCard}
                  onPress={() => handleViewPractice(prac.submissionId)}
                >
                  <Text style={styles.pracTitle}>
                    {prac.assignmentName || `Bài luyện tập ${idx + 1}`}
                  </Text>
                  <Text style={styles.pracDate}>
                    Ngày nộp:{" "}
                    {new Date(prac.submittedAt).toLocaleString("vi-VN")}
                  </Text>
                  <Text style={styles.pracScore}>
                    Điểm: {prac.score ?? "-"}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleEvaluateProgress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <Text style={styles.actionText}>Đánh giá tiến bộ</Text>
                )}
              </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: themeColors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    padding: 16,
    backgroundColor: themeColors.secondary,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginTop: 4,
  },
  submittedAt: {
    fontSize: 14,
    color: "#d0f0c0",
    marginTop: 6,
    textAlign: "right",
  },
  tabRow: {
    flexDirection: "row",
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#eee",
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: themeColors.secondary,
  },
  tabText: {
    fontWeight: "600",
    color: themeColors.text,
  },
  tabTextActive: {
    color: "#fff",
  },
  aiSummary: {
    backgroundColor: "#e8fce8",
    padding: 20,
    borderRadius: 12,
    margin: 16,
    alignItems: "center",
    elevation: 3,
  },
  aiScoreLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.secondary,
  },
  aiScoreValue: {
    fontSize: 40,
    fontWeight: "800",
    color: "#000",
  },
  aiRecommend: {
    marginTop: 12,
    fontSize: 15,
    fontStyle: "italic",
    color: "#555",
    textAlign: "justify",
  },
  questionBlock: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: themeColors.card,
    borderRadius: 10,
    marginHorizontal: 16,
    elevation: 2,
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#000",
  },
  answerText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 8,
  },
  feedbackBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
  },
  aiAnalysisComment: {
    fontSize: 14,
    marginTop: 4,
    color: themeColors.text,
    textAlign: "justify",
  },
  recommendationCard: {
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  overallAdvice: {
    fontSize: 14,
    color: themeColors.text,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginHorizontal: 16,
    color: themeColors.text,
  },
  practiceCard: {
    backgroundColor: themeColors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    elevation: 2,
  },
  pracTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  pracDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  pracScore: {
    fontSize: 14,
    color: themeColors.primary,
    fontWeight: "600",
  },
  noDataText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 12,
    marginHorizontal: 16,
  },
  actionBtn: {
    backgroundColor: themeColors.primary,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: themeColors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: themeColors.text,
  },
});
