# 📁 Template Files

Thư mục này chứa các file mẫu để import dữ liệu hàng loạt.

## 📄 Các File Template

### 1. questions-template.xlsx
**Mục đích:** Template để import câu hỏi hàng loạt vào Ngân hàng Câu hỏi

**Định dạng:** Excel 2007+ (.xlsx)

**Cách sử dụng:**
1. Download file từ nút **"Tải file mẫu"** trong trang Quản lý Ngân hàng Câu hỏi
2. Mở bằng Microsoft Excel, Google Sheets, hoặc LibreOffice Calc
3. Điền thông tin câu hỏi theo format
4. Lưu file (hỗ trợ .xlsx, .xls, .csv)
5. Upload qua nút **"Import Excel"**

**Cột bắt buộc:**
- `questionText` - Nội dung câu hỏi
- `questionType` - Loại: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER
- `difficultyLevel` - Độ khó: EASY, MEDIUM, HARD

**Cột tùy chọn:**
- `points` - Điểm (mặc định: 1.0)
- `optionA`, `optionB`, `optionC`, `optionD`, `optionE`, `optionF` - Các đáp án
- `correctAnswer` - Đáp án đúng (A, B, C, D, E, F)
- `attachmentUrl` - Link đính kèm

**File mẫu có sẵn 5 câu hỏi mẫu để tham khảo.**

---

### 2. schools-template.xlsx
**Mục đích:** Template để import danh sách trường học

**Định dạng:** Excel 2007+ (.xlsx)

---

## 🔧 Tạo lại Template

Nếu cần tạo lại file `questions-template.xlsx`:

```bash
node create-excel-template.mjs
```

Script sẽ tạo file mới với 5 câu hỏi mẫu.

---

## 📊 Hỗ trợ

Để biết thêm chi tiết về format import, xem:
- `IMPORT_QUESTIONS_GUIDE.md` - Hướng dẫn kỹ thuật chi tiết
- `QUICK_IMPORT_GUIDE.md` - Hướng dẫn nhanh cho người dùng
- `EXCEL_IMPORT_FEATURE.md` - Tổng quan tính năng

---

**Cập nhật lần cuối:** October 30, 2025
