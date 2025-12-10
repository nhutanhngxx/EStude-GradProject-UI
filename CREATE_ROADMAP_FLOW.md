# Luồng "Tạo Lộ trình học tập mới"

## Trigger
- User click nút **"Tạo Lộ trình học tập mới"**
- Function: `handleConfirmCreateRoadmap()`

---

# ✅ PHƯƠNG ÁN TỐI ƯU: Sử dụng API GET Request

## API Mới (ĐỦ DỮ LIỆU - KHÔNG CẦN TOKEN)
**API:** `GET /api/ai/request/{requestId}`  
**Endpoint:** `http://localhost:8080/api/ai/request/{requestId}`

**Dữ liệu trả về:**
```javascript
{
  data: {
    requestId: number,
    analysisType: "LEARNING_ROADMAP",
    requestDate: string,
    dataPayload: {
      subject: string,
      submission_id: string,
      student_id: number,
      evaluation_data: {
        topics: [...],
        overall_improvement: {...}
      },
      incorrect_questions: [...],
      learning_style: "VISUAL",
      available_time_per_day: 30
    }
  },
  success: boolean
}
```

**✅ So sánh: dataPayload === Payload cần thiết cho generate-learning-roadmap**

---

# LUỒNG MỚI (ĐƠN GIẢN HÓA)

## Bước 1: Lấy dataPayload từ GET request
**Input:** `requestId` (từ response của getRoadmapLatest)
**Output:** Payload đầy đủ để generate roadmap

## Bước 2: Generate Roadmap trực tiếp
**API:** `POST /api/ai/generate-learning-roadmap`  
**Payload:** Lấy trực tiếp từ `data.dataPayload`

## Bước 3: Lấy Roadmap mới nhất
**API:** `GET /api/ai/me/roadmap/latest`

**🎯 Kết quả: Giảm từ 4 API calls → 2 API calls**

---

# LUỒNG CŨ (PHỨC TẠP - CÓ THỂ BỎ)

## Bước 1: Lấy Feedback (Layer 1)
**API:** `GET /api/ai/me/feedback/latest`  
**Method:** `aiService.getFeedbackLatest(token)`  

**Dữ liệu lấy:**
```javascript
{
  detailedAnalysis: {
    submission_id: number,
    subject: string,
    feedback: [
      {
        question_id: number,
        is_correct: boolean,
        topic: string,
        subtopic: string,
        difficulty_level: "Dễ" | "Trung bình" | "Khó",
        question: string,
        student_answer: string,
        correct_answer: string
      }
    ]
  }
}
```

---

## Bước 2: Lấy Improvement (Layer 4)
**API:** `GET /api/ai/me/improvement/latest`  
**Method:** `aiService.getImprovementLatest(token)`  

**Dữ liệu lấy:**
```javascript
{
  detailedAnalysis: {
    submission_id: number,
    subject: string,
    topics: [
      {
        topic: string,
        improvement: number,
        status: string,
        previous_accuracy: number,
        new_accuracy: number
      }
    ],
    overall_improvement: {
      improvement: number,
      previous_average: number,
      new_average: number
    }
  }
}
```

**Note:** Ưu tiên dùng `evaluation` từ `route.params` nếu có.

---

## Bước 3: Transform Payload
**Transform incorrect_questions:**
```javascript
incorrectQuestions = feedbackData.feedback
  .filter(item => !item.is_correct)
  .map(item => ({
    question_id: item.question_id,
    topic: item.topic || "Không xác định",
    subtopic: item.subtopic || "Mệnh đề đảo",
    difficulty: "EASY" | "MEDIUM" | "HARD",
    question_text: item.question,
    student_answer: item.student_answer,
    correct_answer: item.correct_answer,
    error_type: "CONCEPT_MISUNDERSTANDING"
  }))
```

**Validation:** Phải có ít nhất 1 câu sai.

---

## Bước 4: Generate Roadmap
**API:** `POST /api/ai/generate-learning-roadmap`  
**Method:** `aiService.generateLearningRoadmap(payload, token)`  

**Payload gửi đi:**
```javascript
{
  submission_id: number,
  student_id: number,
  subject: string,
  
  evaluation_data: {
    topics: [
      {
        topic: string,
        improvement: number,
        status: string,
        previous_accuracy: number, // Min 0.1
        new_accuracy: number        // Min 0.1
      }
    ],
    overall_improvement: {
      improvement: number,
      previous_average: number,   // Min 0.1
      new_average: number          // Min 0.1
    }
  },
  
  incorrect_questions: [
    {
      question_id: number,
      topic: string,
      subtopic: string,
      difficulty: "EASY" | "MEDIUM" | "HARD",
      question_text: string,
      student_answer: string,
      correct_answer: string,
      error_type: string
    }
  ],
  
  learning_style: "VISUAL",
  available_time_per_day: 30
}
```

**Response:**
```javascript
{
  success: boolean,
  message: string
}
```

---

## Bước 5: Lấy Roadmap mới nhất
**API:** `GET /api/ai/me/roadmap/latest`  
**Method:** `aiService.getRoadmapLatest(token)`  

**Dữ liệu nhận:**
```javascript
{
  resultId: number,
  detailedAnalysis: {
    roadmap_id: string,
    student_id: number,
    subject: string,
    created_at: string,
    estimated_completion_days: number,
    overall_goal: string,
    phases: [...],
    progress_tracking: {...},
    motivational_tips: [...]
  },
  requestId: number  // ⭐ KEY: Dùng để lấy dataPayload cho lần tạo tiếp theo
}
```

---

## Bước 6: Update State
```javascript
setRoadmap(roadmapResponse.detailedAnalysis)
extractCompletedTasks(roadmapResponse.detailedAnalysis)
setActiveTab("current")
```

---

# SO SÁNH 2 PHƯƠNG ÁN

## Phương án CŨ (4 API calls)
```
1. GET /api/ai/me/feedback/latest        → feedback data
2. GET /api/ai/me/improvement/latest     → evaluation data
3. Transform data manually               → build payload
4. POST /api/ai/generate-learning-roadmap → generate
5. GET /api/ai/me/roadmap/latest         → get roadmap
```

## Phương án MỚI (2 API calls) ⭐ ĐỀ XUẤT
```
1. GET /api/ai/request/{requestId}       → dataPayload (ĐẦY ĐỦ)
2. POST /api/ai/generate-learning-roadmap → generate (dùng dataPayload)
3. GET /api/ai/me/roadmap/latest         → get roadmap
```

**Lợi ích:**
- ✅ Giảm 2 API calls
- ✅ Không cần transform data thủ công
- ✅ Không cần token cho API GET request
- ✅ dataPayload từ backend đã format chuẩn
- ✅ Đồng bộ với backend về cấu trúc dữ liệu

**Cách lấy requestId:**
- Lấy từ `roadmapResponse.requestId` ở Bước 5
- Lưu vào state để dùng cho lần tạo roadmap tiếp theo

---

## Tổng kết API sử dụng

### Phương án CŨ
| Bước | API Endpoint | Method | Mục đích |
|------|-------------|--------|----------|
| 1 | `/api/ai/me/feedback/latest` | GET | Lấy câu hỏi sai |
| 2 | `/api/ai/me/improvement/latest` | GET | Lấy đánh giá tiến bộ |
| 3 | Transform manual | - | Build payload |
| 4 | `/api/ai/generate-learning-roadmap` | POST | Tạo roadmap |
| 5 | `/api/ai/me/roadmap/latest` | GET | Lấy roadmap vừa tạo |

### Phương án MỚI ⭐
| Bước | API Endpoint | Method | Mục đích |
|------|-------------|--------|----------|
| 1 | `/api/ai/request/{requestId}` | GET | Lấy dataPayload đầy đủ |
| 2 | `/api/ai/generate-learning-roadmap` | POST | Tạo roadmap |
| 3 | `/api/ai/me/roadmap/latest` | GET | Lấy roadmap + requestId mới |

---

## File liên quan
- `src/screens/Assessment/AssessmentLearningRoadmapScreen.js` (handleConfirmCreateRoadmap)
- `src/services/aiService.js` (API methods)

---

## Cấu trúc dataPayload (Từ GET request)

```javascript
{
  subject: "Hóa Học",
  submission_id: "4",
  student_id: 53,
  evaluation_data: {
    topics: [
      {
        topic: "Nguyên tố hóa học",
        improvement: 40,
        status: "Tiến bộ vượt bậc",
        previous_accuracy: 0.1,
        new_accuracy: 40.0
      }
    ],
    overall_improvement: {
      improvement: 30,
      previous_average: 0.1,
      new_average: 30.0
    }
  },
  incorrect_questions: [
    {
      topic: "Thành phần của nguyên tử",
      subtopic: "Đang xử lý",
      difficulty: "MEDIUM",
      question_id: 244,
      question_text: "Hạt không mang điện trong nguyên tử là:",
      student_answer: "Proton",
      correct_answer: "Neutron",
      error_type: "CONCEPT_MISUNDERSTANDING"
    }
  ],
  learning_style: "VISUAL",
  available_time_per_day: 30
}
```

**✅ KẾT LUẬN: dataPayload = Payload cần thiết để generate roadmap**
