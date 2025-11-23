import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../../contexts/ToastContext";
import { AuthContext } from "../../contexts/AuthContext";
import topicService from "../../services/topicService";
import aiService from "../../services/aiService";

const themeColors = {
  primary: "#9C27B0",
  secondary: "#7B1FA2",
  background: "#F5F5F5",
  card: "#FFFFFF",
  text: "#333333",
};

export default function AssessmentQuizScreen({ route, navigation }) {
  const {
    assessmentId,
    subjectId,
    subjectName,
    questions: generatedQuestions,
    totalQuestions,
    difficulty,
    selectedTopics,
  } = route.params;

  const { showToast } = useToast();
  const { user, token } = useContext(AuthContext);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [aiFeedbackLoading, setAiFeedbackLoading] = useState(false);

  // Debug: Track modal state changes
  useEffect(() => {
    console.log("🔍 Modal state changed:", {
      showResultModal,
      submitting,
      hasSubmissionResult: !!submissionResult,
      aiFeedbackLoading,
    });
  }, [showResultModal, submitting, submissionResult, aiFeedbackLoading]);

  useEffect(() => {
    // Questions already generated from API
    if (generatedQuestions && Array.isArray(generatedQuestions)) {
      setQuestions(generatedQuestions);
      setLoading(false);
    } else {
      showToast("Không có câu hỏi để hiển thị", { type: "error" });
      setLoading(false);
    }
  }, []);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSelectAnswer = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < questions.length) {
      Alert.alert(
        "Chưa hoàn thành",
        `Bạn mới trả lời ${answeredCount}/${questions.length} câu. Bạn có chắc muốn nộp bài?`,
        [
          { text: "Tiếp tục làm", style: "cancel" },
          { text: "Nộp bài", onPress: () => submitAssessment() },
        ]
      );
    } else {
      Alert.alert("Xác nhận nộp bài", "Bạn có chắc muốn nộp bài đánh giá?", [
        { text: "Hủy", style: "cancel" },
        { text: "Nộp bài", onPress: () => submitAssessment() },
      ]);
    }
  };

  const submitAssessment = async () => {
    try {
      setSubmitting(true);

      // Prepare submission data
      const submissionData = {
        assessmentId: assessmentId,
        studentId: user.userId,
        subjectId: subjectId,
        gradeLevel: questions[0]?.gradeLevel || "GRADE_10",
        difficulty: difficulty.toUpperCase(),
        answers: Object.keys(answers).map((questionId) => ({
          questionId: parseInt(questionId),
          chosenOptionId: answers[questionId],
        })),
        timeTaken: timeElapsed,
      };

      console.log("Submitting assessment:", submissionData);

      // Call submit API
      const result = await topicService.submitAssessment(submissionData, token);

      console.log("Submit API result:", JSON.stringify(result, null, 2));

      // Extract data from response (backend wraps data in {success, message, data} format)
      const submissionData_result = result.data || result;

      // Check if result has required data
      if (
        submissionData_result &&
        (submissionData_result.submissionId ||
          submissionData_result.id ||
          submissionData_result.score !== undefined)
      ) {
        // Normalize the result - ensure submissionId exists
        const normalizedResult = {
          ...submissionData_result,
          submissionId:
            submissionData_result.submissionId ||
            submissionData_result.id ||
            `temp_${Date.now()}`,
        };

        console.log("Submission successful, showing result modal...");
        console.log("Result data:", normalizedResult);

        // Close submitting modal FIRST
        setSubmitting(false);

        // Wait LONGER for submitting modal to close completely (increased to 800ms)
        setTimeout(() => {
          // Show result modal
          setSubmissionResult(normalizedResult);
          setShowResultModal(true);
          console.log(
            "Result modal should be visible now, showResultModal:",
            true
          );

          // Wait for modal to render before starting AI (increased to 1000ms)
          setTimeout(() => {
            console.log("Starting AI feedback process...");
            requestAIFeedback(normalizedResult);
          }, 1000);
        }, 300);
      } else {
        console.error("Invalid result format:", result);
        throw new Error(
          "Không nhận được kết quả từ server. Vui lòng kiểm tra console log."
        );
      }
    } catch (error) {
      setSubmitting(false);
      console.error("Error submitting assessment:", error);
      showToast(error.message || "Lỗi khi nộp bài. Vui lòng thử lại.", {
        type: "error",
      });
    }
  };

  const requestAIFeedback = async (submissionResult) => {
    try {
      setAiFeedbackLoading(true);

      // Use submission answers from backend instead of local questions
      // Backend returns full question details with correct/chosen options
      const aiQuestions =
        submissionResult.answers?.map((ans) => {
          // Build options array from backend data
          const optionsSet = new Set();
          const optionsList = [];

          // Add correct option
          if (ans.correctOptionText) {
            optionsSet.add(ans.correctOptionText);
            optionsList.push(ans.correctOptionText);
          }

          // Add chosen option if different
          if (
            ans.chosenOptionText &&
            ans.chosenOptionText !== ans.correctOptionText
          ) {
            optionsSet.add(ans.chosenOptionText);
            optionsList.push(ans.chosenOptionText);
          }

          // Find indices
          const correctIndex = optionsList.indexOf(ans.correctOptionText);
          const chosenIndex = optionsList.indexOf(ans.chosenOptionText);

          return {
            question_id: ans.questionId,
            topic: ans.topicName || "Không rõ",
            question: ans.questionText,
            options: optionsList,
            correct_answer: correctIndex >= 0 ? correctIndex : 0,
            student_answer: chosenIndex >= 0 ? chosenIndex : -1,
          };
        }) || [];

      const aiPayload = {
        submission_id: submissionResult.submissionId.toString(),
        assessment_id: assessmentId,
        student_name: user.fullName || user.username || "Học sinh",
        subject: subjectName,
        questions: aiQuestions,
      };

      console.log("Requesting AI Layer 1 feedback:", aiPayload);

      // Call Layer 1 AI API
      const layer1Response = await aiService.layer1(aiPayload, token);

      console.log("AI Layer 1 received:", layer1Response);

      // Create updated result object with AI data
      let updatedResult = { ...submissionResult };

      if (layer1Response && layer1Response.success && layer1Response.data) {
        showToast("AI đã phân tích bài làm của bạn!", { type: "success" });

        // Add Layer 1 feedback to result
        updatedResult.aiFeedback = layer1Response.data;

        // Update state
        setSubmissionResult(updatedResult);

        // Call Layer 2 with Layer 1 data
        console.log("Requesting AI Layer 2 recommendation...");

        const layer2Payload = {
          submission_id: submissionResult.submissionId.toString(),
          feedback_data: layer1Response.data, // Pass entire Layer 1 data
        };

        console.log("Layer 2 payload:", layer2Payload);

        const layer2Response = await aiService.layer2(layer2Payload, token);

        console.log("AI Layer 2 received:", layer2Response);

        if (layer2Response && layer2Response.success && layer2Response.data) {
          showToast("AI đã tạo gợi ý học tập cho bạn!", { type: "success" });

          // Add Layer 2 recommendation to result
          updatedResult.aiRecommendation = layer2Response.data;

          // Update state
          setSubmissionResult(updatedResult);
        }

        // Auto navigate to results after AI processing is done
        // Pass updatedResult directly to avoid state timing issues
        setTimeout(() => {
          handleViewResultsWithData(updatedResult);
        }, 2000);
      } else {
        // If AI Layer 1 fails, auto navigate after 3 seconds
        setTimeout(() => {
          handleViewResultsWithData(updatedResult);
        }, 3000);
      }
    } catch (error) {
      console.error("Error requesting AI feedback:", error);
      // Don't show error to user, AI feedback is optional
      // Auto navigate even if AI fails
      setTimeout(() => {
        handleViewResultsWithData(submissionResult);
      }, 3000);
    } finally {
      setAiFeedbackLoading(false);
    }
  };

  const handleViewResultsWithData = (resultData) => {
    setShowResultModal(false);

    // Navigate to results with submission and AI data
    navigation.replace("AssessmentResult", {
      assessmentId,
      subjectId,
      subjectName,
      questions,
      answers,
      submissionResult: resultData,
      score: resultData.score,
      correctCount: resultData.correctAnswers,
      totalQuestions: resultData.totalQuestions,
      timeElapsed,
      selectedTopics,
      difficulty,
    });
  };

  const handleViewResults = () => {
    handleViewResultsWithData(submissionResult);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
        <Text style={styles.loadingSubtext}>Vui lòng đợi trong giây lát</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>Không có câu hỏi</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <View style={styles.container}>
      {/* Result Modal */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          console.log(
            "⚠️ Modal onRequestClose called, aiFeedbackLoading:",
            aiFeedbackLoading
          );
          // Only allow close if AI is not processing
          if (!aiFeedbackLoading) {
            setShowResultModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultModalContainer}>
            {submissionResult ? (
              <>
                <View style={styles.resultModalHeader}>
                  <Ionicons
                    name={
                      submissionResult.score >= 80
                        ? "trophy"
                        : submissionResult.score >= 50
                        ? "ribbon"
                        : "alert-circle"
                    }
                    size={64}
                    color={
                      submissionResult.score >= 80
                        ? "#4CAF50"
                        : submissionResult.score >= 50
                        ? "#FF9800"
                        : "#F44336"
                    }
                  />
                  <Text style={styles.resultModalTitle}>
                    Bài làm đã được chấm!
                  </Text>
                  <Text style={styles.resultModalScore}>
                    {(submissionResult.score / 10).toFixed(2)} điểm
                  </Text>
                  <Text style={styles.resultModalSubtitle}>
                    {submissionResult.correctAnswers}/
                    {submissionResult.totalQuestions} câu đúng
                  </Text>
                </View>

                <View style={styles.resultModalBody}>
                  <View style={styles.resultModalRow}>
                    <Ionicons name="person" size={20} color="#666" />
                    <Text style={styles.resultModalText}>
                      {submissionResult.studentName}
                    </Text>
                  </View>

                  <View style={styles.resultModalRow}>
                    <Ionicons name="book" size={20} color="#666" />
                    <Text style={styles.resultModalText}>
                      {submissionResult.subjectName}
                    </Text>
                  </View>

                  <View style={styles.resultModalRow}>
                    <Ionicons name="star" size={20} color="#666" />
                    <Text style={styles.resultModalText}>
                      Mức độ: {submissionResult.performanceLevel}
                    </Text>
                  </View>

                  {aiFeedbackLoading && (
                    <View style={styles.aiFeedbackLoading}>
                      <ActivityIndicator
                        size="small"
                        color={themeColors.primary}
                      />
                      <Text style={styles.aiFeedbackText}>
                        {submissionResult.aiFeedback
                          ? "Đang tạo gợi ý học tập..."
                          : "Đang phân tích với AI..."}
                      </Text>
                    </View>
                  )}

                  {!aiFeedbackLoading && submissionResult.aiRecommendation && (
                    <View style={styles.aiFeedbackSuccess}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#4CAF50"
                      />
                      <Text style={styles.aiFeedbackTextSuccess}>
                        AI đã hoàn tất phân tích!
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.viewResultButton,
                    aiFeedbackLoading && styles.viewResultButtonDisabled,
                  ]}
                  onPress={handleViewResults}
                  disabled={aiFeedbackLoading}
                >
                  <Ionicons name="eye" size={20} color="#fff" />
                  <Text style={styles.viewResultButtonText}>
                    {aiFeedbackLoading
                      ? "Đang xử lý AI..."
                      : "Xem chi tiết kết quả"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Submitting Modal */}
      <Modal
        visible={submitting}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.submittingModal}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={styles.submittingText}>Đang nộp bài...</Text>
            <Text style={styles.submittingSubtext}>Vui lòng đợi</Text>
          </View>
        </View>
      </Modal>

      {/* Header with progress */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{subjectName}</Text>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Câu {currentIndex + 1}/{questions.length} • Đã trả lời:{" "}
            {answeredCount}
          </Text>
        </View>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          {/* Topic tag */}
          <View style={styles.topicTag}>
            <Ionicons name="bookmark" size={14} color={themeColors.primary} />
            <Text style={styles.topicText}>{currentQuestion.topicName}</Text>
          </View>

          {/* Difficulty badge */}
          <View
            style={[
              styles.difficultyBadge,
              currentQuestion.difficultyLevel === "EASY" &&
                styles.difficultyEasy,
              currentQuestion.difficultyLevel === "MEDIUM" &&
                styles.difficultyMedium,
              currentQuestion.difficultyLevel === "HARD" &&
                styles.difficultyHard,
            ]}
          >
            <Text style={styles.difficultyText}>
              {currentQuestion.difficultyLevel === "EASY"
                ? "Dễ"
                : currentQuestion.difficultyLevel === "MEDIUM"
                ? "Trung bình"
                : "Khó"}
            </Text>
          </View>

          {/* Question text */}
          <Text style={styles.questionText}>
            {currentQuestion.questionText}
          </Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option, idx) => {
              const isSelected =
                answers[currentQuestion.questionId] === option.optionId;

              return (
                <TouchableOpacity
                  key={option.optionId}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() =>
                    handleSelectAnswer(
                      currentQuestion.questionId,
                      option.optionId
                    )
                  }
                >
                  <View
                    style={[
                      styles.optionRadio,
                      isSelected && styles.optionRadioSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.optionRadioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {String.fromCharCode(65 + idx)}. {option.optionText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
          <Text style={styles.navButtonText}>Trước</Text>
        </TouchableOpacity>

        {currentIndex === questions.length - 1 ? (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Nộp bài</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Tiếp theo</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
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
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: themeColors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: themeColors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.text,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: themeColors.primary,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    backgroundColor: themeColors.card,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topicTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  topicText: {
    fontSize: 13,
    color: themeColors.primary,
    fontWeight: "600",
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  difficultyEasy: {
    backgroundColor: "#4caf50",
  },
  difficultyMedium: {
    backgroundColor: "#ff9800",
  },
  difficultyHard: {
    backgroundColor: "#f44336",
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  questionText: {
    fontSize: 17,
    lineHeight: 26,
    color: themeColors.text,
    marginBottom: 24,
    fontWeight: "500",
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSelected: {
    backgroundColor: `${themeColors.primary}10`,
    borderColor: themeColors.primary,
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CCC",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  optionRadioSelected: {
    borderColor: themeColors.primary,
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: themeColors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  optionTextSelected: {
    color: themeColors.primary,
    fontWeight: "600",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: themeColors.card,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 12,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#666",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6,
  },
  navButtonDisabled: {
    backgroundColor: "#CCC",
  },
  navButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeColors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  submittingModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    minWidth: 200,
  },
  submittingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  submittingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  resultModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  resultModalHeader: {
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  resultModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
  },
  resultModalScore: {
    fontSize: 48,
    fontWeight: "800",
    color: themeColors.primary,
    marginTop: 8,
  },
  resultModalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  resultModalBody: {
    marginBottom: 24,
    gap: 12,
  },
  resultModalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  resultModalText: {
    fontSize: 15,
    color: "#333",
  },
  aiFeedbackLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: `${themeColors.primary}10`,
    borderRadius: 8,
    marginTop: 8,
  },
  aiFeedbackText: {
    fontSize: 14,
    color: themeColors.primary,
    fontWeight: "500",
  },
  aiFeedbackSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    marginTop: 8,
  },
  aiFeedbackTextSuccess: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  viewResultButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  viewResultButtonDisabled: {
    backgroundColor: "#CCC",
    opacity: 0.6,
  },
  viewResultButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
