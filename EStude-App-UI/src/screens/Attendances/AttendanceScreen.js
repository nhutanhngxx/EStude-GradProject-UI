import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const student = {
  userId: 101,
  fullName: "Nguyễn Nhựt Anh",
  avatar: "https://i.pravatar.cc/150?img=12",
  studentCode: "S12345",
  class: { classId: 10, name: "12A3", term: "2025-2026", classSize: 42 },
  school: {
    schoolId: 1,
    schoolCode: "IUH001",
    schoolName: "Đại học Công nghiệp TP.HCM",
  },
  gpa: 8.7,
  rank: 5,
  totalStudents: 42,
  passedCredits: 85,
  requiredCredits: 120,
  subjectsAtRisk: 2,
};

const classSubject = [
  {
    classSubjectId: 1,
    subject: { name: "Toán" },
    teacher: { fullName: "Nguyễn Văn A" },
  },
  {
    classSubjectId: 2,
    subject: { name: "Văn" },
    teacher: { fullName: "Trần Thị B" },
  },
  {
    classSubjectId: 3,
    subject: { name: "Anh" },
    teacher: { fullName: "Lê C" },
  },
  {
    classSubjectId: 4,
    subject: { name: "Tin học" },
    teacher: { fullName: "Phạm D" },
  },
];

const attendanceRecord = [
  { id: "1", classSubjectId: 1, attended: 20, total: 24, status: "done" },
  { id: "2", classSubjectId: 2, attended: 18, total: 20, status: "late" },
  { id: "3", classSubjectId: 3, attended: 22, total: 25, status: "pending" },
  { id: "4", classSubjectId: 4, attended: 15, total: 18, status: "done" },
];

// Dữ liệu theo ngày/tuần/tháng
const activityData = {
  Ngày: [
    { classSubjectId: 1, attended: 1, total: 1, status: "done" },
    { classSubjectId: 2, attended: 0, total: 1, status: "pending" },
  ],
  Tuần: [
    { classSubjectId: 1, attended: 4, total: 5, status: "done" },
    { classSubjectId: 2, attended: 3, total: 5, status: "late" },
    { classSubjectId: 3, attended: 3, total: 4, status: "pending" },
  ],
  Tháng: [
    { classSubjectId: 1, attended: 18, total: 20, status: "done" },
    { classSubjectId: 2, attended: 19, total: 20, status: "done" },
    { classSubjectId: 3, attended: 16, total: 20, status: "late" },
    { classSubjectId: 4, attended: 14, total: 18, status: "pending" },
  ],
};

export default function AttendanceScreen({ navigation }) {
  const [selectedFilter, setSelectedFilter] = useState("Tất cả");
  const [selectedActivity, setSelectedActivity] = useState("Ngày");

  const filters = ["Tất cả", ...classSubject.map((s) => s.subject.name)];

  // Lọc dữ liệu danh sách môn học
  const filteredData =
    selectedFilter === "Tất cả"
      ? attendanceRecord
      : attendanceRecord.filter((item) => {
          const subjectName = classSubject.find(
            (s) => s.classSubjectId === item.classSubjectId
          )?.subject.name;
          return subjectName === selectedFilter;
        });

  const getStatusStyle = (status) => {
    switch (status) {
      case "done":
        return { color: "green", label: "Đã điểm danh" };
      case "pending":
        return { color: "red", label: "Chưa điểm danh" };
      case "late":
        return { color: "orange", label: "Điểm danh muộn" };
      default:
        return { color: "#555", label: "Không xác định" };
    }
  };

  const renderSubjectCard = (item) => {
    const classInfo = classSubject.find(
      (s) => s.classSubjectId === item.classSubjectId
    );
    const percent = Math.round((item.attended / item.total) * 100);
    const { color, label } = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        style={styles.subjectCard}
        onPress={() =>
          navigation.navigate("AttendanceDetail", { subject: classInfo })
        }
      >
        <View style={styles.subjectRow}>
          <Text style={styles.subjectName}>{classInfo?.subject.name}</Text>
          <Text style={[styles.percent, { color }]}>{percent}%</Text>
        </View>
        <Text style={[styles.statusText, { color }]}>{label}</Text>
        <Text style={styles.subText}>
          {item.attended}/{item.total} buổi
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${percent}%`, backgroundColor: color },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

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
              Xin chào, <Text style={styles.highlight}>{student.fullName}</Text>{" "}
              👋
            </Text>
            <Text style={styles.subGreeting}>
              Lớp {student.class.name} • Học tốt mỗi ngày
            </Text>
          </View>
          <Image source={{ uri: student.avatar }} style={styles.avatar} />
        </View>

        {/* Tổng quan */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Tổng quan điểm danh</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>75</Text>
              <Text style={styles.statLabel}>Đã điểm danh</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>87</Text>
              <Text style={styles.statLabel}>Tổng số buổi</Text>
            </View>
            <View style={styles.statBoxHighlight}>
              <Text style={styles.statNumberHighlight}>86%</Text>
              <Text style={styles.statLabel}>Tỉ lệ</Text>
            </View>
          </View>
        </View>

        {/* Hoạt động gần đây */}
        <View style={styles.activityCard}>
          <Text style={styles.overviewTitle}>Điểm danh gần đây</Text>
          <View style={styles.filterRow}>
            {["Ngày", "Tuần", "Tháng"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  selectedActivity === type && styles.filterActive,
                ]}
                onPress={() => setSelectedActivity(type)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedActivity === type && styles.filterTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {activityData[selectedActivity].map((item) => (
            <View key={item.classSubjectId}>{renderSubjectCard(item)}</View>
          ))}
        </View>

        {/* Bộ lọc môn học */}
        <View style={styles.activityCard}>
          <Text style={styles.overviewTitle}>Điểm danh</Text>
          <View style={styles.filterRow}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.filterActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => renderSubjectCard(item)}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles giữ nguyên
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
  overviewCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#222",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
  },
  statBoxHighlight: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
  },
  statNumber: { fontSize: 20, fontWeight: "700", color: "#2e7d32" },
  statLabel: { fontSize: 13, color: "#666", marginTop: 2 },
  statNumberHighlight: { fontSize: 22, fontWeight: "800", color: "#1565c0" },
  filterRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterActive: { backgroundColor: "#2e7d32" },
  filterText: { fontSize: 14, color: "#333" },
  filterTextActive: { color: "#fff", fontWeight: "bold" },
  subjectCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  subjectRow: { flexDirection: "row", justifyContent: "space-between" },
  subjectName: { fontSize: 15, fontWeight: "bold", color: "#2e7d32" },
  percent: { fontSize: 14, fontWeight: "bold" },
  statusText: { fontSize: 13, marginBottom: 2 },
  subText: { fontSize: 13, color: "#555", marginBottom: 5 },
  progressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%" },
  activityCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
