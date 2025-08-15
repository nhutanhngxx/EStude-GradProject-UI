import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const user = {
  name: "Nguyễn Minh Khoa",
  avatar: "https://i.pravatar.cc/150?img=12",
  grade: "12A3",
};

export default function AttendanceScreen({ navigation }) {
  const [selectedFilter, setSelectedFilter] = useState("Tất cả");
  const [selectedActivity, setSelectedActivity] = useState("Ngày");

  const filters = ["Tất cả", "Toán", "Văn", "Anh", "Tin học"];

  const attendanceData = [
    { id: "1", subject: "Toán", attended: 20, total: 24, status: "done" },
    { id: "2", subject: "Văn", attended: 18, total: 20, status: "late" },
    { id: "3", subject: "Anh", attended: 22, total: 25, status: "pending" },
    { id: "4", subject: "Tin học", attended: 15, total: 18, status: "done" },
  ];

  const activityData = {
    Ngày: [
      { id: "a1", subject: "Toán", attended: 1, total: 1, status: "done" },
      { id: "a2", subject: "Văn", attended: 0, total: 1, status: "pending" },
    ],
    Tuần: [
      { id: "b1", subject: "Toán", attended: 4, total: 5, status: "done" },
      { id: "b2", subject: "Văn", attended: 3, total: 5, status: "late" },
      { id: "b3", subject: "Anh", attended: 3, total: 4, status: "pending" },
    ],
    Tháng: [
      { id: "c1", subject: "Toán", attended: 18, total: 20, status: "done" },
      { id: "c2", subject: "Văn", attended: 19, total: 20, status: "done" },
      { id: "c3", subject: "Anh", attended: 16, total: 20, status: "late" },
      {
        id: "c4",
        subject: "Tin học",
        attended: 14,
        total: 18,
        status: "pending",
      },
    ],
  };

  const filteredData =
    selectedFilter === "Tất cả"
      ? attendanceData
      : attendanceData.filter((item) => item.subject === selectedFilter);

  const getStatusStyle = (status) => {
    switch (status) {
      case "done":
        return { color: "green", label: "Đã điểm danh" };
      case "pending":
        return { color: "red", label: "Chưa điểm danh" };
      case "late":
        return { color: "orange", label: "Điểm danh muộn" };
      default:
        return { color: "#555", label: "Không xác định" };
    }
  };

  const renderSubjectCard = (item) => {
    const percent = Math.round((item.attended / item.total) * 100);
    const { color, label } = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        style={styles.subjectCard}
        onPress={() =>
          navigation.navigate("AttendanceDetail", { subject: item })
        }
      >
        <View style={styles.subjectRow}>
          <Text style={styles.subjectName}>{item.subject}</Text>
          <Text style={[styles.percent, { color }]}>{percent}%</Text>
        </View>
        <Text style={[styles.statusText, { color }]}>{label}</Text>
        <Text style={styles.subText}>
          {item.attended}/{item.total} buổi
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${percent}%`, backgroundColor: color },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>EStude</Text>
            <Text style={styles.greeting}>
              Xin chào, <Text style={styles.highlight}>{user.name}</Text> 👋
            </Text>
            <Text style={styles.subGreeting}>
              Lớp {user.grade} • Học tốt mỗi ngày
            </Text>
          </View>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        </View>

        {/* Tổng quan */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Tổng quan điểm danh</Text>
          <Text style={styles.overviewText}>
            Tổng buổi đã điểm danh: <Text style={styles.bold}>75</Text>
          </Text>
          <Text style={styles.overviewText}>
            Tổng số buổi: <Text style={styles.bold}>87</Text>
          </Text>
          <Text style={styles.overviewText}>
            Tỉ lệ: <Text style={styles.bold}>86%</Text>
          </Text>
        </View>

        {/* Bộ lọc môn học */}
        <View style={styles.filterRow}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Danh sách môn học */}
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => renderSubjectCard(item)}
          scrollEnabled={false}
        />

        {/* Hoạt động điểm danh */}
        <View style={styles.activityCard}>
          <Text style={styles.overviewTitle}>Hoạt động điểm danh</Text>

          {/* Bộ lọc Ngày/Tuần/Tháng */}
          <View style={styles.filterRow}>
            {["Ngày", "Tuần", "Tháng"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  selectedActivity === type && styles.filterActive,
                ]}
                onPress={() => setSelectedActivity(type)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedActivity === type && styles.filterTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Danh sách hoạt động */}
          {activityData[selectedActivity].map((item) =>
            renderSubjectCard(item)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brand: { fontSize: 20, fontWeight: "bold", color: "#00cc66" },
  greeting: { fontSize: 16, color: "#333" },
  highlight: { fontWeight: "bold" },
  subGreeting: { fontSize: 14, color: "#777" },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  overviewCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#2e7d32",
  },
  overviewText: { fontSize: 14, marginVertical: 2, color: "#555" },
  bold: { fontWeight: "bold", color: "#2e7d32" },

  filterRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterActive: { backgroundColor: "#2e7d32" },
  filterText: { fontSize: 14, color: "#333" },
  filterTextActive: { color: "#fff", fontWeight: "bold" },

  subjectCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  subjectRow: { flexDirection: "row", justifyContent: "space-between" },
  subjectName: { fontSize: 15, fontWeight: "bold", color: "#2e7d32" },
  percent: { fontSize: 14, fontWeight: "bold" },
  statusText: { fontSize: 13, marginBottom: 2 },
  subText: { fontSize: 13, color: "#555", marginBottom: 5 },
  progressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  activityCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
