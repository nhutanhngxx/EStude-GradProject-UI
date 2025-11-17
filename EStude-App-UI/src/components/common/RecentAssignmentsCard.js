import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function RecentAssignmentsCard({
  title,
  assignments = [],
  onPressDetail,
}) {
  const navigation = useNavigation();

  const handlePressAssignment = (item) => {
    if (!item.subject) {
      console.warn("Assignment missing subject data:", item);
      return;
    }

    const subjectData = {
      beginDate: item.subject.beginDate,
      classId: item.subject.classId,
      className: item.subject.className,
      classSubjectId: item.subject.classSubjectId,
      description: item.subject.description,
      endDate: item.subject.endDate,
      name: item.subject.name,
      semester: item.subject.semester,
      teacherName: item.subject.teacherName,
    };

    navigation.navigate("SubjectDetail", {
      subject: subjectData,
      tab: "Bài tập",
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.assignmentItem}
      onPress={() => handlePressAssignment(item)}
    >
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={styles.assignmentName}>{item.name}</Text>
        <Text style={styles.assignmentMeta}>
          {item.subject?.name || "Không rõ môn"} •{" "}
          {item.dueDate
            ? new Date(item.dueDate).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Không có hạn"}
        </Text>
      </View>
      <Text
        style={[
          styles.statusBadge,
          item.status === "NOT_SUBMITTED" && { color: "#ff9800" },
          item.status === "SUBMITTED" && { color: "#28a745" },
        ]}
      >
        {item.status === "NOT_SUBMITTED" ? "CHƯA NỘP" : "ĐÃ NỘP"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name="document-text-outline" size={22} color="#4CAF50" />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>

        {onPressDetail && (
          <TouchableOpacity onPress={onPressDetail}>
            <Text style={styles.link}>Xem chi tiết</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B5E20",
    marginLeft: 8,
  },
  link: {
    color: "#007bff",
    fontWeight: "500",
  },
  assignmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  assignmentName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  assignmentMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    fontSize: 12,
  },
});
