import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { AuthContext } from "../../contexts/AuthContext";
import submissionService from "../../services/submissionService";

export default function ChiTietBaiTapScreen({ route, navigation }) {
  const { assignment, isExam, status: initialStatus } = route.params;
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState(initialStatus || "Chưa nộp");
  const [loading, setLoading] = useState(!initialStatus);
  const [isOverdue, setIsOverdue] = useState(false);
  const isQuiz = assignment.type === "QUIZ";

  useEffect(() => {
    if (initialStatus) return;

    const fetchStatus = async () => {
      setLoading(true);
      try {
        const res =
          await submissionService.getSubmissionByStudentIdAndAssignmentId(
            user.userId,
            assignment.assignmentId
          );
        const submission = Array.isArray(res) ? res[0] : res;
        const currentStatus =
          submission?.status === "SUBMITTED" ? "Đã nộp" : "Chưa nộp";
        setStatus(currentStatus);
      } catch (error) {
        console.error("Lỗi khi lấy trạng thái bài nộp:", error);
        setStatus("Chưa nộp");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [assignment, user, initialStatus]);

  useEffect(() => {
    // Kiểm tra quá hạn
    if (assignment.dueDate) {
      const now = new Date();
      const due = new Date(assignment.dueDate);
      setIsOverdue(due < now);
    }
  }, [assignment.dueDate]);

  // Xác định nút làm bài
  const canSubmit =
    status !== "Đã nộp" && (!isOverdue || assignment.allowLateSubmission);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{assignment.title}</Text>

      <Text style={styles.info}>
        {isExam ? "📅 Ngày thi: " : "📅 Hạn nộp: "}
        {new Date(assignment.dueDate).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>

      <Text style={styles.info}>
        Trạng thái:{" "}
        {loading ? (
          <ActivityIndicator size="small" color="#007BFF" />
        ) : (
          <Text style={status === "Đã nộp" ? styles.done : styles.pending}>
            {status}
          </Text>
        )}
      </Text>

      {isOverdue && (
        <Text style={[styles.info, styles.overdue]}>
          Quá hạn {assignment.allowLateSubmission ? "⚠️" : "❌"}
        </Text>
      )}

      <Text style={styles.info}>
        Loại bài tập:{" "}
        <Text style={styles.type}>{isQuiz ? "Trắc nghiệm" : "Tự luận"}</Text>
      </Text>

      <View style={styles.actions}>
        {assignment.attachmentUrl && (
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Tải file</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.btn,
            styles.submitBtn,
            !canSubmit && styles.disabledBtn,
          ]}
          onPress={() => navigation.navigate("ExamDoing", { exam: assignment })}
          disabled={!canSubmit}
        >
          <Text style={[styles.btnText, { color: "#fff" }]}>
            {status === "Đã nộp"
              ? "Đã nộp"
              : !canSubmit
              ? "Không thể nộp"
              : "Làm bài"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#2c3e50",
  },
  info: { fontSize: 14, marginBottom: 6, color: "#444" },
  type: { fontWeight: "600", color: "#007BFF" },
  done: { color: "#27ae60", fontWeight: "bold" },
  pending: { color: "#e74c3c", fontWeight: "bold" },
  overdue: { color: "#e74c3c", fontWeight: "bold" },
  actions: { marginTop: 20 },
  btn: {
    backgroundColor: "#2ecc71",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  submitBtn: { backgroundColor: "#007BFF" },
  disabledBtn: { backgroundColor: "#999" },
  btnText: { fontSize: 16, color: "#fff", fontWeight: "600" },
});
