import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";

const mockExam = {
  id: "exam1",
  classSubject: { name: "Toán cao cấp" },
  title: "Bài kiểm tra giữa kỳ",
  duration: 15,
  questions: [
    {
      id: "q1",
      text: "1. Đạo hàm y=x^2?",
      options: ["2x", "x^2", "x", "2"],
      answer: ["2x"],
      multiSelect: false,
    },
    {
      id: "q2",
      text: "2. Tích phân ∫x dx?",
      options: ["x^2/2 + C", "x^3/3 + C", "2x + C", "ln(x) + C"],
      answer: ["x^2/2 + C"],
      multiSelect: false,
    },
    {
      id: "q3",
      text: "3. Chọn số nguyên tố?",
      options: ["2", "3", "4", "5"],
      answer: ["2", "3", "5"],
      multiSelect: true,
    },
  ],
};

const themeColors = {
  primary: "#2ecc71",
  secondary: "#27ae60",
  accent: "#FFD60A",
  background: "#fff",
  card: "#f9f9f9",
  text: "#333",
  subText: "#666",
};

export default function ExamDoingScreen({ navigation }) {
  const [timeLeft, setTimeLeft] = useState(mockExam.duration * 60);
  const [answers, setAnswers] = useState({});
  const [activeTab, setActiveTab] = useState("Doing"); // Doing | Overview

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

  // Chọn/xóa đáp án
  const handleSelect = (q, opt) => {
    setAnswers((prev) => {
      const prevAns = prev[q.id] || [];
      if (q.multiSelect) {
        if (prevAns.includes(opt))
          return { ...prev, [q.id]: prevAns.filter((o) => o !== opt) }; // xóa
        else return { ...prev, [q.id]: [...prevAns, opt] };
      } else {
        if (prevAns.includes(opt)) return { ...prev, [q.id]: [] }; // xóa lựa chọn đơn
        return { ...prev, [q.id]: [opt] };
      }
    });
  };

  const handleSubmit = () => {
    let correct = 0;
    mockExam.questions.forEach((q) => {
      const userAns = answers[q.id] || [];
      const correctAns = q.answer;
      if (
        userAns.length === correctAns.length &&
        userAns.every((a) => correctAns.includes(a))
      )
        correct++;
    });
    const score = ((correct / mockExam.questions.length) * 10).toFixed(2);
    Alert.alert(
      "Nộp bài",
      `Đúng ${correct}/${mockExam.questions.length} câu.\nĐiểm: ${score}`,
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.subject}>{mockExam.classSubject.name}</Text>
        <Text style={styles.examTitle}>{mockExam.title}</Text>
        <Text style={styles.timer}>⏰ {formatTime(timeLeft)}</Text>
      </View>

      {/* Tab */}
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
        <ScrollView style={{ flex: 1 }}>
          {mockExam.questions.map((q) => (
            <View key={q.id} style={styles.questionBlock}>
              <Text style={styles.questionText}>
                {q.text} {q.multiSelect && "(Chọn nhiều)"}
              </Text>
              {q.options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.option,
                    answers[q.id]?.includes(opt) && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(q, opt)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      answers[q.id]?.includes(opt) && styles.optionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1, padding: 12 }}>
          {mockExam.questions.map((q) => {
            const isAnswered = answers[q.id]?.length;
            return (
              <View
                key={q.id}
                style={[
                  styles.questionBlock,
                  {
                    backgroundColor: isAnswered ? "#a3d9a5" : "#eee",
                  },
                ]}
              >
                <Text style={{ fontWeight: "600", color: "#000" }}>
                  {q.text}
                </Text>
                <Text style={{ marginTop: 4, color: "#333" }}>
                  {isAnswered
                    ? "Đã chọn: " + answers[q.id].join(", ")
                    : "Bạn chưa có đáp án nào."}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={() =>
          Alert.alert("Xác nhận", "Bạn có chắc chắn muốn nộp bài?", [
            { text: "Hủy", style: "cancel" },
            { text: "Nộp", onPress: handleSubmit },
          ])
        }
      >
        <Text style={styles.submitText}>Nộp bài</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  header: {
    padding: 16,
    backgroundColor: themeColors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  subject: { fontSize: 16, fontWeight: "600", color: "#fff" },
  examTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginTop: 4 },
  timer: {
    fontSize: 16,
    fontWeight: "bold",
    color: themeColors.accent,
    marginTop: 6,
  },

  tabRow: { flexDirection: "row", marginVertical: 8 },
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
    marginBottom: 10,
    backgroundColor: themeColors.card,
    borderRadius: 10,
    elevation: 2,
  },
  questionText: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
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
  optionText: { fontSize: 14, color: themeColors.text },
  optionTextSelected: { color: "#fff", fontWeight: "bold" },

  submitBtn: {
    backgroundColor: themeColors.secondary,
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    margin: 16,
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
