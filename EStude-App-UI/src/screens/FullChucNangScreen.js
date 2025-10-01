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
    iconName: "graduation-cap",
    label: "Xem điểm",
    hint: "Kết quả học tập",
    color: "#4CAF50",
  }, // xanh lá
  {
    id: "2",
    iconName: "check-circle",
    label: "Điểm danh",
    hint: "Điểm danh buổi học",
    color: "#2196F3",
  }, // xanh dương
  {
    id: "3",
    iconName: "upload",
    label: "Bài tập",
    hint: "Bài hôm nay",
    color: "#FF9800",
  }, // cam
  {
    id: "4",
    iconName: "calendar",
    label: "Lịch học",
    hint: "Lịch theo tuần",
    color: "#9C27B0",
  }, // tím
  {
    id: "5",
    iconName: "bar-chart",
    label: "Thống kê",
    hint: "Điểm danh chi tiết",
    color: "#F44336",
  }, // đỏ
  {
    id: "6",
    iconName: "newspaper-o",
    label: "Tin tức",
    hint: "Thông báo mới",
    color: "#00BCD4",
  }, // xanh ngọc
];

export default function FullChucNangScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => console.log(`Đi tới ${item.label}`)}
      activeOpacity={0.7}
    >
      <FontAwesome
        name={item.iconName}
        size={32}
        color={item.color}
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
