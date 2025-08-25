import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";

const scheduleData = [
  {
    scheduleId: "1",
    classSubject: { name: "Nhập môn Lập trình" },
    startTime: "08:00",
    endTime: "09:30",
    date: "2025-08-23",
    status: "SCHEDULED", // SCHEDULED | COMPLETED | CANCELLED
    teacher: { fullName: "Nguyễn Văn A" },
  },
  {
    scheduleId: "2",
    classSubject: { name: "Cơ sở dữ liệu" },
    startTime: "08:00",
    endTime: "09:30",
    date: "2025-08-24",
    status: "SCHEDULED",
    teacher: { fullName: "Trần Thị B" },
  },
  {
    scheduleId: "3",
    classSubject: { name: "Mạng máy tính" },
    startTime: "09:40",
    endTime: "11:10",
    date: "2025-08-24",
    status: "COMPLETED",
    teacher: { fullName: "Nguyễn Văn C" },
  },
  {
    scheduleId: "4",
    classSubject: { name: "Hệ điều hành" },
    startTime: "13:00",
    endTime: "14:30",
    date: "2025-08-25",
    status: "CANCELLED",
    teacher: { fullName: "Lê Thị D" },
  },
  {
    scheduleId: "5",
    classSubject: { name: "Phát triển Web" },
    startTime: "15:00",
    endTime: "16:30",
    date: "2025-08-26",
    status: "SCHEDULED",
    teacher: { fullName: "Phạm Văn E" },
  },
];

export default function ScheduleScreen() {
  const [mode, setMode] = useState("day"); // day | week | month
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const flatListRef = useRef(null);

  const getDayData = (date) => scheduleData.filter((s) => s.date === date);
  const dayData = getDayData(selectedDate);

  // === TUẦN ================================================================
  const current = new Date(today);
  const dayOfWeek = current.getDay() || 7; // Monday = 1
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

  // === THÁNG ================================================================
  const monthStart = new Date(today);
  monthStart.setDate(1);
  const monthDays = Array.from({ length: 31 }, (_, i) => {
    const d = new Date(monthStart);
    d.setDate(1 + i);
    if (d.getMonth() !== monthStart.getMonth()) return null;
    const dateStr = d.toISOString().slice(0, 10);
    return { date: dateStr, items: getDayData(dateStr) };
  }).filter(Boolean);

  const handleSelectMonthDay = (date) => {
    setSelectedDate(date);
    const index = scheduleData.findIndex((s) => s.date === date);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  const renderSessionCard = ({ item }) => {
    let bgColor = "#fff";
    if (item.status === "COMPLETED") bgColor = "#f0f0f0";
    if (item.status === "CANCELLED") bgColor = "#fee";

    return (
      <View style={[styles.sessionCard, { backgroundColor: bgColor }]}>
        <Text style={styles.title}>{item.classSubject.name}</Text>
        <Text style={styles.info}>Ngày: {item.date}</Text>
        <Text style={styles.info}>
          Giờ: {item.startTime} - {item.endTime}
        </Text>
        <Text style={styles.info}>GV: {item.teacher?.fullName}</Text>
        <Text style={styles.status}>Trạng thái: {item.status}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.modeSwitch}>
        {["day", "week", "month"].map((m) => (
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

      {mode === "day" && (
        <FlatList
          data={dayData}
          keyExtractor={(item) => item.scheduleId}
          renderItem={renderSessionCard}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                marginTop: 50,
              }}
            >
              <Text style={{ fontSize: 16, color: "#888" }}>
                Không có lịch ngày này
              </Text>
            </View>
          }
        />
      )}

      {mode === "week" && (
        <View style={{ flex: 1 }}>
          <View style={styles.weekRow}>
            {weekDays.map((d) => (
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
                  {d.date.slice(5)}
                </Text>
                {d.items.length > 0 && <View style={styles.dot} />}
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={getDayData(selectedDate)}
            keyExtractor={(item) => item.scheduleId}
            renderItem={renderSessionCard}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 50,
                }}
              >
                <Text style={{ fontSize: 16, color: "#888" }}>
                  Không có lịch ngày này
                </Text>
              </View>
            }
          />
        </View>
      )}

      {mode === "month" && (
        <View style={{ flex: 1 }}>
          <View style={styles.monthGrid}>
            {monthDays.map((d) => (
              <TouchableOpacity
                key={d.date}
                style={[
                  styles.dayCell,
                  selectedDate === d.date && styles.dayCellActive,
                ]}
                onPress={() => handleSelectMonthDay(d.date)}
              >
                <Text style={styles.dayNumber}>{d.date.slice(8)}</Text>
                {d.items.length > 0 && <View style={styles.dot} />}
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            ref={flatListRef}
            data={scheduleData}
            keyExtractor={(item) => item.scheduleId}
            renderItem={renderSessionCard}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 12 },

  modeSwitch: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  modeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#e5e5e5",
    marginHorizontal: 4,
  },
  modeBtnActive: { backgroundColor: "#22c55e" },
  modeText: { color: "#333", fontWeight: "500" },
  modeTextActive: { color: "#fff" },

  sessionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: "#22c55e",
  },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 4, color: "#15803d" },
  info: { fontSize: 13, color: "#444", marginBottom: 2 },
  status: { fontSize: 12, fontWeight: "600", color: "#555", marginTop: 4 },

  weekRow: { flexDirection: "row", marginBottom: 8 },
  weekCol: {
    flex: 1,
    marginHorizontal: 2,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
  },
  weekColActive: { backgroundColor: "#22c55e" },
  weekDate: { fontWeight: "bold", color: "#333" },
  weekDateActive: { color: "#fff", fontWeight: "700" },

  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellActive: { backgroundColor: "#bbf7d0" },
  dayNumber: { fontSize: 12, color: "#333" },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
    marginTop: 2,
  },
});
