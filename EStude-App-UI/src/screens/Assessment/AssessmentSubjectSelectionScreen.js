import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import classSubjectService from "../../services/classSubjectService";
import AssessmentHistoryScreen from "./AssessmentHistoryScreen";

const themeColors = {
  primary: "#00cc66",      // xanh lá chủ đạo
  secondary: "#33cc77",    // xanh lá nhạt hơn
  background: "#e6f5ea",   // nền xanh rất nhạt / trắng pha xanh
  card: "#FFFFFF",          // màu card vẫn trắng
  text: "#006633",          // text màu xanh đậm
};

export default function AssessmentSubjectSelectionScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("new"); // "new" or "history"

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);

      // 1. Lấy danh sách classSubject của học sinh (giống SubjectListScreen)
      const studentSubjects =
        await classSubjectService.getClassSubjectsByStudent({
          studentId: user.userId,
        });

      if (!Array.isArray(studentSubjects) || studentSubjects.length === 0) {
        setSubjects([]);
        return;
      }

      // 2. Lấy tất cả classSubjects chi tiết
      const allClassSubjects = await classSubjectService.getAllClassSubjects();

      if (!Array.isArray(allClassSubjects)) {
        setSubjects([]);
        return;
      }

      // 3. Map dữ liệu và nhóm theo subjectId để tránh trùng lặp
      const subjectMap = {};

      studentSubjects.forEach((s) => {
        const detail = allClassSubjects.find(
          (cs) => cs.classSubjectId === s.classSubjectId
        );
        if (!detail || !detail.subject) return;

        const subjectId = detail.subject.subjectId;
        const subjectName = detail.subject.name || "Không rõ";

        // Chỉ lưu môn học đầu tiên gặp
        if (!subjectMap[subjectId]) {
          subjectMap[subjectId] = {
            subjectId,
            subjectName,
            gradeLevel: detail.gradeLevel || s.gradeLevel || "GRADE_10",
            className: s.className || detail.className || "Không rõ",
            semester: detail.term?.name || s.termName || "HK1 2025-2026",
            teacherName: detail.teacher?.fullName || "Chưa rõ",
            classSubjectId: detail.classSubjectId,
          };
        }
      });

      setSubjects(Object.values(subjectMap));
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showToast("Lỗi khi tải danh sách môn học", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubject = (subject) => {
    navigation.navigate("AssessmentTopicSelection", {
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      gradeLevel: subject.gradeLevel,
    });
  };

  const renderSubjectItem = ({ item }) => (
    <TouchableOpacity
      style={styles.subjectCard}
      onPress={() => handleSelectSubject(item)}
    >
      <View style={styles.subjectIconContainer}>
        <Ionicons name="book" size={32} color={themeColors.primary} />
      </View>
      <View style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{item.subjectName}</Text>
        {/* <Text style={styles.subjectDetail}>
          Lớp {item.className} • {item.semester}
        </Text> */}
        <Text style={styles.subjectDetail}>Lớp {item.className}</Text>
        <Text style={styles.teacherName}>GV: {item.teacherName}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đánh giá năng lực</Text>
        <Text style={styles.headerSubtitle}>
          {activeTab === "new"
            ? "Chọn môn học để làm bài đánh giá"
            : "Xem lại các bài đánh giá đã làm"}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "new" && styles.tabActive]}
          onPress={() => setActiveTab("new")}
        >
          <Ionicons
            name="add-circle"
            size={20}
            color={activeTab === "new" ? themeColors.primary : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "new" && styles.tabTextActive,
            ]}
          >
            Làm bài mới
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.tabActive]}
          onPress={() => setActiveTab("history")}
        >
          <Ionicons
            name="time"
            size={20}
            color={activeTab === "history" ? themeColors.primary : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.tabTextActive,
            ]}
          >
            Lịch sử
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "new" ? (
        loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={styles.loadingText}>
              Đang tải danh sách môn học...
            </Text>
          </View>
        ) : subjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Không có môn học nào</Text>
          </View>
        ) : (
          <FlatList
            data={subjects}
            renderItem={renderSubjectItem}
            keyExtractor={(item) => item.subjectId.toString()}
            contentContainerStyle={styles.listContent}
          />
        )
      ) : (
        <AssessmentHistoryScreen navigation={navigation} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  header: {
    backgroundColor: themeColors.card,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: themeColors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  listContent: {
    padding: 16,
  },
  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${themeColors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: "600",
    color: themeColors.text,
    marginBottom: 4,
  },
  subjectDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: themeColors.card,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: themeColors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#999",
  },
  tabTextActive: {
    color: themeColors.primary,
    fontWeight: "600",
  },
});
