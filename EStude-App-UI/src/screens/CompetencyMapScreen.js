import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import aiService from "../services/aiService";

export default function CompetencyMapScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [improvements, setImprovements] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);

  const fetchImprovements = async () => {
    try {
      setLoading(true);
      const data = await aiService.getAllUserImprovements(token);
      
      if (Array.isArray(data) && data.length > 0) {
        setImprovements(data);
        processSubjectStats(data);
      } else {
        setImprovements([]);
        setSubjectStats([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu năng lực:", error);
      showToast("Không thể tải dữ liệu năng lực", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const processSubjectStats = (data) => {
    // Nhóm theo môn học
    const subjectMap = {};
    
    data.forEach((item) => {
      const subject = item.detailedAnalysis?.subject || "Không rõ";
      
      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          subject,
          evaluations: [],
          topics: {},
          totalEvaluations: 0,
        };
      }
      
      subjectMap[subject].evaluations.push(item);
      subjectMap[subject].totalEvaluations++;
      
      // Tổng hợp topics
      const topics = item.detailedAnalysis?.topics || [];
      topics.forEach((topic) => {
        const topicName = topic.topic;
        
        if (!subjectMap[subject].topics[topicName]) {
          subjectMap[subject].topics[topicName] = {
            topic: topicName,
            accuracyHistory: [],
            improvementHistory: [],
            latestAccuracy: 0,
            averageImprovement: 0,
            status: "Chưa đánh giá",
          };
        }
        
        subjectMap[subject].topics[topicName].accuracyHistory.push(topic.new_accuracy);
        subjectMap[subject].topics[topicName].improvementHistory.push(topic.improvement);
        subjectMap[subject].topics[topicName].latestAccuracy = topic.new_accuracy;
        subjectMap[subject].topics[topicName].status = topic.status;
      });
    });
    
    // Tính toán thống kê
    const stats = Object.values(subjectMap).map((subjectData) => {
      const topicsList = Object.values(subjectData.topics);
      
      // Tính tỷ lệ đạt trung bình của môn
      const totalAccuracy = topicsList.reduce(
        (sum, t) => sum + (t.latestAccuracy || 0),
        0
      );
      const avgAccuracy = topicsList.length > 0 
        ? totalAccuracy / topicsList.length 
        : 0;
      
      // Tính overall improvement
      const latestEval = subjectData.evaluations[0];
      const overallImprovement = latestEval?.detailedAnalysis?.overall_improvement?.improvement || 0;
      
      // Đếm số topics theo status
      const mastered = topicsList.filter(t => t.latestAccuracy >= 80).length;
      const progressing = topicsList.filter(t => t.latestAccuracy >= 50 && t.latestAccuracy < 80).length;
      const needsWork = topicsList.filter(t => t.latestAccuracy < 50).length;
      
      return {
        subject: subjectData.subject,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
        overallImprovement,
        totalTopics: topicsList.length,
        mastered,
        progressing,
        needsWork,
        topics: topicsList,
        evaluations: subjectData.evaluations,
        lastEvaluated: latestEval?.generatedAt,
      };
    });
    
    // Sắp xếp theo avgAccuracy giảm dần
    stats.sort((a, b) => b.avgAccuracy - a.avgAccuracy);
    
    setSubjectStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchImprovements();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchImprovements();
  }, []);

  const getCompetencyLevel = (accuracy) => {
    if (accuracy >= 80) return { level: "Vững vàng", color: "#4CAF50", icon: "trophy" };
    if (accuracy >= 60) return { level: "Nâng cao", color: "#2196F3", icon: "trending-up" };
    if (accuracy >= 40) return { level: "Trung bình", color: "#FF9800", icon: "school" };
    return { level: "Cơ bản", color: "#F44336", icon: "book-outline" };
  };

  const getImprovementIcon = (improvement) => {
    if (improvement > 20) return { icon: "trending-up", color: "#4CAF50" };
    if (improvement > 0) return { icon: "arrow-up", color: "#8BC34A" };
    if (improvement === 0) return { icon: "minus", color: "#9E9E9E" };
    if (improvement > -20) return { icon: "arrow-down", color: "#FF9800" };
    return { icon: "trending-down", color: "#F44336" };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bản đồ Năng lực</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00cc66" />
          <Text style={styles.loadingText}>Đang tải dữ liệu năng lực...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (subjectStats.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bản đồ Năng lực</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="map-marker-off" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có dữ liệu đánh giá năng lực</Text>
          <Text style={styles.emptySubText}>
            Hãy hoàn thành bài tập và luyện tập để xây dựng bản đồ năng lực của bạn
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bản đồ Năng lực</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00cc66"]}
            tintColor="#00cc66"
          />
        }
      >
        {/* Tổng quan */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>📊 Tổng quan Năng lực</Text>
          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{subjectStats.length}</Text>
              <Text style={styles.statLabel}>Môn học</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {subjectStats.reduce((sum, s) => sum + s.totalTopics, 0)}
              </Text>
              <Text style={styles.statLabel}>Chủ đề</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {subjectStats.reduce((sum, s) => sum + s.mastered, 0)}
              </Text>
              <Text style={styles.statLabel}>Đã vững</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#FF9800" }]}>
                {subjectStats.reduce((sum, s) => sum + s.needsWork, 0)}
              </Text>
              <Text style={styles.statLabel}>Cần luyện</Text>
            </View>
          </View>
        </View>

        {/* Roadmap theo môn học */}
        <Text style={styles.sectionTitle}>🗺️ Lộ trình Năng lực theo Môn học</Text>
        
        {subjectStats.map((subjectData, index) => {
          const competency = getCompetencyLevel(subjectData.avgAccuracy);
          const improvement = getImprovementIcon(subjectData.overallImprovement);
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.subjectCard}
              onPress={() =>
                navigation.navigate("SubjectCompetencyDetail", {
                  subjectData,
                })
              }
            >
              <View style={styles.subjectHeader}>
                <View style={styles.subjectTitleRow}>
                  <MaterialCommunityIcons
                    name={competency.icon}
                    size={24}
                    color={competency.color}
                  />
                  <Text style={styles.subjectName}>{subjectData.subject}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>

              {/* Competency Level */}
              <View style={styles.competencyRow}>
                <View
                  style={[
                    styles.competencyBadge,
                    { backgroundColor: `${competency.color}15` },
                  ]}
                >
                  <Text style={[styles.competencyText, { color: competency.color }]}>
                    {competency.level}
                  </Text>
                </View>
                <View style={styles.accuracyRow}>
                  <Text style={styles.accuracyValue}>{subjectData.avgAccuracy}%</Text>
                  <Ionicons
                    name={improvement.icon}
                    size={18}
                    color={improvement.color}
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${subjectData.avgAccuracy}%`,
                        backgroundColor: competency.color,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Topics breakdown */}
              <View style={styles.topicsBreakdown}>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: "#4CAF50" }]} />
                  <Text style={styles.breakdownText}>
                    {subjectData.mastered} vững
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: "#2196F3" }]} />
                  <Text style={styles.breakdownText}>
                    {subjectData.progressing} tiến bộ
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: "#FF9800" }]} />
                  <Text style={styles.breakdownText}>
                    {subjectData.needsWork} cần luyện
                  </Text>
                </View>
              </View>

              {/* Last evaluated */}
              {subjectData.lastEvaluated && (
                <Text style={styles.lastEvaluated}>
                  Đánh giá gần nhất:{" "}
                  {new Date(subjectData.lastEvaluated).toLocaleDateString("vi-VN")}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

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
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  overviewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  overviewStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00cc66",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  subjectCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333",
  },
  competencyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  competencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  competencyText: {
    fontSize: 13,
    fontWeight: "600",
  },
  accuracyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  accuracyValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  progressBarContainer: {
    marginBottom: 12,
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
  topicsBreakdown: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  breakdownText: {
    fontSize: 12,
    color: "#666",
  },
  lastEvaluated: {
    fontSize: 11,
    color: "#999",
    marginTop: 8,
    fontStyle: "italic",
  },
});
