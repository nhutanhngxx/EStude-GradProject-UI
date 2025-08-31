import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import passwordService from "../../services/passwordService";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await passwordService.verifyOtp({ email, otp });

      if (result && result.success) {
        navigate("/reset-password", { state: { email, otp } });
      } else {
        setError(result?.message || "OTP không hợp lệ hoặc hết hạn.");
      }
    } catch (err) {
      console.error("Lỗi xác thực OTP:", err);
      setError("Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <form
          onSubmit={handleVerify}
          className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl font-extrabold mb-2 text-center">
            Xác thực OTP
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            Nhập mã OTP đã gửi đến email: <strong>{email}</strong>
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

          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-3 rounded-lg w-full font-semibold hover:bg-green-700 transition-all shadow-md disabled:opacity-60"
          >
            {loading ? "Đang xác thực..." : "Xác thực OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
