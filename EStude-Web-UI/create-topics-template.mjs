import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dữ liệu mẫu cho template
const sampleData = [
  {
    "Tên chủ đề": "Mệnh đề",
    Chương: "CHƯƠNG I: MỆNH ĐỀ VÀ TẬP HỢP",
    "Mô tả": "Tìm hiểu về mệnh đề logic và các phép toán trên mệnh đề",
    "Khối lớp": "GRADE_10",
    "Tập sách": 1,
    "Thứ tự": 1,
  },
  {
    "Tên chủ đề": "Tập hợp",
    Chương: "CHƯƠNG I: MỆNH ĐỀ VÀ TẬP HỢP",
    "Mô tả": "Các khái niệm cơ bản về tập hợp, các phép toán trên tập hợp",
    "Khối lớp": "GRADE_10",
    "Tập sách": 1,
    "Thứ tự": 2,
  },
  {
    "Tên chủ đề": "Hàm số và đồ thị",
    Chương: "CHƯƠNG II: HÀM SỐ BẬC NHẤT VÀ BẬC HAI",
    "Mô tả": "Khái niệm hàm số, tính chất và cách vẽ đồ thị hàm số",
    "Khối lớp": "GRADE_10",
    "Tập sách": 1,
    "Thứ tự": 3,
  },
  {
    "Tên chủ đề": "Hàm số bậc nhất",
    Chương: "CHƯƠNG II: HÀM SỐ BẬC NHẤT VÀ BẬC HAI",
    "Mô tả": "Hàm số bậc nhất y = ax + b và ứng dụng",
    "Khối lớp": "GRADE_10",
    "Tập sách": 1,
    "Thứ tự": 4,
  },
  {
    "Tên chủ đề": "Hàm số bậc hai",
    Chương: "CHƯƠNG II: HÀM SỐ BẬC NHẤT VÀ BẬC HAI",
    "Mô tả": "Hàm số bậc hai y = ax² + bx + c, parabol và đỉnh",
    "Khối lớp": "GRADE_10",
    "Tập sách": 1,
    "Thứ tự": 5,
  },
];

// Hướng dẫn sử dụng
const instructions = [
  ["HƯỚNG DẪN IMPORT CHỦ ĐỀ"],
  [""],
  ["1. CẤU TRÚC FILE:"],
  ["   - Tên chủ đề: Tên của chủ đề (bắt buộc)"],
  ["   - Chương: Chương của chủ đề (VD: CHƯƠNG I: MỆNH ĐỀ VÀ TẬP HỢP)"],
  ["   - Mô tả: Mô tả chi tiết về chủ đề"],
  [
    "   - Khối lớp: GRADE_10, GRADE_11, GRADE_12, GRADE_6, GRADE_7, GRADE_8, GRADE_9 (bắt buộc)",
  ],
  ["   - Tập sách: 1 hoặc 2 (bắt buộc)"],
  ["   - Thứ tự: Số thứ tự của chủ đề (1, 2, 3,...)"],
  [
    "   - Mã môn học: Mã môn học (VD: MATH10, PHYS11, CHEM12) - Cần có trước trong hệ thống",
  ],
  [""],
  ["2. LƯU Ý:"],
  [
    "   - Không được để trống các cột: Tên chủ đề, Khối lớp, Tập sách, Mã môn học",
  ],
  ["   - Mã môn học phải tồn tại trong hệ thống trước khi import"],
  [
    "   - Khối lớp phải là một trong các giá trị: GRADE_10, GRADE_11, GRADE_12, GRADE_6, GRADE_7, GRADE_8, GRADE_9",
  ],
  ["   - Tập sách chỉ nhận giá trị 1 hoặc 2"],
  ["   - Thứ tự phải là số nguyên dương (1, 2, 3,...)"],
  [""],
  ["3. CÁC BƯỚC IMPORT:"],
  ["   - Bước 1: Điền đầy đủ thông tin chủ đề vào sheet 'Danh sách chủ đề'"],
  ["   - Bước 2: Lưu file Excel"],
  ["   - Bước 3: Trong trang Quản lý Chủ đề, click nút 'Import Excel'"],
  ["   - Bước 4: Chọn file và upload"],
  ["   - Bước 5: Kiểm tra kết quả import"],
  [""],
  ["4. VÍ DỤ MÃ MÔN HỌC:"],
  ["   - MATH10: Toán 10"],
  ["   - PHYS11: Vật Lý 11"],
  ["   - CHEM12: Hóa Học 12"],
  ["   - BIOL10: Sinh Học 10"],
  ["   - ENGL11: Tiếng Anh 11"],
];

// Tạo workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Hướng dẫn
const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
wsInstructions["!cols"] = [{ wch: 100 }];
XLSX.utils.book_append_sheet(wb, wsInstructions, "Hướng dẫn");

// Sheet 2: Danh sách chủ đề
const wsData = XLSX.utils.json_to_sheet(sampleData);

// Định dạng độ rộng cột
wsData["!cols"] = [
  { wch: 30 }, // Tên chủ đề
  { wch: 40 }, // Chương
  { wch: 50 }, // Mô tả
  { wch: 15 }, // Khối lớp
  { wch: 12 }, // Tập sách
  { wch: 10 }, // Thứ tự
];

XLSX.utils.book_append_sheet(wb, wsData, "Danh sách chủ đề");

// Tạo thư mục nếu chưa tồn tại
const outputDir = path.join(__dirname, "public", "files");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Xuất file
const outputPath = path.join(outputDir, "topics-template.xlsx");
XLSX.writeFile(wb, outputPath);

console.log(`✅ Đã tạo template thành công tại: ${outputPath}`);
console.log(`📊 File chứa ${sampleData.length} mẫu chủ đề`);
