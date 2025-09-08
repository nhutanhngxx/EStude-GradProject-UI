import { StatusBar } from "expo-status-bar";
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ImageBackground,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import authService from "../services/authService";
import { useToast } from "../contexts/ToastContext";

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      showToast("Vui lòng nhập đầy đủ thông tin!", { type: "error" });
      return;
    }

    const result = await authService.login({ username, password });

    if (result) {
      await login(result.user, result.token);
      showToast("Đăng nhập thành công!", { type: "success" });
      navigation.replace("MainTabs");
    } else {
      showToast("Đăng nhập thất bại. Vui lòng thử lại.", { type: "error" });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <ImageBackground
        source={require("../assets/images/background-01.png")}
        style={styles.backgroundImage}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 100,
            paddingBottom: 30,
          }}
        >
          <Image
            source={require("../assets/images/banner-light.png")}
            style={styles.logo}
          />
          <View style={{ width: "80%", alignItems: "center" }}>
            <TextInput
              placeholder="Nhập mã đăng nhập"
              value={username}
              onChangeText={setUsername}
              placeholderTextColor={"gray"}
              style={styles.input}
            />
            <TextInput
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={"gray"}
              style={styles.input}
            />
            <View style={{ width: "100%" }}>
              <TouchableOpacity
                onPress={() =>
                  showToast("Chức năng quên mật khẩu chưa phát triển", {
                    type: "default",
                  })
                }
              >
                <Text
                  style={{
                    color: "white",
                    textAlign: "right",
                    fontStyle: "italic",
                  }}
                >
                  Quên mật khẩu?
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ paddingTop: 30 }} onPress={handleLogin}>
              <Text style={{ fontSize: 16, color: "white" }}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
          <View>
            <Text
              style={{ color: "white", textAlign: "center", fontSize: 16 }}
              onPress={() => navigation.navigate("RoleSelection")}
            >
              Trở lại trang chọn vai trò
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  logo: {
    width: "100%",
    height: 100,
    resizeMode: "contain",
  },
  input: {
    borderColor: "white",
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    width: "100%",
    backgroundColor: "white",
    paddingVertical: 15,
  },
});
