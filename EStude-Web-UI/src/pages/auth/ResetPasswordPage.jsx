import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import passwordService from "../../services/passwordService";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const otpFromState = location.state?.otp || "";

  const [otp, setOtp] = useState(otpFromState);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*]/.test(password)) score += 1;
    return score;
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và mật khẩu nhập lại không khớp.");
      return;
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
      setError(
        "Mật khẩu yếu! Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
      );
      return;
    }

    setLoading(true);

    try {
      const result = await passwordService.resetPassword({
        email,
        otp,
        newPassword,
      });
      if (result && result.success) {
        alert("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
        navigate("/");
      } else {
        setError(result?.message || "Đặt lại mật khẩu thất bại.");
      }
    } catch (err) {
      console.error("Lỗi khi đặt lại mật khẩu:", err);
      setError("Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <form
          onSubmit={handleReset}
          className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl font-extrabold mb-2 text-center">
            Đặt lại mật khẩu
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            Nhập OTP và mật khẩu mới
          </p>

          {error && (
            <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
          )}

          <input
            type="text"
            placeholder="Mã OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 w-full p-3 rounded-lg mb-4 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />

          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordStrength(calculatePasswordStrength(e.target.value));
            }}
            className="border border-gray-300 dark:border-gray-600 w-full p-3 rounded-lg mb-2 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />

          {/* ✅ Strength Bar */}
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded mb-1">
            <div
              className={`h-2 rounded transition-all duration-300`}
              style={{
                width: `${(passwordStrength / 5) * 100}%`,
                backgroundColor:
                  passwordStrength < 3
                    ? "red"
                    : passwordStrength < 5
                    ? "orange"
                    : "green",
              }}
            ></div>
          </div>
          <p className="text-xs mb-4">
            {passwordStrength < 3
              ? "Mật khẩu yếu"
              : passwordStrength < 5
              ? "Mật khẩu trung bình"
              : "Mật khẩu mạnh"}
          </p>

          <input
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 w-full p-3 rounded-lg mb-4 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-3 rounded-lg w-full font-semibold hover:bg-green-700 transition-all shadow-md disabled:opacity-60"
          >
            {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
