import { StyleSheet, Text, View } from "react-native";

const ProgressBar = ({ value }) => {
  const width = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressFill, { width: `${width}%` }]} />
    </View>
  );
};

const AttendanceOverview = ({ totalAttendance }) => {
  const percent = totalAttendance.percent || 0;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Tổng quan điểm danh</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Đã điểm danh</Text>
          <Text style={styles.statValue}>{totalAttendance.present}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Tổng số buổi</Text>
          <Text style={styles.statValue}>{totalAttendance.total}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Tỉ lệ</Text>
          <Text style={styles.statValue}>{percent}%</Text>
        </View>
      </View>
      <ProgressBar value={percent} />
      <Text style={styles.progressText}>{percent}% hoàn thành</Text>
    </View>
  );
};

export default AttendanceOverview;

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
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stat: { alignItems: "center" },
  statLabel: { fontSize: 12, color: "#666" },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#000" },
  progressWrap: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#00cc66" },
  progressText: { fontSize: 12, color: "#666", marginTop: 4 },
  filterRow: { flexDirection: "row", marginBottom: 12 },
  dropdownWrapper: { flexGrow: 0, flexShrink: 1, marginHorizontal: 4 },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: "600", color: "#333" },
  description: { fontSize: 13, color: "#555", marginBottom: 6 },
  status: { fontSize: 14, fontWeight: "bold" },
  loadingInline: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  emptyText: { textAlign: "center", color: "#999", marginTop: 12 },
});
