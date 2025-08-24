import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ChiTietBaiTapScreen({ route }) {
  const { assignment } = route.params;

  return (
    <View style={styles.container}>
      {/* Tiêu đề: Môn học - Bài tập */}
      <Text style={styles.title}>
        {assignment.classSubject.name} - {assignment.title}
      </Text>
      <Text style={styles.deadline}>Hạn nộp: {assignment.deadline}</Text>
      <Text
        style={[
          styles.status,
          assignment.status === "Đã nộp" ? styles.done : styles.pending,
        ]}
      >
        Trạng thái: {assignment.status}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn}>
          <Text style={styles.btnText}>Tải file</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn}>
          <Text style={styles.btnText}>Chụp ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.submitBtn]}>
          <Text style={[styles.btnText, { color: "#fff" }]}>Nộp bài</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  deadline: { fontSize: 14, color: "#666", marginBottom: 6 },
  status: { fontSize: 14, marginBottom: 20 },
  done: { color: "#27ae60" },
  pending: { color: "#e74c3c" },
  actions: { marginTop: 20 },
  btn: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  submitBtn: { backgroundColor: "#007AFF" },
  btnText: { fontSize: 16, color: "#000" },
});
