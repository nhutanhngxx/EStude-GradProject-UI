import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import ProgressBar from "./ProgressBar";

export default function StudyOverviewCard({
  gpa,
  rank,
  totalStudents,
  passedCredits,
  requiredCredits,
  submissionRate = 0,
  attendanceRate = 0,
  onPressDetail,
}) {
  const creditPercent =
    requiredCredits > 0
      ? Math.round((passedCredits / requiredCredits) * 100)
      : 0;
  const submissionPercent = Math.round(submissionRate * 100);
  const attendancePercent = Math.round(attendanceRate * 100);

  return (
    <View style={styles.card}>
      {onPressDetail ? (
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Tổng quan học tập</Text>
          <TouchableOpacity onPress={onPressDetail}>
            <Text style={styles.link}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.cardTitle}>Tổng quan học tập</Text>
      )}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {gpa != null ? gpa.toFixed(2) : "-"}
          </Text>
          <Text style={styles.statLabel}>Điểm trung bình</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{rank ?? "-"}</Text>
          <Text style={styles.statLabel}>
            Thứ hạng trong {totalStudents ?? "-"}
          </Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {passedCredits}/{requiredCredits}
          </Text>
          <Text style={styles.statLabel}>Tổng số môn</Text>
        </View>
      </View>

      {/* Progress Bars */}
      <View style={styles.progressSection}>
        <Text style={styles.blockTitle}>Tiến độ học tập</Text>
        <ProgressBar value={creditPercent} />
        <Text style={styles.progressText}>{creditPercent}% hoàn thành</Text>

        <Text style={styles.blockTitle}>Tỉ lệ nộp bài</Text>
        <ProgressBar value={submissionPercent} />
        <Text style={styles.progressText}>{submissionPercent}%</Text>

        <Text style={styles.blockTitle}>Tỉ lệ đi học</Text>
        <ProgressBar value={attendancePercent} />
        <Text style={styles.progressText}>{attendancePercent}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#333",
  },
  link: {
    color: "#007bff",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stat: {
    alignItems: "center",
    gap: 3,
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  statNote: {
    fontSize: 12,
    color: "#999",
  },
  progressSection: {
    marginTop: 8,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    marginVertical: 4,
  },
});
