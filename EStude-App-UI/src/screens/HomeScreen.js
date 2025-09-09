import React, { useContext } from "react";
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

import { AuthContext } from "../contexts/AuthContext";

const mockStudentData = {
  gpa: 8.7,
  rank: 5,
  totalStudents: 42,
  passedCredits: 85,
  requiredCredits: 120,
  subjectsAtRisk: 2,
  avatar: "https://i.pravatar.cc/150?img=12",
  class: { classId: 10, name: "12A3", term: "2025-2026", classSize: 42 },
};

const classSubject = {
  classSubjectId: 1001,
  subject: { name: "Toán - Hình học không gian" },
  teacher: { fullName: "Nguyễn Văn A" },
  schedule: [
    {
      scheduleId: 1,
      date: "2025-08-24",
      startPeriod: "07:30",
      endPeriod: "09:00",
      room: "P.302",
      status: "SCHEDULED",
    },
    {
      scheduleId: 2,
      date: "2025-08-24",
      startPeriod: "09:15",
      endPeriod: "10:45",
      room: "P.204",
      status: "COMPLETED",
    },
  ],
};

const attendanceRecord = [
  { id: 1, subject: "Toán", present: 12, late: 1, absent: 0, total: 13 },
  { id: 2, subject: "Vật lý", present: 11, late: 0, absent: 2, total: 13 },
  { id: 3, subject: "Hóa học", present: 10, late: 2, absent: 1, total: 13 },
];

const quickActions = [
  { id: "qa1", label: "Môn học", hint: "Môn đang học", icon: "🪪" },
  { id: "qa2", label: "Nộp bài", hint: "Bài hôm nay", icon: "📤" },
  { id: "qa3", label: "Lịch học", hint: "Tuần này", icon: "📅" },
  { id: "qa4", label: "Tra cứu điểm", hint: "Theo môn", icon: "📊" },
];

// Component ProgressBar
const ProgressBar = ({ value }) => {
  const width = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressFill, { width: `${width}%` }]} />
    </View>
  );
};

export default function HomeStudentScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  console.log("Người dùng đã đăng nhập: ", user.fullName);

  // Avatar: lấy từ user nếu có, nếu không thì lấy mock
  const avatarUri = user.avatarPath ? user.avatarPath : mockStudentData.avatar;

  // Dữ liệu học tập
  const gpa = mockStudentData.gpa;
  const rank = mockStudentData.rank;
  const totalStudents = mockStudentData.totalStudents;
  const passedCredits = mockStudentData.passedCredits;
  const requiredCredits = mockStudentData.requiredCredits;
  const creditPercent = Math.round((passedCredits / requiredCredits) * 100);

  // Lịch học hôm nay từ schedule mock
  const todayPlan = classSubject.schedule.map((s) => ({
    id: s.scheduleId.toString(),
    time: `${s.startPeriod} - ${s.endPeriod}`,
    subject: classSubject.subject.name,
    room: s.room,
    status: s.status === "COMPLETED" ? "in_progress" : "upcoming",
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ gap: 3 }}>
            <Text style={styles.brand}>EStude</Text>
            <Text style={styles.greeting}>
              Xin chào,{" "}
              <Text style={styles.highlight}>
                {user.fullName.toUpperCase()}
              </Text>{" "}
              👋
            </Text>

            <Text style={styles.subGreeting}>
              Nơi lưu giữ hành tri tri thức trẻ
            </Text>
          </View>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        </View>

        {/* Tác vụ nhanh */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Các tác vụ nhanh</Text>
          <View style={styles.quickActionRow}>
            {quickActions.slice(0, 3).map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickAction}
                onPress={() => {
                  switch (action.id) {
                    case "qa1":
                      navigation.navigate("SubjectList");
                      break;
                    case "qa2":
                      navigation.navigate("NopBai");
                      break;
                    case "qa3":
                      navigation.navigate("ScheduleList");
                      break;
                  }
                }}
              >
                <Text style={styles.quickIcon}>{action.icon}</Text>
                <Text style={styles.quickLabel}>{action.label}</Text>
                {/* <Text style={styles.quickHint}>{action.hint}</Text> */}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.quickAction, styles.allAction]}
              onPress={() => navigation.navigate("FullChucNang")}
            >
              <Text style={styles.quickIcon}>📂</Text>
              <Text style={styles.quickLabel}>Tất cả</Text>
              <Text style={styles.quickHint}>Xem thêm</Text>
            </TouchableOpacity>
          </View>
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
              <Text style={styles.statValue}>{gpa.toFixed(2)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Thứ hạng</Text>
              <Text style={styles.statValue}>#{rank}</Text>
              <Text style={styles.statNote}>trong {totalStudents}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Tín chỉ</Text>
              <Text style={styles.statValue}>
                {passedCredits}/{requiredCredits}
              </Text>
            </View>
          </View>
          <Text style={styles.blockTitle}>Tiến độ tín chỉ</Text>
          <ProgressBar value={creditPercent} />
          <Text style={styles.progressText}>{creditPercent}% hoàn thành</Text>
        </View>

        {/* Lịch học hôm nay */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Lịch học hôm nay</Text>
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => navigation.navigate("ScheduleList")}
            >
              <Text style={styles.link}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>
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
          {attendanceRecord.map((item) => (
            <View key={item.id} style={styles.attendanceRow}>
              <Text style={styles.attendanceSubject}>{item.subject}</Text>
              <Text style={styles.attendanceDetail}>
                {item.present}/{item.total} có mặt
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brand: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00cc66",
  },
  greeting: {
    fontSize: 16,
    color: "#333",
  },
  highlight: {
    fontWeight: "bold",
  },
  subGreeting: {
    fontSize: 14,
    color: "#777",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  link: { color: "#007bff" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  statNote: {
    fontSize: 12,
    color: "#999",
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  progressWrap: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00cc66",
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  planItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  planSubject: {
    fontSize: 14,
    fontWeight: "bold",
  },
  planTime: {
    fontSize: 12,
    color: "#666",
  },
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
  attendanceSubject: {
    fontWeight: "bold",
  },
  attendanceDetail: { color: "#555" },
  quickActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickAction: {
    width: "23%",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  quickLabel: {
    fontWeight: "bold",
    fontSize: 13,
    textAlign: "center",
  },
  quickHint: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  allAction: {},
});
