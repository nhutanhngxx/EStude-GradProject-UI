import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";

const themeColors = {
  primary: "#2ecc71",
  secondary: "#27ae60",
  accent: "#FFD60A",
  background: "#fff",
  card: "#f9f9f9",
  text: "#333",
};

export default function ExamDoingScreen({ navigation, route }) {
  const { exam } = route.params;
  const [timeLeft, setTimeLeft] = useState(exam.timeLimit * 60 || 15 * 60);
  const [answers, setAnswers] = useState({});
  const [activeTab, setActiveTab] = useState("Doing");

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${s % 60 < 10 ? "0" : ""}${s % 60}`;

  const handleSelect = (q, opt) => {
    setAnswers((prev) => {
      const prevAns = prev[q.questionId] || [];
      const multi = q.answers && q.answers.length > 1;
      if (multi) {
        if (prevAns.includes(opt))
          return {
            ...prev,
            [q.questionId]: prevAns.filter((o) => o !== opt),
          };
        else
          return {
            ...prev,
            [q.questionId]: [...prevAns, opt],
          };
      } else {
        return {
          ...prev,
          [q.questionId]: [opt],
        };
      }
    });
  };

  const handleSubmit = () => {
    Alert.alert("Nộp bài", "Bài thi đã nộp!", [
      {
        text: "OK",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.subject}> {exam.classSubject.clazz.name} </Text>
        <Text style={styles.examTitle}> {exam.title} </Text>
        <Text style={styles.timer}> ⏰ {formatTime(timeLeft)} </Text>
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
      {activeTab === "Doing" ? (
        <ScrollView
          style={{
            flex: 1,
          }}
        >
          {exam.questions.map((q) => (
            <View key={q.questionId} style={styles.questionBlock}>
              <Text style={styles.questionText}>
                {q.questionText} {q.answers.length > 1 && "(Chọn nhiều)"}
              </Text>
              {q.options.map((opt) => (
                <TouchableOpacity
                  key={opt.optionId}
                  style={[
                    styles.option,
                    answers[q.questionId]?.includes(opt.optionText) &&
                      styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(q, opt.optionText)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      answers[q.questionId]?.includes(opt.optionText) &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {opt.optionText}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={{
            flex: 1,
            padding: 12,
          }}
        >
          {exam.questions.map((q) => {
            const isAnswered = answers[q.questionId]?.length;
            return (
              <View
                key={q.questionId}
                style={[
                  styles.questionBlock,
                  {
                    backgroundColor: isAnswered ? "#a3d9a5" : "#eee",
                  },
                ]}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    color: "#000",
                  }}
                >
                  {q.questionText}
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    color: "#333",
                  }}
                >
                  {isAnswered
                    ? "Đã chọn: " + answers[q.questionId].join(", ")
                    : "Bạn chưa có đáp án nào."}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={() =>
          Alert.alert("Xác nhận", "Bạn có chắc chắn muốn nộp bài?", [
            {
              text: "Hủy",
              style: "cancel",
            },
            {
              text: "Nộp",
              onPress: handleSubmit,
            },
          ])
        }
      >
        <Text style={styles.submitText}> Nộp bài </Text>
      </TouchableOpacity>
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
    backgroundColor: themeColors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  subject: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  examTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginTop: 4,
  },
  timer: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 6,
    textAlign: "right",
  },

  tabRow: {
    flexDirection: "row",
    marginVertical: 8,
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
    marginBottom: 10,
    backgroundColor: themeColors.card,
    borderRadius: 10,
    elevation: 2,
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 8,
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

  submitBtn: {
    backgroundColor: themeColors.secondary,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    margin: 16,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
