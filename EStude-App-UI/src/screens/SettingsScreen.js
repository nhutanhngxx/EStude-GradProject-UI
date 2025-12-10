import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../components/common/ConfirmModal";

export default function SettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { logout } = useContext(AuthContext);
  const { showToast } = useToast();
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false); // State để điều khiển modal

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      showToast("Đăng xuất thành công", { type: "success" });
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (err) {
      console.log("Logout error:", err);
      showToast("Đăng xuất thất bại", { type: "error" });
    } finally {
      setLogoutModalVisible(false);
    }
  };

  const handleCancelLogout = () => {
    setLogoutModalVisible(false);
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* <Text style={styles.sectionTitle}>Cài đặt chung</Text>

        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="notifications-outline" size={22} color="#333" />
            <Text style={styles.itemText}>Thông báo</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#ccc", true: "#00cc66" }}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="person-outline" size={22} color="#333" />
            <Text style={styles.itemText}>Cài đặt tài khoản</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Khác</Text>

        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <MaterialIcons name="policy" size={22} color="#333" />
            <Text style={styles.itemText}>Điều khoản sử dụng</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <MaterialIcons name="privacy-tip" size={22} color="#333" />
            <Text style={styles.itemText}>Chính sách bảo mật</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity> */}

        <TouchableOpacity
          style={[styles.item, styles.logout]}
          onPress={handleLogout}
        >
          <View style={styles.itemLeft}>
            <MaterialIcons name="logout" size={22} color="#e63946" />
            <Text style={[styles.itemText, { color: "#e63946" }]}>
              Đăng xuất
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Sử dụng ConfirmModal cho đăng xuất */}
      <ConfirmModal
        visible={isLogoutModalVisible}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 14,
    color: "#777",
    marginBottom: 8,
    marginTop: 16,
    fontWeight: "bold",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemText: { fontSize: 15, color: "#333" },
  logout: {
    marginTop: 20,
    backgroundColor: "#fff5f5",
  },
});
