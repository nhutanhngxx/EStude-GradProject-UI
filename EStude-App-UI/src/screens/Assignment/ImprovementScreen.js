import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { useToast } from "../../contexts/ToastContext";
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
  const [showMotivation, setShowMotivation] = useState(false);

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

    // Hiển thị thông báo động viên nếu cải thiện tổng thể > 20%
    if (evaluation.overall_improvement > 20) {
      setShowMotivation(true);
      setTimeout(() => setShowMotivation(false), 5000); // Tắt sau 5s
    }
  }, [navigation, evaluation]);

  const handleMorePractice = async () => {
    // Lấy các chủ đề yếu (new_accuracy < 70)
    const weakTopics = evaluation.improvement
      .filter((item) => item.new_accuracy < 70)
      .map((item) => item.topic);

    if (weakTopics.length === 0) {
      showToast("Bạn đã làm tốt! Hãy thử bài thi mới.", { type: "success" });
      navigation.navigate("ExamDoing", { exam: quiz, submitted: false });
      return;
    }

    const layer3Payload = {
      subject: quiz.subject,
      topics: weakTopics,
      difficulty: "MEDIUM",
      num_questions: 5,
    };

    try {
      const layer3Result = await aiService.layer3(layer3Payload);
      navigation.navigate("PracticeQuiz", {
        quiz: layer3Result,
        previousFeedback: evaluation.improvement, // Truyền để dùng lại ở Layer 4 sau
      });
    } catch (error) {
      console.error(error);
      showToast("Lỗi khi tạo bài luyện tập mới.", { type: "error" });
    }
  };

  return (
    <View style={styles.container}>
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
            Đánh giá tiến bộ: {quiz.subject}
          </Text>
          <Text style={styles.summaryText}>
            Cải thiện tổng thể: {evaluation.overall_improvement.toFixed(1)}%
          </Text>
          <Text style={styles.summaryComment}>
            💬 {evaluation.comment || "Tốt lắm, tiếp tục cố gắng!"}
          </Text>
        </View>

        {/* Thanh tiến trình cho từng chủ đề */}
        {evaluation.improvement.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.improvementCard,
              {
                backgroundColor:
                  item.new_accuracy >= item.previous_accuracy
                    ? "#E8F5E9"
                    : "#FFEBEE",
              },
            ]}
          >
            <Text style={styles.topicTitle}>{item.topic}</Text>
            <Text style={styles.accuracyText}>
              Trước: {item.previous_accuracy.toFixed(1)}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(item.previous_accuracy, 100)}%`,
                    backgroundColor: themeColors.secondary,
                  },
                ]}
              />
            </View>
            <Text style={styles.accuracyText}>
              Sau: {item.new_accuracy.toFixed(1)}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(item.new_accuracy, 100)}%`,
                    backgroundColor: themeColors.primary,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.feedbackText,
                {
                  color:
                    item.new_accuracy >= item.previous_accuracy
                      ? "#2E7D32"
                      : "#C62828",
                },
              ]}
            >
              {item.feedback}
            </Text>
          </View>
        ))}

        {/* Hành động */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleMorePractice}>
          <Text style={styles.actionText}>Luyện tập thêm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: themeColors.secondary }]}
          onPress={() =>
            navigation.navigate("ExamDoing", { exam: quiz, submitted: false })
          }
        >
          <Text style={styles.actionText}>Quay lại bài thi gốc</Text>
        </TouchableOpacity>
      </ScrollView>
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
