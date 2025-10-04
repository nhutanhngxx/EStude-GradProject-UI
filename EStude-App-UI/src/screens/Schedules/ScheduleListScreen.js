import React, { useState, useRef, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import scheduleService from "../../services/scheduleService";
import { AuthContext } from "../../contexts/AuthContext";

export default function ScheduleScreen() {
  const { user } = useContext(AuthContext);
  const [mode, setMode] = useState("Ngày"); // Ngày | Tuần | Tháng
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  const statusMapping = {
    SCHEDULED: "Đã được lên lịch và dự kiến sẽ diễn ra",
    COMPLETED: "Đã diễn ra và hoàn tất",
    CANCELLED: "Đã bị hủy hoàn toàn",
    SUSPENDED: "Bị tạm ngưng, có thể được tổ chức lại",
  };

  const typeMapping = {
    REGULAR: "Lịch học thường xuyên",
    EXAM: "Lịch thi",
    MAKEUP: "Lịch học bù",
  };

  // Fetch schedules from API
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const schedules = await scheduleService.getSchedulesByStudent(
        user.userId
      );
      if (schedules) {
        setSchedules(schedules);
      } else {
        console.warn("No schedules returned from API");
        setSchedules([]);
      }
    } catch (err) {
      console.error("Lỗi khi lấy lịch học:", err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      fetchSchedules();
    }
  }, [user?.userId]);

  // Group schedules by date
  const groupSchedulesByDate = () => {
    const grouped = schedules.reduce((acc, schedule) => {
      const date = schedule.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(schedule);
      return acc;
    }, {});
    return Object.keys(grouped)
      .sort() // Sort dates in ascending order
      .map((date) => ({
        date,
        items: grouped[date],
      }));
  };

  // Filter data for the selected date (for day view)
  const getDayData = (date) => schedules.filter((s) => s.date === date);
  const dayData = getDayData(selectedDate);

  // Week view: Calculate days of the current week based on selectedDate
  const current = new Date(selectedDate);
  const dayOfWeek = current.getDay() || 7; // Sunday = 7, to make Monday = 1
  const monday = new Date(current);
  monday.setDate(current.getDate() - (dayOfWeek - 1));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    return {
      date: dateStr,
      items: getDayData(dateStr),
    };
  });

  // Month view: Calculate days of the current month based on selectedDate
  const monthStart = new Date(selectedDate);
  monthStart.setDate(1);
  const firstDayOfMonth = monthStart.getDay() || 7; // Monday = 1, Sunday = 7
  const daysInMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0
  ).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(monthStart);
    d.setDate(1 + i);
    const dateStr = d.toISOString().slice(0, 10);
    return { date: dateStr, items: getDayData(dateStr) };
  });

  // Generate empty cells for the start of the month
  const emptyCells = Array.from({ length: firstDayOfMonth - 1 }, (_, i) => ({
    key: `empty-${i}`,
    isEmpty: true,
  }));

  // Get Vietnamese day name with fallback
  const getDayNameVN = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        weekday: "long",
      });
    } catch (error) {
      console.warn("Error in getDayNameVN:", error);
      // Fallback for weekday names
      const days = [
        "Chủ Nhật",
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy",
      ];
      return days[new Date(dateString).getDay()] || "";
    }
  };

  // Weekday names for header
  const weekdayNames = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return getDayNameVN(d.toISOString().slice(0, 10));
  });

  const handleSelectMonthDay = (date) => {
    setSelectedDate(date);
    const index = schedules.findIndex((s) => s.date === date);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  // Chuyển đổi khoảng thời gian thành thời gian để hiển thị
  const periodToTime = (startPeriod, endPeriod) => {
    const periodTimes = {
      1: "07:00 - 07:45",
      2: "08:00 - 08:45",
      3: "09:00 - 09:45",
      4: "10:00 - 10:45",
      5: "11:00 - 11:45",
      6: "13:00 - 13:45",
      7: "14:00 - 14:45",
      8: "15:00 - 15:45",
      9: "16:00 - 16:45",
      10: "17:00 - 17:45",
    };
    const startTime = periodTimes[startPeriod] || `${startPeriod}:00`;
    const endTime = periodTimes[endPeriod] || `${endPeriod}:00`;
    return `${startTime.split(" - ")[0]} - ${endTime.split(" - ")[1]}`;
  };

  const formatDateVN = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "N/A";

  // Function to get ISO week number
  const getWeekNumber = (date) => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  // Get header title based on mode
  const getHeaderTitle = () => {
    const dateObj = new Date(selectedDate);
    if (mode === "Ngày") {
      return `${getDayNameVN(selectedDate)}, ${formatDateVN(selectedDate)}`;
    } else if (mode === "Tuần") {
      const weekNo = getWeekNumber(dateObj);
      const year = dateObj.getFullYear();
      return `Tuần ${weekNo}, ${year}`;
    } else if (mode === "Tháng") {
      return dateObj.toLocaleDateString("vi-VN", {
        month: "long",
        year: "numeric",
      });
    }
    return "";
  };

  // Handle previous/next navigation
  const handlePrev = () => {
    const dateObj = new Date(selectedDate);
    if (mode === "Ngày") {
      dateObj.setDate(dateObj.getDate() - 1);
    } else if (mode === "Tuần") {
      dateObj.setDate(dateObj.getDate() - 7);
    } else if (mode === "Tháng") {
      dateObj.setMonth(dateObj.getMonth() - 1);
      dateObj.setDate(1); // Reset to first day of the month
    }
    setSelectedDate(dateObj.toISOString().slice(0, 10));
  };

  const handleNext = () => {
    const dateObj = new Date(selectedDate);
    if (mode === "Ngày") {
      dateObj.setDate(dateObj.getDate() + 1);
    } else if (mode === "Tuần") {
      dateObj.setDate(dateObj.getDate() + 7);
    } else if (mode === "Tháng") {
      dateObj.setMonth(dateObj.getMonth() + 1);
      dateObj.setDate(1); // Reset to first day of the month
    }
    setSelectedDate(dateObj.toISOString().slice(0, 10));
  };

  const renderSessionCard = ({ item }) => {
    let bgColor = "#fff";
    let statusColor = "#555";
    if (item.status === "COMPLETED") {
      bgColor = "#f0f0f0";
      statusColor = "#10b981";
    }
    if (item.status === "CANCELLED") {
      bgColor = "#fee2e2";
      statusColor = "#ef4444";
    }
    if (item.status === "SCHEDULED") {
      bgColor = "#f0fdf4";
      statusColor = "#22c55e";
    }

    return (
      <View style={[styles.sessionCard, { backgroundColor: bgColor, gap: 5 }]}>
        <Text style={styles.title}>
          {item.classSubject.subjectName.toUpperCase()}
        </Text>
        <Text style={styles.info}>
          Thời gian: {periodToTime(item.startPeriod, item.endPeriod)}
        </Text>
        <Text style={styles.info}>Phòng: {item.room}</Text>
        <Text style={styles.info}>{item.classSubject.teacherName}</Text>
        {item.status !== "SCHEDULED" && (
          <Text style={[styles.status, { color: statusColor }]}>
            Trạng thái: {statusMapping[item.status] || item.status}
          </Text>
        )}
        {item.type !== "REGULAR" && (
          <Text style={styles.type}>
            Loại lịch: {typeMapping[item.type] || item.type}
          </Text>
        )}

        {/* {item.details && (
          <Text style={styles.info}>Ghi chú: {item.details}</Text>
        )} */}
      </View>
    );
  };

  const renderDateGroup = ({ item }) => (
    <View style={styles.dateGroup}>
      <Text style={styles.dateHeader}>{formatDateVN(item.date)}</Text>
      <FlatList
        data={item.items}
        keyExtractor={(schedule) => schedule.scheduleId.toString()}
        renderItem={renderSessionCard}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {/* Nhóm Prev - Title - Next */}
        <View style={styles.dateHeaderGroup}>
          <TouchableOpacity onPress={handlePrev} style={{ paddingRight: 10 }}>
            <FontAwesome name="arrow-left" size={12} color="#22c55e" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>

          <TouchableOpacity onPress={handleNext} style={{ paddingLeft: 10 }}>
            <FontAwesome name="arrow-right" size={12} color="#22c55e" />
          </TouchableOpacity>
        </View>

        {/* Nhóm Mode Switch */}
        <View style={styles.modeSwitch}>
          {["Ngày", "Tuần", "Tháng"].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => setMode(m)}
            >
              <Text
                style={[styles.modeText, mode === m && styles.modeTextActive]}
              >
                {m.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Đang tải lịch học...</Text>
        </View>
      )}

      {/* Day View */}
      {!loading && mode === "Ngày" && (
        <FlatList
          data={dayData}
          keyExtractor={(item) => item.scheduleId.toString()}
          renderItem={renderSessionCard}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            dayData.length > 0 ? (
              <Text style={styles.dateHeader}>
                {formatDateVN(selectedDate)}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Không có lịch ngày này</Text>
            </View>
          }
        />
      )}

      {/* Week View */}
      {!loading && mode === "Tuần" && (
        <View style={styles.weekContainer}>
          <View style={styles.weekRow}>
            {weekDays.map((d) => {
              const dayName = getDayNameVN(d.date);
              return (
                <TouchableOpacity
                  key={d.date}
                  style={[
                    styles.weekCol,
                    selectedDate === d.date && styles.weekColActive,
                  ]}
                  onPress={() => setSelectedDate(d.date)}
                >
                  <Text
                    style={[
                      styles.weekDate,
                      selectedDate === d.date && styles.weekDateActive,
                    ]}
                  >
                    {formatDateVN(d.date).slice(0, 5)}
                  </Text>
                  <Text
                    style={[
                      styles.weekDayName,
                      selectedDate === d.date && styles.weekDayNameActive,
                    ]}
                  >
                    {dayName}
                  </Text>
                  {d.items.length > 0 && <View style={styles.dot} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <FlatList
            data={weekDays.filter((d) => d.items.length > 0)}
            keyExtractor={(item) => item.date}
            renderItem={renderDateGroup}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  Không có lịch trong tuần này
                </Text>
              </View>
            }
          />
        </View>
      )}

      {/* Month View */}
      {!loading && mode === "Tháng" && (
        <View style={styles.monthContainer}>
          <View style={styles.monthGrid}>
            {/* Weekday Header Row */}
            {weekdayNames.map((dayName, index) => (
              <View key={`weekday-${index}`} style={styles.weekdayHeaderCell}>
                <Text style={styles.weekdayHeaderText}>{dayName}</Text>
              </View>
            ))}
            {/* Empty cells for days before the 1st */}
            {emptyCells.map((cell) => (
              <View key={cell.key} style={styles.dayCell} />
            ))}
            {/* Month Days */}
            {monthDays.map((d) => (
              <TouchableOpacity
                key={d.date}
                style={[
                  styles.dayCell,
                  selectedDate === d.date && styles.dayCellActive,
                ]}
                onPress={() => handleSelectMonthDay(d.date)}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    selectedDate === d.date && styles.dayNumberActive,
                  ]}
                >
                  {d.date.slice(8)}
                </Text>
                {d.items.length > 0 && <View style={styles.dot} />}
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            ref={flatListRef}
            data={groupSchedulesByDate()}
            keyExtractor={(item) => item.date}
            renderItem={renderDateGroup}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  Không có lịch trong tháng này
                </Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  dateHeaderGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 15,
    // fontWeight: "bold",
    color: "#15803d",
    marginHorizontal: 8,
  },

  modeSwitch: {
    flexDirection: "row",
    alignItems: "center",
  },

  modeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#e5e5e5",
    // borderRadius: 6,
    // marginLeft: 6,
  },
  modeBtnActive: {
    backgroundColor: "#22c55e",
  },
  modeText: {
    color: "#333",
    fontWeight: "500",
  },
  modeTextActive: {
    color: "#fff",
  },

  sessionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: "#22c55e",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#15803d",
  },
  info: {
    fontSize: 13,
    color: "#444",
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  weekContainer: {
    flex: 1,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekCol: {
    flex: 1,
    marginHorizontal: 2,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
  },
  weekColActive: {
    backgroundColor: "#22c55e",
  },
  weekDate: {
    fontWeight: "bold",
    color: "#333",
    fontSize: 12,
  },
  weekDateActive: {
    color: "#fff",
    fontWeight: "700",
  },
  weekDayName: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginTop: 2,
    fontWeight: "500",
  },
  weekDayNameActive: {
    color: "#fff",
  },
  monthContainer: {
    flex: 1,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    height: 240,
  },
  weekdayHeaderCell: {
    width: "14.28%",
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e6f4ea",
    borderWidth: 0.5,
    borderColor: "#ddd",
  },
  weekdayHeaderText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#15803d",
    textAlign: "center",
  },
  dayCell: {
    width: "14.28%",
    height: 40,
    borderWidth: 0.5,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellActive: {
    backgroundColor: "#bbf7d0",
  },
  dayNumber: {
    fontSize: 12,
    color: "#333",
    fontWeight: "bold",
  },
  dayNumberActive: {
    color: "#15803d",
    fontWeight: "700",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
    marginTop: 2,
  },
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
    marginTop: 10,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#15803d",
    marginBottom: 8,
    paddingLeft: 8,
  },
});
