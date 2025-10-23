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
import classSubjectService from "../../services/classSubjectService";
import { useToast } from "../../contexts/ToastContext";

/*
PracticeQuizScreen
- Bảo vệ an toàn Null cho `quiz` và `quiz.questions`
- Tránh các cảnh báo ScrollView lồng nhau (chỉ một ScrollView)
- Xử lý tốt hơn các phản hồi của aiService (hỗ trợ các wrapper { data: ... })
- Xử lý chỉ mục dựa trên 0/1 phù hợp cho student_answer/correct_answer
- Điều hướng phòng thủ: nếu thiếu câu hỏi -> hiển thị toast và goBack
- Chỉ báo tiến trình, chuyển đổi gợi ý cho từng câu hỏi và đoạn giải thích an toàn
- Phân tách rõ ràng hơn: Chế độ xem Doing so với chế độ xem Tổng quan
*/

const themeColors = {
  primary: "#2ecc71",
  secondary: "#27ae60",
  accent: "#FFD60A",
  background: "#fff",
  card: "#f9f9f9",
  text: "#333",
};

export default function PracticeQuizScreen({ navigation, route }) {
  const quiz = route?.params?.quiz;
  const { user, token } = useContext(AuthContext);
  const { showToast } = useToast();

  console.log("Layer3 raw result:", JSON.stringify(quiz, null, 2));
  //   console.log("quiz: ", quiz);

  useEffect(() => {
    if (!quiz) {
      showToast("Dữ liệu bài luyện tập không hợp lệ.", { type: "error" });
      navigation.goBack();
    }
  }, [quiz, navigation, showToast]);

  const [answers, setAnswers] = useState({});
  const [activeTab, setActiveTab] = useState("Doing");
  const [aiResult, setAiResult] = useState(null);
  const [aiFeedback, setAiFeedback] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showHint, setShowHint] = useState({});

  const totalQuestions = quiz?.questions?.length || 0;

  useEffect(() => {
    if (!quiz) return;
    navigation.setOptions({
      title: `Bài luyện tập: ${quiz.subject || "Chưa xác định"}`,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 16 }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Thoát</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, quiz]);

  const safeGet = (v, fallback = null) =>
    v === undefined || v === null ? fallback : v;

  const handleSelect = (q, selectedOption) => {
    if (submitted) return;

    const key = q.questionId ?? q.question_id ?? q.id ?? q.question;
    const optionText =
      typeof selectedOption === "string"
        ? selectedOption
        : selectedOption.optionText;
    const currentAnswers = { ...answers };

    // Nếu đã chọn thì bỏ chọn
    if (currentAnswers[key]?.includes(optionText)) {
      currentAnswers[key] = currentAnswers[key].filter((o) => o !== optionText);
    } else {
      currentAnswers[key] = [optionText];
    }

    setAnswers(currentAnswers);
  };

  const toggleHint = (questionKey) => {
    setShowHint((prev) => ({ ...prev, [questionKey]: !prev[questionKey] }));
  };

  const trimSnippet = (text, max = 120) => {
    if (!text) return "Không có gợi ý.";
    if (text.length <= max) return text;
    // cố gắng cắt ở khoảng trắng cuối cùng trước max để tránh cắt giữa từ
    const cut = text.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut) + "...";
  };

  const buildAiPayloadFromQuiz = () => {
    return {
      assignment_id: quiz.assignmentId || "practice",
      student_name: user?.fullName || user?.name || "Học sinh",
      subject: quiz.subject || "Chưa xác định",
      questions: (quiz.questions || []).map((q, idx) => {
        const key = q.questionId ?? q.question_id ?? q.id ?? idx + 1;
        const selected = answers[key] || [];
        const chosenOpt = Array.isArray(selected) ? selected[0] : selected;
        const chosenIndex = q.options.findIndex(
          (opt) => opt.optionText === chosenOpt
        );
        const correctIndex = q.options.findIndex(
          (opt) => opt.isCorrect === true
        );

        return {
          question_id: Number(key),
          question: q.questionText,
          options: q.options.map((o) => o.optionText),
          correct_answer: correctIndex >= 0 ? correctIndex + 1 : null, // 1-based
          student_answer: chosenIndex >= 0 ? chosenIndex + 1 : null,
        };
      }),
    };
  };

  const deepLog = (label, data) => {
    console.log(`\n===== ${label} =====`);
    try {
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.log("❌ stringify failed:", e);
      console.log(data);
    }
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    if (!quiz || !totalQuestions) {
      showToast("Không có câu hỏi để nộp.", { type: "error" });
      return;
    }

    setSubmitting(true);
    setAiLoading(true);

    try {
      let correctCount = 0;
      const feedback = (quiz.questions || []).map((q, idx) => {
        const key = q.questionId ?? q.question_id ?? q.id ?? idx + 1;
        const selected = answers[key] || [];
        const correctOpts = (q.options || [])
          .filter((o) => o.isCorrect)
          .map((o) => o.optionText);

        const isCorrect =
          [...selected].sort().join() === [...correctOpts].sort().join();
        if (isCorrect) correctCount++;

        return {
          question_id: idx + 1,
          is_correct: isCorrect,
          explanation: isCorrect
            ? "Đúng."
            : "Sai. " +
              (q.options.find((o) => o.isCorrect)?.explanation ||
                "Không có giải thích."),
          topic: safeGet(q.topic, "Chưa xác định"),
          difficulty_level: safeGet(q.difficulty_level, "Trung bình"),
        };
      });

      setAiFeedback(feedback);
      setSubmitted(true);
      setSubmitting(false);

      // Xây dựng tải trọng AI và gọi Layer1 (tùy chọn nhưng hữu ích)
      const aiPayload = buildAiPayloadFromQuiz();

      const aiResultRaw = await aiService.layer1(aiPayload, token);
      setAiLoading(false);

      if (aiResultRaw) {
        const processed = aiResultRaw?.data || aiResultRaw;

        const aiFeedbackFromApi = Array.isArray(processed.feedback)
          ? processed.feedback.map((f, idx) => ({
              ...f,
              question_id: Number(f.question_id ?? idx + 1),
              is_correct:
                f.student_answer != null && f.correct_answer != null
                  ? Number(f.student_answer) === Number(f.correct_answer)
                  : !!f.is_correct,
            }))
          : [];

        setAiResult({
          detailedAnalysis: {
            subject: processed.subject || quiz.subject,
            summary: processed.summary || {
              total_questions: totalQuestions,
              correct_count: correctCount,
              accuracy_percentage: Math.round(
                (correctCount / totalQuestions) * 100
              ),
            },
            feedback: aiFeedbackFromApi.length ? aiFeedbackFromApi : feedback,
          },
          comment: processed.comment || "Phân tích hoàn tất!",
        });

        setAiFeedback((prev) =>
          aiFeedbackFromApi.length ? aiFeedbackFromApi : prev
        );
      } else {
        setAiLoading(false);
        showToast("Không nhận được phản hồi từ AI. Hiển thị kết quả cục bộ.", {
          type: "warning",
        });
      }

      showToast("Bài luyện tập đã được chấm!", { type: "success" });
    } catch (error) {
      console.error("PracticeQuiz submit error:", error);
      setSubmitting(false);
      setAiLoading(false);
      showToast("Lỗi khi chấm bài. Vui lòng thử lại.", { type: "error" });
    }
  };

  const handleEvaluateProgress = async () => {
    const previousResults = (route.params?.previousFeedback || []).map((f) => ({
      topic: f.topic,
      accuracy: f.is_correct ? 100 : 0,
    }));
    const newResults = (aiFeedback || []).map((f) => ({
      topic: f.topic,
      accuracy: f.is_correct ? 100 : 0,
    }));

    const layer4Payload = {
      subject: quiz.subject,
      student_id: user?.userId,
      previous_results: previousResults,
      new_results: newResults,
    };

    try {
      setAiLoading(true);
      const layer4Raw = await aiService.layer4(layer4Payload, token);
      setAiLoading(false);
      const evaluation = layer4Raw?.data || layer4Raw;
      navigation.navigate("Improvement", {
        evaluation,
        quiz,
        previousFeedback: aiFeedback,
      });
    } catch (error) {
      console.error("layer4 error:", error);
      setAiLoading(false);
      showToast("Lỗi khi đánh giá tiến bộ.", { type: "error" });
    }
  };

  // Trợ lý nhỏ để hiển thị văn bản tùy chọn một cách an toàn từ phản hồi của ai (chỉ số dựa trên 1)
  const getOptionText = (q, idx1Based) => {
    if (!q || !Array.isArray(q.options) || idx1Based == null) return "-";
    const idx = Number(idx1Based) - 1;
    return q.options[idx]?.optionText ?? "-";
  };

  const DoingView = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {Object.keys(answers).length}/{totalQuestions} câu đã chọn
        </Text>
        <Text style={styles.progressText}>
          {submitted ? "Đã nộp" : "Chưa nộp"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {(quiz.questions || []).map((q, index) => {
          const key = q.questionId ?? q.question_id ?? q.id ?? index + 1;
          const isMulti = Array.isArray(q.answers) && q.answers.length > 1;
          return (
            <View key={`q_${index}_${key}`} style={styles.questionBlock}>
              <Text style={styles.questionText}>
                {index + 1}.{" "}
                {q.questionText || q.question || "Câu hỏi không xác định"}{" "}
                {isMulti ? "(Chọn nhiều)" : ""}
              </Text>

              {(q.options || []).map((opt, optIdx) => {
                const optionText =
                  typeof opt === "string" ? opt : opt.optionText;
                const selected = (answers[key] || []).includes(optionText);

                return (
                  <TouchableOpacity
                    key={`opt_${index}_${optIdx}`}
                    disabled={submitted}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => handleSelect(q, optionText)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {optionText}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity onPress={() => toggleHint(key)}>
                <Text style={styles.hintText}>Gợi ý</Text>
              </TouchableOpacity>

              {showHint[key] && (
                <Text style={styles.hintExplanation}>
                  {trimSnippet(
                    (q.options || []).find((o) => o.explanation)?.explanation
                  )}
                </Text>
              )}
            </View>
          );
        })}

        {!submitted && (
          <View style={{ paddingHorizontal: 16 }}>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() =>
                Alert.alert(
                  "Xác nhận",
                  "Bạn có chắc chắn muốn nộp bài luyện tập?",
                  [
                    { text: "Hủy", style: "cancel" },
                    { text: "Nộp", onPress: handleSubmit },
                  ]
                )
              }
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Nộp bài luyện tập</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const OverviewView = () => (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      {(quiz.questions || []).map((q, idx) => {
        const key = q.questionId ?? q.question_id ?? q.id ?? idx + 1;
        const isAnswered =
          Array.isArray(answers[key]) && answers[key].length > 0;
        const fb = aiFeedback.find((f) => Number(f.question_id) === idx + 1);

        return (
          <View key={key} style={styles.questionBlock}>
            <Text
              style={[
                styles.questionText,
                submitted && fb && !fb.is_correct ? { color: "#C62828" } : null,
              ]}
            >
              {idx + 1}.{" "}
              {q.questionText || q.question || "Câu hỏi không xác định"}
            </Text>

            <View
              style={[
                styles.answerBox,
                {
                  backgroundColor: isAnswered
                    ? `${themeColors.primary}20`
                    : "#f5f5f5",
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
                          ? "#2e7d32"
                          : "#c62828"
                        : isAnswered
                        ? themeColors.secondary
                        : "#666",
                  },
                ]}
              >
                {isAnswered
                  ? "Đã chọn: " + answers[key].join(", ")
                  : "Bạn chưa chọn đáp án."}
              </Text>

              {submitted && fb && (
                <Text
                  style={{
                    color: fb.is_correct ? "#2e7d32" : "#c62828",
                    fontWeight: "bold",
                  }}
                >
                  {fb.is_correct ? "Đúng" : "Sai"}
                </Text>
              )}
            </View>

            {submitted && fb && (
              <View
                style={[
                  styles.feedbackBox,
                  { backgroundColor: fb.is_correct ? "#e8f5e9" : "#ffebee" },
                ]}
              >
                <Text
                  style={{
                    fontStyle: "italic",
                    color: fb.is_correct ? "#2e7d32" : "#c62828",
                  }}
                >
                  {fb.explanation || fb.feedback}
                </Text>
              </View>
            )}
          </View>
        );
      })}

      <View style={{ paddingHorizontal: 16 }}>
        <TouchableOpacity
          style={styles.evaluateBtn}
          onPress={handleEvaluateProgress}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>Đánh giá tiến bộ</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Main render
  return (
    <View style={styles.container}>
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

      {activeTab === "Doing" ? <DoingView /> : <OverviewView />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  tabRow: { flexDirection: "row", marginVertical: 8, paddingHorizontal: 8 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#eee",
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabActive: { backgroundColor: themeColors.secondary },
  tabText: { fontWeight: "600", color: "#333" },
  tabTextActive: { color: "#fff" },
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
  hintText: {
    color: themeColors.secondary,
    fontStyle: "italic",
    marginTop: 8,
  },
  hintExplanation: {
    color: "#666",
    fontSize: 13,
    marginTop: 4,
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
  evaluateBtn: {
    backgroundColor: themeColors.primary,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 12,
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
  resultContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  summaryBox: {
    backgroundColor: "#f1f8e9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    color: "#333",
    marginVertical: 2,
  },
  feedbackCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  questionIndex: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  answerText: { fontSize: 14, fontWeight: "500" },
  explanation: { marginTop: 6, fontSize: 13, fontStyle: "italic" },
  metaInfo: { marginTop: 4, fontSize: 12, color: "#666" },
  answerBox: { marginTop: 6, padding: 10, borderRadius: 8 },
  feedbackBox: { marginTop: 8, padding: 10, borderRadius: 8 },
  aiSummary: {
    backgroundColor: "#e8fce8",
    padding: 20,
    borderRadius: 12,
    margin: 16,
    alignItems: "center",
    elevation: 3,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  progressText: { color: "#444", fontWeight: "600" },
});
