import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ChiTietBaiTapScreen({ route, navigation }) {
  const { assignment } = route.params;
  console.log("Assignment detail:", assignment);

  const isQuiz = assignment.type === "QUIZ";

  return (
    <View style={styles.container}>
      {/* Tiêu đề */}
      <Text style={styles.title}>{assignment.title}</Text>

      {/* Hạn nộp */}
      <Text style={styles.info}>
        📅 Hạn nộp:{" "}
        {new Date(assignment.dueDate).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>

      {/* Trạng thái */}
      {/* <Text style={styles.info}>
        Trạng thái:{" "}
        <Text
          style={assignment.status === "Đã nộp" ? styles.done : styles.pending}
        >
          {assignment.status || "Chưa nộp"}
        </Text>
      </Text> */}

      {/* Loại bài tập */}
      <Text style={styles.info}>
        Loại bài tập:{" "}
        <Text style={styles.type}>{isQuiz ? "Trắc nghiệm" : "Tự luận"}</Text>
      </Text>

      {/* Nút hành động */}
      <View style={styles.actions}>
        {assignment.attachmentUrl && (
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Tải file</Text>
          </TouchableOpacity>
        )}
        {!isQuiz && (
          <>
            <TouchableOpacity style={styles.btn}>
              <Text style={styles.btnText}>Chụp ảnh</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[styles.btn, styles.submitBtn]}
          onPress={() => navigation.navigate("ExamDoing", { exam: assignment })}
        >
          <Text style={[styles.btnText, { color: "#fff" }]}>Làm bài</Text>
        </TouchableOpacity>
      </View>
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
  type: {
    fontWeight: "600",
    color: "#007BFF",
  },
  done: {
    color: "#27ae60",
    fontWeight: "bold",
  },
  pending: {
    color: "#e74c3c",
    fontWeight: "bold",
  },
  actions: {
    marginTop: 20,
  },
  btn: {
    backgroundColor: "#2ecc71",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  submitBtn: {
    backgroundColor: "#007BFF",
  },
  btnText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
