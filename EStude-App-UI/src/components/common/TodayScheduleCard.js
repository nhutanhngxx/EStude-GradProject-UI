import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TodayScheduleCard({
  title,
  scheduleList,
  onPressDetail,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar" size={22} color="#4CAF50" />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>

        {onPressDetail && (
          <TouchableOpacity style={styles.detailButton} onPress={onPressDetail}>
            <Text style={styles.link}>Xem chi tiết</Text>
          </TouchableOpacity>
        )}
      </View>

      {scheduleList.map((item) => (
        <View key={item.id} style={styles.planItem}>
          <View style={{ gap: 5 }}>
            <Text style={styles.planSubject}>{item.subject}</Text>
            <Text style={styles.planTime}>
              {item.time} • {item.room}
            </Text>
          </View>

          <Text
            style={[
              styles.statusBadge,
              item.status === "in_progress" && { color: "#28a745" },
              item.status === "upcoming" && { color: "#007bff" },
            ]}
          >
            {item.status === "in_progress" ? "ĐANG HỌC" : "SẮP HỌC"}
          </Text>
        </View>
      ))}
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
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B5E20",
    marginLeft: 8,
  },
  link: { color: "#007bff", fontWeight: "500" },
  planItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  planSubject: { fontSize: 14, fontWeight: "bold", color: "#333" },
  planTime: { fontSize: 12, color: "#666" },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    fontSize: 12,
  },
});
