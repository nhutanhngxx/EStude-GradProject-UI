import { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { AuthContext } from "../../contexts/AuthContext";
import subjectService from "../../services/subjectService";
import classSubjectService from "../../services/classSubjectService";
import Dropdown from "../../components/common/Dropdown";

const formatDate = (dateString) => {
  const d = new Date(dateString);
  return `${d.getDate().toString().padStart(2, "0")}/${
    d.getMonth() + 1
  }/${d.getFullYear()}`;
};

const removeVietnameseTones = (str) => {
  return str
    .normalize("NFD") // tách dấu
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

function SubjectListScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [subjects, setSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Đang diễn ra");
  const [sortOption, setSortOption] = useState("Tên");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isGrid, setIsGrid] = useState(false);

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
              description: `${en.clazz.name}`,
              semester: en.clazz.term,
              teacherName: cs.teacher?.fullName || "Chưa có",
              beginDate: en.clazz.beginDate,
              endDate: en.clazz.endDate,
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

  const today = new Date();

  const filteredSubjects = subjects
    .filter((s) => {
      const begin = new Date(s.beginDate);
      const end = new Date(s.endDate);

      if (
        selectedSemester !== "Tất cả" &&
        !s.semester.includes(selectedSemester)
      )
        return false;

      if (statusFilter === "Sắp diễn ra" && begin <= today) return false;
      if (statusFilter === "Đang diễn ra" && !(begin <= today && today <= end))
        return false;
      if (statusFilter === "Đã học xong" && end >= today) return false;

      if (searchKeyword) {
        const keyword = removeVietnameseTones(searchKeyword.toLowerCase());
        const subjectName = removeVietnameseTones(s.name.toLowerCase());
        if (!subjectName.includes(keyword)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortOption === "Tên") {
        return a.name.localeCompare(b.name);
      } else {
        return new Date(a.beginDate) - new Date(b.beginDate);
      }
    });

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, isGrid && styles.itemGrid]}
      onPress={() => navigation.navigate("SubjectDetail", { subject: item })}
    >
      <Text style={styles.subjectName}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.semester}>{item.semester}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Thanh tìm kiếm + nút đổi layout */}
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.searchInput, { flex: 1 }]}
          placeholder="Tìm môn học..."
          value={searchKeyword}
          onChangeText={setSearchKeyword}
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsGrid(!isGrid)}
        >
          <Text>{isGrid ? "Danh sách" : "Lưới"}</Text>
        </TouchableOpacity>
      </View>

      {/* Bộ lọc 3 dropdown */}
      <View style={styles.filterRow}>
        <View style={styles.dropdownWrapper}>
          <Dropdown
            options={["Tất cả", "HK1", "HK2"]}
            selected={selectedSemester}
            onSelect={setSelectedSemester}
          />
        </View>

        <View style={styles.dropdownWrapper}>
          <Dropdown
            options={["Tất cả", "Sắp diễn ra", "Đang diễn ra", "Đã học xong"]}
            selected={statusFilter}
            onSelect={setStatusFilter}
          />
        </View>

        <View style={styles.dropdownWrapper}>
          <Dropdown
            options={["Tên", "Thời gian"]}
            selected={sortOption}
            onSelect={setSortOption}
          />
        </View>
      </View>

      {/* Danh sách môn học */}
      <FlatList
        data={filteredSubjects}
        keyExtractor={(item) => item.classSubjectId.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>Không có môn học</Text>
          </View>
        }
        numColumns={isGrid ? 2 : 1}
        key={isGrid ? "grid" : "list"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  list: { paddingBottom: 20 },

  searchRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  searchInput: {
    borderWidth: 0,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleButton: {
    marginLeft: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },

  item: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    gap: 5,
    flex: 1,
  },
  itemGrid: {
    margin: 5,
    flexBasis: "48%",
  },
  subjectName: { fontSize: 16, fontWeight: "bold" },
  description: { fontSize: 13, color: "#555" },
  semester: { fontSize: 12, color: "#999" },

  filterRow: {
    flexDirection: "row",
    marginBottom: 12,
    justifyContent: "space-between",
  },
  dropdownWrapper: {
    flex: 1,
    marginHorizontal: 2,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
});

export default SubjectListScreen;
