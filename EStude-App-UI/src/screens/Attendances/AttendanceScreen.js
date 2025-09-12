import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../contexts/AuthContext";
import Dropdown from "../../components/common/Dropdown";
import attendanceService from "../../services/attandanceService";
import classSubjectService from "../../services/classSubjectService";
import ProgressBar from "../../components/common/ProgressBar";

const student = {
  userId: 101,
  fullName: "Nguyễn Nhựt Anh",
  avatar: "https://i.pravatar.cc/150?img=12",
  class: { classId: 10, name: "12A3", term: "2025-2026", classSize: 42 },
};

export default function AttendanceScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [selectedFilter, setSelectedFilter] = useState("Tất cả");
  const [selectedActivity, setSelectedActivity] = useState("Ngày");
  const [subjects, setSubjects] = useState([]);
  const [sessionsData, setSessionsData] = useState({
    Ngày: [],
    Tuần: [],
    Tháng: [],
  });
  const [loading, setLoading] = useState(true);
  const [totalAttendance, setTotalAttendance] = useState({
    present: 0,
    total: 0,
    percent: 0,
  });

  const filters = ["Tất cả", ...subjects.map((s) => s.name)];

  const fetchData = async () => {
    setLoading(true);
    try {
      const subjectsData =
        await classSubjectService.getClassSubjectsByStudentWithDetails({
          studentId: user?.userId,
        });

      if (!subjectsData) throw new Error("Failed to fetch subjects");

      const subjectsWithSessions = await Promise.all(
        subjectsData.map(async (subject) => {
          const sessions =
            await attendanceService.getAttentanceSessionByClassSubjectForStudent(
              subject.classSubjectId,
              user?.userId || student.userId
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

      const today = new Date();
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const activity = { Ngày: [], Tuần: [], Tháng: [] };

      subjectsWithSessions.forEach((subject) => {
        subject.sessions.forEach((sess) => {
          const startTime = new Date(sess.startTime);
          const sessionItem = {
            ...sess,
            subjectName: subject.name,
            key: `${subject.classSubjectId}-${sess.sessionId}`,
          };
          if (startTime >= new Date(today.setHours(0, 0, 0, 0)))
            activity.Ngày.push(sessionItem);
          if (startTime >= oneWeekAgo) activity.Tuần.push(sessionItem);
          if (startTime >= oneMonthAgo) activity.Tháng.push(sessionItem);
        });
      });

      setSubjects(subjectsWithSessions);
      setSessionsData(activity);
    } catch (error) {
      console.error(error);
      setSubjects([]);
      setSessionsData({ Ngày: [], Tuần: [], Tháng: [] });
      setTotalAttendance({ present: 0, total: 0, percent: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const renderSessionCard = (item) => {
    const percent = item.total
      ? Math.round((item.present / item.total) * 100)
      : item.status === "PRESENT"
      ? 100
      : 0;

    const statusText =
      item.status === "PRESENT"
        ? "Có mặt"
        : item.status === "LATE"
        ? "Trễ"
        : "Vắng";
    const statusColor =
      item.status === "PRESENT"
        ? "#27ae60"
        : item.status === "LATE"
        ? "#f39c12"
        : "#e74c3c";

    return (
      <TouchableOpacity
        key={item.key}
        style={[
          styles.card,
          item.status === "PRESENT"
            ? styles.borderPresent
            : item.status === "LATE"
            ? styles.borderLate
            : styles.borderAbsent,
        ]}
        onPress={() =>
          navigation.navigate("SubjectDetail", {
            subject: subjects.find((s) => s.name === item.subjectName),
            tab: "Điểm danh",
          })
        }
      >
        <View style={styles.subjectRow}>
          <Text style={styles.title}>{item.subjectName}</Text>
          <Text
            style={[
              styles.status,
              item.status === "PRESENT"
                ? styles.statusPresent
                : item.status === "LATE"
                ? styles.statusLate
                : styles.statusAbsent,
            ]}
          >
            {statusText}
          </Text>
        </View>
        <Text style={styles.description}>
          {item.present || 0}/{item.total || 1} có mặt
        </Text>
        <ProgressBar value={percent} />
        <Text style={styles.progressText}>{percent}% có mặt</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ gap: 3 }}>
            <Text style={styles.brand}>EStude</Text>
            <Text style={styles.greeting}>
              Xin chào,{" "}
              <Text style={styles.highlight}>
                {user.fullName.toUpperCase()}
              </Text>{" "}
              👋
            </Text>
            <Text style={styles.subGreeting}>
              Nơi lưu giữ hành tri tri thức trẻ
            </Text>
          </View>
        </View>
        {/* Tổng quan */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng quan điểm danh</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Đã điểm danh</Text>
              <Text style={styles.statValue}>{totalAttendance.present}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Tổng số buổi</Text>
              <Text style={styles.statValue}>{totalAttendance.total}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Tỉ lệ</Text>
              <Text style={styles.statValue}>{totalAttendance.percent}%</Text>
            </View>
          </View>
          <ProgressBar value={totalAttendance.percent} />
          <Text style={styles.progressText}>
            {totalAttendance.percent}% hoàn thành
          </Text>
        </View>

        {/* Điểm danh gần đây */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Điểm danh gần đây</Text>

          {/* Dropdown filter */}
          <View style={styles.filterRow}>
            <View style={[styles.dropdownWrapper, { width: "30%" }]}>
              <Dropdown
                options={["Ngày", "Tuần", "Tháng"]}
                selected={selectedActivity}
                onSelect={setSelectedActivity}
              />
            </View>
            <View style={[styles.dropdownWrapper, { width: "70%" }]}>
              <Dropdown
                options={filters}
                selected={selectedFilter}
                onSelect={setSelectedFilter}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator size="small" color="#2ecc71" />
              <Text style={{ marginTop: 4 }}>Đang tải dữ liệu...</Text>
            </View>
          ) : sessionsData[selectedActivity].length === 0 ? (
            <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
          ) : (
            // Group by subject
            Object.values(
              sessionsData[selectedActivity]
                .filter(
                  (item) =>
                    selectedFilter === "Tất cả" ||
                    item.subjectName === selectedFilter
                )
                .reduce((acc, session) => {
                  if (!acc[session.subjectName])
                    acc[session.subjectName] = {
                      subjectName: session.subjectName,
                      sessions: [],
                      present: 0,
                      total: 0,
                    };
                  acc[session.subjectName].sessions.push(session);
                  acc[session.subjectName].total += 1;
                  if (session.status === "PRESENT")
                    acc[session.subjectName].present += 1;
                  return acc;
                }, {})
            ).map((subjectGroup) => {
              const percent = subjectGroup.total
                ? Math.round((subjectGroup.present / subjectGroup.total) * 100)
                : 0;
              return (
                <TouchableOpacity
                  key={subjectGroup.subjectName}
                  style={[
                    styles.card,
                    subjectGroup.present === subjectGroup.total
                      ? styles.borderPresent
                      : subjectGroup.present > 0
                      ? styles.borderLate
                      : styles.borderAbsent,
                  ]}
                  onPress={() =>
                    navigation.navigate("SubjectDetail", {
                      subject: subjects.find(
                        (s) => s.name === subjectGroup.subjectName
                      ),
                      tab: "Điểm danh",
                    })
                  }
                >
                  <Text style={styles.title}>{subjectGroup.subjectName}</Text>
                  <Text style={styles.description}>
                    {subjectGroup.present}/{subjectGroup.total} có mặt
                  </Text>
                  <ProgressBar value={percent} />
                  <Text style={styles.progressText}>{percent}% có mặt</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
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
    marginBottom: 16,
  },
  brand: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00cc66",
  },
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

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

  filterRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  dropdownWrapper: {
    flex: 1,
    marginHorizontal: 2,
  },

  borderPresent: {
    borderLeftWidth: 5,
    borderLeftColor: "#27ae60",
  },
  borderLate: {
    borderLeftWidth: 5,
    borderLeftColor: "#f39c12",
  },
  borderAbsent: {
    borderLeftWidth: 5,
    borderLeftColor: "#e74c3c",
  },

  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
  },
  statusPresent: {
    color: "#27ae60",
  },
  statusLate: {
    color: "#f39c12",
  },
  statusAbsent: {
    color: "#e74c3c",
  },

  loadingInline: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 12,
  },
});
