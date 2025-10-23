import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TopicProgressCard({ topic, onPress }) {
  const getStatusColor = (status) => {
    if (status.includes("vững") || status.includes("Tiến bộ vượt bậc")) {
      return "#4CAF50";
    }
    if (status.includes("Tiến bộ") || status.includes("Ổn định")) {
      return "#2196F3";
    }
    if (status.includes("Cần luyện")) {
      return "#FF9800";
    }
    return "#9E9E9E";
  };

  const getAccuracyLevel = (accuracy) => {
    if (accuracy >= 80) return { label: "Vững vàng", color: "#4CAF50", icon: "check-circle" };
    if (accuracy >= 60) return { label: "Nâng cao", color: "#2196F3", icon: "arrow-up-circle" };
    if (accuracy >= 40) return { label: "Trung bình", color: "#FF9800", icon: "minus-circle" };
    return { label: "Cơ bản", color: "#F44336", icon: "alert-circle" };
  };

  const statusColor = getStatusColor(topic.status);
  const level = getAccuracyLevel(topic.latestAccuracy);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons
            name={level.icon}
            size={20}
            color={level.color}
          />
          <Text style={styles.topicName} numberOfLines={2}>
            {topic.topic}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${statusColor}15` },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {topic.status}
          </Text>
        </View>
      </View>

      <View style={styles.accuracyRow}>
        <View style={styles.accuracyLeft}>
          <Text style={[styles.accuracyValue, { color: level.color }]}>
            {topic.latestAccuracy}%
          </Text>
          <Text style={styles.accuracyLabel}>{level.label}</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${topic.latestAccuracy}%`,
                  backgroundColor: level.color,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Improvement Indicator */}
      {topic.improvementHistory && topic.improvementHistory.length > 0 && (
        <View style={styles.improvementRow}>
          <Text style={styles.improvementLabel}>Xu hướng:</Text>
          <View style={styles.miniTrendBars}>
            {topic.improvementHistory.slice(-3).map((imp, idx) => {
              const barColor = imp > 0 ? "#4CAF50" : imp < 0 ? "#F44336" : "#9E9E9E";
              return (
                <View
                  key={idx}
                  style={[
                    styles.miniBar,
                    { backgroundColor: barColor, opacity: 0.5 + (idx * 0.25) },
                  ]}
                />
              );
            })}
          </View>
          <Text style={styles.improvementValue}>
            {topic.improvementHistory.length > 0
              ? `${(
                  topic.improvementHistory.reduce((a, b) => a + b, 0) /
                  topic.improvementHistory.length
                ).toFixed(1)}%`
              : "N/A"}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  topicName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 6,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  accuracyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  accuracyLeft: {
    alignItems: "center",
    marginRight: 12,
  },
  accuracyValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  accuracyLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  progressContainer: {
    flex: 1,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  improvementRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
  },
  improvementLabel: {
    fontSize: 11,
    color: "#666",
    marginRight: 6,
  },
  miniTrendBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 16,
    gap: 2,
    marginRight: 8,
  },
  miniBar: {
    width: 4,
    height: 12,
    borderRadius: 2,
  },
  improvementValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
});
