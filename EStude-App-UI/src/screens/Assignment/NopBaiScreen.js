import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";

const filters = ["Hôm nay", "Tất cả", "Tuần", "Tháng"];

const mockAssignments = [
  {
    assignmentId: "a1",
    classSubject: { id: "cs1", name: "Toán" },
    title: "Bài 5",
    deadline: "2025-08-23",
    status: "Chưa nộp",
  },
  {
    assignmentId: "a2",
    classSubject: { id: "cs2", name: "Văn" },
    title: "Tập làm văn",
    deadline: "2025-08-23",
    status: "Đã nộp",
  },
  {
    assignmentId: "a3",
    classSubject: { id: "cs3", name: "Anh" },
    title: "Bài nghe",
    deadline: "2025-08-24",
    status: "Chưa nộp",
  },
];

// Mock data Exams theo cấu trúc UML
const mockExams = [
  {
    examId: "e1",
    classSubject: { id: "cs1", name: "Toán" },
    title: "Thi giữa kỳ",
    date: "2025-09-01",
    duration: "60 phút",
    questions: 40,
    status: "Chưa làm",
  },
  {
    examId: "e2",
    classSubject: { id: "cs2", name: "Cơ sở dữ liệu" },
    title: "Thi cuối kỳ",
    date: "2025-09-10",
    duration: "90 phút",
    questions: 50,
    status: "Đã nộp",
  },
];

export default function NopBaiScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState("Hôm nay");
  const [activeTab, setActiveTab] = useState("Assignments"); // "Assignments" | "Exams"

  // Lọc dữ liệu bài tập theo filter
  const filteredAssignments =
    activeFilter === "Hôm nay"
      ? mockAssignments.filter((a) => a.deadline === "2025-08-23")
      : mockAssignments;

  return (
    <View style={styles.container}>
      {/* Tabs Bài tập / Bài thi */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "Assignments" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("Assignments")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Assignments" && styles.tabTextActive,
            ]}
          >
            Bài tập
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "Exams" && styles.tabActive]}
          onPress={() => setActiveTab("Exams")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Exams" && styles.tabTextActive,
            ]}
          >
            Bài thi
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "Assignments" ? (
        <>
          {/* Bộ lọc bài tập */}
          <View style={styles.filterRow}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterBtn,
                  activeFilter === f && styles.filterBtnActive,
                ]}
                onPress={() => setActiveFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === f && styles.filterTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Danh sách bài tập */}
          <FlatList
            data={filteredAssignments}
            keyExtractor={(item) =>
              item.classSubject.id + "_" + item.assignmentId
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.assignmentCard}
                onPress={() =>
                  navigation.navigate("ChiTietBaiTap", { assignment: item })
                }
              >
                <Text style={styles.title}>
                  {item.classSubject.name} - {item.title}
                </Text>
                <Text style={styles.deadline}>Hạn: {item.deadline}</Text>
                <Text
                  style={[
                    styles.status,
                    item.status === "Đã nộp" ? styles.done : styles.pending,
                  ]}
                >
                  {item.status}
                </Text>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <>
          {/* Danh sách bài thi */}
          <FlatList
            data={mockExams}
            keyExtractor={(item) => item.classSubject.id + "_" + item.examId}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.examCard}
                onPress={() =>
                  navigation.navigate("ExamDetail", { exam: item })
                }
              >
                <Text style={styles.title}>
                  {item.classSubject.name} - {item.title}
                </Text>
                <Text style={styles.deadline}>Ngày thi: {item.date}</Text>
                <Text style={styles.info}>
                  Thời lượng: {item.duration} | Số câu: {item.questions}
                </Text>
                <Text
                  style={[
                    styles.status,
                    item.status === "Đã nộp" ? styles.done : styles.pending,
                  ]}
                >
                  {item.status}
                </Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 16 },

  // Tabs
  tabRow: { flexDirection: "row", marginBottom: 12 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#e5e5e5",
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabActive: { backgroundColor: "#2ecc71" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#333" },
  tabTextActive: { color: "#fff" },

  // Filter
  filterRow: {
    flexDirection: "row",
    marginBottom: 12,
    justifyContent: "space-around",
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#e5e5e5",
  },
  filterBtnActive: { backgroundColor: "#27ae60" },
  filterText: { fontSize: 14, color: "#333" },
  filterTextActive: { color: "#fff", fontWeight: "bold" },

  // Assignment Card
  assignmentCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: "#2ecc71",
  },

  // Exam Card
  examCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: "#27ae60",
    elevation: 2,
  },

  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  deadline: { fontSize: 12, color: "#666", marginBottom: 6 },
  info: { fontSize: 13, color: "#444", marginBottom: 4 },
  status: { fontSize: 14, fontWeight: "bold" },
  done: { color: "#27ae60" },
  pending: { color: "#e74c3c" },
});
