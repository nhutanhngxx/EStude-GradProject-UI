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
import assignmentService from "../../services/assignmentService";

// import gradeService from "../../services/gradeService";
// import attendanceService from "../../services/attendanceService";
// import notificationService from "../../services/notificationService";

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
        if (activeTab === "Bài tập") {
          const classId = subject.classSubjects?.[0]?.class?.classId;
          if (classId) {
            const res = await assignmentService.getAssignmentsByClass(classId);
            setAssignments(res);
          }
        }
      } catch (e) {
        console.log("Load error:", e);
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
        contentContainerStyle={{
          paddingBottom: 24,
        }}
      >
        {/* Header môn học */}
        <View style={styles.headerCard}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <Text style={styles.description}> {subject.description} </Text>
        </View>
        {/* Tab row */}
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
            style={{
              marginTop: 20,
            }}
          />
        ) : (
          <View style={styles.tabContent}>
            {activeTab === "Điểm" && (
              <View style={styles.cardContainer}>
                <Text style={styles.cardTitle}> Kết quả học tập </Text>
                {grade ? (
                  <>
                    <Text> Giữa kỳ: {grade.midtermScore} </Text>
                    <Text> Cuối kỳ: {grade.finalScore} </Text>
                    <Text> Tổng kết: {grade.actualAverage} </Text>
                  </>
                ) : (
                  <Text style={styles.emptyText}> Chưa có điểm </Text>
                )}
              </View>
            )}
            {activeTab === "Điểm danh" && (
              <View style={styles.cardContainer}>
                <Text style={styles.cardTitle}> Tình hình điểm danh </Text>
                {attendance.length > 0 ? (
                  attendance.map((ar) => (
                    <View key={ar.attendanceId} style={styles.recordCard}>
                      <Text> {ar.timestamp.slice(0, 10)} </Text>
                      <Text> {ar.status} </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    Chưa có dữ liệu điểm danh
                  </Text>
                )}
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
                <Text style={styles.cardTitle}> Thông báo gần đây </Text>
                {notifications.length > 0 ? (
                  notifications.map((nt) => (
                    <View key={nt.notificationId} style={styles.recordCard}>
                      <Text> {new Date(nt.sentAt).toLocaleDateString()} </Text>
                      <Text> {nt.message} </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}> Chưa có thông báo </Text>
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
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  subjectName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  description: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#007BFF",
  },
  tabText: {
    fontSize: 14,
    color: "#333",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
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
  assignmentTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  assignmentDeadline: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  assignmentStatus: {
    fontSize: 13,
    fontWeight: "bold",
  },
  done: {
    color: "#27ae60",
  },
  pending: {
    color: "#e74c3c",
  },
  recordCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 12,
  },
});
