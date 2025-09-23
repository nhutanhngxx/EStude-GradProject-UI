import React, { useState, useContext, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Image,
} from "react-native";
import { AuthContext } from "../../contexts/AuthContext";
import Dropdown from "../../components/common/Dropdown";
import attendanceService from "../../services/attandanceService";
import classSubjectService from "../../services/classSubjectService";
import ProgressBar from "../../components/common/ProgressBar";
import DateTimePicker from "@react-native-community/datetimepicker";
import AttendanceOverview from "../../components/common/AttendanceOverview";
import bannerLight from "../../assets/images/banner-light.png";
import UserHeader from "../../components/common/UserHeader";

export default function AttendanceScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [selectedFilter, setSelectedFilter] = useState("Tất cả");
  const [selectedActivity, setSelectedActivity] = useState("Ngày"); // "Ngày" | "Tuần" | "Tháng" | "Range"
  const [subjects, setSubjects] = useState([]); // each subject has .sessions: []
  const [sessionsData, setSessionsData] = useState({
    Ngày: [],
    Tuần: [],
    Tháng: [],
    Range: [],
  });
  const [loading, setLoading] = useState(true);
  const [totalAttendance, setTotalAttendance] = useState({
    present: 0,
    total: 0,
    percent: 0,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("single"); // "single" | "start" | "end"
  const [customDate, setCustomDate] = useState(new Date()); // used for Ngày/Tuần/Tháng
  const [rangeStart, setRangeStart] = useState(new Date());
  const [rangeEnd, setRangeEnd] = useState(new Date());

  const activityOptions = ["Ngày", "Tuần", "Tháng", "Range"];

  // Lấy tất cả item trong list
  // const filters = ["Tất cả", ...subjects.map((s) => s.name)];

  // Lọc trùng tên môn
  const uniqueSubjects = [...new Set(subjects.map((s) => s.name))];
  const filters = ["Tất cả", ...uniqueSubjects];

  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const startOfWeek = (d) => {
    const day = d.getDay() === 0 ? 7 : d.getDay(); // sunday => 7
    const diff = day - 1;
    const s = new Date(d);
    s.setDate(d.getDate() - diff);
    return startOfDay(s);
  };
  const endOfWeek = (d) => {
    const s = startOfWeek(d);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    return endOfDay(e);
  };

  const startOfMonth = (d) =>
    new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = (d) =>
    new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

  const parseSessionStart = (s) => {
    if (!s || !s.startTime) return null;
    const dt = new Date(s.startTime);
    if (isNaN(dt.getTime())) {
      const alt = new Date(String(s.startTime).replace(" ", "T"));
      return isNaN(alt.getTime()) ? null : alt;
    }
    return dt;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const subjectsData =
        await classSubjectService.getClassSubjectsByStudentWithDetails({
          studentId: user?.userId,
        });

      // console.log("subjectsData:", subjectsData);

      if (!subjectsData || !Array.isArray(subjectsData)) {
        setSubjects([]);
        setLoading(false);
        return;
      }

      const subjectsWithSessions = await Promise.all(
        subjectsData.map(async (subject) => {
          const sessions =
            await attendanceService.getAttentanceSessionByClassSubjectForStudent(
              subject.classSubjectId,
              user?.userId
            );
          return {
            ...subject,
            sessions: Array.isArray(sessions) ? sessions : [],
          };
        })
      );

      setSubjects(subjectsWithSessions);
    } catch (error) {
      console.error("Lỗi fetchData:", error);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const dayStart = startOfDay(customDate);
    const dayEnd = endOfDay(customDate);
    const weekStart = startOfWeek(customDate);
    const weekEnd = endOfWeek(customDate);
    const monthStart = startOfMonth(customDate);
    const monthEnd = endOfMonth(customDate);
    const rStart = startOfDay(rangeStart);
    const rEnd = endOfDay(rangeEnd);

    const newActivity = {
      Ngày: [],
      Tuần: [],
      Tháng: [],
      Range: [],
    };

    subjects.forEach((subject) => {
      (subject.sessions || []).forEach((sess) => {
        const sDate = parseSessionStart(sess);
        if (!sDate) return;
        const sessionItem = {
          ...sess,
          subjectName: subject.name,
          key: `${subject.classSubjectId}-${sess.sessionId}`,
        };

        if (
          sDate.getTime() >= dayStart.getTime() &&
          sDate.getTime() <= dayEnd.getTime()
        ) {
          newActivity.Ngày.push(sessionItem);
        }
        if (
          sDate.getTime() >= weekStart.getTime() &&
          sDate.getTime() <= weekEnd.getTime()
        ) {
          newActivity.Tuần.push(sessionItem);
        }
        if (
          sDate.getTime() >= monthStart.getTime() &&
          sDate.getTime() <= monthEnd.getTime()
        ) {
          newActivity.Tháng.push(sessionItem);
        }
        if (
          sDate.getTime() >= rStart.getTime() &&
          sDate.getTime() <= rEnd.getTime()
        ) {
          newActivity.Range.push(sessionItem);
        }
      });
    });

    setSessionsData(newActivity);

    const displayed = newActivity[selectedActivity].filter(
      (it) => selectedFilter === "Tất cả" || it.subjectName === selectedFilter
    );
    const presentCount = displayed.filter(
      (it) => it.status === "PRESENT"
    ).length;
    const totalCount = displayed.length;
    const percent = totalCount
      ? Math.round((presentCount / totalCount) * 100)
      : 0;
    setTotalAttendance({
      present: presentCount,
      total: totalCount,
      percent,
    });
  }, [
    subjects,
    selectedActivity,
    customDate,
    rangeStart,
    rangeEnd,
    selectedFilter,
  ]);

  const openPickerFor = (mode) => {
    setPickerMode(mode); // "single" | "start" | "end"
    setShowDatePicker(true);
  };

  const onDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (!selected) return;
    if (pickerMode === "single") {
      setCustomDate(selected);
    } else if (pickerMode === "start") {
      const newStart = startOfDay(selected);
      setRangeStart(newStart);
      if (rangeEnd.getTime() < newStart.getTime()) {
        setRangeEnd(newStart);
      }
    } else if (pickerMode === "end") {
      const newEnd = endOfDay(selected);
      setRangeEnd(newEnd);
      if (rangeStart.getTime() > newEnd.getTime()) {
        setRangeStart(startOfDay(selected));
      }
    }
  };

  const renderSessionGroup = () => {
    const list = (sessionsData[selectedActivity] || []).filter(
      (item) =>
        selectedFilter === "Tất cả" || item.subjectName === selectedFilter
    );

    if (!list || list.length === 0) {
      return <Text style={styles.emptyText}>Chưa có dữ liệu</Text>;
    }

    const grouped = list.reduce((acc, session) => {
      if (!acc[session.subjectName])
        acc[session.subjectName] = {
          subjectName: session.subjectName,
          sessions: [],
          present: 0,
          total: 0,
        };
      acc[session.subjectName].sessions.push(session);
      acc[session.subjectName].total += 1;
      if (session.status === "PRESENT") acc[session.subjectName].present += 1;
      return acc;
    }, {});

    return Object.values(grouped).map((subjectGroup) => {
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
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container}>
        <UserHeader />

        {/* Tổng quan */}
        <AttendanceOverview totalAttendance={totalAttendance} />

        {/* Bộ lọc */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Điểm danh gần đây</Text>

          <View style={styles.filterRow}>
            <View style={{ flexDirection: "row", flex: 1, gap: 5 }}>
              <View style={[styles.dropdownWrapper]}>
                <Dropdown
                  options={activityOptions}
                  selected={selectedActivity}
                  onSelect={setSelectedActivity}
                />
              </View>
              <View style={[styles.dropdownWrapper]}>
                <Dropdown
                  options={filters}
                  selected={selectedFilter}
                  onSelect={setSelectedFilter}
                />
              </View>
            </View>

            {/* Lọc theo thời gian */}
            {/* {selectedActivity !== "Range" ? (
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => {
                  setPickerMode("single");
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateBtnText}>
                  {customDate.toLocaleDateString("vi-VN")}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity
                  style={[styles.dateBtn, { marginRight: 8 }]}
                  onPress={() => {
                    setPickerMode("start");
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dateBtnText}>
                    {rangeStart.toLocaleDateString("vi-VN")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => {
                    setPickerMode("end");
                    setShowDatePicker(true);
                  }}
                >
                  <Text style={styles.dateBtnText}>
                    {rangeEnd.toLocaleDateString("vi-VN")}
                  </Text>
                </TouchableOpacity>
              </View>
            )} */}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={
                pickerMode === "single"
                  ? customDate
                  : pickerMode === "start"
                  ? rangeStart
                  : rangeEnd
              }
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
            />
          )}

          {loading ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator size="small" color="#2ecc71" />
              <Text style={{ marginTop: 4 }}>Đang tải dữ liệu...</Text>
            </View>
          ) : (
            renderSessionGroup()
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, padding: 16 },
  greeting: { fontSize: 16, color: "#333" },
  highlight: { fontWeight: "bold" },
  subGreeting: { fontSize: 14, color: "#777" },

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

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  title: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  description: { fontSize: 13, color: "#555", marginBottom: 4 },
  progressText: { fontSize: 12, color: "#666", marginTop: 4 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stat: { alignItems: "center" },
  statLabel: { fontSize: 12, color: "#666" },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#000" },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },
  dropdownWrapper: { marginHorizontal: 2 },

  dateBtn: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#00cc66",
  },
  dateBtnText: { color: "#fff", fontSize: 14 },

  borderPresent: { borderLeftWidth: 5, borderLeftColor: "#27ae60" },
  borderLate: { borderLeftWidth: 5, borderLeftColor: "#f39c12" },
  borderAbsent: { borderLeftWidth: 5, borderLeftColor: "#e74c3c" },

  loadingInline: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  emptyText: { textAlign: "center", color: "#999", marginTop: 12 },
});
