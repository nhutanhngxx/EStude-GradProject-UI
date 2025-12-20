import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { AuthContext } from "../contexts/AuthContext";
import attendanceService from "../services/attandanceService";
import classSubjectService from "../services/classSubjectService";
import assignmentService from "../services/assignmentService";
import { useToast } from "../contexts/ToastContext";
import AttendanceOverview from "../components/common/AttendanceOverview";
import ProgressBar from "../components/common/ProgressBar";
import StudyOverviewCard from "../components/common/StudyOverviewCard";
import TodayScheduleCard from "../components/common/TodayScheduleCard";
import RecentAssignmentsCard from "../components/common/RecentAssignmentsCard";
import CompetencyOverviewCard from "../components/common/CompetencyOverviewCard";
import LearningRoadmapCard from "../components/common/LearningRoadmapCard";
import studentStudyService from "../services/studentStudyService";
import scheduleService from "../services/scheduleService";
import aiService from "../services/aiService";

import bannerLight from "../assets/images/banner-light.png";
import UserHeader from "../components/common/UserHeader";

export default function HomeStudentScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const { showToast } = useToast();
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [totalAttendance, setTotalAttendance] = useState({
    present: 0,
    total: 0,
    percent: 0,
  });
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [todayPlan, setTodayPlan] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [competencyStats, setCompetencyStats] = useState(null);
  const [loadingCompetency, setLoadingCompetency] = useState(true);
  const [learningRoadmap, setLearningRoadmap] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const assignments = await assignmentService.getAssignmentsByStudent(
        user.userId
      );

      if (Array.isArray(assignments)) {
        const sorted = assignments.sort(
          (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
        );

        const detailedAssignments = await Promise.all(
          sorted.slice(0, 3).map(async (a) => {
            try {
              const detail = await assignmentService.getAssignmentById(
                a.assignmentId
              );

              const classSubject = detail?.data?.classSubject || {};

              // Fix: Map đúng field name từ Backend
              const subjectName =
                classSubject?.subject?.subjectName ||
                classSubject?.subject?.name ||
                "Toán";

              const teacherName =
                classSubject?.teacher?.fullName ||
                detail?.data?.teacher?.fullName ||
                "Chưa rõ";

              const subjectInfo = {
                classSubjectId:
                  classSubject?.classSubjectId || a.classSubjectId || null,
                classId: classSubject?.clazz?.classId || a.classId || null,
                className:
                  classSubject?.clazz?.className || a.className || "Chưa rõ",
                name: subjectName,
                semester: classSubject?.semester || "HK1 2025 - 2026",
                beginDate: classSubject?.beginDate || "2025-09-05",
                endDate: classSubject?.endDate || "2026-01-15",
                teacherName,
                description: `${subjectName} - ${
                  classSubject?.clazz?.className || "Không rõ"
                }`,
              };

              return {
                ...a,
                teacherName,
                subject: subjectInfo,
              };
            } catch (error) {
              console.warn(
                `Không lấy được chi tiết của assignment ${a.assignmentId}`
              );
              return {
                ...a,
                teacherName: "Chưa rõ",
                subject: {
                  classSubjectId: a.classSubjectId || null,
                  classId: a.classId || null,
                  className: a.className || "Không rõ",
                  name: "Không rõ",
                  semester: "HK1 2025 - 2026",
                  beginDate: "2025-09-05",
                  endDate: "2026-01-15",
                  teacherName: "Chưa rõ",
                  description: "Không rõ - Không rõ",
                },
              };
            }
          })
        );

        setRecentAssignments(detailedAssignments);
      } else {
        setRecentAssignments([]);
      }
    } catch (error) {
      console.error("Lỗi khi load assignments:", error);
      setRecentAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const subjectsData =
        await classSubjectService.getClassSubjectsByStudentWithDetails({
          studentId: user?.userId,
        });
      const subjectsWithSessions = await Promise.all(
        subjectsData.map(async (subject) => {
          const sessions =
            await attendanceService.getAttentanceSessionByClassSubjectForStudent(
              subject.classSubjectId,
              user?.userId
            );
          return { ...subject, sessions: sessions || [] };
        })
      );

      const totalPresent = subjectsWithSessions.reduce(
        (sum, s) =>
          sum + s.sessions.filter((sess) => sess.status === "PRESENT").length,
        0
      );
      const totalSessionsCount = subjectsWithSessions.reduce(
        (sum, s) => sum + s.sessions.length,
        0
      );
      const percent = totalSessionsCount
        ? Math.round((totalPresent / totalSessionsCount) * 100)
        : 0;

      setTotalAttendance({
        present: totalPresent,
        total: totalSessionsCount,
        percent,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      if (user?.userId) {
        const overviewData = await studentStudyService.getAcademicRecords(
          user.userId
        );
        if (overviewData) {
          setOverview({
            gpa: overviewData.averageScore ?? 0,
            rank: overviewData.rank ?? "-",
            totalStudents: overviewData.totalStudents ?? "-",
            passedCredits: overviewData.completedSubjects ?? 0,
            requiredCredits: overviewData.totalSubjects ?? 0,
            submissionRate: overviewData.submissionRate ?? 0,
            attendanceRate: overviewData.attendanceRate ?? 0,
          });
        }
      }
    } catch (err) {
      console.error("Load overview failed:", err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      setLoadingSchedule(true);

      const schedules = await scheduleService.getSchedulesByStudent(
        user.userId
      );

      if (Array.isArray(schedules)) {
        const today = new Date().toISOString().split("T")[0];
        const todaySchedules = schedules.filter((s) => s.date === today);

        const formatted = todaySchedules.map((s) => ({
          id: s.scheduleId,
          subject: s.classSubject?.subjectName || "Không rõ",
          time: `Tiết ${s.startPeriod}${
            s.endPeriod && s.endPeriod !== s.startPeriod
              ? `-${s.endPeriod}`
              : ""
          }`,
          room: s.room || "Không rõ",
          status:
            s.status === "SCHEDULED"
              ? "upcoming"
              : s.status === "ONGOING"
              ? "in_progress"
              : "done",
        }));

        setTodayPlan(formatted);
      } else {
        setTodayPlan([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy lịch học hôm nay:", error);
      setTodayPlan([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const fetchCompetencyStats = async () => {
    try {
      setLoadingCompetency(true);
      const improvements = await aiService.getAllUserImprovements(token);

      if (Array.isArray(improvements) && improvements.length > 0) {
        // Process similar to CompetencyMapScreen
        const subjectMap = {};

        improvements.forEach((item) => {
          const subject = item.detailedAnalysis?.subject || "Không rõ";

          if (!subjectMap[subject]) {
            subjectMap[subject] = {
              subject,
              topics: {},
            };
          }

          // Lấy overall_improvement của evaluation này
          const overallImprovement = item.detailedAnalysis?.overall_improvement;
          const improvementValue = overallImprovement?.improvement || 0;
          const newAverage = overallImprovement?.new_average || 0;

          const topics = item.detailedAnalysis?.topics || [];
          topics.forEach((topic) => {
            const topicName = topic.topic;
            // Normalize topic name để nhóm topics giống nhau
            const normalizedTopicName = topicName.trim().toLowerCase();

            if (!subjectMap[subject].topics[normalizedTopicName]) {
              subjectMap[subject].topics[normalizedTopicName] = {
                accuracyHistory: [],
                improvementHistory: [],
                count: 0,
              };
            }

            // Lưu tất cả accuracy và improvement để tính trung bình
            subjectMap[subject].topics[
              normalizedTopicName
            ].accuracyHistory.push(topic.new_accuracy);
            subjectMap[subject].topics[
              normalizedTopicName
            ].improvementHistory.push(topic.improvement);
            subjectMap[subject].topics[normalizedTopicName].count++;
          });
        });

        const subjectStats = Object.values(subjectMap).map((subjectData) => {
          const topicsList = Object.values(subjectData.topics).map((topic) => {
            // Tính trung bình accuracy và improvement
            const avgAccuracy =
              topic.accuracyHistory.reduce((sum, val) => sum + val, 0) /
              topic.count;
            const avgImprovement =
              topic.improvementHistory.reduce((sum, val) => sum + val, 0) /
              topic.count;

            return {
              avgAccuracy: Math.round(avgAccuracy * 10) / 10,
              avgImprovement: Math.round(avgImprovement * 10) / 10,
            };
          });

          // Tính tỷ lệ đạt trung bình
          const totalAvgAccuracy = topicsList.reduce(
            (sum, t) => sum + t.avgAccuracy,
            0
          );
          const avgAccuracy =
            topicsList.length > 0 ? totalAvgAccuracy / topicsList.length : 0;

          // Đếm topics theo avgAccuracy
          const mastered = topicsList.filter((t) => t.avgAccuracy >= 80).length;
          const progressing = topicsList.filter((t) => {
            return t.avgAccuracy >= 50 && t.avgAccuracy < 80;
          }).length;
          const needsWork = topicsList.filter((t) => t.avgAccuracy < 50).length;

          return {
            avgAccuracy: Math.round(avgAccuracy * 10) / 10,
            mastered,
            progressing,
            needsWork,
            totalTopics: topicsList.length,
          };
        });

        const stats = {
          totalSubjects: subjectStats.length,
          totalTopics: subjectStats.reduce((sum, s) => sum + s.totalTopics, 0),
          totalMastered: subjectStats.reduce((sum, s) => sum + s.mastered, 0),
          totalProgressing: subjectStats.reduce(
            (sum, s) => sum + s.progressing,
            0
          ),
          totalNeedsWork: subjectStats.reduce((sum, s) => sum + s.needsWork, 0),
          subjectStats,
        };

        setCompetencyStats(stats);
      } else {
        setCompetencyStats(null);
      }
    } catch (error) {
      console.error("Lỗi khi tải competency stats:", error);
      setCompetencyStats(null);
    } finally {
      setLoadingCompetency(false);
    }
  };

  const fetchLearningRoadmap = async () => {
    try {
      setLoadingRoadmap(true);

      // Gọi API lấy roadmap LATEST (có resultId và full data)
      const response = await aiService.getRoadmapLatest(token);

      // Check if response is empty or user has no roadmap yet
      if (!response || !response.resultId) {
        // User chưa có roadmap - trạng thái bình thường cho user mới
        console.log(
          "ℹ️ No active roadmap found (new user or no assessments yet)"
        );
        setLearningRoadmap({
          hasActiveRoadmap: false,
        });
        return;
      }

      console.log("✅ Roadmap Latest API Response:", response);

      // Response structure:
      // {
      //   resultId: 44,
      //   detailedAnalysis: { subject, phases, ... },
      //   comment: "..."
      // }

      const resultId = response.resultId;
      const detailedAnalysis = response.detailedAnalysis || {};
      const subject = detailedAnalysis.subject || "Môn học";
      const overallGoal =
        detailedAnalysis.overall_goal || "Cải thiện kết quả học tập";

      // Tính progress từ phases (nếu có)
      let completionPercent = 0;
      let completedTasks = 0;
      let totalTasks = 0;
      let currentPhaseName = "Bắt đầu học";

      if (detailedAnalysis.phases && detailedAnalysis.phases.length > 0) {
        detailedAnalysis.phases.forEach((phase, index) => {
          if (phase.daily_tasks) {
            phase.daily_tasks.forEach((day) => {
              if (day.tasks) {
                totalTasks += day.tasks.length;
                day.tasks.forEach((task) => {
                  if (task.completed) completedTasks++;
                });
              }
            });
          }
          // Lấy phase đầu tiên chưa hoàn thành
          if (index === 0 || completedTasks > 0) {
            currentPhaseName =
              phase.phase_name || `Giai đoạn ${phase.phase_number}`;
          }
        });
        if (totalTasks > 0) {
          completionPercent = Math.round((completedTasks / totalTasks) * 100);
        }
      }

      setLearningRoadmap({
        hasActiveRoadmap: true,
        progress: completionPercent,
        currentPhase: currentPhaseName,
        tasksCompleted: completedTasks,
        totalTasks: totalTasks,
        roadmapId: `roadmap_${resultId}`,
        subject: subject,
        overallGoal: overallGoal,
        resultId: resultId, // CRITICAL: Lưu để navigate
      });

      console.log("✅ Fetched roadmap data:", {
        resultId: resultId,
        subject: subject,
        progress: completionPercent,
        currentPhase: currentPhaseName,
        totalTasks: totalTasks,
      });
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      setLearningRoadmap({
        hasActiveRoadmap: false,
      });
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAssignments(),
        fetchAttendance(),
        fetchOverview(),
        fetchTodaySchedule(),
        fetchCompetencyStats(),
        fetchLearningRoadmap(),
      ]);
      showToast("Dữ liệu đã được làm mới!", { type: "success" });
    } catch (error) {
      console.error("Refresh error:", error);
      showToast("Lỗi khi làm mới dữ liệu!", { type: "error" });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchAttendance();
    fetchOverview();
    fetchTodaySchedule();
    fetchLearningRoadmap();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCompetencyStats();
    }, [])
  );

  const handleViewLearningRoadmap = () => {
    console.log("🚀 handleViewLearningRoadmap called:", {
      hasActiveRoadmap: learningRoadmap?.hasActiveRoadmap,
      resultId: learningRoadmap?.resultId,
      learningRoadmapState: learningRoadmap,
    });

    if (learningRoadmap?.hasActiveRoadmap && learningRoadmap?.resultId) {
      // Có roadmap → navigate đến roadmap screen với resultId
      // Screen sẽ tự fetch full roadmap data
      console.log(
        "✅ Navigate to AssessmentLearningRoadmap with resultId:",
        learningRoadmap.resultId
      );
      navigation.navigate("AssessmentLearningRoadmap", {
        resultId: learningRoadmap.resultId,
        roadmap: null, // Không truyền data, để screen tự fetch
        evaluation: null,
      });
    } else {
      // Chưa có roadmap → navigate đến assessment để tạo
      console.log("⚠️ No resultId, navigate to AssessmentSubjectSelection");
      navigation.navigate("AssessmentSubjectSelection");
    }
  };

  const quickActions = [
    { id: "qa1", label: "Môn học", iconName: "book", color: "#00cc66" }, // xanh lá chủ đạo
    // { id: "qa2", label: "Nộp bài", iconName: "upload", color: "#00cc66" }, // nếu dùng
    { id: "qa3", label: "Lịch học", iconName: "calendar", color: "#66d98c" }, // xanh lá nhạt hơn
    {
      id: "qa4",
      label: "Đánh giá",
      iconName: "check-square-o",
      color: "#00994d",
    }, // xanh lá đậm
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00cc66"]}
            tintColor={"#00cc66"}
          />
        }
      >
        <StatusBar barStyle="dark-content" />
        <UserHeader />

        {/* Tác vụ nhanh */}
        <View style={styles.card}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Ionicons name="flash" size={22} color="#4CAF50" />
            <Text style={[styles.cardTitle, { color: "#1B5E20" }]}>
              Các tác vụ nhanh
            </Text>
          </View>
          <View style={styles.quickActionRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickAction}
                onPress={() => {
                  switch (action.id) {
                    case "qa1":
                      navigation.navigate("SubjectList");
                      break;
                    case "qa2":
                      navigation.navigate("NopBai");
                      break;
                    case "qa3":
                      navigation.navigate("ScheduleList");
                      break;
                    case "qa4":
                      navigation.navigate("AssessmentSubjectSelection");
                      break;
                  }
                }}
              >
                <FontAwesome
                  name={action.iconName}
                  size={28}
                  color={action.color}
                  style={styles.quickIcon}
                />
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.quickAction, styles.allAction]}
              onPress={() => navigation.navigate("FullChucNang")}
            >
              <MaterialIcons
                name="grid-view"
                size={28}
                color="#555555"
                style={styles.quickIcon}
              />
              <Text style={styles.quickLabel}>Tất cả</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tổng quan học tập */}
        {loadingOverview ? (
          <ActivityIndicator
            size="large"
            color="#00cc66"
            style={{ marginTop: 16 }}
          />
        ) : overview ? (
          <StudyOverviewCard
            gpa={overview.gpa}
            rank={overview.rank}
            totalStudents={overview.totalStudents}
            passedCredits={overview.passedCredits}
            requiredCredits={overview.requiredCredits}
            submissionRate={overview.submissionRate}
            attendanceRate={overview.attendanceRate}
            onPressDetail={() => navigation.navigate("DetailStudy")}
          />
        ) : (
          <Text style={styles.cardTitle}>Không có dữ liệu học tập</Text>
        )}

        {/* Bản đồ Năng lực */}
        {!loadingCompetency && competencyStats && (
          <CompetencyOverviewCard
            stats={competencyStats}
            onPress={() => navigation.navigate("CompetencyMap")}
          />
        )}

        {/* Lộ trình học tập */}
        {!loadingRoadmap && (
          <LearningRoadmapCard
            hasActiveRoadmap={learningRoadmap?.hasActiveRoadmap || false}
            progress={learningRoadmap?.progress || 0}
            currentPhase={
              learningRoadmap?.currentPhase || "Ôn lại kiến thức yếu"
            }
            tasksCompleted={learningRoadmap?.tasksCompleted || 0}
            totalTasks={learningRoadmap?.totalTasks || 8}
            onPress={handleViewLearningRoadmap}
          />
        )}

        {loadingAssignments ? (
          <ActivityIndicator
            size="large"
            color="#00cc66"
            style={{ marginTop: 16 }}
          />
        ) : (
          <RecentAssignmentsCard
            title="Bài tập gần đây"
            assignments={recentAssignments.map((a) => ({
              id: a.assignmentId,
              name: a.title,
              dueDate: a.dueDate,
              subject: a.subject,
              status: a.status,
            }))}
          />
        )}

        {/* Lịch học hôm nay */}
        {loadingSchedule ? (
          <ActivityIndicator
            size="large"
            color="#00cc66"
            style={{ marginTop: 16 }}
          />
        ) : todayPlan.length > 0 ? (
          <TodayScheduleCard
            title="Lịch học hôm nay"
            scheduleList={todayPlan}
            onPressDetail={() => navigation.navigate("ScheduleList")}
          />
        ) : (
          <View style={styles.card}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Ionicons name="calendar" size={22} color="#4CAF50" />
              <Text style={[styles.cardTitle, { color: "#1B5E20" }]}>
                Lịch học hôm nay
              </Text>
            </View>
            <Text style={{ color: "#777", marginTop: 8 }}>
              Không có lịch học hôm nay
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  subtitle: { fontSize: 15, color: "#555" },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  banner: {
    width: 200,
    height: 60,
    resizeMode: "contain",
    marginBottom: 4,
    alignSelf: "flex-start",
    marginLeft: -20,
  },
  highlight: {
    fontWeight: "bold",
  },
  subGreeting: {
    fontSize: 14,
    color: "#777",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    // marginBottom: 8,
  },
  link: { color: "#007bff" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  statNote: {
    fontSize: 12,
    color: "#999",
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  progressWrap: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00cc66",
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  planItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  planSubject: {
    fontSize: 14,
    fontWeight: "bold",
  },
  planTime: {
    fontSize: 12,
    color: "#666",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    color: "#fff",
    fontSize: 12,
    backgroundColor: "#007bff",
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  attendanceSubject: {
    fontWeight: "bold",
  },
  attendanceDetail: { color: "#555" },
  quickActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickAction: {
    width: "23%",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  quickLabel: {
    fontSize: 13,
    textAlign: "center",
  },
  quickHint: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  allAction: {},
});
