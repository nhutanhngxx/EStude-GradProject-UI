import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

// Dữ liệu theo PlantUML
const subjects = [
  {
    subjectId: "1",
    name: "Toán cao cấp",
    description: "Môn toán nâng cao, áp dụng cho sinh viên IT",
    semester: "HK1",
    classSubjects: [
      {
        classSubjectId: "cs1",
        class: {
          classId: "class1",
          name: "Lớp 12A",
          term: "HK1",
          classSize: 40,
        },
        teacher: { teacherCode: "T01", fullName: "Thầy An" },
      },
    ],
    subjectGrade: { midtermScore: 8.0, finalScore: 7.5, actualAverage: 7.8 },
    attendanceRecords: [
      {
        attendanceId: "a1",
        timestamp: "2025-08-01T08:00",
        status: "Có mặt",
      },
      { attendanceId: "a2", timestamp: "2025-08-03T08:00", status: "Vắng" },
      { attendanceId: "a3", timestamp: "2025-08-05T08:00", status: "Muộn" },
    ],
    assignments: [
      {
        assignmentId: "as1",
        title: "Bài 1",
        submissions: [{ submissionId: "s1", status: "SUBMITTED" }],
      },
      { assignmentId: "as2", title: "Bài 2", submissions: [] },
    ],
    notifications: [
      {
        notificationId: "n1",
        sentAt: "2025-08-01",
        message: "Kiểm tra giữa kỳ 10/08",
      },
      {
        notificationId: "n2",
        sentAt: "2025-08-05",
        message: "Nộp bài tập lớn trước 20/08",
      },
    ],
  },
  {
    subjectId: "2",
    name: "Lập trình C",
    description: "Ngôn ngữ lập trình C cơ bản",
    semester: "HK1",
    classSubjects: [
      {
        classSubjectId: "cs2",
        class: {
          classId: "class2",
          name: "Lớp 12B",
          term: "HK1",
          classSize: 35,
        },
        teacher: { teacherCode: "T02", fullName: "Cô Bình" },
      },
    ],
    subjectGrade: { midtermScore: 7.5, finalScore: 8.2, actualAverage: 7.9 },
    attendanceRecords: [
      {
        attendanceId: "a4",
        timestamp: "2025-08-02T08:00",
        status: "Có mặt",
      },
      {
        attendanceId: "a5",
        timestamp: "2025-08-04T08:00",
        status: "Có mặt",
      },
    ],
    assignments: [
      {
        assignmentId: "as3",
        title: "Bài 1",
        submissions: [{ submissionId: "s2", status: "SUBMITTED" }],
      },
      {
        assignmentId: "as4",
        title: "Bài 2",
        submissions: [{ submissionId: "s3", status: "SUBMITTED" }],
      },
    ],
    notifications: [
      {
        notificationId: "n3",
        sentAt: "2025-08-03",
        message: "Nộp bài lab 1 trước 15/08",
      },
    ],
  },
  {
    subjectId: "3",
    name: "Cơ sở dữ liệu",
    description: "Môn học về cơ sở dữ liệu quan hệ",
    semester: "HK2",
    classSubjects: [
      {
        classSubjectId: "cs3",
        class: {
          classId: "class3",
          name: "Lớp 12C",
          term: "HK2",
          classSize: 30,
        },
        teacher: { teacherCode: "T03", fullName: "Thầy Cường" },
      },
    ],
    subjectGrade: { midtermScore: 8.5, finalScore: 9.0, actualAverage: 8.8 },
    attendanceRecords: [
      {
        attendanceId: "a6",
        timestamp: "2025-09-01T08:00",
        status: "Có mặt",
      },
      { attendanceId: "a7", timestamp: "2025-09-03T08:00", status: "Vắng" },
    ],
    assignments: [
      {
        assignmentId: "as5",
        title: "Bài 1",
        submissions: [{ submissionId: "s4", status: "SUBMITTED" }],
      },
      { assignmentId: "as6", title: "Bài 2", submissions: [] },
    ],
    notifications: [
      {
        notificationId: "n4",
        sentAt: "2025-09-01",
        message: "Nộp đề cương dự án cuối kỳ",
      },
    ],
  },
  {
    subjectId: "4",
    name: "Mạng máy tính",
    description: "Môn học về mạng máy tính cơ bản",
    semester: "HK2",
    classSubjects: [
      {
        classSubjectId: "cs4",
        class: {
          classId: "class4",
          name: "Lớp 12D",
          term: "HK2",
          classSize: 32,
        },
        teacher: { teacherCode: "T04", fullName: "Cô Dung" },
      },
    ],
    subjectGrade: { midtermScore: 7.0, finalScore: 7.8, actualAverage: 7.4 },
    attendanceRecords: [
      {
        attendanceId: "a8",
        timestamp: "2025-09-02T08:00",
        status: "Có mặt",
      },
      {
        attendanceId: "a9",
        timestamp: "2025-09-04T08:00",
        status: "Có mặt",
      },
    ],
    assignments: [
      { assignmentId: "as7", title: "Bài 1", submissions: [] },
      {
        assignmentId: "as8",
        title: "Bài 2",
        submissions: [{ submissionId: "s5", status: "SUBMITTED" }],
      },
    ],
    notifications: [
      {
        notificationId: "n5",
        sentAt: "2025-09-02",
        message: "Bắt đầu lab mạng 1",
      },
    ],
  },
];

export default function SubjectListScreen({ navigation }) {
  const [selectedSemester, setSelectedSemester] = useState("Tất cả");

  const filteredSubjects =
    selectedSemester === "Tất cả"
      ? subjects
      : subjects.filter((s) => s.semester === selectedSemester);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("SubjectDetail", { subject: item })}
    >
      <Text style={styles.subjectName}>
        {item.name} - {item.subjectId}
      </Text>
      <Text style={styles.description}>{item.description}</Text>

      {item.classSubjects.map((cs) => (
        <View key={cs.classSubjectId} style={styles.classRow}>
          <Text style={styles.className}>{cs.class.name}</Text>
          <Text style={styles.teacherName}>
            Giáo viên/Giảng viên: {cs.teacher.fullName}
          </Text>
        </View>
      ))}

      <Text style={styles.semester}>Học kỳ: {item.semester}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Bộ lọc học kỳ */}
      <View style={styles.filterRow}>
        {["Tất cả", "HK1", "HK2"].map((sem) => (
          <TouchableOpacity
            key={sem}
            style={[
              styles.filterButton,
              selectedSemester === sem && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedSemester(sem)}
          >
            <Text
              style={[
                styles.filterText,
                selectedSemester === sem && styles.filterTextActive,
              ]}
            >
              {sem}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Danh sách môn học */}
      <FlatList
        data={filteredSubjects}
        keyExtractor={(item) => item.subjectId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>Không có môn học</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  list: { paddingBottom: 20 },

  // Card môn học
  item: {
    backgroundColor: "#f2f2f2",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  subjectName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  description: { fontSize: 13, color: "#555", marginBottom: 6 },
  classRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  className: { fontSize: 14, color: "#333" },
  teacherName: { fontSize: 13, color: "#777" },
  semester: { fontSize: 12, color: "#999", marginTop: 4 },

  // Bộ lọc học kỳ
  filterRow: { flexDirection: "row", marginBottom: 16 },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#aaa",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  filterText: { fontSize: 14, color: "#333" },
  filterTextActive: { color: "#fff", fontWeight: "bold" },

  // Empty
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
});
