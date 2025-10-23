import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function CompetencyRoadmap({ currentAccuracy, totalTopics, masteredTopics }) {
  const roadmapLevels = [
    {
      level: "Cơ bản",
      minAccuracy: 0,
      maxAccuracy: 40,
      icon: "book-outline",
      color: "#F44336",
      description: "Bắt đầu làm quen",
    },
    {
      level: "Trung bình",
      minAccuracy: 40,
      maxAccuracy: 60,
      icon: "school",
      color: "#FF9800",
      description: "Đang phát triển",
    },
    {
      level: "Nâng cao",
      minAccuracy: 60,
      maxAccuracy: 80,
      icon: "trending-up",
      color: "#2196F3",
      description: "Tiến bộ tốt",
    },
    {
      level: "Vững vàng",
      minAccuracy: 80,
      maxAccuracy: 100,
      icon: "trophy",
      color: "#4CAF50",
      description: "Thành thạo",
    },
  ];

  const getCurrentLevel = () => {
    return roadmapLevels.find(
      (level) =>
        currentAccuracy >= level.minAccuracy &&
        currentAccuracy < level.maxAccuracy
    ) || roadmapLevels[roadmapLevels.length - 1];
  };

  const currentLevel = getCurrentLevel();
  const currentLevelIndex = roadmapLevels.indexOf(currentLevel);
  const completionPercentage = (masteredTopics / totalTopics) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗺️ Lộ trình Năng lực</Text>
      
      <View style={styles.roadmapContainer}>
        {roadmapLevels.map((level, index) => {
          const isCompleted = currentAccuracy > level.maxAccuracy;
          const isCurrent = index === currentLevelIndex;
          const isUpcoming = index > currentLevelIndex;

          return (
            <View key={index} style={styles.levelContainer}>
              {/* Connector line */}
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: isCompleted ? level.color : "#e0e0e0",
                    },
                  ]}
                />
              )}

              {/* Level Node */}
              <View
                style={[
                  styles.levelNode,
                  {
                    backgroundColor: isCurrent
                      ? level.color
                      : isCompleted
                      ? level.color
                      : "#f5f5f5",
                    borderColor: level.color,
                    borderWidth: isCurrent ? 3 : isCompleted ? 2 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={level.icon}
                  size={isCurrent ? 32 : 24}
                  color={isCurrent || isCompleted ? "#fff" : "#999"}
                />
              </View>

              {/* Level Info */}
              <View style={styles.levelInfo}>
                <Text
                  style={[
                    styles.levelName,
                    {
                      color: isCurrent
                        ? level.color
                        : isCompleted
                        ? "#333"
                        : "#999",
                      fontWeight: isCurrent ? "bold" : "600",
                    },
                  ]}
                >
                  {level.level}
                </Text>
                <Text style={styles.levelDescription}>{level.description}</Text>
                <Text style={styles.levelRange}>
                  {level.minAccuracy}% - {level.maxAccuracy}%
                </Text>
                
                {isCurrent && (
                  <View
                    style={[
                      styles.currentBadge,
                      { backgroundColor: `${level.color}15` },
                    ]}
                  >
                    <Text style={[styles.currentBadgeText, { color: level.color }]}>
                      Vị trí hiện tại: {currentAccuracy.toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Overall Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Tiến trình tổng thể</Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${completionPercentage}%`,
                backgroundColor: currentLevel.color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {masteredTopics}/{totalTopics} chủ đề đã vững ({completionPercentage.toFixed(0)}%)
        </Text>
      </View>

      {/* Next Goal */}
      {currentLevelIndex < roadmapLevels.length - 1 && (
        <View style={styles.nextGoalContainer}>
          <Text style={styles.nextGoalTitle}>🎯 Mục tiêu tiếp theo</Text>
          <Text style={styles.nextGoalText}>
            Đạt {roadmapLevels[currentLevelIndex + 1].minAccuracy}% để lên cấp{" "}
            <Text style={{ fontWeight: "bold", color: roadmapLevels[currentLevelIndex + 1].color }}>
              {roadmapLevels[currentLevelIndex + 1].level}
            </Text>
          </Text>
          <Text style={styles.nextGoalProgress}>
            Còn {(roadmapLevels[currentLevelIndex + 1].minAccuracy - currentAccuracy).toFixed(1)}% nữa!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  roadmapContainer: {
    paddingVertical: 8,
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  connector: {
    position: "absolute",
    left: 28,
    top: -20,
    width: 3,
    height: 20,
  },
  levelNode: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  levelInfo: {
    marginLeft: 16,
    flex: 1,
  },
  levelName: {
    fontSize: 15,
    fontWeight: "600",
  },
  levelDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  levelRange: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  currentBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
  },
  nextGoalContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#00cc66",
  },
  nextGoalTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  nextGoalText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  nextGoalProgress: {
    fontSize: 12,
    color: "#00cc66",
    marginTop: 4,
    fontWeight: "600",
  },
});
