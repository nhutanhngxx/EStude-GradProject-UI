import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ExamDetailScreen({ route, navigation }) {
  const { exam } = route.params;

  return (
    <View style={styles.container}>
      {/* Tiêu đề: Môn học - Bài thi */}
      <Text style={styles.title}>
        {exam.classSubject.name} - {exam.title}
      </Text>

      <Text style={styles.info}>📅 Ngày thi: {exam.date}</Text>
      <Text style={styles.info}>⏱ Thời lượng: {exam.duration}</Text>
      <Text style={styles.info}>❓ Số câu hỏi: {exam.questions}</Text>

      <Text style={styles.status}>
        Trạng thái:{" "}
        <Text style={exam.status === "Đã nộp" ? styles.done : styles.pending}>
          {exam.status}
        </Text>
      </Text>

      {exam.status === "Chưa làm" && (
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate("ExamDoing", { exam })}
        >
          <Text style={styles.startText}>Bắt đầu làm bài</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#2c3e50",
  },
  info: {
    fontSize: 14,
    marginBottom: 6,
    color: "#444",
  },
  status: {
    fontSize: 16,
    marginTop: 10,
  },
  done: {
    color: "#27ae60",
    fontWeight: "bold",
  },
  pending: {
    color: "#e74c3c",
    fontWeight: "bold",
  },
  startBtn: {
    backgroundColor: "#2ecc71",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  startText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
