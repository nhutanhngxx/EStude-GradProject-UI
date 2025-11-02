import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Component hiển thị card Lộ trình học tập trên trang chủ
 *
 * Props:
 * - onPress: Function callback khi nhấn vào card
 * - hasActiveRoadmap: Boolean - có lộ trình đang thực hiện không
 * - progress: Number - % hoàn thành (0-100)
 * - currentPhase: String - tên phase hiện tại
 * - tasksCompleted: Number - số tasks đã hoàn thành
 * - totalTasks: Number - tổng số tasks
 */
export default function LearningRoadmapCard({
  onPress,
  hasActiveRoadmap = false,
  progress = 0,
  currentPhase = "Ôn lại kiến thức yếu",
  tasksCompleted = 0,
  totalTasks = 8,
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="map" size={24} color="#7C3AED" />
          <Text style={styles.title}>Lộ trình học tập</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>

      {hasActiveRoadmap ? (
        <View style={styles.content}>
          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Tiến độ</Text>
              <Text style={styles.progressValue}>{progress.toFixed(0)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[styles.progressBarFill, { width: `${progress}%` }]}
              />
            </View>
          </View>

          {/* Current Phase */}
          <View style={styles.phaseSection}>
            <View style={styles.phaseLabel}>
              <Ionicons name="flag" size={14} color="#FF9800" />
              <Text style={styles.phaseLabelText}>Giai đoạn hiện tại</Text>
            </View>
            <Text style={styles.phaseText} numberOfLines={1}>
              {currentPhase}
            </Text>
          </View>

          {/* Tasks Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.statText}>
                {tasksCompleted}/{totalTasks} nhiệm vụ
              </Text>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={onPress}>
              <Text style={styles.continueButtonText}>Tiếp tục học</Text>
              <Ionicons name="arrow-forward" size={14} color="#7C3AED" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContent}>
          <Ionicons name="compass-outline" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>Chưa có lộ trình học tập</Text>
          <Text style={styles.emptyDescription}>
            Làm bài đánh giá để nhận lộ trình học tập cá nhân hóa
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={onPress}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.createButtonText}>Tạo lộ trình</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginLeft: 8,
  },
  content: {
    gap: 12,
  },
  progressSection: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: "#666",
  },
  progressValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7C3AED",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 4,
  },
  phaseSection: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  phaseLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  phaseLabelText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
  },
  phaseText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F3F0FF",
    borderRadius: 8,
  },
  continueButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7C3AED",
    marginRight: 4,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
  },
  emptyDescription: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#7C3AED",
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6,
  },
});
