import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const themeColors = {
  primary: "#9C27B0",
  secondary: "#7B1FA2",
  background: "#F5F5F5",
  card: "#FFFFFF",
  text: "#333333",
};

export default function AssessmentReviewScreen({ route, navigation }) {
  const { questions, answers, subjectName, submissionResult } = route.params;

  const [currentIndex, setCurrentIndex] = useState(0);

  if (!questions || questions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>Không có dữ liệu để xem lại</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const userAnswer = answers[currentQuestion.questionId];
  const correctOption = currentQuestion.options?.find((opt) => opt.isCorrect);
  const isCorrect = userAnswer === correctOption?.optionId;

  // Get AI feedback for current question - prioritize question.aiFeedback (from history)
  let aiFeedback = currentQuestion.aiFeedback; // From history view

  // Fallback to submissionResult.aiFeedback if not in question
  if (!aiFeedback && submissionResult?.aiFeedback?.feedback) {
    aiFeedback = submissionResult.aiFeedback.feedback.find(
      (feedback) => feedback.question_id === currentQuestion.questionId
    );
  }

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

  return (
    <View style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{subjectName}</Text>
        <Text style={styles.progressText}>
          Câu {currentIndex + 1}/{questions.length}
        </Text>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          {/* Topic and Result Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.topicTag}>
              <Ionicons name="bookmark" size={14} color={themeColors.primary} />
              <Text style={styles.topicText}>{currentQuestion.topicName}</Text>
            </View>

            <View
              style={[
                styles.resultBadge,
                isCorrect ? styles.resultCorrect : styles.resultWrong,
              ]}
            >
              <Ionicons
                name={isCorrect ? "checkmark-circle" : "close-circle"}
                size={16}
                color="#fff"
              />
              <Text style={styles.resultText}>
                {isCorrect ? "Đúng" : "Sai"}
              </Text>
            </View>
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
              const isUserAnswer = userAnswer === option.optionId;
              const isCorrectAnswer = option.isCorrect;

              return (
                <View
                  key={option.optionId}
                  style={[
                    styles.optionCard,
                    isCorrectAnswer && styles.optionCorrect,
                    isUserAnswer && !isCorrectAnswer && styles.optionWrong,
                  ]}
                >
                  <View style={styles.optionContent}>
                    {/* Icon */}
                    <View style={styles.optionIcon}>
                      {isCorrectAnswer ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#4CAF50"
                        />
                      ) : isUserAnswer ? (
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#F44336"
                        />
                      ) : (
                        <View
                          style={[
                            styles.optionRadio,
                            {
                              borderColor: isCorrectAnswer ? "#4CAF50" : "#CCC",
                            },
                          ]}
                        />
                      )}
                    </View>

                    {/* Option Text */}
                    <Text
                      style={[
                        styles.optionText,
                        isCorrectAnswer && styles.optionTextCorrect,
                        isUserAnswer &&
                          !isCorrectAnswer &&
                          styles.optionTextWrong,
                      ]}
                    >
                      {String.fromCharCode(65 + idx)}. {option.optionText}
                    </Text>
                  </View>

                  {/* Labels */}
                  {isCorrectAnswer && (
                    <View style={styles.labelCorrect}>
                      <Text style={styles.labelText}>Đáp án đúng</Text>
                    </View>
                  )}
                  {isUserAnswer && !isCorrectAnswer && (
                    <View style={styles.labelWrong}>
                      <Text style={styles.labelText}>Bạn đã chọn</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* AI Feedback Explanation */}
          {aiFeedback && aiFeedback.explanation && (
            <View style={styles.explanationCard}>
              <View style={styles.explanationHeader}>
                <Ionicons
                  name="sparkles"
                  size={20}
                  color={themeColors.primary}
                />
                <Text style={styles.explanationTitle}>Phân tích từ AI</Text>
                {aiFeedback.difficulty_level && (
                  <View style={styles.aiDifficultyBadge}>
                    <Text style={styles.aiDifficultyText}>
                      {aiFeedback.difficulty_level}
                    </Text>
                  </View>
                )}
              </View>

              {/* Topic and Subtopic */}
              {(aiFeedback.topic || aiFeedback.subtopic) && (
                <View style={styles.aiTopicRow}>
                  {aiFeedback.topic && (
                    <View style={styles.aiTopicTag}>
                      <Ionicons name="folder-outline" size={14} color="#666" />
                      <Text style={styles.aiTopicText}>{aiFeedback.topic}</Text>
                    </View>
                  )}
                  {aiFeedback.subtopic && (
                    <View style={styles.aiTopicTag}>
                      <Ionicons
                        name="document-text-outline"
                        size={14}
                        color="#666"
                      />
                      <Text style={styles.aiTopicText}>
                        {aiFeedback.subtopic}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Explanation text */}
              <Text style={styles.explanationText}>
                {aiFeedback.explanation}
              </Text>

              {/* Show student and correct answers */}
              {!aiFeedback.is_correct && (
                <View style={styles.aiAnswersComparison}>
                  <View style={styles.aiAnswerRow}>
                    <Ionicons name="close-circle" size={16} color="#F44336" />
                    <Text style={styles.aiAnswerLabel}>Bạn đã chọn:</Text>
                    <Text style={styles.aiAnswerWrong}>
                      {aiFeedback.student_answer}
                    </Text>
                  </View>
                  <View style={styles.aiAnswerRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#4CAF50"
                    />
                    <Text style={styles.aiAnswerLabel}>Đáp án đúng:</Text>
                    <Text style={styles.aiAnswerCorrect}>
                      {aiFeedback.correct_answer}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Fallback to question explanation if no AI feedback */}
          {!aiFeedback?.explanation && currentQuestion.explanation && (
            <View style={styles.explanationCard}>
              <View style={styles.explanationHeader}>
                <Ionicons name="bulb" size={20} color={themeColors.primary} />
                <Text style={styles.explanationTitle}>Giải thích</Text>
              </View>
              <Text style={styles.explanationText}>
                {currentQuestion.explanation}
              </Text>
            </View>
          )}

          {/* Not answered */}
          {!userAnswer && (
            <View style={styles.notAnsweredCard}>
              <Ionicons name="alert-circle-outline" size={20} color="#FF9800" />
              <Text style={styles.notAnsweredText}>
                Bạn chưa trả lời câu hỏi này
              </Text>
            </View>
          )}
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

        <TouchableOpacity
          style={styles.summaryButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="bar-chart" size={20} color={themeColors.primary} />
          <Text style={styles.summaryButtonText}>Tổng quan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            currentIndex === questions.length - 1 && styles.navButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={currentIndex === questions.length - 1}
        >
          <Text style={styles.navButtonText}>Sau</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
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
  header: {
    backgroundColor: themeColors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.text,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
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
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  topicTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  topicText: {
    fontSize: 13,
    color: themeColors.primary,
    fontWeight: "600",
  },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  resultCorrect: {
    backgroundColor: "#4CAF50",
  },
  resultWrong: {
    backgroundColor: "#F44336",
  },
  resultText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
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
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  optionCorrect: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  optionWrong: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  optionTextCorrect: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  optionTextWrong: {
    color: "#C62828",
  },
  labelCorrect: {
    backgroundColor: "#4CAF50",
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: "flex-end",
    marginTop: -8,
    marginRight: 12,
    marginBottom: 8,
    borderRadius: 4,
  },
  labelWrong: {
    backgroundColor: "#F44336",
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: "flex-end",
    marginTop: -8,
    marginRight: 12,
    marginBottom: 8,
    borderRadius: 4,
  },
  labelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  explanationCard: {
    backgroundColor: `${themeColors.primary}10`,
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.primary,
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: themeColors.primary,
    flex: 1,
  },
  explanationText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  // AI Feedback styles
  aiDifficultyBadge: {
    backgroundColor: themeColors.primary,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  aiDifficultyText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  aiTopicRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  aiTopicTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F0F0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  aiTopicText: {
    fontSize: 12,
    color: "#666",
  },
  aiAnswersComparison: {
    marginTop: 12,
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  aiAnswerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  aiAnswerLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  aiAnswerWrong: {
    fontSize: 13,
    color: "#F44336",
    fontWeight: "600",
    flex: 1,
  },
  aiAnswerCorrect: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
    flex: 1,
  },
  notAnsweredCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  notAnsweredText: {
    fontSize: 14,
    color: "#E65100",
    fontWeight: "500",
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
  summaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${themeColors.primary}15`,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 2,
    borderColor: themeColors.primary,
  },
  summaryButtonText: {
    color: themeColors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});
