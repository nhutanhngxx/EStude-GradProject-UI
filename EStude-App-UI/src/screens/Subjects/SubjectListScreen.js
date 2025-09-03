import { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { AuthContext } from "../../contexts/AuthContext";
import subjectService from "../../services/subjectService";

export default function SubjectListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("Tất cả");

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user) return;

      const result = await subjectService.getSubjectsByStudent();
      if (result) {
        // lọc enrollment theo userId đăng nhập
        const myEnrollments = result.filter(
          (en) => en.student.userId === user.userId
        );

        // map enrollment → subject item (theo class info trong enrollment)
        const mappedSubjects = myEnrollments.map((en) => ({
          subjectId: en.enrollmentId, // tạm dùng enrollmentId làm id
          name: en.clazz.name,
          description: `Lớp học: ${en.clazz.name}`,
          semester: en.clazz.term,
          classSubjects: [
            {
              classSubjectId: `cs-${en.clazz.classId}`,
              class: {
                classId: en.clazz.classId,
                name: en.clazz.name,
                term: en.clazz.term,
                classSize: en.clazz.classSize,
              },
              teacher: {
                fullName: en.clazz.homeroomTeacher
                  ? en.clazz.homeroomTeacher.fullName
                  : "Chưa có",
              },
            },
          ],
        }));

        setSubjects(mappedSubjects);
      } else {
        setSubjects([]);
      }
    };

    fetchSubjects();
  }, [user]);

  const filteredSubjects =
    selectedSemester === "Tất cả"
      ? subjects
      : subjects.filter((s) => s.semester === selectedSemester);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("SubjectDetail", { subject: item })}
    >
      <Text style={styles.subjectName}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>

      {item.classSubjects.map((cs) => (
        <View key={cs.classSubjectId} style={styles.classRow}>
          {/* <Text style={styles.className}>{cs.class.name}</Text> */}
          <Text style={styles.teacherName}>GV: {cs.teacher.fullName}</Text>
        </View>
      ))}

      <Text style={styles.semester}>{item.semester}</Text>
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
        keyExtractor={(item) => item.subjectId.toString()}
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
