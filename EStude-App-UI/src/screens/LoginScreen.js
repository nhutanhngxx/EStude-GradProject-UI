import { StatusBar } from "expo-status-bar";
import React, { useContext, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import authService from "../services/authService";
import { useToast } from "../contexts/ToastContext";

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current; // slide-up khi xuất hiện
  const keyboardSlide = useRef(new Animated.Value(0)).current; // slide khi bàn phím

  useEffect(() => {
    // Animation card xuất hiện
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const keyboardShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        Animated.timing(keyboardSlide, {
          toValue: -100, // đẩy card lên 100px, tuỳ chỉnh
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        Animated.timing(keyboardSlide, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      showToast("Vui lòng nhập đầy đủ thông tin đăng nhập!", { type: "error" });
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            {/* Card animated */}
            <Animated.View
              style={[
                styles.loginContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: Animated.add(slideAnim, keyboardSlide) },
                  ],
                },
              ]}
            >
              <Text style={styles.title}>HỌC SINH ĐĂNG NHẬP</Text>

              <TextInput
                placeholder="Nhập mã đăng nhập"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor="#999"
                style={styles.input}
              />
              <TextInput
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#999"
                style={styles.input}
              />

              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  loginContainer: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginTop: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007f3f",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    color: "#007AFF",
    fontStyle: "italic",
    marginBottom: 25,
    fontSize: 14,
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#00cc66",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
