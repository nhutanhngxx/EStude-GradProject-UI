import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { AuthContext } from "../../contexts/AuthContext";
import { loadAssignmentsWithStatus } from "../../services/assignmentHelper";
import assignmentService from "../../services/assignmentService";
import subjectGradeService from "../../services/subjectGradeService";

export default function SubjectDetailScreen({ route, navigation }) {
  const { subject } = route.params;
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("Điểm");
  const [loading, setLoading] = useState(false);
  const [grade, setGrade] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const tabs = ["Điểm", "Điểm danh", "Bài tập", "Thông báo"];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === "Điểm") {
          // gọi API điểm
          const res =
            await subjectGradeService.getGradesOfStudentByClassSubject(
              user.userId,
              subject.classSubjectId
            );
          setGrade(res);
        } else if (activeTab === "Bài tập") {
          if (subject.clazz.classId) {
            const res = await loadAssignmentsWithStatus(
              user.userId,
              subject.clazz.classId,
              null,
              subject.subjectId
            );
            const assignmentsForThisClass = res.filter(
              (a) => a.classSubject?.classSubjectId === subject.classSubjectId
            );
            setAssignments(assignmentsForThisClass);
          }
        }
      } catch (e) {
        console.log("Load error:", e);
        if (activeTab === "Điểm") setGrade(null);
        if (activeTab === "Bài tập") setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab]);

  return (
    <View style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header môn học */}
        <View style={styles.headerCard}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <Text style={styles.description}> {subject.description} </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nội dung */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007bff"
            style={{ marginTop: 20 }}
          />
        ) : (
          <View style={styles.tabContent}>
            {activeTab === "Điểm" && (
              <View style={styles.cardContainer}>
                <Text style={styles.cardTitle}>Kết quả học tập</Text>

                <View style={styles.verticalTable}>
                  {/* Thường kỳ 1-3 */}
                  {(grade?.regularScores ?? ["-", "-", "-"]).map((v, i) => (
                    <View style={styles.row} key={`reg${i}`}>
                      <Text style={styles.rowLabel}>Thường kỳ {i + 1}</Text>
                      <Text style={styles.rowValue}>{v ?? "-"}</Text>
                    </View>
                  ))}

                  {/* Giữa kỳ */}
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Giữa kỳ</Text>
                    <Text style={styles.rowValue}>
                      {grade?.midtermScore ?? "-"}
                    </Text>
                  </View>

                  {/* Cuối kỳ */}
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Cuối kỳ</Text>
                    <Text style={styles.rowValue}>
                      {grade?.finalScore ?? "-"}
                    </Text>
                  </View>

                  {/* Điểm trung bình */}
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Điểm trung bình</Text>
                    <Text style={styles.rowValue}>
                      {grade?.actualAverage ?? "-"}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === "Bài tập" && (
              <View style={styles.cardContainer}>
                <Text style={styles.cardTitle}>Danh sách bài tập</Text>
                {assignments.length > 0 ? (
                  assignments.map((as) => (
                    <TouchableOpacity
                      key={as.assignmentId}
                      style={styles.assignmentItem}
                      onPress={() =>
                        navigation.navigate("ChiTietBaiTap", {
                          assignment: as,
                          isExam: activeTab === "Exams",
                          status: as.status || "Chưa nộp",
                          submissionId: as.submissionId || null,
                        })
                      }
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.assignmentTitle}>{as.title}</Text>
                        <Text style={styles.assignmentDeadline}>
                          Hạn nộp:{" "}
                          {new Date(as.dueDate).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.assignmentStatus,
                          as.status === "Đã nộp" ? styles.done : styles.pending,
                        ]}
                      >
                        {as.status}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Chưa có bài tập</Text>
                )}
              </View>
            )}

            {activeTab === "Thông báo" && (
              <View style={styles.cardContainer}>
                <Text style={styles.cardTitle}>Thông báo gần đây</Text>
                {notifications.length > 0 ? (
                  notifications.map((nt) => (
                    <View key={nt.notificationId} style={styles.recordCard}>
                      <Text>{new Date(nt.sentAt).toLocaleDateString()}</Text>
                      <Text>{nt.message}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Chưa có thông báo</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, padding: 16 },
  headerCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  subjectName: { fontSize: 20, fontWeight: "bold", color: "#333" },
  description: { fontSize: 13, color: "#555", marginTop: 2 },

  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
  },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: "center" },
  activeTab: { backgroundColor: "#007BFF" },
  tabText: { fontSize: 14, color: "#333" },
  activeTabText: { color: "#fff", fontWeight: "bold" },

  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },

  // Assignment list
  assignmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  assignmentTitle: { fontSize: 15, fontWeight: "500", color: "#333" },
  assignmentDeadline: { fontSize: 13, color: "#666", marginTop: 2 },
  assignmentStatus: { fontSize: 13, fontWeight: "bold" },
  done: { color: "#27ae60" },
  pending: { color: "#e74c3c" },

  // Records
  recordCard: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 12 },

  // Grade Table
  verticalTable: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#444" },
  rowValue: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
    color: "#000",
    fontWeight: "600",
  },
});
