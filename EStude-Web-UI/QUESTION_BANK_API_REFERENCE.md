# Question Bank API Reference
## Complete API Documentation for Question Bank Management

Tài liệu này mô tả đầy đủ các API endpoints để quản lý Question Bank (Ngân hàng câu hỏi).

---

## 📋 Table of Contents

1. [Create Question](#1-create-question---post)
2. [Get All Questions](#2-get-all-questions---get)
3. [Get Questions by Topic](#3-get-questions-by-topic---get)
4. [Get Question by ID](#4-get-question-by-id---get)
5. [Update Question](#5-update-question---put)
6. [Delete Question](#6-delete-question---delete)
7. [Count Questions by Topic](#7-count-questions-by-topic---get)

---

## Base URL

```
http://localhost:8080/api/questions/bank
```

---

## API Endpoints

### 1. Create Question - POST

**Endpoint:** `POST /api/questions/bank`

**Description:** Tạo câu hỏi mới cho question bank

**Request Body:**
```json
{
  "questionText": "Mệnh đề nào sau đây là mệnh đề đúng?",
  "points": 1.0,
  "questionType": "MULTIPLE_CHOICE",
  "topicId": 1,
  "difficultyLevel": "EASY",
  "attachmentUrl": null,
  "options": [
    {
      "optionText": "2 + 3 = 5",
      "isCorrect": true,
      "optionOrder": 1
    },
    {
      "optionText": "2 + 3 = 6",
      "isCorrect": false,
      "optionOrder": 2
    },
    {
      "optionText": "2 + 3 = 7",
      "isCorrect": false,
      "optionOrder": 3
    },
    {
      "optionText": "2 + 3 = 4",
      "isCorrect": false,
      "optionOrder": 4
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Question added to bank successfully",
  "data": {
    "questionId": 1,
    "questionText": "Mệnh đề nào sau đây là mệnh đề đúng?",
    "points": 1.0,
    "questionType": "MULTIPLE_CHOICE",
    "difficultyLevel": "EASY",
    "isQuestionBank": true,
    "topic": {
      "topicId": 1,
      "name": "Mệnh đề"
    },
    "options": [...]
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/questions/bank \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "Mệnh đề nào sau đây là mệnh đề đúng?",
    "points": 1.0,
    "questionType": "MULTIPLE_CHOICE",
    "topicId": 1,
    "difficultyLevel": "EASY",
    "options": [
      {"optionText": "2 + 3 = 5", "isCorrect": true, "optionOrder": 1},
      {"optionText": "2 + 3 = 6", "isCorrect": false, "optionOrder": 2}
    ]
  }'
```

---

### 2. Get All Questions - GET

**Endpoint:** `GET /api/questions/bank`

**Description:** Lấy tất cả câu hỏi trong question bank (sắp xếp theo ID giảm dần)

**Request:** No body required

**Response (Success):**
```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": [
    {
      "questionId": 10,
      "questionText": "Câu hỏi mới nhất...",
      "points": 1.0,
      "questionType": "MULTIPLE_CHOICE",
      "difficultyLevel": "MEDIUM",
      "isQuestionBank": true,
      "topic": {
        "topicId": 2,
        "name": "Tập hợp"
      }
    },
    {
      "questionId": 9,
      "questionText": "Câu hỏi cũ hơn...",
      "points": 1.0,
      "questionType": "TRUE_FALSE",
      "difficultyLevel": "EASY",
      "isQuestionBank": true
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8080/api/questions/bank
```

---

### 3. Get Questions by Topic - GET

**Endpoint:** `GET /api/questions/bank/topic/{topicId}`

**Description:** Lấy câu hỏi trong question bank theo topic, có thể filter theo độ khó

**Path Parameters:**
- `topicId` (Long, required) - ID của topic

**Query Parameters:**
- `difficulty` (String, optional) - Mức độ khó: `EASY`, `MEDIUM`, `HARD`

**Examples:**

#### 3.1. Lấy tất cả câu hỏi của topic
```http
GET /api/questions/bank/topic/1
```

**Response:**
```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": [
    {
      "questionId": 5,
      "questionText": "Phủ định của mệnh đề...",
      "difficultyLevel": "MEDIUM",
      "topic": {"topicId": 1, "name": "Mệnh đề"}
    },
    {
      "questionId": 4,
      "questionText": "Mệnh đề nào đúng...",
      "difficultyLevel": "EASY",
      "topic": {"topicId": 1, "name": "Mệnh đề"}
    }
  ]
}
```

#### 3.2. Filter theo độ khó
```http
GET /api/questions/bank/topic/1?difficulty=EASY
```

**Response:**
```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": [
    {
      "questionId": 4,
      "questionText": "Mệnh đề nào đúng...",
      "difficultyLevel": "EASY",
      "topic": {"topicId": 1, "name": "Mệnh đề"}
    }
  ]
}
```

**cURL Examples:**
```bash
# Tất cả câu hỏi của topic 1
curl -X GET http://localhost:8080/api/questions/bank/topic/1

# Chỉ câu hỏi EASY của topic 1
curl -X GET "http://localhost:8080/api/questions/bank/topic/1?difficulty=EASY"

# Chỉ câu hỏi HARD của topic 2
curl -X GET "http://localhost:8080/api/questions/bank/topic/2?difficulty=HARD"
```

---

### 4. Get Question by ID - GET

**Endpoint:** `GET /api/questions/bank/{questionId}`

**Description:** Lấy chi tiết một câu hỏi từ question bank

**Path Parameters:**
- `questionId` (Long, required) - ID của câu hỏi

**Request:** No body required

**Response (Success):**
```json
{
  "success": true,
  "message": "Question retrieved successfully",
  "data": {
    "questionId": 5,
    "questionText": "Phủ định của mệnh đề 'Mọi số tự nhiên đều là số nguyên' là:",
    "points": 1.0,
    "questionType": "MULTIPLE_CHOICE",
    "difficultyLevel": "MEDIUM",
    "isQuestionBank": true,
    "attachmentUrl": null,
    "topic": {
      "topicId": 1,
      "name": "Mệnh đề",
      "gradeLevel": "GRADE_10",
      "volume": 1
    },
    "options": [
      {
        "optionId": 17,
        "optionText": "Tồn tại số tự nhiên không là số nguyên",
        "isCorrect": true,
        "optionOrder": 1
      },
      {
        "optionId": 18,
        "optionText": "Không có số tự nhiên nào là số nguyên",
        "isCorrect": false,
        "optionOrder": 2
      }
    ]
  }
}
```

**Response (Error - Not a Question Bank):**
```json
{
  "success": false,
  "message": "This question is not a question bank question",
  "data": null
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8080/api/questions/bank/5
```

---

### 5. Update Question - PUT

**Endpoint:** `PUT /api/questions/bank/{questionId}`

**Description:** Cập nhật câu hỏi trong question bank

**Path Parameters:**
- `questionId` (Long, required) - ID của câu hỏi cần update

**Request Body:** (Chỉ cần gửi các fields muốn update)
```json
{
  "questionText": "Updated question text",
  "points": 2.0,
  "difficultyLevel": "HARD",
  "options": [
    {
      "optionText": "Updated option A",
      "isCorrect": true,
      "optionOrder": 1
    },
    {
      "optionText": "Updated option B",
      "isCorrect": false,
      "optionOrder": 2
    }
  ]
}
```

**Full Update Example:**
```json
{
  "questionText": "Mệnh đề nào sau đây SAI?",
  "points": 1.5,
  "questionType": "MULTIPLE_CHOICE",
  "topicId": 1,
  "difficultyLevel": "MEDIUM",
  "attachmentUrl": "https://example.com/image.png",
  "options": [
    {"optionText": "2 + 3 = 6", "isCorrect": true, "optionOrder": 1},
    {"optionText": "2 + 3 = 5", "isCorrect": false, "optionOrder": 2},
    {"optionText": "2 + 3 = 7", "isCorrect": false, "optionOrder": 3},
    {"optionText": "2 + 3 = 4", "isCorrect": false, "optionOrder": 4}
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "questionId": 5,
    "questionText": "Mệnh đề nào sau đây SAI?",
    "points": 1.5,
    "difficultyLevel": "MEDIUM",
    "isQuestionBank": true,
    "options": [...]
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "This question is not a question bank question",
  "data": null
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:8080/api/questions/bank/5 \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "Updated question text",
    "difficultyLevel": "HARD"
  }'
```

---

### 6. Delete Question - DELETE

**Endpoint:** `DELETE /api/questions/bank/{questionId}`

**Description:** Xóa câu hỏi khỏi question bank

**Path Parameters:**
- `questionId` (Long, required) - ID của câu hỏi cần xóa

**Request:** No body required

**Response (Success):**
```json
{
  "success": true,
  "message": "Question deleted from bank successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "This question is not a question bank question"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:8080/api/questions/bank/5
```

---

### 7. Count Questions by Topic - GET

**Endpoint:** `GET /api/questions/bank/topic/{topicId}/count`

**Description:** Đếm số lượng câu hỏi trong question bank của một topic

**Path Parameters:**
- `topicId` (Long, required) - ID của topic

**Request:** No body required

**Response (Success):**
```json
{
  "success": true,
  "message": "Count retrieved successfully",
  "data": 150
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8080/api/questions/bank/topic/1/count
```

---

## 📊 Summary Table

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/questions/bank` | Tạo câu hỏi mới | No* |
| GET | `/api/questions/bank` | Lấy tất cả câu hỏi | No* |
| GET | `/api/questions/bank/topic/{topicId}` | Lấy câu hỏi theo topic | No* |
| GET | `/api/questions/bank/topic/{topicId}?difficulty=EASY` | Lấy câu hỏi theo topic + độ khó | No* |
| GET | `/api/questions/bank/{questionId}` | Lấy chi tiết 1 câu hỏi | No* |
| PUT | `/api/questions/bank/{questionId}` | Cập nhật câu hỏi | No* |
| DELETE | `/api/questions/bank/{questionId}` | Xóa câu hỏi | No* |
| GET | `/api/questions/bank/topic/{topicId}/count` | Đếm số câu hỏi | No* |

_* Authentication có thể được thêm vào sau_

---

## 🔧 Request/Response Models

### QuestionBankRequest Model
```json
{
  "questionText": "string (required)",
  "points": "float (required)",
  "questionType": "enum: MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER",
  "topicId": "long (required)",
  "difficultyLevel": "enum: EASY | MEDIUM | HARD",
  "attachmentUrl": "string (optional)",
  "options": [
    {
      "optionText": "string (required)",
      "isCorrect": "boolean (required)",
      "optionOrder": "integer (required)"
    }
  ]
}
```

### Question Response Model
```json
{
  "questionId": "long",
  "questionText": "string",
  "points": "float",
  "questionType": "enum",
  "difficultyLevel": "enum",
  "isQuestionBank": "boolean",
  "attachmentUrl": "string",
  "topic": {
    "topicId": "long",
    "name": "string",
    "gradeLevel": "enum",
    "volume": "integer"
  },
  "options": [
    {
      "optionId": "long",
      "optionText": "string",
      "isCorrect": "boolean",
      "optionOrder": "integer"
    }
  ]
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Tạo và quản lý câu hỏi cho Toán 10 Tập 1

```bash
# 1. Tạo câu hỏi EASY cho topic "Mệnh đề"
POST /api/questions/bank
{
  "questionText": "...",
  "difficultyLevel": "EASY",
  "topicId": 1
}

# 2. Lấy tất cả câu EASY của topic để review
GET /api/questions/bank/topic/1?difficulty=EASY

# 3. Update câu hỏi nếu cần
PUT /api/questions/bank/5
{
  "questionText": "Updated text"
}

# 4. Kiểm tra số lượng câu hỏi đã tạo
GET /api/questions/bank/topic/1/count
```

### Use Case 2: Generate Practice Test

```bash
# 1. Đếm số câu hỏi available
GET /api/questions/bank/topic/1/count

# 2. Lấy câu hỏi EASY (10 câu)
GET /api/questions/bank/topic/1?difficulty=EASY

# 3. Lấy câu hỏi MEDIUM (15 câu)
GET /api/questions/bank/topic/1?difficulty=MEDIUM

# 4. Lấy câu hỏi HARD (5 câu)
GET /api/questions/bank/topic/1?difficulty=HARD

# 5. Random và tạo practice test với 30 câu
```

### Use Case 3: Bulk Import Questions

```python
import requests

questions = load_from_csv('questions.csv')

for q in questions:
    response = requests.post(
        'http://localhost:8080/api/questions/bank',
        json=q
    )
    print(f"Created: {response.json()}")
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid difficulty level",
  "data": null
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Topic not found with id: 999",
  "data": null
}
```

### 403 Forbidden (when trying to update non-question-bank question)
```json
{
  "success": false,
  "message": "This question is not a question bank question",
  "data": null
}
```

---

## 🧪 Testing with Postman

### Import Collection
See `POSTMAN_QUESTION_BANK_COLLECTION.md` for complete Postman collection.

### Environment Variables
```json
{
  "baseUrl": "http://localhost:8080",
  "topicId_menhdde": "1",
  "topicId_taphop": "2",
  "topicId_hamso": "3"
}
```

---

## 📝 Notes

1. **isQuestionBank Flag**: Tất cả câu hỏi được tạo qua `/questions/bank` endpoints đều có `isQuestionBank = true`
2. **Filtering**: API hỗ trợ filter theo topic và difficulty level
3. **Sorting**: Câu hỏi được sắp xếp theo ID giảm dần (mới nhất trước)
4. **Validation**: Topic phải tồn tại trước khi tạo câu hỏi
5. **Cascade Delete**: Xóa câu hỏi sẽ tự động xóa các options liên quan

---

## 🔗 Related Documentation

- `QUESTION_BANK_SAMPLES.md` - Sample request bodies
- `POSTMAN_QUESTION_BANK_COLLECTION.md` - Postman collection
- `QUICK_START_QUESTION_BANK.md` - Quick start guide
- `NEW_ARCHITECTURE_API_TESTING.md` - Architecture overview

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**API Version:** v1
