import React, { useContext, useEffect, useState } from "react";
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
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { AuthContext } from "../contexts/AuthContext";
import attendanceService from "../services/attandanceService";
import classSubjectService from "../services/classSubjectService";
import assignmentService from "../services/assignmentService";
import AttendanceOverview from "../components/common/AttendanceOverview";
import ProgressBar from "../components/common/ProgressBar";
import StudyOverviewCard from "../components/common/StudyOverviewCard";
import TodayScheduleCard from "../components/common/TodayScheduleCard";
import RecentAssignmentsCard from "../components/common/RecentAssignmentsCard";
import studentStudyService from "../services/studentStudyService";

import bannerLight from "../assets/images/banner-light.png";
import UserHeader from "../components/common/UserHeader";

export default function HomeStudentScreen({ navigation }) {
  const { user } = useContext(AuthContext);
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

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoadingAssignments(true);
        const assignments = await assignmentService.getAssignmentsByStudent(
          user.userId
        );

        // console.log("[Home screen] recent assignments:", assignments);

        if (Array.isArray(assignments)) {
          const sorted = assignments.sort(
            (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
          );
          setRecentAssignments(sorted.slice(0, 3));
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

    fetchAssignments();
  }, [user]);

  useEffect(() => {
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

    fetchAttendance();
  }, [user]);

  useEffect(() => {
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
              submissionRate: (overviewData.submissionRate ?? 0) * 100,
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
    fetchOverview();
  }, [user]);

  const todayPlan = [];

  const quickActions = [
    { id: "qa1", label: "Môn học", iconName: "book", color: "#4CAF50" }, // xanh lá
    { id: "qa2", label: "Nộp bài", iconName: "upload", color: "#FF9800" }, // cam
    { id: "qa3", label: "Lịch học", iconName: "calendar", color: "#2196F3" }, // xanh dương
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container}>
        <UserHeader />

        {/* Tác vụ nhanh */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Các tác vụ nhanh</Text>
          <View style={styles.quickActionRow}>
            {quickActions.slice(0, 3).map((action) => (
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
              subject: a.className,
              dueDate: a.dueDate,
            }))}
            onPressDetail={() => navigation.navigate("NopBai")}
          />
        )}

        {/* Lịch học hôm nay */}
        {/* <TodayScheduleCard
          title="Lịch học hôm nay"
          scheduleList={todayPlan}
          onPressDetail={() => navigation.navigate("ScheduleList")}
        /> */}
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
