import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Dữ liệu mẫu (mock)
const user = {
  name: "Nguyễn Minh Khoa",
  avatar: "https://i.pravatar.cc/150?img=12",
  grade: "12A3",
};

const academicOverview = {
  gpa: 8.7,
  rank: 5,
  totalStudents: 42,
  passedCredits: 85,
  requiredCredits: 120,
  subjectsAtRisk: 2,
};

const todayPlan = [
  {
    id: "1",
    time: "07:30 - 09:00",
    subject: "Toán - Hình học không gian",
    room: "P.302",
    status: "upcoming",
  },
  {
    id: "2",
    time: "09:15 - 10:45",
    subject: "Vật lý - Điện xoay chiều",
    room: "P.204",
    status: "in_progress",
  },
  {
    id: "3",
    time: "14:00 - 16:00",
    subject: "Ôn tập - Lịch sử Việt Nam",
    room: "Thư viện",
    status: "upcoming",
  },
];

const attendanceOverview = [
  { id: "a1", subject: "Toán", present: 12, late: 1, absent: 0, total: 13 },
  { id: "a2", subject: "Vật lý", present: 11, late: 0, absent: 2, total: 13 },
  { id: "a3", subject: "Hóa học", present: 10, late: 2, absent: 1, total: 13 },
];

const quickActions = [
  { id: "qa1", label: "Điểm danh", hint: "QR / GPS", icon: "🪪" },
  { id: "qa2", label: "Nộp bài", hint: "Bài tập hôm nay", icon: "📤" },
  { id: "qa3", label: "Lịch học", hint: "Tuần này", icon: "📅" },
  { id: "qa4", label: "Tra cứu điểm", hint: "Theo môn", icon: "📊" },
];

// Component hiển thị thanh tiến độ
const ProgressBar = ({ value }) => {
  const width = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressFill, { width: `${width}%` }]} />
    </View>
  );
};

export default function HomeStudentScreen() {
  const creditPercent = Math.round(
    (academicOverview.passedCredits / academicOverview.requiredCredits) * 100
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>EStude</Text>
            <Text style={styles.greeting}>
              Xin chào, <Text style={styles.highlight}>{user.name}</Text> 👋
            </Text>
            <Text style={styles.subGreeting}>
              Lớp {user.grade} • Học tốt mỗi ngày
            </Text>
          </View>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        </View>

        {/* Tổng quan học tập */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Tổng quan học tập</Text>
            <TouchableOpacity>
              <Text style={styles.link}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Điểm TB</Text>
              <Text style={styles.statValue}>
                {academicOverview.gpa.toFixed(2)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Thứ hạng</Text>
              <Text style={styles.statValue}>#{academicOverview.rank}</Text>
              <Text style={styles.statNote}>
                trong {academicOverview.totalStudents}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Tín chỉ</Text>
              <Text style={styles.statValue}>
                {academicOverview.passedCredits}/
                {academicOverview.requiredCredits}
              </Text>
            </View>
          </View>
          <Text style={styles.blockTitle}>Tiến độ tín chỉ</Text>
          <ProgressBar value={creditPercent} />
          <Text style={styles.progressText}>{creditPercent}% hoàn thành</Text>
        </View>

        {/* Kế hoạch học hôm nay */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kế hoạch học hôm nay</Text>
          {todayPlan.map((item) => (
            <View key={item.id} style={styles.planItem}>
              <View>
                <Text style={styles.planSubject}>{item.subject}</Text>
                <Text style={styles.planTime}>
                  {item.time} • {item.room}
                </Text>
              </View>
              <Text
                style={[
                  styles.statusBadge,
                  item.status === "in_progress" && {
                    backgroundColor: "#28a745",
                  },
                  item.status === "upcoming" && { backgroundColor: "#007bff" },
                ]}
              >
                {item.status === "in_progress" ? "Đang học" : "Sắp học"}
              </Text>
            </View>
          ))}
        </View>

        {/* Tổng quan điểm danh */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng quan điểm danh</Text>
          {attendanceOverview.map((item) => (
            <View key={item.id} style={styles.attendanceRow}>
              <Text style={styles.attendanceSubject}>{item.subject}</Text>
              <Text style={styles.attendanceDetail}>
                {item.present}/{item.total} có mặt
              </Text>
            </View>
          ))}
        </View>

        {/* Tác vụ nhanh */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tác vụ nhanh</Text>
          <View style={styles.quickActionRow}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.id} style={styles.quickAction}>
                <Text style={styles.quickIcon}>{action.icon}</Text>
                <Text style={styles.quickLabel}>{action.label}</Text>
                <Text style={styles.quickHint}>{action.hint}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brand: { fontSize: 20, fontWeight: "bold", color: "#00cc66" },
  greeting: { fontSize: 16, color: "#333" },
  highlight: { fontWeight: "bold" },
  subGreeting: { fontSize: 14, color: "#777" },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  link: { color: "#007bff" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stat: { alignItems: "center" },
  statLabel: { fontSize: 12, color: "#666" },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#000" },
  statNote: { fontSize: 12, color: "#999" },
  blockTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  progressWrap: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#00cc66" },
  progressText: { fontSize: 12, color: "#666", marginTop: 4 },
  planItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  planSubject: { fontSize: 14, fontWeight: "bold" },
  planTime: { fontSize: 12, color: "#666" },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    color: "#fff",
    fontSize: 12,
    backgroundColor: "#007bff",
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  attendanceSubject: { fontWeight: "bold" },
  attendanceDetail: { color: "#555" },
  quickActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickAction: {
    width: "48%",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    alignItems: "center",
  },
  quickIcon: { fontSize: 24, marginBottom: 6 },
  quickLabel: { fontWeight: "bold", fontSize: 14 },
  quickHint: { fontSize: 12, color: "#666" },
});
