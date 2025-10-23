import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { useToast } from "../../contexts/ToastContext";
import { AuthContext } from "../../contexts/AuthContext";
import aiService from "../../services/aiService";

const themeColors = {
  primary: "#2ecc71",
  secondary: "#27ae60",
  accent: "#FFD60A",
  background: "#fff",
  card: "#f9f9f9",
  text: "#333",
};

export default function ImprovementScreen({ navigation, route }) {
  const { evaluation, quiz, previousFeedback } = route.params; // evaluation từ Layer 4, quiz từ PracticeQuizScreen, previousFeedback từ ExamDoingScreen
  const { showToast } = useToast();
  const { token } = useContext(AuthContext);
  const [showMotivation, setShowMotivation] = useState(false);

  console.log("🎯 Improvement Screen - evaluation:", JSON.stringify(evaluation, null, 2));
  console.log("🎯 Improvement Screen - quiz:", JSON.stringify(quiz, null, 2));

  useEffect(() => {
    navigation.setOptions({
      title: "Đánh giá tiến bộ",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 16 }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Quay lại</Text>
        </TouchableOpacity>
      ),
    });

    // Kiểm tra evaluation trước khi sử dụng
    if (!evaluation) {
      showToast("Không có dữ liệu đánh giá tiến bộ.", { type: "error" });
      return;
    }

    // Hiển thị thông báo động viên nếu cải thiện tổng thể > 20%
    if (evaluation?.overall_improvement?.improvement > 20) {
      setShowMotivation(true);
      setTimeout(() => setShowMotivation(false), 5000); // Tắt sau 5s
    }
  }, [navigation, evaluation]);

  const handleMorePractice = async () => {
    if (!evaluation || !Array.isArray(evaluation.topics)) {
      showToast("Không có dữ liệu để tạo bài luyện tập.", { type: "error" });
      return;
    }

    // Lấy các chủ đề yếu (new_accuracy < 70)
    const weakTopics = evaluation.topics
      .filter((item) => item.new_accuracy < 70)
      .map((item) => item.topic);

    if (weakTopics.length === 0) {
      showToast("Bạn đã làm tốt! Hãy thử bài thi mới.", { type: "success" });
      navigation.goBack();
      return;
    }

    const layer3Payload = {
      assignment_id: quiz?.assignmentId || "practice",
      subject: evaluation?.subject || quiz?.subject || "Chưa xác định",
      topics: weakTopics,
      difficulty: "medium",
      num_questions: 5,
    };

    try {
      const layer3Result = await aiService.layer3(layer3Payload, token);
      const quizData = layer3Result?.data || layer3Result;
      
      // Tạo previousFeedback object từ evaluation hiện tại để truyền cho lần practice tiếp theo
      const newPreviousFeedback = {
        resultId: evaluation?.result_id,
        detailedAnalysis: {
          subject: evaluation?.subject,
          topic_breakdown: evaluation?.topics?.map(t => ({
            topic: t.topic,
            accuracy: t.new_accuracy / 100, // Convert về 0-1
            correct: 0, // Không có thông tin chi tiết
            total: 0,
          })) || [],
        }
      };
      
      navigation.navigate("PracticeQuiz", {
        quiz: { ...quizData, assignmentId: quiz?.assignmentId },
        previousFeedback: newPreviousFeedback,
      });
    } catch (error) {
      console.error(error);
      showToast("Lỗi khi tạo bài luyện tập mới.", { type: "error" });
    }
  };

  return (
    <View style={styles.container}>
      {!evaluation ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Text style={{ fontSize: 16, color: themeColors.text, textAlign: "center" }}>
            Không có dữ liệu đánh giá tiến bộ.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { marginTop: 20 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.actionText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* Thông báo động viên */}
          {showMotivation && (
            <View style={styles.motivationBox}>
              <Text style={styles.motivationText}>
                🎉 Tuyệt vời! Bạn đã cải thiện đáng kể!
              </Text>
            </View>
          )}

          {/* Tóm tắt */}
          <View style={styles.summaryBox}>
            <Text style={styles.subjectTitle}>
              Đánh giá tiến bộ: {evaluation?.subject || quiz?.subject || "Chưa xác định"}
            </Text>
            <Text style={styles.summaryText}>
              Cải thiện tổng thể: {evaluation?.overall_improvement?.improvement?.toFixed(1) || 0}% 
              ({evaluation?.overall_improvement?.direction || "N/A"})
            </Text>
            <Text style={styles.summaryText}>
              Trước: {evaluation?.overall_improvement?.previous_average?.toFixed(1) || 0}% → 
              Sau: {evaluation?.overall_improvement?.new_average?.toFixed(1) || 0}%
            </Text>
            <Text style={styles.summaryComment}>
              💬 {evaluation?.summary || evaluation?.comment || "Tốt lắm, tiếp tục cố gắng!"}
            </Text>
            {evaluation?.next_action && (
              <View style={{ marginTop: 12, padding: 10, backgroundColor: "#fff3e0", borderRadius: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 4 }}>
                  🎯 Bước tiếp theo:
                </Text>
                <Text style={{ fontSize: 13, color: "#666" }}>
                  {evaluation.next_action}
                </Text>
              </View>
            )}
          </View>

          {/* Thanh tiến trình cho từng chủ đề */}
          {Array.isArray(evaluation?.topics) && evaluation.topics.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.improvementCard,
                {
                  backgroundColor:
                    (item?.new_accuracy || 0) >= (item?.previous_accuracy || 0)
                      ? "#E8F5E9"
                      : "#FFEBEE",
                },
              ]}
            >
              <Text style={styles.topicTitle}>{item?.topic || "Không xác định"}</Text>
              
              {item?.status && (
                <View style={{ 
                  backgroundColor: item.new_accuracy >= item.previous_accuracy ? "#4caf50" : "#ff9800",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  alignSelf: "flex-start",
                  marginBottom: 8
                }}>
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                    {item.status}
                  </Text>
                </View>
              )}
              
              <Text style={styles.accuracyText}>
                Trước: {(item?.previous_accuracy || 0).toFixed(1)}%
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(item?.previous_accuracy || 0, 100)}%`,
                      backgroundColor: themeColors.secondary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.accuracyText}>
                Sau: {(item?.new_accuracy || 0).toFixed(1)}%
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(item?.new_accuracy || 0, 100)}%`,
                      backgroundColor: themeColors.primary,
                    },
                  ]}
                />
              </View>
              
              {item?.improvement_percentage && (
                <Text style={[
                  styles.feedbackText,
                  {
                    color: (item?.new_accuracy || 0) >= (item?.previous_accuracy || 0)
                      ? "#2E7D32"
                      : "#C62828",
                    fontWeight: "700",
                    fontSize: 14,
                  },
                ]}>
                  {item.improvement_percentage}
                </Text>
              )}
              
              <Text
                style={[
                  styles.feedbackText,
                  {
                    color:
                      (item?.new_accuracy || 0) >= (item?.previous_accuracy || 0)
                        ? "#2E7D32"
                        : "#C62828",
                  },
                ]}
              >
                {item?.feedback || `Cải thiện: ${item?.improvement?.toFixed(1) || 0}%`}
              </Text>
            </View>
          ))}

          {/* Hành động */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleMorePractice}>
            <Text style={styles.actionText}>Luyện tập thêm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: themeColors.secondary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.actionText}>Quay lại</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  motivationBox: {
    backgroundColor: themeColors.accent,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  motivationText: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.text,
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
    color: themeColors.text,
    marginVertical: 2,
  },
  summaryComment: {
    marginTop: 10,
    fontStyle: "italic",
    color: "#2E7D32",
  },
  improvementCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 14,
    color: themeColors.text,
    marginVertical: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  feedbackText: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 6,
  },
  actionBtn: {
    backgroundColor: themeColors.primary,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 8,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
