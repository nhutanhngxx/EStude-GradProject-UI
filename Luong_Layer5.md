# Tài liệu Kỹ thuật Layer 5 - Learning Roadmap Generation

## 📋 Mục lục
1. [Tổng quan Layer 5](#tổng-quan-layer-5)
2. [Luồng xử lý chi tiết](#luồng-xử-lý-chi-tiết)
3. [Dữ liệu đầu vào](#dữ-liệu-đầu-vào)
4. [Các API liên quan](#các-api-liên-quan)
5. [Cấu trúc JSON Request](#cấu-trúc-json-request)
6. [Cấu trúc JSON Response](#cấu-trúc-json-response)
7. [Xử lý lỗi](#xử-lý-lỗi)

---

## 🎯 Tổng quan Layer 5

### Nhiệm vụ chính
**Layer 5 (Learning Roadmap Generation)** có nhiệm vụ:
- Thu thập dữ liệu từ Layer 1 (Feedback) và Layer 4 (Improvement Evaluation)
- Phân tích các câu hỏi làm sai để xác định điểm yếu
- Kết hợp đánh giá tiến bộ để tạo lộ trình học tập cá nhân hóa
- Sinh ra kế hoạch học tập theo giai đoạn (phases) với các nhiệm vụ cụ thể

### Vị trí trong hệ thống
```
Layer 1: Feedback (Phân tích chi tiết câu hỏi)
    ↓
Layer 2: Recommendation (Gợi ý học tập)
    ↓
Layer 3: Practice Quiz Generation (Sinh câu hỏi luyện tập)
    ↓
Layer 4: Improvement Evaluation (Đánh giá tiến bộ)
    ↓
Layer 5: Learning Roadmap Generation ← [ĐANG TẠI ĐÂY]
    → Tạo lộ trình học tập cá nhân hóa
```

---

## 🔄 Luồng xử lý chi tiết

### File: `AssessmentImprovementScreen.js`

**Hàm chính**: `handleViewLearningRoadmap()`

### Sơ đồ luồng

```
User tap "Xem lộ trình học tập"
    ↓
[Bước 1] Lấy Feedback mới nhất (Layer 1)
    ↓ API: GET /api/ai/me/feedback/latest
    ↓ aiService.getFeedbackLatest(token)
    ↓
[Bước 2] Lấy Improvement từ params (Layer 4)
    ↓ evaluation object (đã có sẵn)
    ↓
[Bước 3] Transform dữ liệu thành payload
    ↓ - Lọc câu hỏi sai từ feedback
    ↓ - Format evaluation_data
    ↓ - Chuẩn bị metadata (learning_style, time)
    ↓
[Bước 4] Gửi request tạo roadmap
    ↓ API: POST /api/ai/generate-learning-roadmap
    ↓ aiService.generateLearningRoadmap(payload, token)
    ↓
[Bước 5] Lấy roadmap mới nhất
    ↓ API: GET /api/ai/me/roadmap/latest
    ↓ aiService.getRoadmapLatest(token)
    ↓
[Bước 6] Navigate đến AssessmentLearningRoadmapScreen
    ↓ params: { roadmap, evaluation }
```

---

## 📥 Dữ liệu đầu vào

### 1. Feedback Data (từ Layer 1)

**Nguồn**: API Backend  
**Endpoint**: `GET /api/ai/me/feedback/latest`  
**Service**: `aiService.getFeedbackLatest(token)`

**Cấu trúc response**:
```javascript
{
  _id: "...",
  userId: "...",
  generatedAt: "2025-12-07T10:30:00Z",
  detailedAnalysis: {
    submission_id: "submission_abc123",
    subject: "Toán học",
    total_questions: 20,
    correct_answers: 15,
    score: 75,
    feedback: [
      {
        question_id: "q001",
        question: "Giải phương trình: 2x + 5 = 15",
        student_answer: "x = 4",
        correct_answer: "x = 5",
        is_correct: false,
        explanation: "Bạn đã quên trừ 5 cho cả hai vế...",
        topic: "Phương trình bậc nhất",
        subtopic: "Giải phương trình đơn giản",
        difficulty_level: "Dễ"
      },
      // ... more feedback items
    ]
  }
}
```

**Dữ liệu được sử dụng**:
- `submission_id`: ID bài nộp
- `subject`: Môn học
- `feedback[]`: Mảng các câu hỏi
  - Lọc chỉ lấy các câu `is_correct: false`
  - Transform thành `incorrect_questions[]`

---

### 2. Improvement Data (từ Layer 4)

**Nguồn**: Route params  
**Variable**: `evaluation` (đã có sẵn từ màn hình trước)

**Cấu trúc**:
```javascript
{
  subject: "Toán học",
  summary: "Bạn đã cải thiện đáng kể trong phương trình...",
  overall_improvement: {
    improvement: 12.5,           // % cải thiện
    previous_average: 65.8,      // Điểm trung bình trước
    new_average: 78.3,           // Điểm trung bình mới
    direction: "Tăng"
  },
  topics: [
    {
      topic: "Phương trình bậc nhất",
      previous_accuracy: 60,
      new_accuracy: 75,
      improvement: 15,
      status: "Tiến bộ rõ rệt"
    },
    {
      topic: "Phương trình bậc hai",
      previous_accuracy: 70,
      new_accuracy: 82,
      improvement: 12,
      status: "Tiến bộ tốt"
    }
    // ... more topics
  ],
  next_action: "Tiếp tục luyện tập các dạng khó hơn..."
}
```

**Dữ liệu được sử dụng**:
- `subject`: Môn học
- `overall_improvement`: Đánh giá tổng thể
- `topics[]`: Chi tiết từng chủ đề

---

### 3. Metadata

**Nguồn**: Hardcoded / User profile (TODO)

```javascript
{
  learning_style: "VISUAL",           // VISUAL | AUDITORY | KINESTHETIC
  available_time_per_day: 30          // Phút/ngày (TODO: từ user profile)
}
```

---

## 🌐 Các API liên quan

### API Backend (EStude)

#### 1. GET Feedback Latest
```
Endpoint: GET /api/ai/me/feedback/latest
Headers: 
  - Authorization: Bearer {token}
  - Content-Type: application/json

Response: Feedback object (Layer 1)
```

#### 2. GET Improvement Latest (optional)
```
Endpoint: GET /api/ai/me/improvement/latest
Headers: 
  - Authorization: Bearer {token}
  - Content-Type: application/json

Response: Improvement object (Layer 4)
```

#### 3. POST Generate Learning Roadmap
```
Endpoint: POST /api/ai/generate-learning-roadmap
Headers: 
  - Authorization: Bearer {token}
  - Content-Type: application/json
Body: Payload (xem section tiếp theo)

Response: 
{
  success: true,
  message: "Lộ trình học tập đã được tạo thành công",
  data: { ... }
}
```

#### 4. GET Roadmap Latest
```
Endpoint: GET /api/ai/me/roadmap/latest
Headers: 
  - Authorization: Bearer {token}
  - Content-Type: application/json

Response: Roadmap object với detailedAnalysis
```

---

## 📤 Cấu trúc JSON Request

### Payload gửi đến AI Service

**API**: `POST /api/ai/generate-learning-roadmap`

```json
{
  "submission_id": "submission_abc123",
  "student_id": "user_xyz789",
  "subject": "Toán học",
  
  "evaluation_data": {
    "topics": [
      {
        "topic": "Phương trình bậc nhất",
        "improvement": 15,
        "status": "Tiến bộ rõ rệt",
        "previous_accuracy": 60,
        "new_accuracy": 75
      },
      {
        "topic": "Phương trình bậc hai",
        "improvement": 12,
        "status": "Tiến bộ tốt",
        "previous_accuracy": 70,
        "new_accuracy": 82
      }
    ],
    "overall_improvement": {
      "improvement": 12.5,
      "previous_average": 65.8,
      "new_average": 78.3
    }
  },
  
  "incorrect_questions": [
    {
      "question_id": "q001",
      "topic": "Phương trình bậc nhất",
      "subtopic": "Giải phương trình đơn giản",
      "difficulty": "EASY",
      "question_text": "Giải phương trình: 2x + 5 = 15",
      "student_answer": "x = 4",
      "correct_answer": "x = 5",
      "error_type": "CONCEPT_MISUNDERSTANDING"
    },
    {
      "question_id": "q005",
      "topic": "Phương trình bậc hai",
      "subtopic": "Công thức nghiệm",
      "difficulty": "MEDIUM",
      "question_text": "Giải phương trình: x² - 5x + 6 = 0",
      "student_answer": "x = 1 hoặc x = 6",
      "correct_answer": "x = 2 hoặc x = 3",
      "error_type": "CALCULATION_ERROR"
    }
  ],
  
  "learning_style": "VISUAL",
  "available_time_per_day": 30
}
```

### Chi tiết các trường

#### Trường bắt buộc

| Field | Type | Nguồn | Mô tả |
|-------|------|-------|-------|
| `submission_id` | string | Feedback API | ID bài nộp |
| `student_id` | string | User context | ID học sinh |
| `subject` | string | Evaluation | Môn học |
| `evaluation_data` | object | Evaluation | Dữ liệu đánh giá Layer 4 |
| `incorrect_questions` | array | Feedback API | Câu hỏi làm sai |
| `learning_style` | string | Hardcoded | Phong cách học |
| `available_time_per_day` | number | Hardcoded | Thời gian/ngày (phút) |

#### evaluation_data.topics[]

```typescript
{
  topic: string,              // Tên chủ đề
  improvement: number,        // % cải thiện
  status: string,             // Trạng thái ("Tiến bộ rõ rệt", "Ổn định", ...)
  previous_accuracy: number,  // Độ chính xác trước (%, min 0.1)
  new_accuracy: number        // Độ chính xác mới (%, min 0.1)
}
```

**Lưu ý**: Nếu `previous_accuracy` hoặc `new_accuracy` = 0, đặt giá trị tối thiểu là `0.1` để tránh lỗi AI.

#### incorrect_questions[]

```typescript
{
  question_id: string,      // ID câu hỏi
  topic: string,            // Chủ đề (từ feedback)
  subtopic: string,         // Chủ đề con (từ feedback, default "Chung")
  difficulty: string,       // EASY | MEDIUM | HARD
  question_text: string,    // Nội dung câu hỏi
  student_answer: string,   // Câu trả lời của học sinh
  correct_answer: string,   // Đáp án đúng
  error_type: string        // Default: "CONCEPT_MISUNDERSTANDING"
}
```

**Transform difficulty**:
```javascript
const difficultyMap = {
  "Dễ": "EASY",
  "Trung bình": "MEDIUM",
  "Khó": "HARD"
};
```

---

## 📥 Cấu trúc JSON Response

### Response từ `generateLearningRoadmap`

```json
{
  "success": true,
  "message": "Lộ trình học tập đã được tạo thành công",
  "data": {
    "roadmap_id": "roadmap_xyz789",
    "created_at": "2025-12-07T10:35:00Z"
  }
}
```

### Response từ `getRoadmapLatest`

**API**: `GET /api/ai/me/roadmap/latest`

```json
{
  "_id": "...",
  "userId": "user_xyz789",
  "generatedAt": "2025-12-07T10:35:00Z",
  "detailedAnalysis": {
    "roadmap_id": "roadmap_xyz789",
    "subject": "Toán học",
    "overall_goal": "Nâng cao kỹ năng giải phương trình và đạt 85% độ chính xác",
    "current_level": "Trung bình - Đang phát triển",
    "target_level": "Nâng cao - Thành thạo",
    "estimated_duration": "3 tuần (21 ngày)",
    "learning_style": "VISUAL",
    "time_per_day": 30,
    
    "phases": [
      {
        "phase_number": 1,
        "phase_name": "Củng cố kiến thức cơ bản",
        "description": "Ôn lại các khái niệm cơ bản về phương trình bậc nhất",
        "duration": "1 tuần",
        "focus_topics": [
          "Phương trình bậc nhất",
          "Biến đổi đơn giản"
        ],
        "tasks": [
          {
            "task_id": "task_001",
            "task_name": "Ôn lý thuyết phương trình bậc nhất",
            "description": "Xem lại định nghĩa, quy tắc chuyển vế",
            "type": "THEORY",
            "estimated_time": 30,
            "resources": [
              {
                "type": "VIDEO",
                "title": "Phương trình bậc nhất - Lý thuyết",
                "url": "https://example.com/video1",
                "duration": 15
              },
              {
                "type": "DOCUMENT",
                "title": "Tóm tắt công thức",
                "url": "https://example.com/doc1"
              }
            ],
            "order": 1
          },
          {
            "task_id": "task_002",
            "task_name": "Làm bài tập cơ bản",
            "description": "Giải 10 phương trình bậc nhất đơn giản",
            "type": "PRACTICE",
            "estimated_time": 45,
            "resources": [
              {
                "type": "EXERCISE",
                "title": "Bài tập cơ bản",
                "url": "https://example.com/exercise1",
                "question_count": 10
              }
            ],
            "order": 2
          }
        ],
        "completion_criteria": "Đạt ≥80% bài tập cơ bản",
        "order": 1
      },
      {
        "phase_number": 2,
        "phase_name": "Nâng cao kỹ năng",
        "description": "Luyện tập các dạng phương trình phức tạp hơn",
        "duration": "1 tuần",
        "focus_topics": [
          "Phương trình bậc hai",
          "Hệ phương trình"
        ],
        "tasks": [
          {
            "task_id": "task_003",
            "task_name": "Học công thức nghiệm bậc hai",
            "description": "Nắm vững công thức Delta, các dạng nghiệm",
            "type": "THEORY",
            "estimated_time": 40,
            "resources": [
              {
                "type": "VIDEO",
                "title": "Phương trình bậc hai",
                "url": "https://example.com/video2",
                "duration": 20
              }
            ],
            "order": 1
          },
          {
            "task_id": "task_004",
            "task_name": "Luyện tập bậc hai",
            "description": "Giải 15 phương trình bậc hai đa dạng",
            "type": "PRACTICE",
            "estimated_time": 60,
            "resources": [
              {
                "type": "EXERCISE",
                "title": "Bài tập nâng cao",
                "url": "https://example.com/exercise2",
                "question_count": 15
              }
            ],
            "order": 2
          }
        ],
        "completion_criteria": "Đạt ≥75% bài tập nâng cao",
        "order": 2
      },
      {
        "phase_number": 3,
        "phase_name": "Thực hành tổng hợp",
        "description": "Luyện tập tổng hợp tất cả dạng bài",
        "duration": "1 tuần",
        "focus_topics": [
          "Tổng hợp phương trình",
          "Bài toán thực tế"
        ],
        "tasks": [
          {
            "task_id": "task_005",
            "task_name": "Đề kiểm tra tổng hợp",
            "description": "Làm đề thi thử với 20 câu hỏi đa dạng",
            "type": "TEST",
            "estimated_time": 60,
            "resources": [
              {
                "type": "TEST",
                "title": "Đề kiểm tra cuối kỳ",
                "url": "https://example.com/test1",
                "question_count": 20
              }
            ],
            "order": 1
          }
        ],
        "completion_criteria": "Đạt ≥85% điểm tổng hợp",
        "order": 3
      }
    ],
    
    "progress_tracking": {
      "total_tasks": 5,
      "completed_tasks": 0,
      "completion_percentage": 0,
      "current_phase": 1,
      "started_at": "2025-12-07T10:35:00Z",
      "expected_completion": "2025-12-28T10:35:00Z"
    },
    
    "next_steps": [
      "Bắt đầu với Phase 1: Ôn lý thuyết phương trình bậc nhất",
      "Dành 30 phút/ngày cho việc học",
      "Hoàn thành các bài tập đúng trình tự"
    ],
    
    "motivation": "Bạn đã tiến bộ 12.5% trong lần học gần nhất. Với kế hoạch này, bạn có thể đạt mục tiêu trong 3 tuần!",
    
    "weak_areas": [
      {
        "topic": "Phương trình bậc nhất",
        "issue": "Chưa thành thạo quy tắc chuyển vế",
        "recommendation": "Làm thêm bài tập cơ bản trước khi chuyển sang dạng khó"
      },
      {
        "topic": "Phương trình bậc hai",
        "issue": "Nhầm lẫn khi tính Delta",
        "recommendation": "Xem lại video hướng dẫn và ghi nhớ công thức"
      }
    ]
  }
}
```

### Các trường quan trọng

#### phases[]

| Field | Type | Mô tả |
|-------|------|-------|
| `phase_number` | number | Số thứ tự giai đoạn |
| `phase_name` | string | Tên giai đoạn |
| `description` | string | Mô tả giai đoạn |
| `duration` | string | Thời gian ước tính |
| `focus_topics[]` | array | Chủ đề tập trung |
| `tasks[]` | array | Danh sách nhiệm vụ |
| `completion_criteria` | string | Tiêu chí hoàn thành |
| `order` | number | Thứ tự thực hiện |

#### tasks[]

| Field | Type | Mô tả |
|-------|------|-------|
| `task_id` | string | ID nhiệm vụ |
| `task_name` | string | Tên nhiệm vụ |
| `description` | string | Mô tả chi tiết |
| `type` | string | THEORY / PRACTICE / TEST / REVIEW |
| `estimated_time` | number | Thời gian ước tính (phút) |
| `resources[]` | array | Tài liệu học tập |
| `order` | number | Thứ tự trong phase |

#### resources[]

| Field | Type | Mô tả |
|-------|------|-------|
| `type` | string | VIDEO / DOCUMENT / EXERCISE / TEST |
| `title` | string | Tiêu đề tài liệu |
| `url` | string | Link tài liệu |
| `duration` | number | Thời lượng (phút, cho video) |
| `question_count` | number | Số câu hỏi (cho exercise/test) |

#### progress_tracking

| Field | Type | Mô tả |
|-------|------|-------|
| `total_tasks` | number | Tổng số nhiệm vụ |
| `completed_tasks` | number | Số nhiệm vụ đã hoàn thành |
| `completion_percentage` | number | % hoàn thành |
| `current_phase` | number | Giai đoạn hiện tại |
| `started_at` | string | Thời gian bắt đầu |
| `expected_completion` | string | Thời gian dự kiến hoàn thành |

---

## 🔍 Code Implementation

### Transform Incorrect Questions

```javascript
// File: AssessmentImprovementScreen.js - handleViewLearningRoadmap()

const feedbackData = feedbackResponse.detailedAnalysis;

const incorrectQuestions = feedbackData.feedback
  ? feedbackData.feedback
      .filter((item) => !item.is_correct)  // Chỉ lấy câu sai
      .map((item) => ({
        question_id: item.question_id,
        topic: item.topic || "Không xác định",
        subtopic: item.subtopic || "Chung",
        difficulty:
          item.difficulty_level === "Dễ"
            ? "EASY"
            : item.difficulty_level === "Trung bình"
            ? "MEDIUM"
            : "HARD",
        question_text: item.question || "",
        student_answer: item.student_answer || "",
        correct_answer: item.correct_answer || "",
        error_type: "CONCEPT_MISUNDERSTANDING", // Default
      }))
  : [];
```

### Build Payload

```javascript
const payload = {
  submission_id: feedbackData.submission_id || evaluation.submission_id,
  student_id: user.userId,
  subject: feedbackData.subject || evaluation.subject,
  
  evaluation_data: {
    topics: (improvementData.topics || []).map((topic) => ({
      topic: topic.topic,
      improvement: topic.improvement || 0,
      status: topic.status || "Ổn định",
      previous_accuracy: topic.previous_accuracy || 0.1, // Min 0.1
      new_accuracy: topic.new_accuracy || 0.1,           // Min 0.1
    })),
    overall_improvement: {
      improvement: improvementData.overall_improvement?.improvement || 0,
      previous_average: improvementData.overall_improvement?.previous_average || 0.1,
      new_average: improvementData.overall_improvement?.new_average || 0.1,
    },
  },
  
  incorrect_questions: incorrectQuestions,
  learning_style: "VISUAL",
  available_time_per_day: 30,
};
```

### API Calls

```javascript
// Bước 4: POST để tạo roadmap
const generateResponse = await aiService.generateLearningRoadmap(
  payload,
  token
);

if (!generateResponse || !generateResponse.success) {
  showToast("Không thể tạo lộ trình học tập!", { type: "error" });
  return;
}

// Bước 5: GET roadmap mới nhất
const roadmapResponse = await aiService.getRoadmapLatest(token);

if (!roadmapResponse || !roadmapResponse.detailedAnalysis) {
  showToast("Không thể tải lộ trình!", { type: "error" });
  return;
}

// Bước 6: Navigate với data
navigation.navigate("AssessmentLearningRoadmap", {
  roadmap: roadmapResponse.detailedAnalysis,
  evaluation: evaluation,
});
```

---

## ⚠️ Xử lý lỗi

### Validation checks

```javascript
// Check 1: Có feedback không?
if (!feedbackResponse || !feedbackResponse.detailedAnalysis) {
  showToast("Không thể lấy thông tin câu hỏi sai!", { type: "error" });
  return;
}

// Check 2: Có câu sai không?
if (incorrectQuestions.length === 0) {
  showToast(
    "Không tìm thấy câu hỏi sai để tạo lộ trình. Hãy làm thêm bài đánh giá!",
    { type: "warning" }
  );
  return;
}

// Check 3: Generate thành công không?
if (!generateResponse || !generateResponse.success) {
  console.error("Generate Roadmap failed:", generateResponse);
  showToast("Không thể tạo lộ trình học tập!", { type: "error" });
  return;
}

// Check 4: Có roadmap trả về không?
if (!roadmapResponse || !roadmapResponse.detailedAnalysis) {
  showToast("Không thể tải lộ trình!", { type: "error" });
  return;
}
```

### Error Messages

| Lỗi | Message | Type |
|-----|---------|------|
| Không lấy được feedback | "Không thể lấy thông tin câu hỏi sai!" | error |
| Không có câu sai | "Không tìm thấy câu hỏi sai để tạo lộ trình..." | warning |
| Generate thất bại | "Không thể tạo lộ trình học tập!" | error |
| Không lấy được roadmap | "Không thể tải lộ trình!" | error |
| Exception | "Lỗi khi tạo lộ trình học tập!" | error |

---

## 📊 Logging & Debug

### Console logs trong luồng

```javascript
// Log 1: Evaluation data
console.log("🎯 Assessment Improvement Screen - evaluation:", 
  JSON.stringify(evaluation, null, 2));

// Log 2: Fetch feedback
console.log("📥 Fetching latest feedback...");
console.log("📊 Feedback response:", feedbackResponse);

// Log 3: Transform data
console.log("🔍 Feedback data:", feedbackData);
console.log("🔍 Feedback array:", 
  feedbackData.feedback ? feedbackData.feedback.length : "undefined");
console.log("❌ Incorrect questions count:", 
  incorrectQuestions.length, incorrectQuestions);

// Log 4: Payload
console.log("📤 Generating Roadmap with payload:", payload);
console.log("📤 Full Payload JSON:", 
  JSON.stringify(payload, null, 2));

// Log 5: Response
console.log("📥 Generate Roadmap Response:", generateResponse);
```

---

## 🎯 Tóm tắt Layer 5

### Input
1. **Feedback Data** (Layer 1)
   - Danh sách câu hỏi làm sai
   - Phân tích lỗi chi tiết
   - Nguồn: `GET /api/ai/me/feedback/latest`

2. **Improvement Data** (Layer 4)
   - Đánh giá tiến bộ tổng thể
   - Chi tiết từng chủ đề
   - Nguồn: Route params (evaluation)

3. **Metadata**
   - Learning style, time/day
   - Nguồn: Hardcoded / User profile

### Process
1. Lọc câu hỏi sai từ feedback
2. Transform data thành format yêu cầu
3. Gửi request tạo roadmap đến AI
4. Lấy roadmap mới nhất từ backend
5. Navigate đến màn hình hiển thị

### Output
**Lộ trình học tập cá nhân hóa** với:
- Mục tiêu tổng thể
- 3 giai đoạn (phases)
- Nhiệm vụ cụ thể (tasks)
- Tài liệu học tập (resources)
- Tracking tiến độ
- Gợi ý điểm yếu

### Navigation Flow
```
AssessmentImprovementScreen
    ↓ (tap "Xem lộ trình học tập")
    ↓ (generate roadmap)
    ↓
AssessmentLearningRoadmapScreen
    → Tab 1: Mục tiêu tổng thể
    → Tab 2: Lịch sử roadmaps
```

---

## 📌 Dependencies

### Services
- `aiService.js`:
  - `getFeedbackLatest(token)`
  - `generateLearningRoadmap(payload, token)`
  - `getRoadmapLatest(token)`

### Contexts
- `AuthContext`: user, token
- `ToastContext`: showToast()

### Navigation
- React Navigation Stack
- Params: `{ roadmap, evaluation }`

---

**Document Version**: 1.0  
**Last Updated**: December 7, 2025  
**Author**: EStude Development Team
