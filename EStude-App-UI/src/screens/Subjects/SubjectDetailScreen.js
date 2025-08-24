import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

export default function SubjectDetailScreen({ route }) {
  const { subject } = route.params;
  const [activeTab, setActiveTab] = useState("Điểm");
  const tabs = ["Điểm", "Điểm danh", "Bài tập", "Thông báo"];

  return (
    <View style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header môn học */}
        <View style={styles.headerCard}>
          <Text style={styles.subjectName}>
            {subject.name} - {subject.subjectId}
          </Text>
          <Text style={styles.description}>{subject.description}</Text>

          {/* Danh sách lớp + GV */}
          {subject.classSubjects.map((cs) => (
            <View key={cs.classSubjectId} style={styles.classRow}>
              <Text style={styles.className}>
                {cs.class.name} ({cs.class.term})
              </Text>
              <Text style={styles.teacherName}>
                Giáo viên/Giảng viên: {cs.teacher.fullName}
              </Text>
            </View>
          ))}
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

        {/* Nội dung tab */}
        <View style={styles.tabContent}>
          {activeTab === "Điểm" && (
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Kết quả học tập</Text>

              {/* Bảng điểm theo cột dọc */}
              <View style={styles.verticalTable}>
                {/* Giữa kỳ */}
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Giữa kỳ</Text>
                  <Text style={styles.rowValue}>
                    {subject.subjectGrade?.midtermScore ?? "-"}
                  </Text>
                </View>

                {/* Thường kỳ 1-3 */}
                {(subject.subjectGrade?.regularScores ?? ["-", "-", "-"]).map(
                  (v, i) => (
                    <View style={styles.row} key={`reg${i}`}>
                      <Text style={styles.rowLabel}>Thường kỳ {i + 1}</Text>
                      <Text style={styles.rowValue}>{v ?? "-"}</Text>
                    </View>
                  )
                )}

                {/* Thực hành 1-3 */}
                {(subject.subjectGrade?.practiceScores ?? ["-", "-", "-"]).map(
                  (v, i) => (
                    <View style={styles.row} key={`prac${i}`}>
                      <Text style={styles.rowLabel}>Thực hành {i + 1}</Text>
                      <Text style={styles.rowValue}>{v ?? "-"}</Text>
                    </View>
                  )
                )}

                {/* Cuối kỳ */}
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Cuối kỳ</Text>
                  <Text style={styles.rowValue}>
                    {subject.subjectGrade?.finalScore ?? "-"}
                  </Text>
                </View>

                {/* Tổng kết */}
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Tổng kết</Text>
                  <Text style={styles.rowValue}>
                    {subject.subjectGrade?.actualAverage ?? "-"}
                  </Text>
                </View>

                {/* Xếp loại */}
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Xếp loại</Text>
                  <Text style={styles.rowValue}>
                    {subject.subjectGrade?.gradeClassification ?? "-"}
                  </Text>
                </View>

                {/* Đạt/Không đạt */}
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Đạt/Không đạt</Text>
                  <Text style={styles.rowValue}>
                    {subject.subjectGrade?.passed
                      ? "Đạt ✅"
                      : subject.subjectGrade?.passed === false
                      ? "Không đạt ❌"
                      : "-"}
                  </Text>
                </View>
              </View>
            </View>
          )}
          {activeTab === "Điểm danh" && (
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Tình hình điểm danh</Text>
              {subject.attendanceRecords?.length > 0 ? (
                subject.attendanceRecords.map((ar) => (
                  <View key={ar.attendanceId} style={styles.recordCard}>
                    <Text style={styles.recordDate}>
                      {ar.timestamp.slice(0, 10)}
                    </Text>
                    <Text
                      style={[
                        styles.recordStatus,
                        ar.status === "Vắng" && { color: "#FF4D4F" },
                        ar.status === "Có mặt" && { color: "#52C41A" },
                      ]}
                    >
                      {ar.status}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa có dữ liệu điểm danh</Text>
              )}
            </View>
          )}
          {activeTab === "Bài tập" && (
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Danh sách bài tập</Text>
              {subject.assignments?.length > 0 ? (
                subject.assignments.map((as) => (
                  <View key={as.assignmentId} style={styles.recordCard}>
                    <Text style={styles.recordTitle}>{as.title}</Text>
                    <Text
                      style={[
                        styles.recordStatus,
                        as.submissions?.length > 0
                          ? { color: "#52C41A" }
                          : { color: "#FF4D4F" },
                      ]}
                    >
                      {as.submissions?.length > 0 ? "Hoàn thành" : "Chưa nộp"}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa có bài tập</Text>
              )}
            </View>
          )}
          {activeTab === "Thông báo" && (
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Thông báo gần đây</Text>
              {subject.notifications?.length > 0 ? (
                subject.notifications.map((nt) => (
                  <View key={nt.notificationId} style={styles.recordCard}>
                    <Text style={styles.recordDate}>
                      {nt.sentAt.slice(0, 10)}
                    </Text>
                    <Text style={styles.recordMessage}>{nt.message}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa có thông báo</Text>
              )}
            </View>
          )}
        </View>
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
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  subjectName: { fontSize: 20, fontWeight: "bold", color: "#333" },
  subjectCode: { fontSize: 14, color: "#666", marginTop: 4 },
  description: { fontSize: 13, color: "#555", marginTop: 2 },
  classRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  className: { fontSize: 14, color: "#333" },
  teacherName: { fontSize: 13, color: "#007BFF" },

  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: "center" },
  activeTab: { backgroundColor: "#007BFF" },
  tabText: { fontSize: 14, color: "#333" },
  activeTabText: { color: "#fff", fontWeight: "bold" },

  tabContent: {},
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoLabel: { fontWeight: "600", color: "#666" },
  infoValue: { color: "#333" },
  verticalTable: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rowLabel: { fontWeight: "600", color: "#333" },
  rowValue: { color: "#555" },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  recordDate: { fontSize: 13, color: "#666" },
  recordStatus: { fontSize: 14, fontWeight: "600" },
  recordTitle: { fontSize: 14, fontWeight: "600", color: "#333" },
  recordMessage: { fontSize: 14, color: "#333", flex: 1, marginLeft: 8 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 12 },
});
