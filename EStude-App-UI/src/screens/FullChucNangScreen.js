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
import { MaterialIcons } from "@expo/vector-icons";

const features = [
  { id: "1", iconName: "grading", label: "Xem điểm", hint: "Kết quả học tập" },
  {
    id: "2",
    iconName: "check-circle-outline",
    label: "Điểm danh",
    hint: "Điểm danh buổi học",
  },
  { id: "3", iconName: "file-upload", label: "Bài tập", hint: "Bài hôm nay" },
  {
    id: "4",
    iconName: "calendar-today",
    label: "Lịch học",
    hint: "Lịch học & lịch thi",
  },
  {
    id: "5",
    iconName: "insights",
    label: "Thống kê",
    hint: "Điểm danh chi tiết",
  },
  { id: "6", iconName: "newspaper", label: "Tin tức", hint: "Thông báo mới" },
];

export default function FullChucNangScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => console.log(`Đi tới ${item.label}`)}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name={item.iconName}
        size={32}
        color="#777777"
        style={styles.icon}
      />
      <Text style={styles.label}>{item.label}</Text>
      <Text style={styles.hint}>{item.hint}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <FlatList
          data={features}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, padding: 16 },
  list: { paddingBottom: 20 },
  row: { justifyContent: "space-between" },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: { marginBottom: 8 },
  label: { fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 12, color: "#666", marginTop: 4, textAlign: "center" },
});
