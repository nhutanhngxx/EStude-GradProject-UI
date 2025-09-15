import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useToast } from "../../contexts/ToastContext";
import authService from "../../services/authService";

export default function ForgotPasswordScreen({ navigation }) {
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [loading, setLoading] = useState(false);

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 1; // độ dài
    if (/[A-Z]/.test(password)) score += 1; // chữ hoa
    if (/[a-z]/.test(password)) score += 1; // chữ thường
    if (/\d/.test(password)) score += 1; // số
    if (/[!@#$%^&*]/.test(password)) score += 1; // ký tự đặc biệt
    return score; // max 5
  };

  const handleSendOtp = async () => {
    if (!email) {
      showToast("Vui lòng nhập email!", { type: "error" });
      return;
    }
    setLoading(true);
    const res = await authService.forgotPassword(email);
    setLoading(false);
    if (res) {
      showToast("OTP đã được gửi tới email!", { type: "success" });
      setStep(2);
    } else {
      showToast("Gửi OTP thất bại. Vui lòng thử lại.", { type: "error" });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      showToast("Vui lòng nhập OTP!", { type: "error" });
      return;
    }
    setLoading(true);
    const res = await authService.verifyOtp({ email, otp });
    setLoading(false);
    if (res) {
      showToast("Xác nhận OTP thành công!", { type: "success" });
      setStep(3);
    } else {
      showToast("OTP không đúng. Vui lòng thử lại.", { type: "error" });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast("Vui lòng nhập đầy đủ thông tin!", { type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp!", { type: "error" });
      return;
    }

    // Regex mật khẩu mạnh
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
      showToast(
        "Mật khẩu yếu! Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
        { type: "error" }
      );
      return;
    }

    setLoading(true);
    const res = await authService.resetPassword({ email, otp, newPassword });
    setLoading(false);
    if (res) {
      showToast("Đặt lại mật khẩu thành công!", { type: "success" });
      navigation.goBack();
    } else {
      showToast("Đặt lại mật khẩu thất bại. Vui lòng thử lại.", {
        type: "error",
      });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  return (
    <ImageBackground
      source={require("../../assets/images/background-01.png")}
      style={styles.backgroundImage}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Quên mật khẩu</Text>

            {step === 1 && (
              <>
                <Text style={styles.label}>Nhập email của bạn</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholder="tencuaban@gmail.com"
                  placeholderTextColor="#999"
                  style={styles.input}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.button,
                      {
                        flex: 1,
                        marginRight: 10,
                        backgroundColor: "transparent",
                      },
                    ]}
                    onPress={handleBack}
                    disabled={loading}
                  >
                    <Text style={[styles.buttonText, { color: "#007f3f" }]}>
                      Quay lại
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { flex: 1 }]}
                    onPress={handleSendOtp}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "Đang gửi..." : "Gửi OTP"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.label}>Nhập mã OTP</Text>
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  placeholder="123456"
                  placeholderTextColor="#999"
                  style={[styles.input, { textAlign: "center" }]}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.button,
                      {
                        flex: 1,
                        marginRight: 10,
                        backgroundColor: "transparent",
                      },
                    ]}
                    onPress={handleBack}
                    disabled={loading}
                  >
                    <Text style={[styles.buttonText, { color: "#007f3f" }]}>
                      Quay lại
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { flex: 1 }]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "Đang xác nhận..." : "Xác nhận OTP"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.label}>Nhập mật khẩu mới</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setPasswordStrength(calculatePasswordStrength(text));
                  }}
                  secureTextEntry
                  placeholder="Mật khẩu mới"
                  style={styles.input}
                  placeholderTextColor="#999"
                />
                <View style={styles.strengthBarContainer}>
                  <View
                    style={[
                      styles.strengthBar,
                      { width: `${(passwordStrength / 5) * 100}%` },
                      passwordStrength < 3
                        ? { backgroundColor: "red" }
                        : passwordStrength < 5
                        ? { backgroundColor: "orange" }
                        : { backgroundColor: "green" },
                    ]}
                  />
                </View>
                <Text style={styles.strengthText}>
                  {passwordStrength < 3
                    ? "Yếu"
                    : passwordStrength < 5
                    ? "Trung bình"
                    : "Mạnh"}
                </Text>

                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Xác nhận mật khẩu"
                  style={styles.input}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <TouchableOpacity
                    style={[styles.button, { flex: 1, marginRight: 10 }]}
                    onPress={handleBack}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>Quay lại</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { flex: 1 }]}
                    onPress={handleResetPassword}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ImageBackground>
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
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#007f3f",
    marginBottom: 30,
    alignSelf: "center",
  },
  label: { fontSize: 16, marginBottom: 10, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#fff",
    color: "#333",
  },
  button: {
    backgroundColor: "#00cc66",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  strengthBarContainer: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 4,
    marginBottom: 5,
  },
  strengthBar: {
    height: "100%",
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 12,
    marginBottom: 15,
    color: "#333",
  },
});
