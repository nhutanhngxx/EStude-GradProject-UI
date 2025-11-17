import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function CompetencyOverviewCard({ stats, onPress }) {
  if (!stats || stats.totalSubjects === 0) {
    return null;
  }

  const colors = {
    primary: "#4CAF50",
    secondary: "#43A047",
    accent: "#B2FF59",
    warning: "#FFB300",
    error: "#E53935",
    text: "#1B5E20",
    textLight: "#4C8C4A",
    card: "#F4FFF5",
    border: "#E0F2E9",
  };

  const getAverageAccuracy = () => {
    if (stats.subjectStats.length === 0) return 0;
    const total = stats.subjectStats.reduce((sum, s) => sum + s.avgAccuracy, 0);
    return (total / stats.subjectStats.length).toFixed(1);
  };

  const getCompetencyLevel = (accuracy) => {
    if (accuracy >= 80)
      return { level: "Vững vàng", color: colors.primary, icon: "trophy" };
    if (accuracy >= 60)
      return { level: "Nâng cao", color: colors.secondary, icon: "trending-up" };
    if (accuracy >= 40)
      return { level: "Trung bình", color: colors.warning, icon: "school" };
    return { level: "Cơ bản", color: colors.error, icon: "book-outline" };
  };

  const avgAccuracy = getAverageAccuracy();
  const competency = getCompetencyLevel(avgAccuracy);

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: "#fff" }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons
            name="map-marker-path"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.title, { color: colors.text }]}>Bản đồ Năng lực</Text>
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
          <Text style={[styles.averageValue, { color: colors.primary }]}>
            {avgAccuracy}%
          </Text>
          <Text style={[styles.averageLabel, { color: colors.textLight }]}>
            Tỷ lệ đạt trung bình
          </Text>
        </View>

        <View style={[styles.statsGrid, { borderTopColor: colors.border }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats.totalMastered}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Chủ đề vững</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.secondary }]}>
              {stats.totalProgressing}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Tiến bộ</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {stats.totalNeedsWork}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textLight }]}>Cần luyện</Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: "#777" }]}>
          Theo dõi {stats.totalSubjects} môn học • {stats.totalTopics} chủ đề
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
  },
  averageLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: 12,
    borderTopWidth: 1,
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
    marginTop: 4,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
});
