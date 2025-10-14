import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { AuthContext } from "../../contexts/AuthContext";
import { loadAssignmentsWithStatus } from "../../services/assignmentHelper";
import assignmentService from "../../services/assignmentService";
import subjectGradeService from "../../services/subjectGradeService";
import attendanceService from "../../services/attandanceService";
import { useToast } from "../../contexts/ToastContext";
import { useSocket } from "../../contexts/SocketContext";

const formatDate = (dateString) => {
  const d = new Date(dateString);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function SubjectDetailScreen({ route, navigation }) {
  const { subject, tab } = route.params;
  const { user } = useContext(AuthContext);
  const socket = useSocket();
  const { showToast } = useToast();

  console.log("subject:", subject);

  const [activeTab, setActiveTab] = useState(tab || "Điểm");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [grade, setGrade] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const tabs = ["Điểm", "Điểm danh", "Bài tập"];

  useEffect(() => {
    if (subject?.name) {
      navigation.setOptions({
        title: `${subject.name.toUpperCase()}`,
      });
    }
  }, [subject, navigation]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "Điểm") {
        const res = await subjectGradeService.getGradesOfStudentByClassSubject(
          user.userId,
          subject.classSubjectId
        );
        setGrade(res);
      } else if (activeTab === "Bài tập") {
        if (subject.classId) {
          const res = await loadAssignmentsWithStatus(
            user.userId,
            null,
            null,
            subject.classSubjectId
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
      showToast("Lỗi khi tải dữ liệu!", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (!socket || !subject?.classSubjectId || !user?.userId) return;

    const handleNewSession = async (msg) => {
      console.log("📩 Received session event:", msg);
      try {
        setLoading(true);
        const res =
          await attendanceService.getAttentanceSessionByClassSubjectForStudent(
            subject.classSubjectId,
            user.userId
          );
        setAttendance(res || []);
        showToast(`Phiên điểm danh mới: ${msg.sessionName || "Không tên"}`, {
          type: "success",
        });
      } catch (e) {
        console.error("Failed to load attendance:", e);
        showToast("Lỗi khi cập nhật danh sách điểm danh!", { type: "error" });
      } finally {
        setLoading(false);
      }
    };

    const handleNewAssignment = async (msg) => {
      console.log("📩 Received assignment event:", msg);
      try {
        setLoading(true);
        const res = await loadAssignmentsWithStatus(
          user.userId,
          null,
          null,
          subject.classSubjectId
        );
        setAssignments(res || []);
        showToast(`Bài tập mới: ${msg.title || "Không tên"}`, {
          type: "success",
        });
      } catch (e) {
        console.error("Failed to load assignments:", e);
        showToast("Lỗi khi cập nhật danh sách bài tập!", { type: "error" });
      } finally {
        setLoading(false);
      }
    };

    const subscription = socket.subscribe(
      `/topic/class/${subject.classSubjectId}/sessions`,
      handleNewSession
    );

    const assignmentSubscription = socket.subscribe(
      `/topic/class/${subject.classSubjectId}/assignments`,
      handleNewAssignment
    );

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
        console.log(
          `🛑 Unsubscribed from /topic/class/${subject.classSubjectId}/sessions`
        );
      }
      if (assignmentSubscription?.unsubscribe) {
        assignmentSubscription.unsubscribe();
        console.log(
          `🛑 Unsubscribed from /topic/class/${subject.classSubjectId}/assignments`
        );
      }
      socket.unsubscribe(`/topic/class/${subject.classSubjectId}/sessions`);
      socket.unsubscribe(`/topic/class/${subject.classSubjectId}/assignments`);
    };
  }, [socket, subject?.classSubjectId, user?.userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      showToast("Dữ liệu đã được làm mới!", { type: "success" });
    } catch (e) {
      console.error("Refresh error:", e);
      showToast("Lỗi khi làm mới dữ liệu!", { type: "error" });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2ecc71"]}
            tintColor={"#2ecc71"}
          />
        }
      >
        {/* Header môn học */}
        <View style={styles.headerCard}>
          <View style={styles.classInfo}>
            <Text style={styles.classText}>
              {subject.teacherName || "Chưa có"}
            </Text>
            <Text style={styles.classText}>{subject.semester}</Text>
            <Text style={styles.deadline}>
              Thời gian bắt đầu: {formatDate(subject.beginDate)}
            </Text>
            <Text style={styles.deadline}>
              Thời gian kết thúc: {formatDate(subject.endDate)}
            </Text>
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
              <View>
                <View style={styles.tableContainer}>
                  {/* Header */}
                  <View style={styles.tableHeader}>
                    <View style={{ flex: 2, paddingHorizontal: 8 }}>
                      <Text style={styles.tableHeaderText}></Text>
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 8 }}>
                      <Text
                        style={[styles.tableHeaderText, { textAlign: "right" }]}
                      >
                        Điểm số
                      </Text>
                    </View>
                  </View>

                  {/* Thường kỳ */}
                  {(grade?.regularScores ?? ["-", "-", "-"]).map((v, i) => (
                    <View key={`reg${i}`} style={styles.tableRow}>
                      <View style={{ flex: 2, paddingHorizontal: 8 }}>
                        <Text style={styles.tableCellText}>
                          Thường kỳ {i + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1, paddingHorizontal: 8 }}>
                        <Text
                          style={[
                            styles.tableCellText,
                            {
                              textAlign: "right",
                              color: v ? "#27ae60" : "#999",
                            },
                          ]}
                        >
                          {v ?? "-"}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* Giữa kỳ */}
                  <View style={styles.tableRow}>
                    <View style={{ flex: 2, paddingHorizontal: 8 }}>
                      <Text style={styles.tableCellText}>Giữa kỳ</Text>
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 8 }}>
                      <Text
                        style={[
                          styles.tableCellText,
                          {
                            textAlign: "right",
                            color: grade?.midtermScore ? "#27ae60" : "#999",
                          },
                        ]}
                      >
                        {grade?.midtermScore ?? "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Cuối kỳ */}
                  <View style={styles.tableRow}>
                    <View style={{ flex: 2, paddingHorizontal: 8 }}>
                      <Text style={styles.tableCellText}>Cuối kỳ</Text>
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 8 }}>
                      <Text
                        style={[
                          styles.tableCellText,
                          {
                            textAlign: "right",
                            color: grade?.finalScore ? "#27ae60" : "#999",
                          },
                        ]}
                      >
                        {grade?.finalScore ?? "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Trung bình */}
                  <View style={styles.tableRow}>
                    <View style={{ flex: 2, paddingHorizontal: 8 }}>
                      <Text style={styles.tableCellText}>Điểm trung bình</Text>
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 8 }}>
                      <Text
                        style={[
                          styles.tableCellText,
                          {
                            textAlign: "right",
                            color: grade?.actualAverage ? "#27ae60" : "#999",
                          },
                        ]}
                      >
                        {grade?.actualAverage ?? "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Học lực */}
                  <View style={styles.tableRow}>
                    <View style={{ flex: 2, paddingHorizontal: 8 }}>
                      <Text style={styles.tableCellText}>Học lực</Text>
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 8 }}>
                      <Text
                        style={[
                          styles.tableCellText,
                          { textAlign: "right", color: "#555" },
                        ]}
                      >
                        {grade?.rank ?? "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Xếp loại */}
                  <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 2, paddingHorizontal: 8 }}>
                      <Text style={styles.tableCellText}>Xếp loại</Text>
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 8 }}>
                      <Text
                        style={[
                          styles.tableCellText,
                          { textAlign: "right", color: "#555" },
                        ]}
                      >
                        {grade?.conduct ?? "-"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {activeTab === "Bài tập" && (
              <View>
                {assignments.length > 0 ? (
                  [...assignments]
                    .sort(
                      (a, b) =>
                        new Date(b.dueDate).getTime() -
                        new Date(a.dueDate).getTime()
                    )
                    .map((as) => (
                      <TouchableOpacity
                        key={as.assignmentId}
                        style={styles.recordCard}
                        activeOpacity={0.8}
                        onPress={() =>
                          navigation.navigate("ChiTietBaiTap", {
                            assignment: as,
                            isExam: activeTab === "Exams",
                            status: as.status || "Chưa nộp",
                            submissionId: as.submissionId || null,
                          })
                        }
                      >
                        <View style={styles.recordInfo}>
                          <Text style={styles.sessionName}>{as.title}</Text>
                          <Text style={styles.sessionTime}>
                            Hạn nộp:{" "}
                            {new Date(as.dueDate).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>

                        <View style={styles.recordActions}>
                          <Text
                            style={[
                              styles.statusText,
                              as.status === "Đã nộp"
                                ? { color: "#27ae60" }
                                : { color: "#e74c3c" },
                            ]}
                          >
                            {as.status || "Chưa nộp"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                ) : (
                  <Text style={styles.emptyText}>Chưa có bài tập</Text>
                )}
              </View>
            )}

            {activeTab === "Điểm danh" && (
              <View>
                {attendance.length > 0 ? (
                  [...attendance]
                    .sort(
                      (a, b) =>
                        new Date(b.startTime).getTime() -
                        new Date(a.startTime).getTime()
                    )
                    .map((ses) => {
                      const now = new Date();
                      const startTime = new Date(ses.startTime);
                      const endTime = new Date(ses.endTime);
                      const canMark =
                        now.getTime() >= startTime.getTime() && !ses.status;

                      return (
                        <TouchableOpacity
                          key={ses.sessionId}
                          style={styles.recordCard}
                          activeOpacity={0.8}
                          onPress={() =>
                            navigation.navigate("AttendanceDetail", {
                              session: ses,
                              subject: subject,
                              userId: user.userId,
                            })
                          }
                        >
                          {/* Cột trái: thông tin */}
                          <View style={styles.recordInfo}>
                            <Text style={styles.sessionName}>
                              {ses.sessionName}
                            </Text>
                            <Text style={styles.sessionTime}>
                              Bắt đầu:{" "}
                              {startTime.toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                            <Text style={styles.sessionTime}>
                              Kết thúc:{" "}
                              {endTime.toLocaleString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </View>

                          {/* Cột phải: trạng thái hoặc nút điểm danh */}
                          <View style={styles.recordActions}>
                            {!ses.status ? (
                              <TouchableOpacity
                                style={[
                                  styles.attendanceButton,
                                  !canMark && { backgroundColor: "#ccc" },
                                ]}
                                disabled={!canMark}
                                onPress={async (e) => {
                                  e.stopPropagation();
                                  try {
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
                                      showToast(
                                        "Bạn đã điểm danh thành công!",
                                        {
                                          type: "success",
                                        }
                                      );
                                    } else {
                                      showToast("Điểm danh thất bại!", {
                                        type: "error",
                                      });
                                    }
                                  } catch (error) {
                                    showToast("Có lỗi xảy ra khi điểm danh!", {
                                      type: "error",
                                    });
                                    console.error(error);
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
                          </View>
                        </TouchableOpacity>
                      );
                    })
                ) : (
                  <Text style={styles.emptyText}>Chưa có phiên điểm danh</Text>
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
  classInfo: {
    gap: 5,
  },
  classText: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  deadline: {
    fontSize: 12,
    color: "#888",
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
  activeTab: { backgroundColor: "#27ae60" },
  tabText: { fontSize: 14, color: "#333" },
  activeTabText: { color: "#fff", fontWeight: "bold" },
  tabContent: {
    flex: 1,
    minHeight: "77%",
  },
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
    flex: 1,
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
  emptyText: { textAlign: "center", color: "#999", marginTop: 12 },
  verticalTable: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
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
    fontWeight: "500",
    color: "#333",
  },
  rowValue: {
    flex: 1,
    textAlign: "right",
    color: "#2e7d32",
    fontWeight: "600",
  },
  recordInfo: {
    flex: 1,
    marginRight: 12,
    gap: 5,
  },
  sessionName: {
    fontWeight: "bold",
    color: "#2e7d32",
  },
  sessionTime: {
    fontSize: 12,
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
  semesterSection: {
    marginBottom: 20,
  },
  semesterLabel: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    alignItems: "center",
  },
  tableHeaderText: {
    fontWeight: "bold",
    color: "#333",
  },
  tableCellText: {
    color: "#555",
  },
  detailView: {
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  detailColumn: {
    flex: 1,
    flexDirection: "column",
    paddingRight: 8,
  },
  regularScoresContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  regularLabel: {
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
    textAlign: "center",
    alignSelf: "center",
    width: 80,
  },
  scoresGrid: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    gap: 10,
  },
  scoreBox: {
    borderRadius: 6,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontWeight: "500",
    color: "#555",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  rowEven: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  label: {
    color: "#333",
    flex: 1,
  },
  value: {
    color: "#555",
    textAlign: "right",
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#27ae60",
  },
});
