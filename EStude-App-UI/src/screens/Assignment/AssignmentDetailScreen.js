import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { AuthContext } from "../../contexts/AuthContext";
import submissionService from "../../services/submissionService";
import assignmentService from "../../services/assignmentService";

export default function ChiTietBaiTapScreen({ route, navigation }) {
  const { assignment: initialAssignment, isExam } = route.params;
  const [assignmentDetail, setAssignmentDetail] = useState(assignment);
  const { user } = useContext(AuthContext);

  const assignment = assignmentDetail || initialAssignment;

  // console.log("assignment:", assignment);

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [isOverdue, setIsOverdue] = useState(false);
  const isQuiz = assignment.type === "QUIZ";

  // useEffect lấy thông tin đầy đủ của assignment
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await assignmentService.getAssignmentById(
          assignment.assignmentId
        );
        // console.log("assignmentDetail:", res.data);
        if (res) {
          setAssignmentDetail(res.data);
        }
      } catch (err) {
        // console.error("Lỗi khi lấy thông tin bài tập:", err);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [initialAssignment]);

  // Load submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const res =
          await submissionService.getSubmissionByStudentIdAndAssignmentId(
            user.userId,
            assignment.assignmentId
          );
        setSubmissions(Array.isArray(res) ? res : res ? [res] : []);
      } catch (error) {
        console.error("Lỗi khi lấy submissions:", error);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [assignment, user]);

  // Kiểm tra quá hạn
  useEffect(() => {
    if (assignment.dueDate) {
      const now = new Date();
      const due = new Date(assignment.dueDate);
      setIsOverdue(due < now);
    }
  }, [assignment.dueDate]);

  const lastSubmission = submissions[0];
  const hasSubmitted = submissions.length > 0;

  // Kiểm tra số lần làm bài để cho phép học sinh làm bài
  const canSubmit =
    (!isOverdue || assignment.allowLateSubmission) && // Điều kiện: Chưa quá hạn hoặc cho phép nộp muộn
    (assignment.submissionLimit == null ||
      submissions.length < assignment.submissionLimit); // Điều kiện: Chưa vượt số lượt nộp

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{assignment.title}</Text>
      <Text style={styles.info}>
        {isExam ? "Ngày thi: " : "Hạn nộp: "}
        {new Date(assignment.dueDate).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
      <Text style={styles.info}>
        <Text style={styles.type}>{isQuiz ? "TRẮC NGHIỆM" : "TỰ LUẬN"}</Text>
      </Text>
      <Text style={styles.info}>
        Số lần nộp còn lại:{" "}
        <Text style={{ fontWeight: "bold", corlor: "#2e7d32" }}>
          {assignment.submissionLimit
            ? Math.max(assignment.submissionLimit - submissions.length, 0)
            : "Không giới hạn"}
        </Text>
      </Text>
      {/* Submissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bài nộp của bạn</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2ecc71" />
        ) : submissions.length === 0 ? (
          <Text style={styles.empty}>Chưa có bài nộp nào</Text>
        ) : (
          submissions.map((sub, index) => (
            <View
              key={sub.submissionId || index}
              style={styles.submissionCardRow}
            >
              {/* Cột trái: thông tin submission */}
              <View style={styles.submissionInfo}>
                <Text
                  style={(styles.subText, { fontWeight: "bold", fontSize: 18 })}
                >
                  LẦN NỘP {index + 1}
                </Text>
                <Text style={styles.subText}>
                  Ngày nộp:{" "}
                  {new Date(sub.submittedAt).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              {/* Cột phải: trạng thái + nút */}
              <View style={styles.submissionActions}>
                {/* <Text
                  style={[
                    styles.subStatus,
                    sub.status === "SUBMITTED" ? styles.done : styles.pending,
                  ]}
                >
                  {sub.status === "SUBMITTED" ? "ĐÃ NỘP" : "CHƯA NỘP"}
                </Text> */}
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("ExamReview", {
                      submissionId: sub.submissionId,
                    })
                  }
                >
                  <Text style={styles.detailLink}>Xem chi tiết</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Nút làm bài */}
      {submissions.length < (assignment.submissionLimit ?? Infinity) && (
        <TouchableOpacity
          style={[
            styles.btn,
            styles.submitBtn,
            !canSubmit && styles.disabledBtn,
          ]}
          onPress={() =>
            navigation.navigate("ExamDoing", {
              exam: assignment,
              submitted: false,
            })
          }
          disabled={!canSubmit}
        >
          <Text style={styles.btnText}>
            {!canSubmit ? "Quá hạn" : "Làm bài"}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
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

  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },

  empty: { fontSize: 14, color: "#888", fontStyle: "italic" },

  submissionCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  subText: { fontSize: 14, color: "#333" },
  subStatus: { fontSize: 14, marginTop: 4 },
  subScore: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  done: { color: "#27ae60", fontWeight: "bold" },
  pending: { color: "#e74c3c", fontWeight: "bold" },

  btn: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitBtn: { backgroundColor: "#27ae60" },
  disabledBtn: { backgroundColor: "#999" },
  btnText: { fontSize: 16, color: "#fff", fontWeight: "600" },

  detailBtn: {
    marginTop: 8,
    backgroundColor: "#2e7d32",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  submissionCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  submissionInfo: {
    flex: 1,
    gap: 5,
  },

  submissionActions: {
    alignItems: "flex-end",
  },

  detailLink: {
    color: "#2e7d32",
    fontSize: 13,
    textDecorationLine: "underline",
    marginTop: 6,
  },
});
