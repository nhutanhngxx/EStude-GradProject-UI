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
  const previousFeedback = route?.params?.previousFeedback; // Layer 1 feedback từ AssignmentReviewScreen
  const { user, token } = useContext(AuthContext);
  const { showToast } = useToast();

  console.log("🎯 Layer3 raw result:", JSON.stringify(quiz, null, 2));
  console.log("📋 Quiz structure:", {
    hasQuestions: !!quiz?.questions,
    questionCount: quiz?.questions?.length,
    firstQuestion: quiz?.questions?.[0],
    firstQuestionOptions: quiz?.questions?.[0]?.options,
  });

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
  const [normalizedQuiz, setNormalizedQuiz] = useState(null);

  const totalQuestions = quiz?.questions?.length || 0;

  // Normalize quiz data từ layer 3
  useEffect(() => {
    if (!quiz?.questions) return;

    console.log("🔍 Raw quiz from Layer 3:", JSON.stringify(quiz, null, 2));

    const normalized = {
      ...quiz,
      questions: quiz.questions.map((q, idx) => {
        console.log(`📝 Question ${idx + 1}:`, {
          hasCorrectAnswer: !!q.correct_answer,
          correctAnswerValue: q.correct_answer,
          optionsType: typeof q.options?.[0],
          optionsCount: q.options?.length,
        });

        // Normalize options - convert all to objects with optionText
        const normalizedOptions = (q.options || []).map((opt, optIdx) => {
          let optionText, isCorrect;

          if (typeof opt === "string") {
            optionText = opt;
            // Nếu có correct_answer, so sánh với index (1-based)
            isCorrect = q.correct_answer
              ? optIdx + 1 === Number(q.correct_answer)
              : false;
          } else {
            optionText = opt.optionText || opt.text || String(opt);
            // Ưu tiên isCorrect từ option, fallback về correct_answer
            isCorrect =
              opt.isCorrect !== undefined
                ? opt.isCorrect
                : q.correct_answer
                ? optIdx + 1 === Number(q.correct_answer)
                : false;
          }

          return { optionText, isCorrect };
        });

        // Kiểm tra xem có ít nhất 1 đáp án đúng không
        const hasCorrectAnswer = normalizedOptions.some((opt) => opt.isCorrect);
        if (!hasCorrectAnswer) {
          console.warn(`⚠️ Question ${idx + 1} has NO correct answer marked!`);
        }

        return {
          ...q,
          questionId: q.questionId || q.question_id || q.id || idx + 1,
          questionText:
            q.questionText || q.question || q.text || `Câu hỏi ${idx + 1}`,
          options: normalizedOptions,
        };
      }),
    };

    console.log("✅ Normalized quiz:", JSON.stringify(normalized, null, 2));
    setNormalizedQuiz(normalized);
  }, [quiz]);

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
    const quizData = normalizedQuiz || quiz;

    // Filter và chỉ gửi các câu hỏi có correct_answer hợp lệ
    const validQuestions = (quizData.questions || []).filter((q) => {
      const correctIndex = (q.options || []).findIndex(
        (opt) => opt.isCorrect === true
      );
      const hasCorrectAnswer = correctIndex >= 0;

      if (!hasCorrectAnswer) {
        console.warn(
          `⚠️ Question skipped - no correct answer found:`,
          q.questionText
        );
      }

      return hasCorrectAnswer;
    });

    console.log(
      `📊 Valid questions: ${validQuestions.length}/${
        quizData.questions?.length || 0
      }`
    );

    return {
      assignment_id: String(quizData.assignmentId || "practice"),
      student_name: user?.fullName || user?.name || "Học sinh",
      subject: quizData.subject || "Chưa xác định",
      questions: validQuestions.map((q, idx) => {
        const key = q.questionId;
        const selected = answers[key] || [];
        const chosenOpt = Array.isArray(selected) ? selected[0] : selected;

        const optionsAsStrings = (q.options || []).map((opt) => opt.optionText);
        const chosenIndex = optionsAsStrings.findIndex((t) => t === chosenOpt);
        const correctIndex = (q.options || []).findIndex(
          (opt) => opt.isCorrect === true
        );

        return {
          question: q.questionText,
          options: optionsAsStrings,
          correct_answer: correctIndex + 1, // 1-based, guaranteed >= 1 vì đã filter
          student_answer: chosenIndex >= 0 ? chosenIndex + 1 : null, // 1-based
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
    if (!normalizedQuiz || !totalQuestions) {
      showToast("Không có câu hỏi để nộp.", { type: "error" });
      return;
    }

    setSubmitting(true);
    setAiLoading(true);

    try {
      let correctCount = 0;
      const feedback = (normalizedQuiz.questions || []).map((q, idx) => {
        const key = q.questionId;
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

      // Xây dựng payload theo schema yêu cầu và gọi Layer 3.5
      const aiPayload = buildAiPayloadFromQuiz();
      console.log(
        "📤 Submitting to Layer 3.5:",
        JSON.stringify(aiPayload, null, 2)
      );

      // Kiểm tra payload có câu hỏi hợp lệ không
      if (!aiPayload.questions || aiPayload.questions.length === 0) {
        showToast(
          "Không có câu hỏi hợp lệ để gửi. Vui lòng kiểm tra lại bài luyện tập.",
          {
            type: "error",
          }
        );
        setAiLoading(false);
        setSubmitting(false);
        return;
      }

      const reviewRes = await aiService.submitPracticeReview(aiPayload, token);
      setAiLoading(false);

      if (reviewRes) {
        console.log(
          "📥 Layer 3.5 Response:",
          JSON.stringify(reviewRes, null, 2)
        );

        const processed = reviewRes?.data || reviewRes;
        const detailed = processed?.detailedAnalysis || processed;
        const sum = detailed?.summary;
        const fb = detailed?.feedback || [];
        const resultId = processed?.result_id; // Lấy result_id từ response

        // Chuẩn hóa feedback: thêm is_correct nếu cần
        const normalizedFb = Array.isArray(fb)
          ? fb.map((f, i) => ({
              ...f,
              question_id: Number(f.question_id ?? i + 1),
              is_correct:
                f.student_answer != null && f.correct_answer != null
                  ? Number(f.student_answer) === Number(f.correct_answer)
                  : !!f.is_correct,
            }))
          : [];

        setAiResult({
          detailedAnalysis: {
            result_id: resultId, // Lưu result_id để dùng cho Layer 4
            subject: detailed?.subject || normalizedQuiz.subject,
            topic_breakdown: detailed?.topic_breakdown || [], // Lưu topic_breakdown
            summary: sum || {
              total_questions: totalQuestions,
              correct_count: correctCount,
              accuracy_percentage: Math.round(
                (correctCount / totalQuestions) * 100
              ),
            },
            feedback: normalizedFb.length ? normalizedFb : feedback,
          },
          comment: processed?.comment || "Đánh giá luyện tập hoàn tất!",
        });

        setAiFeedback((prev) => (normalizedFb.length ? normalizedFb : prev));
      } else {
        setAiLoading(false);
        showToast(
          "Không gửi được kết quả lên máy chủ. Hiển thị kết quả cục bộ.",
          {
            type: "warning",
          }
        );
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
    if (!aiResult?.detailedAnalysis) {
      showToast("Chưa có dữ liệu bài luyện tập để đánh giá.", {
        type: "warning",
      });
      return;
    }

    // Lấy result_id từ Layer 3.5 response (reviewRes.data.result_id)
    const layer35ResultId = aiResult.detailedAnalysis?.result_id;

    if (!layer35ResultId) {
      showToast("Không tìm thấy result_id từ bài luyện tập.", {
        type: "error",
      });
      return;
    }

    // Lấy previous_results_id và previous_results từ Layer 1 feedback
    const layer1Feedback = previousFeedback; // Đây là object Layer 1 từ AssignmentReviewScreen
    const previousResultsId = layer1Feedback?.resultId;

    if (!previousResultsId) {
      showToast("Không tìm thấy dữ liệu bài làm gốc (Layer 1).", {
        type: "error",
      });
      return;
    }

    // Tính previous_results từ Layer 1 topic_breakdown (nếu không có thì tính từ feedback)
    let previousResults = [];
    if (layer1Feedback?.detailedAnalysis?.topic_breakdown) {
      previousResults = layer1Feedback.detailedAnalysis.topic_breakdown.map(
        (tb) => ({
          topic: tb.topic,
          accuracy: tb.accuracy || 0,
        })
      );
    } else if (layer1Feedback?.detailedAnalysis?.feedback) {
      // Fallback: group by topic và tính accuracy
      const topicMap = {};
      layer1Feedback.detailedAnalysis.feedback.forEach((f) => {
        const topic = f.topic || "Không xác định";
        if (!topicMap[topic]) {
          topicMap[topic] = { correct: 0, total: 0 };
        }
        topicMap[topic].total += 1;
        if (f.is_correct) topicMap[topic].correct += 1;
      });
      previousResults = Object.keys(topicMap).map((topic) => ({
        topic,
        accuracy:
          topicMap[topic].total > 0
            ? topicMap[topic].correct / topicMap[topic].total
            : 0,
      }));
    }

    // Tính new_results từ Layer 3.5 topic_breakdown
    let newResults = [];
    if (aiResult.detailedAnalysis?.topic_breakdown) {
      newResults = aiResult.detailedAnalysis.topic_breakdown.map((tb) => ({
        topic: tb.topic,
        accuracy: tb.accuracy || 0,
      }));
    } else {
      // Fallback: group by topic từ feedback
      const topicMap = {};
      (aiFeedback || []).forEach((f) => {
        const topic = f.topic || "Không xác định";
        if (!topicMap[topic]) {
          topicMap[topic] = { correct: 0, total: 0 };
        }
        topicMap[topic].total += 1;
        if (f.is_correct) topicMap[topic].correct += 1;
      });
      newResults = Object.keys(topicMap).map((topic) => ({
        topic,
        accuracy:
          topicMap[topic].total > 0
            ? topicMap[topic].correct / topicMap[topic].total
            : 0,
      }));
    }

    const layer4Payload = {
      student_id: user?.userId,
      subject: aiResult.detailedAnalysis?.subject || quiz?.subject,
      result_id: String(layer35ResultId),
      previous_results_id: String(previousResultsId),
      previous_results: previousResults,
      new_results: newResults,
    };

    console.log("📤 Layer 4 Payload:", JSON.stringify(layer4Payload, null, 2));

    try {
      setAiLoading(true);
      const layer4Raw = await aiService.layer4(layer4Payload, token);
      setAiLoading(false);

      console.log("📥 Layer 4 Response:", JSON.stringify(layer4Raw, null, 2));

      if (!layer4Raw) {
        showToast("Không nhận được kết quả từ máy chủ (Layer 4).", {
          type: "error",
        });
        return;
      }

      const evaluation = layer4Raw?.data || layer4Raw;

      if (!evaluation) {
        showToast("Dữ liệu đánh giá tiến bộ không hợp lệ.", { type: "error" });
        return;
      }

      navigation.navigate("Improvement", {
        evaluation,
        quiz,
        previousFeedback: aiFeedback,
      });
    } catch (error) {
      console.error("❌ Layer 4 error:", error);
      setAiLoading(false);
      showToast(
        "Lỗi khi đánh giá tiến bộ: " + (error.message || "Unknown error"),
        { type: "error" }
      );
    }
  };

  // Trợ lý nhỏ để hiển thị văn bản tùy chọn một cách an toàn từ phản hồi của ai (chỉ số dựa trên 1)
  const getOptionText = (q, idx1Based) => {
    if (!q || !Array.isArray(q.options) || idx1Based == null) return "-";
    const idx = Number(idx1Based) - 1;
    return q.options[idx]?.optionText ?? "-";
  };

  const DoingView = () => {
    if (!normalizedQuiz) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Đang tải bài luyện tập...</Text>
        </View>
      );
    }

    return (
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
          {(normalizedQuiz.questions || []).map((q, index) => {
            const key = q.questionId;
            const isMulti = Array.isArray(q.answers) && q.answers.length > 1;
            return (
              <View key={`q_${index}_${key}`} style={styles.questionBlock}>
                <Text style={styles.questionText}>
                  {index + 1}. {q.questionText} {isMulti ? "(Chọn nhiều)" : ""}
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
  };

  const OverviewView = () => {
    if (!normalizedQuiz) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Đang tải bài luyện tập...</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {(normalizedQuiz.questions || []).map((q, idx) => {
          const key = q.questionId;
          const isAnswered =
            Array.isArray(answers[key]) && answers[key].length > 0;
          const fb = aiFeedback.find((f) => Number(f.question_id) === idx + 1);

          return (
            <View key={key} style={styles.questionBlock}>
              <Text
                style={[
                  styles.questionText,
                  submitted && fb && !fb.is_correct
                    ? { color: "#C62828" }
                    : null,
                ]}
              >
                {idx + 1}. {q.questionText}
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
  };

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
