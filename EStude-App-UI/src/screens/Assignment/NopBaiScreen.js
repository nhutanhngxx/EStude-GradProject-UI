import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import assignmentService from "../../services/assignmentService";
import { AuthContext } from "../../contexts/AuthContext";
import submissionService from "../../services/submissionService";
import { loadAssignmentsWithStatus } from "../../services/assignmentHelper";

const filters = ["Hôm nay", "Tất cả", "Tuần", "Tháng"];
const PAGE_SIZE = 20;

export default function NopBaiScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("Assignments");
  const [activeFilter, setActiveFilter] = useState("Hôm nay");

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const res = await loadAssignmentsWithStatus(
          user.userId,
          null,
          activeTab === "Exams"
        );
        setAssignments(res);
      } catch (err) {
        console.error(err);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [user, activeTab]);

  const filteredByTab = useMemo(() => {
    return assignments.filter((item) => {
      const isExam = item.isExam;
      return activeTab === "Assignments" ? !isExam : isExam;
    });
  }, [assignments, activeTab]);

  const filteredByDate = useMemo(() => {
    const now = new Date();
    return filteredByTab.filter((item) => {
      const due = new Date(item.dueDate || item.startDate || item.createdAt);
      switch (activeFilter) {
        case "Hôm nay":
          return due.toDateString() === now.toDateString();
        case "Tuần": {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return due >= weekStart && due <= weekEnd;
        }
        case "Tháng":
          return (
            due.getMonth() === now.getMonth() &&
            due.getFullYear() === now.getFullYear()
          );
        case "Tất cả":
        default:
          return true;
      }
    });
  }, [filteredByTab, activeFilter]);

  const displayData = useMemo(() => {
    const start = 0;
    const end = page * PAGE_SIZE;
    return filteredByDate.slice(start, end);
  }, [filteredByDate, page]);

  const handleLoadMore = () => {
    if (displayData.length < filteredByDate.length) {
      setPage((prev) => prev + 1);
    }
  };

  const renderItem = ({ item }) => {
    const title = item.title;
    const className =
      item.classSubject?.clazz?.name || item.classSubject?.name || "Lớp";
    const deadline = item.dueDate || item.startDate || item.createdAt;
    const status = item.status;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          status === "Đã nộp" ? styles.doneBorder : styles.pendingBorder,
        ]}
        onPress={() =>
          navigation.navigate("ChiTietBaiTap", {
            assignment: item,
            isExam: activeTab === "Exams",
            status: item.status || "Chưa nộp",
          })
        }
      >
        <Text style={styles.title}>
          {className} - {title}
        </Text>
        <Text style={styles.deadline}>
          {activeTab === "Assignments"
            ? `Hạn: ${deadline}`
            : `Ngày thi: ${deadline}`}
        </Text>
        <Text
          style={[
            styles.status,
            status === "Đã nộp" ? styles.done : styles.pending,
          ]}
        >
          {status}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        style={{ marginTop: 50 }}
        color="#007BFF"
      />
    );

  return (
    <View style={styles.container}>
      {/* Tabs */}
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

      {/* Filter */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              activeFilter === f && styles.filterBtnActive,
            ]}
            onPress={() => {
              setActiveFilter(f);
              setPage(1); // reset pagination khi đổi filter
            }}
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

      {/* List */}
      <FlatList
        data={displayData}
        keyExtractor={(item) =>
          `${item.assignmentId || item.examId}_${user.userId}`
        }
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 16 },
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

  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  doneBorder: { borderLeftWidth: 5, borderLeftColor: "#27ae60" },
  pendingBorder: { borderLeftWidth: 5, borderLeftColor: "#e74c3c" },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  deadline: { fontSize: 12, color: "#666", marginBottom: 6 },
  status: { fontSize: 14, fontWeight: "bold" },
  done: { color: "#27ae60" },
  pending: { color: "#e74c3c" },
});
