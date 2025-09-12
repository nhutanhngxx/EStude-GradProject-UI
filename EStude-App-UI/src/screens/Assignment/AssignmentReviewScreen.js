// src/screens/ExamReviewScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import submissionService from "../../services/submissionService";
import aiService from "../../services/aiService";

const themeColors = {
  primary: "#2ecc71",
  secondary: "#27ae60",
  danger: "#c62828",
  card: "#f9f9f9",
  text: "#333",
};

export default function ExamReviewScreen({ route }) {
  const { submissionId } = route.params;
  const [submission, setSubmission] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAIQuestionFeedback = (question) => {
    if (!aiResult?.detailedAnalysis?.feedback) return null;
    return aiResult.detailedAnalysis.feedback.find(
      (f) => Number(f.question_id) === Number(question.questionOrder)
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await submissionService.getSubmission(submissionId);
        if (result?.data) {
          setSubmission(result.data);
          // console.log("result:", result.data);

          // Gọi AI Analysis khi có submission
          const ai = await aiService.getAIAnalysisResultOfSubmission(
            result.data.studentId,
            result.data.assignmentId
          );
          // console.log("ai:", ai);
          // console.log("AI Feedback chi tiết:", ai.detailedAnalysis.feedback);

          // console.log(
          //   "AI Feedback chi tiết:",
          //   JSON.stringify(ai.detailedAnalysis.feedback, null, 2)
          // );

          if (ai) {
            setAiResult(ai);
          }
        }
      } catch (err) {
        console.error("Lỗi khi load dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text>Đang tải dữ liệu...</Text>
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
      <ScrollView>
        {/* Tiêu đề */}
        <Text style={styles.assignmentTitle}>{submission.assignmentName}</Text>
        <Text style={styles.submittedAt}>
          Ngày nộp: {new Date(submission.submittedAt).toLocaleString("vi-VN")}
        </Text>

        {/* Tổng quan điểm */}
        <View style={styles.aiSummary}>
          <Text style={styles.aiScoreLabel}>Điểm của bạn</Text>
          <Text style={styles.aiScoreValue}>{submission.score ?? "-"}</Text>
          <Text style={styles.aiRecommend}>
            {aiResult?.comment ?? "Không có nhận xét."}
          </Text>
        </View>

        {/* Danh sách câu hỏi */}
        {submission.answers?.map((a, idx) => {
          const aiFb = getAIQuestionFeedback(a.question);
          // console.log("aiFb:", aiFb);

          return (
            <View key={a.answerId} style={styles.questionBlock}>
              <Text style={styles.questionText}>
                Câu {idx + 1}: {a.question.questionText}
              </Text>
              {/* Đáp án học sinh chọn */}
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
              {/* Feedback hệ thống */}
              {a.feedback && (
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
              )}

              {/* Feedback AI */}
              {aiFb && (
                <View style={[styles.feedbackBox, { backgroundColor: "#fff" }]}>
                  {aiFb.feedback && (
                    <Text style={styles.aiAnalysisComment}>
                      AI đánh giá: {aiFb.feedback}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  assignmentTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: themeColors.text,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 5,
  },
  submittedAt: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 16,
    marginBottom: 12,
  },

  aiSummary: {
    backgroundColor: "#e8fce8",
    padding: 20,
    borderRadius: 12,
    margin: 16,
    alignItems: "center",
  },
  aiScoreLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.secondary,
  },
  aiScoreValue: { fontSize: 40, fontWeight: "800", color: "#000" },
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
  },
  questionText: { fontSize: 15, fontWeight: "600", marginBottom: 6 },
  answerText: { fontSize: 14, color: "#444" },
  fileLink: {
    marginTop: 6,
    fontSize: 14,
    color: "#1976d2",
    textDecorationLine: "underline",
  },
  feedbackBox: { marginTop: 8, padding: 10, borderRadius: 8 },
  aiAnalysisComment: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: "italic",
    color: "#444",
    textAlign: "justify",
  },
});
