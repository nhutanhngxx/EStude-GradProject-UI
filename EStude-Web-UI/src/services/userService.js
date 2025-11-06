import config from "../config/config.js";

const userService = {
  /**
   * Update user avatar
   * @param {number} userId - User ID
   * @param {File} avatarFile - Image file to upload
   * @returns {Promise<Object>} Updated user data
   */
  updateAvatar: async (userId, avatarFile) => {
    try {
      if (!avatarFile) {
        throw new Error("Vui lòng chọn ảnh để upload");
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(avatarFile.type)) {
        throw new Error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)");
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (avatarFile.size > maxSize) {
        throw new Error("Kích thước ảnh không được vượt quá 5MB");
      }

      const formData = new FormData();
      formData.append("avatar", avatarFile);

      console.log("🔍 [Upload Avatar] userId:", userId);
      console.log("🔍 [Upload Avatar] File name:", avatarFile.name);
      console.log("🔍 [Upload Avatar] File type:", avatarFile.type);
      console.log("🔍 [Upload Avatar] File size:", avatarFile.size);
      console.log(
        "🔍 [Upload Avatar] URL:",
        `${config.BASE_URL}/api/users/${userId}/avatar`
      );

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(
          `${config.BASE_URL}/api/users/${userId}/avatar`,
          {
            method: "PATCH",
            body: formData,
            signal: controller.signal,
            // No Authorization header as per backend requirement
          }
        );

        clearTimeout(timeoutId);

        console.log("📦 [Upload Avatar] Response status:", response.status);
        console.log("📦 [Upload Avatar] Response ok:", response.ok);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("❌ [Upload Avatar] Error data:", errorData);
          throw new Error(errorData.message || "Cập nhật avatar thất bại");
        }

        const data = await response.json();
        console.log("✅ [Upload Avatar] Success data:", data);

        // Backend returns avatarUrl, not avatarPath
        const avatarPath = data.avatarUrl || data.avatarPath;

        // Update user in localStorage
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (currentUser.userId === userId && avatarPath) {
          currentUser.avatarPath = avatarPath;
          localStorage.setItem("user", JSON.stringify(currentUser));
        }

        return { ...data, avatarPath }; // Add avatarPath to response for consistency
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError.name === "AbortError") {
          throw new Error("Upload quá lâu, vui lòng thử lại");
        }

        // Network error or CORS
        if (fetchError.message === "Failed to fetch") {
          console.error(
            " [Upload Avatar] Network error - CORS or Backend không phản hồi"
          );
          throw new Error(
            "Không thể kết nối với server. Vui lòng kiểm tra:\n1. Backend đang chạy tại " +
              config.BASE_URL +
              "\n2. Backend đã enable CORS cho http://localhost:5173\n3. Kết nối mạng"
          );
        }

        throw fetchError;
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      throw error;
    }
  },
};

export default userService;
