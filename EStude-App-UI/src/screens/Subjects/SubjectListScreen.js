import { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
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
    .normalize("NFD")
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const result = await subjectService.getSubjectsByStudent();
        if (!result) {
          setSubjects([]);
          return;
        }

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
      } finally {
        setLoading(false);
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

  const renderItem = ({ item, index }) => {
    const begin = new Date(item.beginDate);
    const end = new Date(item.endDate);
    const today = new Date();

    let status = "Đang diễn ra";
    if (begin > today) status = "Sắp diễn ra";
    if (end < today) status = "Đã học xong";

    const borderStyle =
      status === "Đang diễn ra"
        ? styles.activeBorder
        : status === "Sắp diễn ra"
        ? styles.upcomingBorder
        : styles.finishedBorder;

    const isLastOdd =
      isGrid &&
      index === filteredSubjects.length - 1 &&
      filteredSubjects.length % 2 !== 0;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          borderStyle,
          isGrid && (isLastOdd ? styles.cardFullWidth : styles.cardGrid),
        ]}
        onPress={() => navigation.navigate("SubjectDetail", { subject: item })}
      >
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.semester}>Học kỳ: {item.semester}</Text>
        <Text style={styles.deadline}>
          {`Thời gian: ${formatDate(item.beginDate)} - ${formatDate(
            item.endDate
          )}`}
        </Text>

        <Text
          style={[
            styles.status,
            status === "Đang diễn ra"
              ? styles.statusActive
              : status === "Sắp diễn ra"
              ? styles.statusUpcoming
              : styles.statusFinished,
          ]}
        >
          {status}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Loading */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text>Đang tải danh sách môn học...</Text>
        </View>
      ) : (
        <>
          {/* Thanh tìm kiếm + nút đổi layout */}
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.searchInput, { flex: 1 }]}
              placeholder="Tìm môn học..."
              placeholderTextColor="#999"
              value={searchKeyword}
              onChangeText={setSearchKeyword}
            />
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsGrid(!isGrid)}
            >
              <Text style={styles.toggleButtonText}>
                {isGrid ? "Danh sách" : "Lưới"}
              </Text>
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
                options={[
                  "Tất cả",
                  "Sắp diễn ra",
                  "Đang diễn ra",
                  "Đã học xong",
                ]}
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
        </>
      )}
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
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2c3e50",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  toggleButton: {
    marginLeft: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 5,
    backgroundColor: "#27ae60",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
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
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  semester: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  deadline: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
  },
  activeBorder: {
    borderLeftWidth: 5,
    borderLeftColor: "#27ae60",
  },
  upcomingBorder: {
    borderLeftWidth: 5,
    borderLeftColor: "#3498db",
  },
  finishedBorder: {
    borderLeftWidth: 5,
    borderLeftColor: "#7f8c8d",
  },

  status: {
    fontSize: 14,
    fontWeight: "bold",
  },
  statusActive: {
    color: "#27ae60",
  },
  statusUpcoming: {
    color: "#3498db",
  },
  statusFinished: {
    color: "#7f8c8d",
  },

  cardGrid: {
    flex: 1,
    margin: 6,
  },
  cardFullWidth: {
    width: "100%",
    marginVertical: 6,
  },
});

export default SubjectListScreen;
