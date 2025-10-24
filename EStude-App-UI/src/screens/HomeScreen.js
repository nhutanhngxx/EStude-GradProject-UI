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
              const teacherName =
                classSubject?.teacher?.fullName ||
                detail?.data?.teacher?.fullName ||
                "Chưa rõ";

              const subjectInfo = {
                classSubjectId:
                  classSubject?.classSubjectId || a.classSubjectId || null,
                classId: classSubject?.classId || a.classId || null,
                className: classSubject?.className || a.className || "Chưa rõ",
                name: classSubject?.subject?.name || "Không rõ",
                semester: classSubject?.semester || "HK1 2025 - 2026",
                beginDate: classSubject?.beginDate || "2025-09-05",
                endDate: classSubject?.endDate || "2026-01-15",
                teacherName,
                description: `${classSubject?.subject?.name || "Không rõ"} - ${
                  classSubject?.className || "Không rõ"
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

          const topics = item.detailedAnalysis?.topics || [];
          topics.forEach((topic) => {
            const topicName = topic.topic;
            subjectMap[subject].topics[topicName] = {
              latestAccuracy: topic.new_accuracy,
              status: topic.status,
            };
          });
        });

        const subjectStats = Object.values(subjectMap).map((subjectData) => {
          const topicsList = Object.values(subjectData.topics);
          const totalAccuracy = topicsList.reduce(
            (sum, t) => sum + (t.latestAccuracy || 0),
            0
          );
          const avgAccuracy =
            topicsList.length > 0 ? totalAccuracy / topicsList.length : 0;

          const mastered = topicsList.filter(
            (t) => t.latestAccuracy >= 80
          ).length;
          const progressing = topicsList.filter(
            (t) => t.latestAccuracy >= 50 && t.latestAccuracy < 80
          ).length;
          const needsWork = topicsList.filter(
            (t) => t.latestAccuracy < 50
          ).length;

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAssignments(),
        fetchAttendance(),
        fetchOverview(),
        fetchTodaySchedule(),
        fetchCompetencyStats(),
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCompetencyStats();
    }, [])
  );

  const quickActions = [
    { id: "qa1", label: "Môn học", iconName: "book", color: "#4CAF50" },
    { id: "qa2", label: "Nộp bài", iconName: "upload", color: "#FF9800" },
    { id: "qa3", label: "Lịch học", iconName: "calendar", color: "#2196F3" },
    // { id: "qa4", label: "Năng lực", iconName: "area-chart", color: "#9C27B0" },
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
          <Text style={styles.cardTitle}>Các tác vụ nhanh</Text>
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
                      navigation.navigate("CompetencyMap");
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
            <Text style={styles.cardTitle}>Lịch học hôm nay</Text>
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
    marginBottom: 8,
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
