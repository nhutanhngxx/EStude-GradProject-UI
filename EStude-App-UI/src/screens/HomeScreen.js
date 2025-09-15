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
// import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { AuthContext } from "../contexts/AuthContext";
import attendanceService from "../services/attandanceService";
import classSubjectService from "../services/classSubjectService";
import assignmentService from "../services/assignmentService";
import AttendanceOverview from "../components/common/AttendanceOverview";
import ProgressBar from "../components/common/ProgressBar";
import StudyOverviewCard from "../components/common/StudyOverviewCard";
import TodayScheduleCard from "../components/common/TodayScheduleCard";
import RecentAssignmentsCard from "../components/common/RecentAssignmentsCard";

const mockStudentData = {
  gpa: 8.7,
  rank: 5,
  totalStudents: 42,
  passedCredits: 85,
  requiredCredits: 120,
  subjectsAtRisk: 2,
  avatar: "https://i.pravatar.cc/150?img=12",
  class: { classId: 10, name: "12A3", term: "2025-2026", classSize: 42 },
};

const classSubject = {
  classSubjectId: 1001,
  subject: { name: "Toán - Hình học không gian" },
  teacher: { fullName: "Nguyễn Văn A" },
  schedule: [
    {
      scheduleId: 1,
      date: "2025-08-24",
      startPeriod: "07:30",
      endPeriod: "09:00",
      room: "P.302",
      status: "SCHEDULED",
    },
    {
      scheduleId: 2,
      date: "2025-08-24",
      startPeriod: "09:15",
      endPeriod: "10:45",
      room: "P.204",
      status: "COMPLETED",
    },
  ],
};

const attendanceRecord = [
  { id: 1, subject: "Toán", present: 12, late: 1, absent: 0, total: 13 },
  { id: 2, subject: "Vật lý", present: 11, late: 0, absent: 2, total: 13 },
  { id: 3, subject: "Hóa học", present: 10, late: 2, absent: 1, total: 13 },
];

const recentAssignments = [
  {
    id: 1,
    name: "Bài tập 1",
    subject: "Toán",
    dueDate: "2025-09-15",
    status: "pending",
  },
  {
    id: 2,
    name: "Bài tập 2",
    subject: "Vật lý",
    dueDate: "2025-09-14",
    status: "submitted",
  },
  {
    id: 3,
    name: "Bài tập 3",
    subject: "Hóa học",
    dueDate: "2025-09-13",
    status: "late",
  },
];

const quickActions = [
  { id: "qa1", label: "Môn học", iconName: "menu-book" },
  { id: "qa2", label: "Nộp bài", iconName: "file-upload" },
  { id: "qa3", label: "Lịch học", iconName: "calendar-today" },
];

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

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoadingAssignments(true);
        const assignments = await assignmentService.getAssignmentsByStudent(
          user.userId
        );

        if (Array.isArray(assignments)) {
          // Sắp xếp theo dueDate tăng dần
          const sorted = assignments.sort(
            (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
          );
          // Lấy 3 bài tập gần nhất
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

  // Avatar: lấy từ user nếu có, nếu không thì lấy mock
  const avatarUri = user.avatarPath ? user.avatarPath : mockStudentData.avatar;

  // Dữ liệu học tập
  const gpa = mockStudentData.gpa;
  const rank = mockStudentData.rank;
  const totalStudents = mockStudentData.totalStudents;
  const passedCredits = mockStudentData.passedCredits;
  const requiredCredits = mockStudentData.requiredCredits;
  const creditPercent = Math.round((passedCredits / requiredCredits) * 100);

  // Lịch học hôm nay từ schedule mock
  const todayPlan = classSubject.schedule.map((s) => ({
    id: s.scheduleId.toString(),
    time: `${s.startPeriod} - ${s.endPeriod}`,
    subject: classSubject.subject.name,
    room: s.room,
    status: s.status === "COMPLETED" ? "in_progress" : "upcoming",
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        // contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>ESTUDE</Text>
            <Text style={styles.subtitle}>Xin chào, {user.fullName} 👋</Text>
          </View>
          {/* <Image
              source={{ uri: "https://i.pravatar.cc/100?img=12" }}
              style={styles.avatar}
            /> */}
        </View>

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
                <MaterialIcons
                  name={action.iconName}
                  size={28}
                  color="#777777"
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
              {/* <Text style={styles.quickHint}>Xem thêm</Text> */}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tổng quan học tập */}
        <StudyOverviewCard
          gpa={gpa}
          rank={rank}
          totalStudents={totalStudents}
          passedCredits={passedCredits}
          requiredCredits={requiredCredits}
          onPressDetail={() => navigation.navigate("DetailStudy")}
        />

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
              // status: a.isExam ? "exam" : "pending",
            }))}
            onPressDetail={() => navigation.navigate("NopBai")}
          />
        )}

        {/* Lịch học hôm nay */}
        <TodayScheduleCard
          title="Lịch học hôm nay"
          scheduleList={todayPlan}
          onPressDetail={() => navigation.navigate("ScheduleList")}
        />
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
  brand: { fontSize: 24, fontWeight: "800", color: "#00cc66" },
  subtitle: { fontSize: 15, color: "#555" },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  greeting: {
    fontSize: 16,
    color: "#333",
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
