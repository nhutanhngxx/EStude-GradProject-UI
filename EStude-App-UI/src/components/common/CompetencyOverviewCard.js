import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function CompetencyOverviewCard({ stats, onPress }) {
  if (!stats || stats.totalSubjects === 0) {
    return null;
  }

  const getAverageAccuracy = () => {
    if (stats.subjectStats.length === 0) return 0;
    const total = stats.subjectStats.reduce((sum, s) => sum + s.avgAccuracy, 0);
    return (total / stats.subjectStats.length).toFixed(1);
  };

  const getCompetencyLevel = (accuracy) => {
    if (accuracy >= 80) return { level: "Vững vàng", color: "#4CAF50", icon: "trophy" };
    if (accuracy >= 60) return { level: "Nâng cao", color: "#2196F3", icon: "trending-up" };
    if (accuracy >= 40) return { level: "Trung bình", color: "#FF9800", icon: "school" };
    return { level: "Cơ bản", color: "#F44336", icon: "book-outline" };
  };

  const avgAccuracy = getAverageAccuracy();
  const competency = getCompetencyLevel(avgAccuracy);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="map-marker-path" size={20} color="#00cc66" />
          <Text style={styles.title}>Bản đồ Năng lực</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
      </View>

      <View style={styles.content}>
        <View style={styles.mainStat}>
          <View style={styles.competencyBadge}>
            <MaterialCommunityIcons
              name={competency.icon}
              size={32}
              color={competency.color}
            />
            <Text style={[styles.competencyLevel, { color: competency.color }]}>
              {competency.level}
            </Text>
          </View>
          <Text style={styles.averageValue}>{avgAccuracy}%</Text>
          <Text style={styles.averageLabel}>Tỷ lệ đạt trung bình</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#4CAF50" }]}>
              {stats.totalMastered}
            </Text>
            <Text style={styles.statLabel}>Chủ đề vững</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#2196F3" }]}>
              {stats.totalProgressing}
            </Text>
            <Text style={styles.statLabel}>Tiến bộ</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#FF9800" }]}>
              {stats.totalNeedsWork}
            </Text>
            <Text style={styles.statLabel}>Cần luyện</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Theo dõi {stats.totalSubjects} môn học • {stats.totalTopics} chủ đề
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333",
  },
  content: {
    alignItems: "center",
  },
  mainStat: {
    alignItems: "center",
    marginBottom: 16,
  },
  competencyBadge: {
    alignItems: "center",
    marginBottom: 8,
  },
  competencyLevel: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
  averageValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#00cc66",
  },
  averageLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
