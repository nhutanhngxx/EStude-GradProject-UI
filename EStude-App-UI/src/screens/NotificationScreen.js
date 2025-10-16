import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import UserHeader from "../components/common/UserHeader";
import notificationService from "../services/notificationService";

export default function NotificationScreen() {
  const { user, token } = useContext(AuthContext);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const avatarUri = user?.avatarPath
    ? { uri: user.avatarPath }
    : {
        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user?.fullName || user?.username || "Unknown"
        )}&background=random&size=128`,
      };

  const tabs = ["Tất cả", "Bài tập", "Điểm danh", "Hệ thống"];

  const mapApiToNotifications = (apiNotifications) => {
    return apiNotifications.map((item) => {
      let typeLabel, color;

      switch (item.type) {
        case "ASSIGNMENT_REMINDER":
          typeLabel = "Bài tập";
          color = "#f39c12";
          break;
        case "ATTENDANCE_REMINDER":
          typeLabel = "Điểm danh";
          color = "#27ae60";
          break;
        case "SYSTEM":
          typeLabel = "Hệ thống";
          color = "#2980b9";
          break;
        case "TEACHER":
          typeLabel = "Giáo viên";
          color = "#e74c3c";
          break;
        default:
          typeLabel = "Khác";
          color = "#7f8c8d";
      }

      return {
        type: typeLabel,
        title: item.sender?.fullName
          ? `Thông báo từ ${item.sender.fullName}`
          : "Thông báo hệ thống",
        content: item.message,
        time: new Date(item.sentAt).toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        color,
      };
    });
  };

  const fetchNotifications = async () => {
    if (!token) {
      setError("Không có token để truy cập API");
      return;
    }

    setLoading(true);
    try {
      const result = await notificationService.studentGetReceivedNotifications(
        token
      );

      if (result && Array.isArray(result)) {
        setNotifications(mapApiToNotifications(result));
        setError(null);
      } else {
        setError("Không thể tải danh sách thông báo");
        setNotifications([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
      setError("Lỗi khi tải thông báo");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNotifications();
      showToast("Thông báo đã được làm mới!", { type: "success" });
    } catch (error) {
      console.error("Refresh error:", error);
      showToast("Lỗi khi làm mới thông báo!", { type: "error" });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // return () => clearInterval(interval);
  }, [token]);

  const filteredNotifications =
    activeTab === "Tất cả"
      ? notifications
      : notifications.filter((n) => n.type === activeTab);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2e7d32"]}
            tintColor={"#2e7d32"}
          />
        }
      >
        <UserHeader />

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

          {/* Loading State */}
          {loading && (
            <View style={styles.loading}>
              <Text>Đang tải thông báo...</Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Empty State */}
          {!loading && !error && filteredNotifications.length === 0 && (
            <View style={styles.empty}>
              <Text>Không có thông báo nào</Text>
            </View>
          )}

          {/* Notification Items */}
          {filteredNotifications.map((item, index) => (
            <View
              key={index}
              style={[styles.notificationItem, { borderLeftColor: item.color }]}
            >
              <Text style={styles.notificationContent}>{item.content}</Text>
              <Text style={styles.notificationTime}>{item.time}</Text>
            </View>
          ))}

          {/* Load More */}
          <View style={styles.loadMore}>
            <TouchableOpacity>
              <Text style={styles.loadMoreText}>Đã nhận đủ bộ lọc này</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => fetchNotifications()}>
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
    paddingHorizontal: 16,
  },
  main: {
    flex: 1,
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
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
  loading: {
    alignItems: "center",
    padding: 20,
  },
  error: {
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#ff3333",
    fontSize: 14,
  },
  empty: {
    alignItems: "center",
    padding: 20,
  },
});
