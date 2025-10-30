# Question Bank Import Template

## Hướng dẫn sử dụng File Template Import

### 1. Format File
- File hỗ trợ: `.xlsx`, `.xls`, `.csv`
- Sheet đầu tiên sẽ được đọc
- Dòng đầu tiên là header (không được thay đổi)

### 2. Các cột bắt buộc (Required)
- **questionText**: Nội dung câu hỏi (bắt buộc)
- **questionType**: Loại câu hỏi (bắt buộc)
  - `MULTIPLE_CHOICE`: Trắc nghiệm nhiều đáp án
  - `TRUE_FALSE`: Đúng/Sai
  - `SHORT_ANSWER`: Tự luận ngắn
- **difficultyLevel**: Độ khó (bắt buộc)
  - `EASY`: Dễ
  - `MEDIUM`: Trung bình
  - `HARD`: Khó

### 3. Các cột tùy chọn (Optional)
- **points**: Điểm số (mặc định: 1.0)
- **attachmentUrl**: Link đính kèm (hình ảnh, video...)

### 4. Các cột cho câu hỏi MULTIPLE_CHOICE
- **optionA**: Đáp án A
- **optionB**: Đáp án B
- **optionC**: Đáp án C (tùy chọn)
- **optionD**: Đáp án D (tùy chọn)
- **optionE**: Đáp án E (tùy chọn)
- **optionF**: Đáp án F (tùy chọn)
- **correctAnswer**: Đáp án đúng (A, B, C, D, E, hoặc F)
  - Có thể có nhiều đáp án đúng, ngăn cách bởi dấu phẩy: `A,C`

### 5. Lưu ý quan trọng
- Câu hỏi MULTIPLE_CHOICE phải có ít nhất 2 đáp án
- Phải có ít nhất 1 đáp án đúng (correctAnswer)
- Chủ đề (Topic) sẽ được chọn từ bộ lọc trước khi import
- Các giá trị enum phải viết CHÍNH XÁC (phân biệt HOA/thường)

### 6. Ví dụ

#### Câu hỏi Trắc nghiệm:
```
questionText: "Mệnh đề nào sau đây là mệnh đề đúng?"
points: 1.0
questionType: MULTIPLE_CHOICE
difficultyLevel: EASY
optionA: "2 + 3 = 5"
optionB: "2 + 3 = 6"
optionC: "2 + 3 = 7"
optionD: "2 + 3 = 4"
correctAnswer: A
```

#### Câu hỏi Đúng/Sai:
```
questionText: "Trái đất hình cầu"
points: 0.5
questionType: TRUE_FALSE
difficultyLevel: EASY
```

#### Câu hỏi Tự luận:
```
questionText: "Phân tích tác phẩm Chí Phèo"
points: 3.0
questionType: SHORT_ANSWER
difficultyLevel: HARD
```

### 7. Workflow Import
1. Tải file template về (nút "Tải file mẫu")
2. Điền thông tin câu hỏi vào file Excel
3. Chọn **Môn học** và **Chủ đề** từ bộ lọc
4. Click nút **"Import Excel"**
5. Chọn file đã điền
6. Kiểm tra preview các câu hỏi
7. Click **"Xác nhận Import"**

### 8. Xử lý lỗi
Nếu có lỗi, hệ thống sẽ hiển thị:
- Dòng bị lỗi (số thứ tự)
- Lý do lỗi cụ thể
- Các câu hỏi hợp lệ vẫn sẽ được import

### 9. Tải file mẫu
- Click nút **"Tải file mẫu"** trên trang
- File: `questions-template.csv`
- Mở bằng Excel hoặc Google Sheets
- Điền thông tin theo hướng dẫn
- Lưu và import

---

## Template Structure

| questionText | points | questionType | difficultyLevel | optionA | optionB | optionC | optionD | correctAnswer | attachmentUrl |
|--------------|--------|--------------|-----------------|---------|---------|---------|---------|---------------|---------------|
| Mệnh đề nào sau đây là mệnh đề đúng? | 1.0 | MULTIPLE_CHOICE | EASY | 2 + 3 = 5 | 2 + 3 = 6 | 2 + 3 = 7 | 2 + 3 = 4 | A | |
| Phủ định của mệnh đề 'Mọi số tự nhiên đều là số nguyên' là: | 1.0 | MULTIPLE_CHOICE | MEDIUM | Tồn tại số tự nhiên không là số nguyên | Không có số tự nhiên nào là số nguyên | Mọi số tự nhiên đều không phải là số nguyên | Có ít nhất một số nguyên không phải là số tự nhiên | A | |

---

**Lưu ý cuối cùng:**
- Đảm bảo chọn đúng chủ đề trước khi import
- Các câu hỏi sẽ được gán vào chủ đề đã chọn
- Import nhiều lần sẽ tạo thêm câu hỏi mới (không ghi đè)
