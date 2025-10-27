import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";

import submissionService from "../../services/submissionService";
import { AuthContext } from "../../contexts/AuthContext";
import aiService from "../../services/aiService";
import classSubjectService from "../../services/classSubjectService";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../../components/common/ConfirmModal";
import { Ionicons } from "@expo/vector-icons";

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
  const { user, token } = useContext(AuthContext);
  const { showToast } = useToast();

  const [isSubmitModalVisible, setSubmitModalVisible] = useState(false);
  const [submittedScore, setSubmittedScore] = useState(null);
  const [submittedResult, setSubmittedResult] = useState(null);
  const initialSeconds = (exam?.timeLimit ?? 15) * 60;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [answers, setAnswers] = useState({});
  const [activeTab, setActiveTab] = useState("Doing");
  const [aiResult, setAiResult] = useState(null);
  const [aiFeedback, setAiFeedback] = useState([]);
  const [submitted, setSubmitted] = useState(initialSubmitted || false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  // 🎯 States cho Practice Settings Modal
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [numQuestions, setNumQuestions] = useState("5");
  const [difficulty, setDifficulty] = useState("easy");

  // console.log("exam: ", exam);

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
        "Thời gian làm bài đã hết. Bài làm của bạn sẽ được tự động nộp.",
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
    setAiLoading(true);

    try {
      const answersPayload = Object.entries(answers).flatMap(
        ([questionId, selected]) => {
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

      const result = await submissionService.addSubmission(submission);

      if (result) {
        showToast("Bài tập của bạn đã được nộp!", { type: "success" });
        setSubmittedResult(result);
        setSubmitted(true);
        setSubmitting(false);

        // ✅ Lấy submissionId từ response
        const submissionId = result.submissionId;

        if (!submissionId) {
          console.error("❌ Không nhận được submissionId từ backend");
          showToast("Lỗi: Không nhận được submissionId", { type: "error" });
          setAiLoading(false);
          return;
        }

        console.log("✅ Submission thành công, submissionId:", submissionId);

        const classSubject = await classSubjectService.getClassSubject(
          exam.classSubject.classSubjectId
        );

        const aiPayload = {
          submission_id: submissionId.toString(), // ✅ THÊM submission_id
          assignment_id: exam.assignmentId.toString(),
          student_name: user.fullName || user.name || "Học sinh chưa đặt tên",
          subject:
            `${classSubject?.subjectName} ${
              classSubject?.gradeLevel?.match(/\d+/)?.[0] || ""
            }`.trim() || "Chưa xác định",
          questions: exam.questions.map((q, idx) => {
            const selected = answers[q.questionId] || [];
            const chosenOpt = Array.isArray(selected) ? selected[0] : selected;
            const chosenIndex = q.options.findIndex(
              (opt) => opt.optionText === chosenOpt
            );
            const correctIndex = q.options.findIndex(
              (opt) => opt.isCorrect === true
            );

            return {
              question_id: Number(q.questionId ?? q.question_id ?? idx + 1),
              question: q.questionText,
              options: q.options.map((o) => o.optionText),
              correct_answer: correctIndex + 1,
              student_answer: chosenIndex + 1 || null,
            };
          }),
        };

        console.log("📤 Gọi Layer 1 với payload:", aiPayload);

        const aiResult = await aiService.layer1(aiPayload, token);
        console.log("layer1Result: ", aiResult);
        setAiLoading(false);

        if (aiResult) {
          const processedResult = aiResult?.data || aiResult;
          setAiResult({
            detailedAnalysis: {
              subject: processedResult.subject,
              summary: processedResult.summary,
              feedback: processedResult.feedback.map((f, idx) => ({
                ...f,
                question_id: idx + 1,
                is_correct: f.student_answer === f.correct_answer,
              })),
            },
            comment: processedResult.comment || "Phân tích hoàn tất!",
          });
          setAiFeedback(processedResult.feedback || []);

          // Gọi Layer 2
          const layer2Payload = {
            submission_id: submissionId.toString(), // ✅ THÊM submission_id
            feedback_data: processedResult,
          };
          try {
            const layer2Result = await aiService.layer2(layer2Payload, token);
            showToast("Gợi ý học tập thành công.", { type: "success" });
            console.log("layer2Result: ", layer2Result);
            setRecommendations(layer2Result?.data || layer2Result);
          } catch (layer2Error) {
            console.error("Lỗi gọi Layer 2:", layer2Error);
            showToast("Lỗi khi lấy gợi ý học tập.", { type: "error" });
            setAiLoading(false);
          }
        } else {
          console.warn("Không thể phân tích chi tiết bài nộp.");
          setAiLoading(false);
        }
      } else {
        setSubmitting(false);
        setAiLoading(false);
        showToast("Không thể nộp bài, vui lòng thử lại.", { type: "error" });
      }
    } catch (error) {
      console.error(error);
      setSubmitting(false);
      setAiLoading(false);
      showToast("Không thể nộp bài, vui lòng thử lại.", { type: "error" });
    }
  };

  // 🎯 Mở modal chọn settings cho bài luyện tập
  const handleOpenPracticeModal = (rawTopic) => {
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

    // Lưu topic và mở modal
    setSelectedTopic(topic);
    setNumQuestions("5"); // Reset về default
    setDifficulty("easy"); // Reset về default
    setShowPracticeModal(true);
  };

  // 🚀 Tạo bài luyện tập với settings đã chọn
  const handleGeneratePractice = async () => {
    if (!selectedTopic) return;

    const topic = selectedTopic;

    // Chuẩn hoá topic: nếu là object, lấy thuộc tính phù hợp
    // let topic = rawTopic;
    // if (!topic) {
    //   showToast("Chủ đề không hợp lệ, không thể tạo bài luyện tập.", {
    //     type: "error",
    //   });
    //   return;
    // }
    // // Nếu weak_topics là object như {topic: 'X'} hoặc {name:'X'}
    // if (typeof topic === "object") {
    //   topic = topic.topic ?? topic.name ?? topic.label ?? null;
    // }
    // topic = typeof topic === "string" ? topic.trim() : null;

    // if (!topic || topic.toLowerCase() === "không xác định") {
    //   showToast("Chủ đề không rõ — không thể tạo bài luyện tập tự động.", {
    //     type: "warning",
    //   });
    //   return;
    // }

    // ✅ Lấy submission_id từ submittedResult
    const submissionIdForLayer3 = submittedResult?.submissionId;

    if (!submissionIdForLayer3) {
      showToast("Lỗi: Không tìm thấy submission_id để tạo bài luyện tập.", {
        type: "error",
      });
      return;
    }

    // 🔥 GỌI API LẤY FEEDBACK THỰC TẾ TỪ ASSIGNMENT
    let referenceQuestions = [];
    try {
      const assignmentId = exam.assignmentId;
      console.log(
        "🔍 Fetching feedback from API for assignmentId:",
        assignmentId
      );

      const feedbackResults = await aiService.getAIFeedbackByAssignmentId(
        assignmentId,
        token
      );

      if (
        feedbackResults &&
        Array.isArray(feedbackResults) &&
        feedbackResults.length > 0
      ) {
        // Lấy feedback mới nhất
        const latestFeedback = feedbackResults.reduce((latest, current) => {
          return current.resultId > latest.resultId ? current : latest;
        }, feedbackResults[0]);

        console.log("✅ Latest feedback retrieved:", latestFeedback.resultId);

        // Lọc feedback theo topic
        if (latestFeedback?.detailedAnalysis?.feedback) {
          latestFeedback.detailedAnalysis.feedback
            .filter((f) => f.topic?.toLowerCase().includes(topic.toLowerCase()))
            .forEach((f) => {
              referenceQuestions.push({
                question: f.question || "",
                topic: f.topic || topic,
                explanation: f.explanation || f.feedback || "",
              });
            });
        }
      }
    } catch (error) {
      console.error("❌ Error fetching feedback from API:", error);
      // Không throw error, tiếp tục với fallback
    }

    // Nếu không có reference questions từ API, tạo một default
    if (referenceQuestions.length === 0) {
      console.warn("⚠️ No reference questions from API, using fallback");
      referenceQuestions.push({
        question: `Câu hỏi mẫu về ${topic}`,
        topic: topic,
        explanation: `Đây là câu hỏi liên quan đến chủ đề ${topic}`,
      });
    }

    // 🎯 Sử dụng settings từ modal
    const numQuestionsInt = parseInt(numQuestions) || 5;

    const layer3Payload = {
      submission_id: submissionIdForLayer3.toString(), // ✅ BẮT BUỘC
      subject: exam.classSubject.subject.name,
      topics: [topic],
      difficulty: difficulty, // ✅ Từ modal
      num_questions: numQuestionsInt, // ✅ Từ modal
      reference_questions: referenceQuestions, // ✅ THÊM reference_questions
    };

    console.log("📤 Layer3 Payload:", JSON.stringify(layer3Payload, null, 2));

    try {
      setAiLoading(true);
      setShowPracticeModal(false); // Đóng modal trước khi gọi API

      const layer3Result = await aiService.layer3(layer3Payload, token);
      console.log("Layer3 raw result:", layer3Result);

      // Hỗ trợ cả dạng { data: { questions: [...] } } hoặc raw { questions: [...] }
      const quizData = layer3Result?.data ?? layer3Result;
      console.log("quizData: ", quizData);

      // Kiểm tra hợp lệ trước khi navigate
      if (
        !quizData ||
        !Array.isArray(quizData.questions) ||
        quizData.questions.length === 0
      ) {
        showToast("Không tạo được bài luyện tập (API trả về rỗng).", {
          type: "error",
        });
        setAiLoading(false);
        return;
      }

      // Bảo đảm mỗi câu có questionId và option structure phù hợp
      // (bạn có thể chuẩn hoá/casting ở đây nếu backend trả khác)
      navigation.navigate("PracticeQuiz", {
        quiz: {
          ...quizData,
          submissionId: submittedResult?.submissionId, // ✅ THÊM submissionId vào quiz
        },
        previousFeedback: {
          resultId:
            submittedResult?.data?.result_id ||
            submittedResult?.result_id ||
            "local-layer1",
          detailedAnalysis: aiResult?.detailedAnalysis || null,
        },
        submissionId: submittedResult?.submissionId, // ✅ THÊM submissionId vào params
      });

      setAiLoading(false);
    } catch (error) {
      console.error("Lỗi gọi Layer 3:", error);
      showToast("Lỗi khi tạo bài luyện tập.", { type: "error" });
      setAiLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🎯 Practice Settings Modal */}
      <Modal
        visible={showPracticeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPracticeModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Cài đặt bài luyện tập</Text>
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowPracticeModal(false);
                      }}
                    >
                      <Ionicons name="close-circle" size={28} color="#999" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.modalBody}
                    keyboardShouldPersistTaps="handled"
                  >
                    <Text style={styles.topicLabel}>
                      📚 Chủ đề:{" "}
                      <Text style={styles.topicValue}>{selectedTopic}</Text>
                    </Text>

                    {/* Số câu hỏi */}
                    <View style={styles.settingGroup}>
                      <Text style={styles.settingLabel}>🔢 Số câu hỏi:</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={numQuestions}
                        onChangeText={setNumQuestions}
                        keyboardType="numeric"
                        maxLength={2}
                        placeholder="5"
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                      />
                    </View>

                    {/* Mức độ */}
                    <View style={styles.settingGroup}>
                      <Text style={styles.settingLabel}>📊 Mức độ:</Text>
                      <View style={styles.difficultyButtons}>
                        {[
                          {
                            key: "easy",
                            label: "Dễ",
                            icon: "happy-outline",
                            color: "#4caf50",
                          },
                          {
                            key: "medium",
                            label: "Trung bình",
                            icon: "sunny-outline",
                            color: "#ff9800",
                          },
                          {
                            key: "hard",
                            label: "Khó",
                            icon: "flame-outline",
                            color: "#f44336",
                          },
                          {
                            key: "mixed",
                            label: "Hỗn hợp",
                            icon: "shuffle-outline",
                            color: "#9c27b0",
                          },
                        ].map((item) => (
                          <TouchableOpacity
                            key={item.key}
                            style={[
                              styles.difficultyBtn,
                              difficulty === item.key && {
                                backgroundColor: item.color,
                                borderColor: item.color,
                              },
                            ]}
                            onPress={() => {
                              Keyboard.dismiss();
                              setDifficulty(item.key);
                            }}
                          >
                            <Ionicons
                              name={item.icon}
                              size={18}
                              color={
                                difficulty === item.key ? "#fff" : item.color
                              }
                            />
                            <Text
                              style={[
                                styles.difficultyText,
                                difficulty === item.key &&
                                  styles.difficultyTextActive,
                              ]}
                            >
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowPracticeModal(false);
                      }}
                    >
                      <Text style={styles.cancelBtnText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={() => {
                        Keyboard.dismiss();
                        handleGeneratePractice();
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.confirmBtnText}>
                        Tạo bài luyện tập
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

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
            {submitted ? "Xem bài làm" : "Làm bài"}
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
            Câu hỏi
          </Text>
        </TouchableOpacity>

        {submitted ? (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "Review" && styles.tabActive]}
            onPress={() => setActiveTab("Review")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Review" && styles.tabTextActive,
              ]}
            >
              Gợi ý
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Body */}
      {activeTab === "Doing" ? (
        <ScrollView style={{ flex: 1 }}>
          {submitted ? (
            aiLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text style={styles.loadingText}>
                  Đang phân tích bài làm của bạn...
                </Text>
              </View>
            ) : aiResult?.detailedAnalysis ? (
              <ScrollView style={styles.resultContainer}>
                <View style={styles.summaryBox}>
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="stats-chart-outline"
                      size={26}
                      color={themeColors.primary}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#333",
                        textAlign: "center",
                      }}
                    >
                      Điểm của bạn
                    </Text>
                    <Text
                      style={{
                        marginTop: 8,
                        fontSize: 48,
                        lineHeight: 52,
                        fontWeight: "bold",
                        color: themeColors.primary,
                        textAlign: "center",
                      }}
                    >
                      {(
                        (aiResult.detailedAnalysis.summary.correct_count /
                          aiResult.detailedAnalysis.summary.total_questions) *
                        10
                      ).toFixed(2)}
                    </Text>
                  </View>

                  <Text style={styles.summaryText}>
                    Tổng số câu:{" "}
                    {aiResult.detailedAnalysis.summary.total_questions}
                  </Text>
                  <Text style={styles.summaryText}>
                    Số câu đúng:{" "}
                    {aiResult.detailedAnalysis.summary.correct_count}
                  </Text>
                  <Text style={styles.summaryText}>
                    Độ chính xác:{" "}
                    {aiResult.detailedAnalysis.summary.accuracy_percentage}%
                  </Text>
                </View>

                {aiResult.detailedAnalysis.feedback.map((f, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.feedbackCard,
                      {
                        backgroundColor: f.is_correct ? "#E8F5E9" : "#FFEBEE",
                        gap: 5,
                      },
                    ]}
                  >
                    <Text style={styles.questionIndex}>Câu {idx + 1}</Text>
                    <Text style={styles.questionText}>{f.question}</Text>
                    <Text
                      style={[
                        styles.answerText,
                        { color: f.is_correct ? "#2E7D32" : "#C62828" },
                      ]}
                    >
                      Đáp án của bạn: {f.student_answer || "Chưa trả lời"}
                    </Text>
                    <Text style={{ color: "#333" }}>
                      Đáp án đúng: {f.correct_answer || "Không có dữ liệu"}
                    </Text>
                    <Text
                      style={[
                        styles.explanation,
                        { color: f.is_correct ? "#2E7D32" : "#C62828" },
                      ]}
                    >
                      <Ionicons name="sparkles" size={15} color="green" /> Giải
                      thích: {f.explanation}
                    </Text>
                    <Text style={styles.metaInfo}>
                      Chủ đề: {f.topic} • Mức độ: {f.difficulty_level}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.aiSummary}>
                <Text>Không có dữ liệu phân tích AI.</Text>
              </View>
            )
          ) : (
            exam.questions.map((q, idx) => (
              <View key={q.questionId} style={styles.questionBlock}>
                <Text style={styles.questionText}>
                  <Text style={styles.questionNumber}>Câu {idx + 1}:</Text>{" "}
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
      ) : activeTab === "Overview" ? (
        <ScrollView style={{ flex: 1, padding: 12 }}>
          {exam.questions.map((q, idx) => {
            const isAnswered =
              Array.isArray(answers[q.questionId]) &&
              answers[q.questionId].length > 0;
            const fb = aiFeedback.find(
              (f) => Number(f.question_id) === idx + 1
            );

            return (
              <View key={q.questionId} style={styles.questionBlock}>
                <Text
                  style={[
                    styles.questionText,
                    submitted && fb && !fb.is_correct && { color: "#C62828" },
                  ]}
                >
                  <Text style={styles.questionNumber}>Câu {idx + 1}:</Text>{" "}
                  {q.questionText}
                </Text>

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
                              ? "#2e7d32"
                              : "#c62828"
                            : isAnswered
                            ? themeColors.secondary
                            : "#666",
                        fontWeight: submitted && fb ? "bold" : "500",
                        flexShrink: 1,
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
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {aiLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={styles.loadingText}>Đang tải gợi ý học tập...</Text>
            </View>
          ) : recommendations ? (
            <>
              {/* Tổng kết */}
              <View style={styles.aiSummaryCard}>
                <View style={styles.aiSummaryHeader}>
                  <Ionicons
                    name="bulb-outline"
                    size={22}
                    color={themeColors.secondary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.sectionTitle}>Tổng kết gợi ý</Text>
                </View>
                <Text style={[styles.aiSummaryText, { textAlign: "justify" }]}>
                  {recommendations.overall_advice}
                </Text>
              </View>

              {/* Chủ đề yếu */}
              {recommendations.weak_topics?.length > 0 && (
                <View style={styles.aiWeakCard}>
                  <View style={styles.aiSummaryHeader}>
                    <Ionicons
                      name="warning-outline"
                      size={22}
                      color={themeColors.danger}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.sectionTitle}>Chủ đề yếu</Text>
                  </View>
                  {recommendations.weak_topics.map((t, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleOpenPracticeModal(t.topic)}
                      style={styles.actionButton}
                    >
                      <Ionicons
                        name="book-outline"
                        size={18}
                        color={themeColors.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.actionText}>Ôn tập {t.topic}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.aiSummary}>
              <Ionicons name="cloud-offline-outline" size={20} color="#888" />
              <Text style={{ marginLeft: 6 }}>
                Không có gợi ý học tập nào hiện tại.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {!submitted && (
        <View style={styles.fixedSubmitContainer}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => setSubmitModalVisible(true)}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>Nộp bài</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ConfirmModal
        visible={isSubmitModalVisible}
        title="Xác nhận nộp bài"
        message="Bạn có chắc chắn muốn nộp bài làm này không?"
        confirmText="Nộp bài"
        cancelText="Hủy"
        onConfirm={() => {
          setSubmitModalVisible(false);
          handleSubmit();
        }}
        onCancel={() => setSubmitModalVisible(false)}
      />
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
  questionNumber: {
    fontWeight: "bold",
    color: "#2c3e50",
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
  resultContainer: { flex: 1, padding: 16, backgroundColor: "#fff" },
  summaryBox: {
    backgroundColor: "#f1f8e9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  subjectTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  summaryText: { fontSize: 13, color: "#333", marginVertical: 2 },
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
  questionText: { fontSize: 15, color: "#222", marginBottom: 6 },
  answerText: { fontSize: 14, fontWeight: "500" },
  explanation: { marginTop: 6, fontSize: 13, fontStyle: "italic" },
  metaInfo: { marginTop: 4, fontSize: 12, color: "#666" },
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
  recommendationCard: {
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  actionText: {
    color: themeColors.secondary,
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginTop: 8,
  },
  fixedSubmitContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  aiSummaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  aiWeakCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  aiSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  aiSummaryText: {
    fontSize: 14,
    color: themeColors.text,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  // 🎯 Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  modalBody: {
    padding: 20,
  },
  topicLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f0f7f0",
    borderRadius: 8,
  },
  topicValue: {
    color: themeColors.secondary,
    fontWeight: "700",
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  numberInput: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "#f9f9f9",
  },
  difficultyButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  difficultyBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
    minWidth: "48%",
    justifyContent: "center",
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    color: "#666",
  },
  difficultyTextActive: {
    color: "#fff",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: themeColors.secondary,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
