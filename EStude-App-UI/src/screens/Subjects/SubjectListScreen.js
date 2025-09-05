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
import classSubjectService from "../../services/classSubjectService";

export default function SubjectListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("Tất cả");

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user) return;

      try {
        const result = await subjectService.getSubjectsByStudent();
        if (!result) return setSubjects([]);

        const myEnrollments = result.filter(
          (en) => en.student.userId === user.userId
        );

        const classSubjectsFlattened = [];

        for (const en of myEnrollments) {
          const classSubjects = await classSubjectService.getByClassId(
            en.clazz.classId
          );

          classSubjects.forEach((cs) => {
            classSubjectsFlattened.push({
              classSubjectId: cs.classSubjectId,
              subjectId: cs.subject.subjectId,
              name: cs.subject.name,
              description: `Lớp học: ${en.clazz.name}`,
              semester: en.clazz.term,
              teacherName: cs.teacher?.fullName || "Chưa có",
              clazz: {
                classId: en.clazz.classId,
                name: en.clazz.name,
                term: en.clazz.term,
              },
            });
          });
        }

        setSubjects(classSubjectsFlattened);
      } catch (err) {
        console.error(err);
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
      <Text style={styles.teacherName}>GV: {item.teacherName}</Text>
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
  container: { flex: 1, padding: 16 },
  list: { paddingBottom: 20 },
  item: {
    backgroundColor: "#fff",
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
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
});
