import { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { AuthContext } from "../../contexts/AuthContext";
import classSubjectService from "../../services/classSubjectService";

function SimpleSubjectListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const studentSubjects =
          await classSubjectService.getClassSubjectsByStudent({
            studentId: user.userId,
          });

        if (!Array.isArray(studentSubjects) || studentSubjects.length === 0) {
          setSubjects([]);
          return;
        }

        const allClassSubjects =
          await classSubjectService.getAllClassSubjects();
        if (!Array.isArray(allClassSubjects)) {
          setSubjects([]);
          return;
        }

        const today = new Date();

        const detailedSubjects = studentSubjects
          .map((s) => {
            const detail = allClassSubjects.find(
              (cs) => cs.classSubjectId === s.classSubjectId
            );
            if (!detail) return null;

            const begin = new Date(detail.term?.beginDate);
            const end = new Date(detail.term?.endDate);

            if (!(begin <= today && today <= end)) return null;

            return {
              classSubjectId: detail.classSubjectId,
              className: s.className,
              name: detail.subject?.name || s.subjectName,
              teacherName:
                detail.teacher?.fullName || s.teacherName || "Chưa có",
              semester: detail.term?.name || s.termName || "",
              beginDate: detail.term?.beginDate || null,
              endDate: detail.term?.endDate || null,
            };
          })
          .filter(Boolean);

        setSubjects(detailedSubjects);
      } catch (error) {
        console.error("Lỗi khi lấy môn học chi tiết:", error);
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [user]);

  const renderItem = ({ item }) => {
    const today = new Date();
    const begin = new Date(item.beginDate);
    const end = new Date(item.endDate);

    let status = "Đang diễn ra";
    if (begin > today) status = "Sắp diễn ra";
    else if (end < today) status = "Đã học xong";

    const borderStyle =
      status === "Đang diễn ra"
        ? styles.activeBorder
        : status === "Sắp diễn ra"
        ? styles.upcomingBorder
        : styles.finishedBorder;

    return (
      <TouchableOpacity
        style={[styles.card, borderStyle]}
        onPress={() => navigation.navigate("SubjectDetail", { subject: item })}
      >
        <Text style={styles.title}>{item.name.toUpperCase()}</Text>
        <Text style={styles.teacher}>{item.teacherName}</Text>
        <Text style={styles.semester}>{item.semester}</Text>
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
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text>Đang tải danh sách môn học...</Text>
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.classSubjectId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text>Không có môn học nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  list: {
    paddingBottom: 20,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#2c3e50",
  },
  teacher: {
    fontSize: 13,
    color: "#555",
  },
  semester: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 6,
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
});

export default SimpleSubjectListScreen;
