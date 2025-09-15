import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import ProgressBar from "./ProgressBar";

export default function StudyOverviewCard({
  gpa,
  rank,
  totalStudents,
  passedCredits,
  requiredCredits,
  onPressDetail,
}) {
  const creditPercent = Math.round((passedCredits / requiredCredits) * 100);

  return (
    <View style={styles.card}>
      {onPressDetail && (
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Tổng quan học tập</Text>
          <TouchableOpacity onPress={onPressDetail}>
            <Text style={styles.link}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>
      )}
      {!onPressDetail && <Text style={styles.cardTitle}>Tổng quan</Text>}

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
    shadowOffset: { width: 0, height: 2 },
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
  link: { color: "#007bff", fontWeight: "500" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stat: { alignItems: "center" },
  statLabel: { fontSize: 13, color: "#666" },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#000" },
  statNote: { fontSize: 12, color: "#999" },
  blockTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  progressText: { fontSize: 12, color: "#666", marginTop: 4 },
});
