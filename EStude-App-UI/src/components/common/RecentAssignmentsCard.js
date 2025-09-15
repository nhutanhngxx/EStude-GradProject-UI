import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";

export default function RecentAssignmentsCard({
  title,
  assignments,
  onPressDetail,
}) {
  const renderItem = ({ item }) => (
    <View style={styles.assignmentItem}>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={styles.assignmentName}>{item.name}</Text>
        <Text style={styles.assignmentMeta}>
          {item.subject} • Hạn: {item.dueDate}
        </Text>
      </View>
      <Text
        style={[
          styles.statusBadge,
          item.status === "pending" && { color: "#ff9800" },
          item.status === "submitted" && { color: "#28a745" },
          item.status === "late" && { color: "#f44336" },
        ]}
      >
        {item.status === "pending"
          ? "CHƯA NỘP"
          : item.status === "submitted"
          ? "ĐÃ NỘP"
          : "TRỄ HẠN"}
      </Text>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {onPressDetail && (
          <TouchableOpacity onPress={onPressDetail}>
            <Text style={styles.link}>Xem chi tiết</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        scrollEnabled={false}
      />
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  link: { color: "#007bff", fontWeight: "500" },
  assignmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  assignmentName: { fontSize: 14, fontWeight: "bold", color: "#333" },
  assignmentMeta: { fontSize: 12, color: "#666", marginTop: 2 },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    color: "#fff",
    fontSize: 12,
  },
});
