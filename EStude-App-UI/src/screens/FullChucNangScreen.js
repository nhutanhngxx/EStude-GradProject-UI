import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const features = [
  {
    id: "1",
    iconName: "bar-chart",
    label: "Tổng kết",
    hint: "Xem kết quả học tập",
    color: "#00cc66", // xanh lá chủ đạo
  },
  {
    id: "2",
    iconName: "upload",
    label: "Bài tập",
    hint: "Bài hôm nay",
    color: "#66d98c", // xanh lá nhạt
  },
  {
    id: "3",
    iconName: "calendar",
    label: "Lịch học",
    hint: "Lịch theo tuần",
    color: "#00994d", // xanh lá đậm
  },
  {
    id: "4",
    iconName: "check-circle",
    label: "Đánh giá",
    hint: "Đánh giá năng lực",
    color: "#33cc77", // xanh lá trung
  },
  {
    id: "5",
    iconName: "map",
    label: "Lộ trình học",
    hint: "Xem lộ trình năng lực",
    color: "#00b359", // xanh lá đậm hơn
  },
];

export default function FullChucNangScreen({ navigation }) {
  const renderItem = ({ item }) => {
    let screenName = "";
    switch (item.label) {
      case "Tổng kết":
        screenName = "DetailStudy"; // màn hình tổng quan học tập
        break;
      case "Bài tập":
        screenName = "NopBai"; // danh sách bài tập
        break;
      case "Lịch học":
        screenName = "ScheduleList"; // lịch học
        break;
      case "Đánh giá":
        screenName = "AssessmentSubjectSelection"; // chọn môn đánh giá
        break;
      case "Lộ trình học":
        screenName = "AssessmentLearningRoadmap"; // lộ trình học
        break;
      default:
        screenName = "FullChucNang"; // mặc định quay lại màn hình hiện tại
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate(screenName)}
        activeOpacity={0.7}
      >
        <FontAwesome
          name={item.iconName}
          size={36}
          color={item.color}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.hint}>{item.hint}</Text>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <FlatList
          data={features}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          // numColumns={1} // 1 cột duy nhất
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#e6f5ea",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
    elevation: 4,
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "#006633",
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: "#4d4d4d",
  },
});

