import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  ImageBackground,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";

export default function LoginScreen({ navigation }) {
  const handleLogin = () => {
    navigation.replace("MainTabs");
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
          <View
            style={{
              width: "80%",
              alignItems: "center",
            }}
          >
            <TextInput
              placeholder="Nhập Mã định danh hoặc Số điện thoại..."
              placeholderTextColor={"gray"}
              style={{
                borderColor: "white",
                paddingHorizontal: 10,
                borderRadius: 10,
                marginBottom: 10,
                width: "100%",
                backgroundColor: "white",
                paddingVertical: 15,
              }}
            />
            <TextInput
              placeholder="Nhập Mật khẩu..."
              placeholderTextColor={"gray"}
              style={{
                borderColor: "white",
                paddingHorizontal: 10,
                borderRadius: 10,
                marginBottom: 10,
                width: "100%",
                backgroundColor: "white",
                paddingVertical: 15,
              }}
            />
            <View style={{ width: "100%" }}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Thông báo", "Chức năng chưa được phát triển")
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
            <TouchableOpacity
              style={{ paddingTop: 30 }}
              onPress={() => {
                handleLogin();
                Alert.alert("Thông báo", "Đăng nhập thành công!");
              }}
            >
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
});
