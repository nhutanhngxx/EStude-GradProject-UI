# 📝 Hướng dẫn Import Câu hỏi từ Excel

## 🚀 Quick Start

### Bước 1: Tải File Mẫu
1. Truy cập trang **Quản lý Ngân hàng Câu hỏi**
2. Click nút **"Tải file mẫu"** (màu xanh lá)
3. File `questions-template.csv` sẽ được tải về

### Bước 2: Chuẩn bị File Excel
Mở file bằng Microsoft Excel, Google Sheets, hoặc LibreOffice Calc.

#### Format Chuẩn:
```
| questionText | points | questionType | difficultyLevel | optionA | optionB | optionC | optionD | correctAnswer | attachmentUrl |
```

#### Ví dụ:
```csv
questionText,points,questionType,difficultyLevel,optionA,optionB,optionC,optionD,correctAnswer,attachmentUrl
"2 + 2 = ?",1.0,MULTIPLE_CHOICE,EASY,3,4,5,6,B,
"Trái đất hình cầu",0.5,TRUE_FALSE,EASY,,,,,,
"Phân tích tác phẩm Chí Phèo",3.0,SHORT_ANSWER,HARD,,,,,,
```

### Bước 3: Điền Dữ liệu

#### ✅ Các cột BẮT BUỘC:

1. **questionText** - Nội dung câu hỏi
   ```
   Ví dụ: "Mệnh đề nào sau đây là mệnh đề đúng?"
   ```

2. **questionType** - Loại câu hỏi (viết CHÍNH XÁC)
   - `MULTIPLE_CHOICE` - Trắc nghiệm nhiều đáp án
   - `TRUE_FALSE` - Đúng/Sai
   - `SHORT_ANSWER` - Tự luận ngắn

3. **difficultyLevel** - Độ khó (viết CHÍNH XÁC)
   - `EASY` - Dễ
   - `MEDIUM` - Trung bình
   - `HARD` - Khó

#### 📌 Các cột TÙY CHỌN:

- **points** - Điểm số (mặc định: 1.0)
  ```
  Ví dụ: 1.0, 1.5, 2.0, 3.0
  ```

- **attachmentUrl** - Link hình ảnh/video đính kèm
  ```
  Ví dụ: https://example.com/image.png
  ```

#### 🎯 Cho câu hỏi MULTIPLE_CHOICE:

- **optionA** - Đáp án A (bắt buộc)
- **optionB** - Đáp án B (bắt buộc)
- **optionC** - Đáp án C (tùy chọn)
- **optionD** - Đáp án D (tùy chọn)
- **optionE** - Đáp án E (tùy chọn)
- **optionF** - Đáp án F (tùy chọn)
- **correctAnswer** - Đáp án đúng (bắt buộc)
  ```
  Ví dụ: A, B, C, D, E, F
  ```

### Bước 4: Import

1. **Chọn bộ lọc trên trang:**
   - ✅ Môn học (bắt buộc)
   - Khối lớp (tùy chọn)
   - Tập sách (tùy chọn)
   - ✅ Chủ đề (bắt buộc)

2. Click nút **"Import Excel"** (màu tím)

3. Chọn file Excel đã chuẩn bị (`.xlsx`, `.xls`, `.csv`)

4. Hệ thống sẽ đọc và hiển thị **Preview** tất cả câu hỏi

5. Kiểm tra kỹ các câu hỏi trong preview

6. Click **"Xác nhận Import X câu hỏi"**

### Bước 5: Hoàn thành ✅

Hệ thống sẽ thông báo:
- ✅ Số câu hỏi import thành công
- ❌ Số câu hỏi bị lỗi (nếu có)

---

## 📋 Ví dụ Chi tiết

### Ví dụ 1: Câu hỏi Trắc nghiệm Dễ
```csv
"Mệnh đề nào sau đây là mệnh đề đúng?",1.0,MULTIPLE_CHOICE,EASY,"2 + 3 = 5","2 + 3 = 6","2 + 3 = 7","2 + 3 = 4",A,
```

**Kết quả:**
- Câu hỏi: "Mệnh đề nào sau đây là mệnh đề đúng?"
- Điểm: 1.0
- Loại: Trắc nghiệm
- Độ khó: Dễ (🟢)
- 4 đáp án (A, B, C, D)
- Đáp án đúng: A ("2 + 3 = 5")

### Ví dụ 2: Câu hỏi Trắc nghiệm Trung bình
```csv
"Giá trị của sin(30°) là:",1.0,MULTIPLE_CHOICE,MEDIUM,0.5,0.707,0.866,1,A,
```

**Kết quả:**
- Câu hỏi: "Giá trị của sin(30°) là:"
- Điểm: 1.0
- Loại: Trắc nghiệm
- Độ khó: Trung bình (🟡)
- 4 đáp án
- Đáp án đúng: A (0.5)

### Ví dụ 3: Câu hỏi Đúng/Sai
```csv
"Trái đất hình cầu",0.5,TRUE_FALSE,EASY,,,,,,
```

**Kết quả:**
- Câu hỏi: "Trái đất hình cầu"
- Điểm: 0.5
- Loại: Đúng/Sai
- Độ khó: Dễ (🟢)
- Không cần đáp án (các cột option để trống)

### Ví dụ 4: Câu hỏi Tự luận
```csv
"Phân tích tác phẩm Chí Phèo",3.0,SHORT_ANSWER,HARD,,,,,,
```

**Kết quả:**
- Câu hỏi: "Phân tích tác phẩm Chí Phèo"
- Điểm: 3.0
- Loại: Tự luận
- Độ khó: Khó (🔴)
- Không cần đáp án

---

## ⚠️ Lỗi Thường Gặp

### ❌ Lỗi 1: Thiếu thông tin bắt buộc
```
Dòng 3: Thiếu thông tin bắt buộc (questionText, questionType, difficultyLevel)
```
**Giải pháp:** Đảm bảo điền đầy đủ 3 cột bắt buộc

### ❌ Lỗi 2: Loại câu hỏi không hợp lệ
```
Dòng 5: Loại câu hỏi không hợp lệ. Phải là: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER
```
**Giải pháp:** Viết chính xác tên loại câu hỏi (phân biệt HOA/thường)

### ❌ Lỗi 3: Độ khó không hợp lệ
```
Dòng 7: Độ khó không hợp lệ. Phải là: EASY, MEDIUM, HARD
```
**Giải pháp:** Viết chính xác độ khó (phân biệt HOA/thường)

### ❌ Lỗi 4: Thiếu đáp án cho trắc nghiệm
```
Dòng 10: Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án
```
**Giải pháp:** Điền ít nhất optionA và optionB

### ❌ Lỗi 5: Không có đáp án đúng
```
Dòng 12: Phải có ít nhất một đáp án đúng (correctAnswer)
```
**Giải pháp:** Điền cột correctAnswer với giá trị A, B, C, D, E, hoặc F

---

## 💡 Tips & Tricks

### 1. Import nhiều câu hỏi cùng lúc
- Điền hàng loạt câu hỏi vào file Excel
- Một lần import có thể thêm hàng trăm câu hỏi
- Hệ thống sẽ báo cáo chi tiết từng câu

### 2. Sử dụng Excel Formula
```excel
=IF(A2>50, "HARD", IF(A2>30, "MEDIUM", "EASY"))
```
Tự động gán độ khó dựa trên điểm số

### 3. Copy từ Word/Google Docs
- Copy câu hỏi từ tài liệu có sẵn
- Paste vào Excel
- Điều chỉnh format theo template

### 4. Kiểm tra trước khi import
- Đọc kỹ preview
- Kiểm tra đáp án đúng
- Xác nhận độ khó và điểm số

### 5. Backup dữ liệu
- Lưu file Excel làm backup
- Có thể re-import nếu cần
- Dễ dàng chỉnh sửa và cập nhật

---

## 🎯 Checklist Trước Khi Import

- [ ] Đã chọn **Môn học**
- [ ] Đã chọn **Chủ đề**
- [ ] File Excel có đúng format
- [ ] Các cột bắt buộc đã điền đầy đủ
- [ ] questionType viết đúng (MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER)
- [ ] difficultyLevel viết đúng (EASY, MEDIUM, HARD)
- [ ] Câu trắc nghiệm có ít nhất 2 đáp án
- [ ] Mỗi câu trắc nghiệm có ít nhất 1 đáp án đúng
- [ ] Đã kiểm tra preview
- [ ] Sẵn sàng click "Xác nhận Import"

---

## 📞 Liên hệ Hỗ trợ

Nếu gặp vấn đề khi import, vui lòng:
1. Kiểm tra lại format file theo hướng dẫn
2. Xem phần "Lỗi Thường Gặp"
3. Đảm bảo đã chọn đúng Môn học và Chủ đề
4. Liên hệ admin nếu vẫn gặp lỗi

---

**Chúc bạn import thành công! 🎉**
