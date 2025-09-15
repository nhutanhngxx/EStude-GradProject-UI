import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import submissionService from "../../services/submissionService";
import { AuthContext } from "../../contexts/AuthContext";
import aiService from "../../services/aiService";
import { useToast } from "../../contexts/ToastContext";

const themeColors = {
  primary: "#2ecc71",
  secondary: "#27ae60",
  accent: "#FFD60A",
  background: "#fff",
  card: "#f9f9f9",
  text: "#333",
};

export default function ExamDoingScreen({ navigation, route }) {
  const { exam, submitted: initialSubmitted } = route.params;
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [submittedScore, setSubmittedScore] = useState(null);

  const initialSeconds = (exam?.timeLimit ?? 15) * 60;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [answers, setAnswers] = useState({});
  const [activeTab, setActiveTab] = useState("Doing");
  const [aiResult, setAiResult] = useState(null);
  const [aiFeedback, setAiFeedback] = useState([]);
  const [submitted, setSubmitted] = useState(initialSubmitted || false);
  const [submitting, setSubmitting] = useState(false);

  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    if (submitted) {
      navigation.setOptions({ title: "Chi tiết bài làm" });
    } else {
      navigation.setOptions({ title: "Đang làm" });
    }
  }, [submitted, navigation]);

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted]);

  useEffect(() => {
    if (timeLeft <= 0 && !submitted && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      Alert.alert(
        "Hết giờ",
        "Thời gian làm bài đã hết. Bài sẽ được tự động nộp.",
        [{ text: "OK", onPress: () => handleSubmit() }]
      );
    }
  }, [timeLeft, submitted]);

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${s % 60 < 10 ? "0" : ""}${s % 60}`;

  const handleSelect = (q, optText) => {
    if (submitted) return;
    setAnswers((prev) => {
      const prevAns = prev[q.questionId] || [];
      // detect multi-select: I assume q.answers chứa đúng số câu trả lời hợp lệ?
      // original code used q.answers && q.answers.length > 1
      const multi = q.answers && q.answers.length > 1;
      if (multi) {
        if (prevAns.includes(optText)) {
          return {
            ...prev,
            [q.questionId]: prevAns.filter((o) => o !== optText),
          };
        } else {
          return { ...prev, [q.questionId]: [...prevAns, optText] };
        }
      } else {
        return { ...prev, [q.questionId]: [optText] };
      }
    });
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);

    try {
      // build submission payload
      const answersPayload = Object.entries(answers).flatMap(
        ([questionId, selected]) => {
          // selected is array of optionText(s)
          const q = exam.questions.find(
            (x) => x.questionId === Number(questionId)
          );
          if (!q || !Array.isArray(selected)) return [];
          return selected
            .map((optText) => {
              const opt = q.options.find((o) => o.optionText === optText);
              if (!opt || opt.optionId == null) return null;
              return {
                questionId: Number(questionId),
                chosenOptionId: opt.optionId,
              };
            })
            .filter(Boolean);
        }
      );

      const submission = {
        assignmentId: exam.assignmentId,
        studentId: user.userId,
        content: "Nộp bài",
        answers: answersPayload,
      };

      console.log("submission:", JSON.stringify(submission, null, 2));

      const result = await submissionService.addSubmission(submission);

      if (result) {
        showToast("Bài tập của bạn đã được nộp!", "success");
        setSubmittedScore(result.score);
        try {
          const analysis = await aiService.getAIAnalysisBySubmission(
            exam.assignmentId,
            user.userId
          );
          if (analysis?.success) {
            setAiResult(analysis.data);
            const rawFb = analysis.data.feedback || [];
            const normalizedFb = Array.isArray(rawFb) ? rawFb.flat() : [];
            setAiFeedback(normalizedFb);
          } else {
            setAiResult(null);
            setAiFeedback([]);
            console.warn("AI analysis did not return success:", analysis);
          }
        } catch (e) {
          console.error("Lỗi khi gọi AI analysis:", e);
          setAiResult(null);
          setAiFeedback([]);
        }
        setSubmitted(true);
        setSubmitting(false);
      } else {
        setSubmitting(false);
        Alert.alert("Lỗi", "Không thể nộp bài, vui lòng thử lại.");
      }
    } catch (error) {
      console.error(error);
      setSubmitting(false);
      Alert.alert("Lỗi", "Không thể nộp bài, vui lòng thử lại.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.examTitle}>{exam?.title ?? "Bài kiểm tra"}</Text>
        <Text style={styles.timer}>⏰ {formatTime(timeLeft)}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "Doing" && styles.tabActive]}
          onPress={() => setActiveTab("Doing")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Doing" && styles.tabTextActive,
            ]}
          >
            Làm bài
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "Overview" && styles.tabActive]}
          onPress={() => setActiveTab("Overview")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Overview" && styles.tabTextActive,
            ]}
          >
            Danh sách câu hỏi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {activeTab === "Doing" ? (
        <ScrollView style={{ flex: 1 }}>
          {submitted ? (
            <View style={styles.aiSummary}>
              {aiResult ? (
                <>
                  <Text style={styles.aiScoreLabel}>Điểm của bạn</Text>
                  <Text style={styles.aiScoreValue}>
                    {submittedScore ?? "Không thể tải điểm"}
                  </Text>
                  <Text style={styles.aiPerf}>
                    {aiResult?.performance_level ?? "Không thể tải"}
                  </Text>
                  <Text style={styles.aiRecommend}>
                    {aiResult?.general_recommendation ?? "Không có gợi ý."}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.aiScoreLabel}>Điểm của bạn</Text>
                  <Text style={styles.aiScoreValue}>
                    {submittedScore ?? "Không thể tải điểm"}
                  </Text>
                  <Text style={styles.aiPerf}>(Không có phân tích AI)</Text>
                </>
              )}
            </View>
          ) : (
            // Trước khi nộp: hiển thị câu hỏi + lựa chọn
            exam.questions.map((q) => (
              <View key={q.questionId} style={styles.questionBlock}>
                <Text style={styles.questionText}>
                  {q.questionText}{" "}
                  {q.answers && q.answers.length > 1 && "(Chọn nhiều)"}
                </Text>
                {q.options.map((opt) => {
                  const selected = answers[q.questionId]?.includes(
                    opt.optionText
                  );
                  return (
                    <TouchableOpacity
                      key={opt.optionId}
                      disabled={submitted}
                      style={[styles.option, selected && styles.optionSelected]}
                      onPress={() => handleSelect(q, opt.optionText)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected && styles.optionTextSelected,
                        ]}
                      >
                        {opt.optionText}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1, padding: 12 }}>
          {exam.questions.map((q) => {
            const isAnswered =
              Array.isArray(answers[q.questionId]) &&
              answers[q.questionId].length > 0;

            const fb = aiFeedback.find(
              (f) => Number(f.question_id) === exam.questions.indexOf(q) + 1
            );

            return (
              <View key={q.questionId} style={styles.questionBlock}>
                {/* Câu hỏi */}
                <Text
                  style={[
                    styles.questionText,
                    submitted && fb && !fb.is_correct,
                  ]}
                >
                  {q.questionText}
                </Text>

                {/* Đáp án đã chọn */}
                <View
                  style={[
                    styles.answerBox,
                    {
                      backgroundColor: isAnswered
                        ? `${themeColors.primary}20`
                        : "#f5f5f5",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.answerText,
                      {
                        color:
                          submitted && fb
                            ? fb.is_correct
                              ? "#2e7d32" // xanh lá cho đúng
                              : "#c62828" // đỏ cho sai
                            : isAnswered
                            ? themeColors.secondary
                            : "#666",
                        fontWeight: submitted && fb ? "bold" : "500",
                        flexShrink: 1, // để text không tràn khi dài
                      },
                    ]}
                  >
                    {isAnswered
                      ? "Đã chọn: " + answers[q.questionId].join(", ")
                      : "Bạn chưa có đáp án nào."}
                  </Text>

                  {submitted && fb && (
                    <Text
                      style={{
                        color: fb.is_correct ? "#2e7d32" : "#c62828",
                        fontWeight: "bold",
                        marginLeft: 8,
                      }}
                    >
                      {fb.is_correct ? "Đúng" : "Sai"}
                    </Text>
                  )}
                </View>

                {/* Feedback */}
                {submitted && fb && (
                  <View
                    style={[
                      styles.feedbackBox,
                      {
                        backgroundColor: fb.is_correct ? "#e8f5e9" : "#ffebee",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: fb.is_correct ? "#2e7d32" : "#c62828",
                        fontStyle: "italic",
                        fontSize: 14,
                      }}
                    >
                      {fb.feedback}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Submit button - ẩn sau khi đã nộp */}
      {!submitted && (
        <View style={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() =>
              Alert.alert("Xác nhận", "Bạn có chắc chắn muốn nộp bài?", [
                { text: "Hủy", style: "cancel" },
                { text: "Nộp", onPress: handleSubmit },
              ])
            }
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="large" color="#2ecc71" />
            ) : (
              <Text style={styles.submitText}> Nộp bài </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    padding: 16,
    backgroundColor: "#27ae60",
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
  timer: {
    fontSize: 16,
    fontWeight: "600",
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
    color: "#333",
  },
  tabTextActive: {
    color: "#fff",
  },

  questionBlock: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: themeColors.card,
    borderRadius: 10,
    elevation: 2,
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#000",
  },

  answerBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 8,
  },
  answerText: {
    fontSize: 14,
    fontWeight: "500",
  },

  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  optionSelected: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  optionText: {
    fontSize: 14,
    color: themeColors.text,
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },

  feedbackBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
  },

  submitBtn: {
    backgroundColor: themeColors.secondary,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 12,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  aiSummary: {
    backgroundColor: "#e8fce8",
    padding: 20,
    borderRadius: 12,
    margin: 16,
    alignItems: "center",
    elevation: 3,
  },
  aiScore: {
    fontSize: 36,
    fontWeight: "900",
    color: "#27ae60",
  },
  aiScoreLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 4,
  },
  aiScoreValue: {
    fontSize: 40,
    fontWeight: "800",
    color: "#000",
  },
  aiPerf: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  aiRecommend: {
    marginTop: 12,
    fontSize: 15,
    fontStyle: "italic",
    color: "#555",
    textAlign: "center",
  },
});
