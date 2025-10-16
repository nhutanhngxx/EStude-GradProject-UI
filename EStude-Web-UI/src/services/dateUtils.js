/**
 * Định dạng ngày theo kiểu Việt Nam (DD/MM/YYYY)
 * @param {Date|string} date - Ngày cần định dạng
 * @returns {string} - Chuỗi ngày định dạng DD/MM/YYYY
 */
export const formatVietnameseDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Tính khoảng thời gian từ hiện tại đến một ngày cụ thể
 * @param {Date|string} date - Ngày cần tính
 * @returns {string} - Chuỗi mô tả khoảng thời gian (VD: "1 phút trước")
 */
export const timeAgo = (date) => {
  if (!date) return "Không xác định";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "Không xác định";

  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);

  // Định nghĩa các khoảng thời gian
  const intervals = [
    { label: "năm", seconds: 31536000 }, // 60 * 60 * 24 * 365
    { label: "tháng", seconds: 2592000 }, // 60 * 60 * 24 * 30
    { label: "tuần", seconds: 604800 }, // 60 * 60 * 24 * 7
    { label: "ngày", seconds: 86400 }, // 60 * 60 * 24
    { label: "giờ", seconds: 3600 }, // 60 * 60
    { label: "phút", seconds: 60 },
    { label: "giây", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "" : ""} trước`;
    }
  }

  return "Vừa xong";
};
