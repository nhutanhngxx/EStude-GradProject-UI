import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const user = {
  name: "Nguyễn Nhựt Anh",
  avatar: "https://i.pravatar.cc/150?img=12",
  grade: "12A3",
};

export default function NotificationScreen() {
  const [activeTab, setActiveTab] = useState("Tất cả");

  const tabs = ["Tất cả", "Bài tập", "Hệ thống", "Giáo viên"];

  const notifications = [
    {
      type: "Bài tập",
      title: "Nhắc nhở nộp bài tập Toán - Giải tích",
      content: "Hạn chót: 18/07/2025. Vui lòng nộp bài trước 23:59.",
      time: "02:00 PM, 12/07/2025",
      color: "#ffcc00",
    },
    {
      type: "Bài tập",
      title: "Bài tập Lịch sử - Thế chiến II",
      content:
        "Đã nhận được bài nộp của bạn. Điểm sẽ được cập nhật trong 2 ngày.",
      time: "01:30 PM, 12/07/2025",
      color: "#ffcc00",
    },
    {
      type: "Hệ thống",
      title: "Cập nhật ứng dụng eStudie",
      content:
        "Phiên bản mới 2.1.0 đã sẵn sàng. Tải xuống để trải nghiệm tính năng mới.",
      time: "12:00 PM, 12/07/2025",
      color: "#3399ff",
    },
    {
      type: "Hệ thống",
      title: "Thông báo bảo trì hệ thống",
      content: "Hệ thống sẽ bảo trì từ 02:00 AM - 04:00 AM ngày 13/07/2025.",
      time: "11:45 AM, 12/07/2025",
      color: "#3399ff",
    },
    {
      type: "Giáo viên",
      title: "Thông báo từ GV. Nguyễn Văn A",
      content: "Lớp Vật lý sẽ có buổi học bổ sung vào 08:00 AM, 15/07/2025.",
      time: "02:15 PM, 12/07/2025",
      color: "#ff6666",
    },
    {
      type: "Giáo viên",
      title: "Phản hồi bài tập",
      content:
        "Bài tập Toán của bạn cần chỉnh sửa phần tính toán. Vui lòng xem lại.",
      time: "02:10 PM, 12/07/2025",
      color: "#ff6666",
    },
  ];

  const filteredNotifications =
    activeTab === "Tất cả"
      ? notifications
      : notifications.filter((n) => n.type === activeTab);

  return (
    <SafeAreaView style={styles.safe}>
      {/* <StatusBar barStyle="dark-content" /> */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>EStude</Text>
            <Text style={styles.greeting}>
              Xin chào, <Text style={styles.highlight}>{user.name}</Text> 👋
            </Text>
            <Text style={styles.subGreeting}>
              Lớp {user.grade} • Học tốt mỗi ngày
            </Text>
          </View>
          {/* <Image source={{ uri: user.avatar }} style={styles.avatar} /> */}
        </View>

        {/* Main Content */}
        <ScrollView style={styles.main}>
          {/* Tabs */}
          <View style={styles.tabs}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notification Items */}
          {filteredNotifications.map((item, index) => (
            <View
              key={index}
              style={[styles.notificationItem, { borderLeftColor: item.color }]}
            >
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationContent}>{item.content}</Text>
              <Text style={styles.notificationTime}>{item.time}</Text>
            </View>
          ))}

          {/* Load More */}
          <View style={styles.loadMore}>
            <TouchableOpacity>
              <Text style={styles.loadMoreText}>Đã nhận đủ bộ lọc này</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.loadMoreText}>Cập nhật</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brand: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00cc66",
  },
  greeting: {
    fontSize: 16,
    color: "#333",
  },
  highlight: {
    fontWeight: "bold",
  },
  subGreeting: {
    fontSize: 14,
    color: "#777",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  main: {
    flex: 1,
    marginTop: 10,
  },

  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
    // paddingHorizontal: 15,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  activeTab: {
    backgroundColor: "#2e7d32",
  },
  tabText: {
    fontSize: 14,
    color: "#333",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },

  notificationItem: {
    backgroundColor: "#fff",
    padding: 15,
    // marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    borderLeftWidth: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  notificationContent: {
    fontSize: 14,
    color: "#555",
    marginVertical: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: "#777",
    textAlign: "right",
  },

  loadMore: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    marginTop: 5,
  },
  loadMoreText: {
    color: "#2e7d32",
    fontWeight: "bold",
  },
});
