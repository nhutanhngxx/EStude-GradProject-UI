import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";

// Props route nhận classSubject thay vì subject string
export default function AttendanceDetailScreen({ route }) {
  const { subject } = route.params; // subject: { classSubjectId, subject: {name}, teacher: {fullName} }

  // Giả lập dữ liệu buổi học theo classSubjectId
  const initialSessions = [
    {
      id: "s1",
      classSubjectId: subject.classSubjectId,
      date: "2025-08-01",
      status: "done",
    },
    {
      id: "s2",
      classSubjectId: subject.classSubjectId,
      date: "2025-08-03",
      status: "done",
    },
    {
      id: "s3",
      classSubjectId: subject.classSubjectId,
      date: "2025-08-05",
      status: "late",
    },
    {
      id: "s4",
      classSubjectId: subject.classSubjectId,
      date: "2025-08-07",
      status: "pending",
    },
    {
      id: "s5",
      classSubjectId: subject.classSubjectId,
      date: "2025-08-09",
      status: "pending",
    },
  ];

  const [sessions, setSessions] = useState(initialSessions);

  const attendedCount = sessions.filter((s) => s.status === "done").length;
  const totalCount = sessions.length;
  const percent = Math.round((attendedCount / totalCount) * 100);

  const getStatusStyle = (status) => {
    switch (status) {
      case "done":
        return { color: "#2e7d32", label: "Đúng giờ" };
      case "late":
        return { color: "#ff9800", label: "Đi muộn" };
      case "pending":
        return { color: "#1976d2", label: "Chưa điểm danh" };
      default:
        return { color: "#555", label: "Không xác định" };
    }
  };

  const handleAttendance = (id) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "done" } : s))
    );
  };

  const renderSession = ({ item }) => {
    const { color, label } = getStatusStyle(item.status);
    return (
      <View style={styles.sessionRow}>
        <Text style={styles.sessionDate}>📅 {item.date}</Text>
        {item.status === "pending" ? (
          <TouchableOpacity
            style={styles.attendBtn}
            onPress={() => handleAttendance(item.id)}
          >
            <Text style={styles.attendText}>Điểm danh</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.sessionStatus, { color }]}>{label}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{subject.subject.name}</Text>
          <Text style={styles.subText}>
            {attendedCount}/{totalCount} buổi • {percent}%
          </Text>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percent}%`, backgroundColor: "#2e7d32" },
              ]}
            />
          </View>
        </View>

        {/* Danh sách buổi học */}
        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Chi tiết buổi học</Text>
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={renderSession}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#2e7d32" },
  subText: { fontSize: 14, color: "#555", marginTop: 6 },
  progressBar: {
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 6 },
  body: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  sessionDate: { fontSize: 14, color: "#333" },
  sessionStatus: { fontSize: 14, fontWeight: "600" },
  separator: { height: 10 },
  attendBtn: {
    backgroundColor: "#1976d2",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  attendText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  container: { flex: 1 },
});
