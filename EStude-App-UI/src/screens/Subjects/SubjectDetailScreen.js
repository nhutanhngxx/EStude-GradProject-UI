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
import attendanceService from "../../services/attandanceService";
import { useToast } from "../../contexts/ToastContext";

export default function SubjectDetailScreen({ route, navigation }) {
  const { subject, tab } = route.params;
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  // console.log("subject:", subject);

  // const [activeTab, setActiveTab] = useState("Điểm");
  const [activeTab, setActiveTab] = useState(tab || "Điểm");
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
        } else if (activeTab === "Điểm danh") {
          const res =
            await attendanceService.getAttentanceSessionByClassSubjectForStudent(
              subject.classSubjectId,
              user.userId
            );
          setAttendance(res || []);
        }
      } catch (e) {
        console.log("Load error:", e);
        if (activeTab === "Điểm") setGrade(null);
        if (activeTab === "Bài tập") setAssignments([]);
        if (activeTab === "Điểm danh") setAttendance([]);
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

          {/* Thêm dữ liệu lớp học */}
          <View style={styles.classInfo}>
            {/* <Text style={styles.description}>{subject.description}</Text> */}
            {/* <Text style={styles.classText}>Lớp: {subject.clazz?.name}</Text> */}
            <Text style={styles.classText}>{subject.clazz?.term}</Text>
            <Text style={styles.classText}>
              {subject.teacherName || "Chưa có"}
            </Text>
            {/* <Text style={styles.classText}>
              Thời gian:{" "}
              {new Date(subject.clazz?.beginDate).toLocaleDateString("vi-VN")} →{" "}
              {new Date(subject.clazz?.endDate).toLocaleDateString("vi-VN")}
            </Text> */}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                index === 0 && styles.firstTab,
                index === tabs.length - 1 && styles.lastTab,
                activeTab === tab && styles.activeTab,
              ]}
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
            color="#2ecc71"
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
                    <View
                      style={[
                        styles.row,
                        i % 2 === 0 ? styles.rowEven : styles.rowOdd,
                        i === (grade?.regularScores?.length ?? 3) - 1 && {
                          borderBottomWidth: 1,
                        },
                      ]}
                      key={`reg${i}`}
                    >
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

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Học lực</Text>
                    <Text style={styles.rowValue}>{"-"}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Xếp loại</Text>
                    <Text style={styles.rowValue}>{"-"}</Text>
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

            {activeTab === "Điểm danh" && (
              <View style={styles.cardContainer}>
                <Text style={styles.cardTitle}>Danh sách phiên điểm danh</Text>
                {attendance.length > 0 ? (
                  attendance.map((ses) => {
                    const now = new Date();
                    const startTime = new Date(ses.startTime);
                    const endTime = new Date(ses.endTime);
                    const canMark =
                      now >= startTime && now <= endTime && !ses.status;

                    return (
                      <View key={ses.sessionId} style={styles.recordCard}>
                        {/* Cột trái: thông tin */}
                        <View style={styles.recordInfo}>
                          <Text style={styles.sessionName}>
                            {ses.sessionName}
                          </Text>
                          <Text style={styles.sessionTime}>
                            Thời gian:{" "}
                            {startTime.toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            →{" "}
                            {endTime.toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>

                        {/* Cột phải: trạng thái / nút */}
                        <View style={styles.recordActions}>
                          {!ses.status ? (
                            <TouchableOpacity
                              style={[
                                styles.attendanceButton,
                                !canMark && { backgroundColor: "#ccc" }, // disable màu xám
                              ]}
                              disabled={!canMark}
                              onPress={async () => {
                                const res =
                                  await attendanceService.markAttendance(
                                    ses.sessionId,
                                    user.userId,
                                    "BUTTON_PRESS"
                                  );
                                if (res) {
                                  const updated =
                                    await attendanceService.getAttentanceSessionByClassSubjectForStudent(
                                      subject.classSubjectId,
                                      user.userId
                                    );
                                  setAttendance(updated || []);
                                }
                              }}
                            >
                              <Text style={styles.attendanceButtonText}>
                                {canMark ? "ĐIỂM DANH" : "CHƯA MỞ"}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <Text
                              style={[
                                styles.statusText,
                                ses.status === "PRESENT"
                                  ? { color: "#27ae60" }
                                  : ses.status === "ABSENT"
                                  ? { color: "#e74c3c" }
                                  : ses.status === "LATE"
                                  ? { color: "#f39c12" }
                                  : { color: "#999" },
                              ]}
                            >
                              {ses.status === "PRESENT"
                                ? "CÓ MẶT"
                                : ses.status === "ABSENT"
                                ? "VẮNG"
                                : ses.status === "LATE"
                                ? "TRỄ"
                                : "Chưa điểm danh"}
                            </Text>
                          )}

                          <TouchableOpacity
                            onPress={() => {
                              showToast("Chức năng đang phát triển", "info");
                            }}
                          >
                            <Text style={styles.detailLink}>Xem chi tiết</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>Chưa có phiên điểm danh</Text>
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
  activeTab: { backgroundColor: "#27ae60" },
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

  recordCard: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 12 },

  verticalTable: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  rowEven: { backgroundColor: "#fafafa" },
  rowOdd: { backgroundColor: "#fff" },

  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },

  rowValue: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
    color: "#2e7d32",
    fontWeight: "600",
  },
  classInfo: {
    marginTop: 10,
    gap: 5,
  },
  classText: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },

  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  firstTab: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  lastTab: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },

  attendanceButton: {
    marginTop: 8,
    backgroundColor: "#2e7d32",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  attendanceButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  recordCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  recordInfo: {
    flex: 1,
    marginRight: 12,
    gap: 5,
  },

  sessionName: {
    fontWeight: "600",
    color: "#2e7d32",
    fontSize: 16,
  },

  sessionTime: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },

  recordActions: {
    alignItems: "flex-end",
  },

  attendanceButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },

  attendanceButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  statusText: {
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
  },

  detailLink: {
    color: "#2e7d32",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
