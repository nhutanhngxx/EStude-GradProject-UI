import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CompetencyRoadmap from "../components/common/CompetencyRoadmap";

const { width } = Dimensions.get("window");

export default function SubjectCompetencyDetailScreen({ route, navigation }) {
  const { subjectData } = route.params;
  const [selectedTab, setSelectedTab] = useState("roadmap"); // roadmap | topics | history

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

  // Hàm tính status từ avgImprovement (theo yêu cầu mới)
  const getImprovementStatus = (avgImprovement) => {
    if (avgImprovement >= 20)
      return { status: "Tiến bộ rõ rệt", color: "#4CAF50" };
    if (avgImprovement >= 5)
      return { status: "Có cải thiện", color: "#2196F3" };
    if (avgImprovement >= -4) return { status: "Ổn định", color: "#9E9E9E" };
    if (avgImprovement >= -19) return { status: "Giảm nhẹ", color: "#FF9800" };
    return { status: "Cần cải thiện gấp", color: "#F44336" };
  };

  const getAccuracyLevel = (accuracy) => {
    if (accuracy >= 80) return { label: "Vững vàng", color: "#4CAF50" };
    if (accuracy >= 60) return { label: "Nâng cao", color: "#2196F3" };
    if (accuracy >= 40) return { label: "Trung bình", color: "#FF9800" };
    return { label: "Cơ bản", color: "#F44336" };
  };

  const sortedTopics = [...subjectData.topics].sort((a, b) => {
    const accA = a.avgAccuracy || 0;
    const accB = b.avgAccuracy || 0;
    return accB - accA;
  });

  const sortedEvaluations = [...subjectData.evaluations].sort(
    (a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {subjectData.subject}
        </Text>
        <View style={{ width: 24 }} />
      </View> */}

      <ScrollView style={styles.container}>
        {/* Subject Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Tổng quan Năng lực</Text>

          <View style={styles.bigAccuracyContainer}>
            <Text style={styles.bigAccuracyValue}>
              {subjectData.avgAccuracy}%
            </Text>
            <Text style={styles.bigAccuracyLabel}>Tỷ lệ đạt trung bình</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statsBox}>
              <MaterialCommunityIcons name="trophy" size={28} color="#4CAF50" />
              <Text style={styles.statsBoxValue}>{subjectData.mastered}</Text>
              <Text style={styles.statsBoxLabel}>Chủ đề vững</Text>
            </View>
            <View style={styles.statsBox}>
              <MaterialCommunityIcons
                name="trending-up"
                size={28}
                color="#2196F3"
              />
              <Text style={styles.statsBoxValue}>
                {subjectData.progressing}
              </Text>
              <Text style={styles.statsBoxLabel}>Đang tiến bộ</Text>
            </View>
            <View style={styles.statsBox}>
              <MaterialCommunityIcons
                name="book-open-variant"
                size={28}
                color="#FF9800"
              />
              <Text style={styles.statsBoxValue}>{subjectData.needsWork}</Text>
              <Text style={styles.statsBoxLabel}>Cần luyện thêm</Text>
            </View>
          </View>

          {subjectData.overallImprovement !== undefined && (
            <View
              style={[
                styles.improvementBadge,
                {
                  backgroundColor:
                    subjectData.overallImprovement > 0 ? "#E8F5E9" : "#FFEBEE",
                },
              ]}
            >
              <Ionicons
                name={
                  subjectData.overallImprovement > 0
                    ? "trending-up"
                    : "trending-down"
                }
                size={18}
                color={
                  subjectData.overallImprovement > 0 ? "#4CAF50" : "#F44336"
                }
              />
              <Text
                style={[
                  styles.improvementText,
                  {
                    color:
                      subjectData.overallImprovement > 0
                        ? "#4CAF50"
                        : "#F44336",
                  },
                ]}
              >
                {subjectData.overallImprovement > 0 ? "+" : ""}
                {subjectData.overallImprovement.toFixed(1)}% so với lần trước
              </Text>
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "roadmap" && styles.tabActive]}
            onPress={() => setSelectedTab("roadmap")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "roadmap" && styles.tabTextActive,
              ]}
            >
              Lộ trình
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "topics" && styles.tabActive]}
            onPress={() => setSelectedTab("topics")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "topics" && styles.tabTextActive,
              ]}
            >
              Chủ đề ({subjectData.totalTopics})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "history" && styles.tabActive]}
            onPress={() => setSelectedTab("history")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "history" && styles.tabTextActive,
              ]}
            >
              Lịch sử ({subjectData.evaluations.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {selectedTab === "roadmap" ? (
          <View style={styles.tabContent}>
            <CompetencyRoadmap
              currentAccuracy={subjectData.avgAccuracy}
              totalTopics={subjectData.totalTopics}
              masteredTopics={subjectData.mastered}
            />
          </View>
        ) : selectedTab === "topics" ? (
          <View style={styles.tabContent}>
            {/* <Text style={styles.sectionTitle}>🎯 Chi tiết từng Chủ đề</Text> */}

            {sortedTopics.map((topic, index) => {
              // Hiển thị avgAccuracy (trung bình)
              const displayAccuracy = topic.avgAccuracy || 0;
              const level = getAccuracyLevel(displayAccuracy);

              // Tính status từ avgImprovement
              const improvementStatus = getImprovementStatus(
                topic.avgImprovement || 0
              );

              return (
                <View key={index} style={styles.topicCard}>
                  <View style={styles.topicHeader}>
                    <Text style={styles.topicName}>{topic.topic}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${improvementStatus.color}15` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: improvementStatus.color },
                        ]}
                      >
                        {improvementStatus.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.topicContent}>
                    <View style={styles.accuracySection}>
                      <Text
                        style={[styles.accuracyBig, { color: level.color }]}
                      >
                        {Math.round(displayAccuracy)}%
                      </Text>
                      <Text style={styles.accuracyLabel}>{level.label}</Text>
                    </View>

                    <View style={styles.topicProgressContainer}>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${displayAccuracy}%`,
                              backgroundColor: level.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Improvement Trend */}
                  {topic.improvementHistory.length > 0 && (
                    <View style={styles.trendContainer}>
                      <Text style={styles.trendLabel}>
                        Xu hướng cải thiện theo thời gian:
                      </Text>

                      {/* Line Chart */}
                      <View style={styles.lineChartContainer}>
                        {/* Y-axis labels */}
                        <View style={styles.yAxisLabels}>
                          <Text style={styles.yAxisLabel}>100%</Text>
                          <Text style={styles.yAxisLabel}>0%</Text>
                          <Text style={styles.yAxisLabel}>-100%</Text>
                        </View>

                        {/* Chart area */}
                        <View style={styles.chartArea}>
                          {/* Grid lines */}
                          <View style={styles.gridLine} />
                          <View
                            style={[styles.gridLine, styles.gridLineZero]}
                          />
                          <View style={styles.gridLine} />

                          {/* SVG-like line path using Views */}
                          <View style={styles.lineChartPoints}>
                            {topic.improvementHistory
                              .slice(-6)
                              .map((imp, idx, arr) => {
                                // Normalize value to 0-100 range for positioning
                                // -100% to +100% range → 0 to 100 for bottom position
                                // If imp = 100%, bottom should be 100%
                                // If imp = 0%, bottom should be 50%
                                // If imp = -100%, bottom should be 0%
                                const normalizedValue =
                                  ((imp + 100) / 200) * 100;
                                const bottomPosition = Math.max(
                                  0,
                                  Math.min(100, normalizedValue)
                                );

                                const pointColor =
                                  imp > 5
                                    ? "#4CAF50"
                                    : imp < -5
                                    ? "#F44336"
                                    : "#FF9800";

                                // Calculate angle for connecting line
                                let lineAngle = 0;
                                let lineLength = 0;
                                if (idx < arr.length - 1) {
                                  const nextImp = arr[idx + 1];
                                  const nextNormalized =
                                    ((nextImp + 20) / 40) * 100;
                                  const nextBottom = Math.max(
                                    0,
                                    Math.min(100, nextNormalized)
                                  );
                                  const deltaY = nextBottom - bottomPosition;
                                  const deltaX = 100 / arr.length; // percentage width per point
                                  lineAngle =
                                    Math.atan2(deltaY, deltaX) *
                                    (180 / Math.PI);
                                  lineLength = Math.sqrt(
                                    deltaY * deltaY + deltaX * deltaX
                                  );
                                }

                                return (
                                  <View key={idx} style={styles.pointColumn}>
                                    {/* Data point */}
                                    <View
                                      style={[
                                        styles.dataPoint,
                                        {
                                          bottom: `${bottomPosition}%`,
                                          backgroundColor: "#fff",
                                          borderColor: pointColor,
                                        },
                                      ]}
                                    />

                                    {/* Value label - positioned smartly */}
                                    <View
                                      style={[
                                        styles.pointValueContainer,
                                        {
                                          bottom: `${bottomPosition}%`,
                                          // Shift up or down based on position to avoid overlap
                                          marginBottom:
                                            bottomPosition > 50 ? -20 : 15,
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.pointValue,
                                          { color: pointColor },
                                        ]}
                                      >
                                        {imp > 0 ? "+" : ""}
                                        {imp.toFixed(1)}%
                                      </Text>
                                    </View>
                                  </View>
                                );
                              })}
                          </View>

                          {/* Connecting lines as separate overlay - DIAGONAL LINES */}
                          <View style={styles.lineOverlay}>
                            {topic.improvementHistory
                              .slice(-6)
                              .map((imp, idx, arr) => {
                                if (idx >= arr.length - 1) return null;

                                const normalizedValue =
                                  ((imp + 100) / 200) * 100;
                                const bottomPosition = Math.max(
                                  0,
                                  Math.min(100, normalizedValue)
                                );

                                const nextImp = arr[idx + 1];
                                const nextNormalized =
                                  ((nextImp + 100) / 200) * 100;
                                const nextBottom = Math.max(
                                  0,
                                  Math.min(100, nextNormalized)
                                );

                                // Line color follows the NEXT point (destination)
                                const lineColor =
                                  nextImp > 5
                                    ? "#4CAF50"
                                    : nextImp < -5
                                    ? "#F44336"
                                    : "#FF9800";

                                // Calculate diagonal line correctly
                                // Segment width in percentage
                                const segmentWidthPercent = 100 / arr.length;
                                // Height difference in percentage
                                // Note: In CSS 'bottom', higher value = higher position
                                // So if nextBottom < bottomPosition, we need negative angle (go down)
                                const deltaYPercent =
                                  nextBottom - bottomPosition;

                                // Calculate actual pixel values (chart area is ~120px height)
                                const chartHeightPx = 120;
                                const chartWidthPx = width - 100; // approximate
                                const segmentWidthPx =
                                  chartWidthPx / arr.length;
                                // IMPORTANT: Negate deltaY because CSS 'bottom' is inverted from typical Y-axis
                                const deltaYPx =
                                  -(deltaYPercent / 100) * chartHeightPx;

                                // Calculate line length and angle
                                const lineLength = Math.sqrt(
                                  segmentWidthPx * segmentWidthPx +
                                    deltaYPx * deltaYPx
                                );
                                const angle =
                                  Math.atan2(deltaYPx, segmentWidthPx) *
                                  (180 / Math.PI);

                                return (
                                  <View
                                    key={`line-${idx}`}
                                    style={[
                                      styles.connectingLine,
                                      {
                                        left: `${
                                          (idx * 100) / arr.length +
                                          50 / arr.length
                                        }%`,
                                        bottom: `${bottomPosition}%`,
                                        width: lineLength,
                                        height: 3,
                                        backgroundColor: lineColor,
                                        opacity: 0.9,
                                        transform: [{ rotate: `${angle}deg` }],
                                        transformOrigin: "left center",
                                      },
                                    ]}
                                  />
                                );
                              })}
                          </View>
                        </View>
                      </View>

                      {/* X-axis time labels */}
                      <View style={styles.xAxisLabels}>
                        {topic.improvementHistory.slice(-6).map((_, idx) => (
                          <Text key={idx} style={styles.xAxisLabel}>
                            T{idx}
                          </Text>
                        ))}
                      </View>

                      {/* Legend */}
                      <View style={styles.chartLegend}>
                        <View style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: "#4CAF50" },
                            ]}
                          />
                          <Text style={styles.legendText}>Tốt (&gt;5%)</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: "#FF9800" },
                            ]}
                          />
                          <Text style={styles.legendText}>Ổn định</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: "#F44336" },
                            ]}
                          />
                          <Text style={styles.legendText}>Giảm (&lt;-5%)</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Average Improvement */}
                  {topic.improvementHistory.length > 0 && (
                    <Text style={styles.avgImprovement}>
                      TB cải thiện:{" "}
                      <Text
                        style={{
                          fontWeight: "bold",
                          color:
                            topic.improvementHistory.reduce(
                              (a, b) => a + b,
                              0
                            ) /
                              topic.improvementHistory.length >
                            0
                              ? "#4CAF50"
                              : "#F44336",
                        }}
                      >
                        {(
                          topic.improvementHistory.reduce((a, b) => a + b, 0) /
                          topic.improvementHistory.length
                        ).toFixed(1)}
                        %
                      </Text>
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* <View style={styles.sectionHeader}>
              <Ionicons
                name="time-outline"
                size={20}
                color="#007AFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.sectionTitle}>Lịch sử Đánh giá</Text>
            </View> */}

            {sortedEvaluations.map((evaluation, index) => {
              const evalData = evaluation.detailedAnalysis;
              const overallImp =
                evalData?.overall_improvement?.improvement || 0;

              return (
                <View key={index} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View>
                      <Text style={styles.historyDate}>
                        {new Date(evaluation.generatedAt).toLocaleDateString(
                          "vi-VN",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </Text>
                      <Text style={styles.historyTime}>
                        {new Date(evaluation.generatedAt).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.historyBadge,
                        {
                          backgroundColor:
                            overallImp > 0 ? "#E8F5E9" : "#FFEBEE",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.historyBadgeText,
                          { color: overallImp > 0 ? "#4CAF50" : "#F44336" },
                        ]}
                      >
                        {overallImp > 0 ? "+" : ""}
                        {overallImp.toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  {evalData?.summary && (
                    <Text style={styles.historySummary} numberOfLines={3}>
                      {evalData.summary}
                    </Text>
                  )}

                  {evalData?.topics && (
                    <View style={styles.historyTopics}>
                      {evalData.topics.map((topic, idx) => (
                        <View key={idx} style={styles.historyTopicItem}>
                          <Text style={styles.historyTopicName}>
                            {topic.topic}
                          </Text>
                          <Text
                            style={[
                              styles.historyTopicAccuracy,
                              {
                                color:
                                  topic.improvement > 0
                                    ? "#4CAF50"
                                    : topic.improvement < 0
                                    ? "#F44336"
                                    : "#9E9E9E",
                              },
                            ]}
                          >
                            {topic.new_accuracy}% (
                            {topic.improvement > 0 ? "+" : ""}
                            {topic.improvement}%)
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* {evalData?.next_action && (
                    <TouchableOpacity
                      style={styles.viewActionButton}
                      onPress={() => {
                        // TODO: Navigate to action detail
                      }}
                    >
                      <Text style={styles.viewActionText}>
                        Xem gợi ý hành động
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#00cc66"
                      />
                    </TouchableOpacity>
                  )} */}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  overviewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  bigAccuracyContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  bigAccuracyValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#00cc66",
  },
  bigAccuracyLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statsBox: {
    alignItems: "center",
  },
  statsBoxValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 4,
  },
  statsBoxLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },
  improvementBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 8,
  },
  improvementText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#00cc66",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#fff",
  },
  tabContent: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  topicCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  topicName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  topicContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  accuracySection: {
    alignItems: "center",
    marginRight: 16,
  },
  accuracyBig: {
    fontSize: 28,
    fontWeight: "bold",
  },
  accuracyLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  topicProgressContainer: {
    flex: 1,
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
  trendContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  trendLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    fontWeight: "600",
  },
  lineChartContainer: {
    flexDirection: "row",
    height: 120,
    marginBottom: 8,
  },
  yAxisLabels: {
    width: 40,
    justifyContent: "space-between",
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 10,
    color: "#999",
    textAlign: "right",
  },
  chartArea: {
    flex: 1,
    position: "relative",
    justifyContent: "space-between",
  },
  gridLine: {
    height: 1,
    backgroundColor: "#f0f0f0",
    width: "100%",
  },
  gridLineZero: {
    backgroundColor: "#ddd",
    height: 1.5,
  },
  lineChartPoints: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  lineOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  connectingLine: {
    position: "absolute",
    height: 3,
    borderRadius: 1.5,
  },
  pointColumn: {
    flex: 1,
    position: "relative",
    alignItems: "center",
  },
  dataPoint: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    backgroundColor: "#fff",
    zIndex: 3,
  },
  pointValueContainer: {
    position: "absolute",
    alignItems: "center",
    zIndex: 4,
    minWidth: 45,
  },
  pointValue: {
    fontSize: 9,
    fontWeight: "700",
    backgroundColor: "#fff",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  connectLine: {
    position: "absolute",
    width: "100%",
    height: 2,
    left: "50%",
    zIndex: 1,
  },
  xAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingLeft: 40,
    marginTop: 4,
  },
  xAxisLabel: {
    fontSize: 10,
    color: "#999",
    flex: 1,
    textAlign: "center",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: "#666",
  },
  trendBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 50,
    gap: 4,
  },
  trendBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 5,
  },
  avgImprovement: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  historyTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  historyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  historyBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  historySummary: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  historyTopics: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  historyTopicItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  historyTopicName: {
    fontSize: 13,
    color: "#333",
    flex: 1,
  },
  historyTopicAccuracy: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  viewActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  viewActionText: {
    fontSize: 13,
    color: "#00cc66",
    fontWeight: "600",
    marginRight: 4,
  },
});
