import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bannerLight from "../../assets/banner-light.png";
import bannerDark from "../../assets/banner-dark.png";
import passwordService from "../../services/passwordService";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const result = await passwordService.sendOtp(email);

      if (result && result.success) {
        setMessage("OTP đã được gửi tới email của bạn.");
        setTimeout(() => navigate("/verify-otp", { state: { email } }), 1000);
      } else {
        setError(result?.message || "Gửi OTP thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi gửi OTP:", err);
      setError("Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <img
          src={
            window.matchMedia("(prefers-color-scheme: dark)").matches
              ? bannerDark
              : bannerLight
          }
          alt="EStude Banner"
          className="w-[260px] sm:w-[320px] mb-6"
        />
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl font-extrabold mb-2 text-center">
            Quên mật khẩu
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            Nhập email để nhận mã OTP
          </p>

          {message && (
            <div className="text-green-500 text-sm mb-4 text-center">
              {message}
            </div>
          )}
          {error && (
            <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 w-full p-3 rounded-lg mb-4 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-3 rounded-lg w-full font-semibold hover:bg-green-700 transition-all shadow-md disabled:opacity-60"
          >
            {loading ? "Đang gửi..." : "Gửi OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
