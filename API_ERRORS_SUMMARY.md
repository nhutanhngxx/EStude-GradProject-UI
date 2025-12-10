# 🔴 API Errors Summary - Cần Fix Ở Server

**Ngày**: 9/12/2025  
**Branch**: nguyenchung  
**Trạng thái**: 4 nhóm API đang lỗi 400/500

---

## 📊 Tổng quan

| API Group | Endpoint | Status Code | Priority | Impact |
|-----------|----------|-------------|----------|---------|
| **Analytics** | `/api/admin/analytics/questions/*` | 500 | 🔴 Critical | Dashboard không hoạt động |
| **Users** | `/api/users` | 400 | 🔴 Critical | Dashboard không load được users |
| **Class Subjects** | API class-subjects | 400 | 🟡 High | Attendance Context lỗi |
| **Topics** | `/api/topics?subjectId=1` | 400 | 🟢 Medium | Question Bank management lỗi |

---

## ❌ 1. Analytics APIs - 500 Internal Server Error

### **Endpoints bị lỗi:**

```http
GET /api/admin/analytics/questions/overview
GET /api/admin/analytics/questions/usage-ranking?limit=10
```

### **Error Log:**

```javascript
analyticsService.js:27 Error fetching question bank overview: AxiosError
analyticsService.js:69 Error fetching question usage ranking: AxiosError
AdminAnalytics.jsx:44 ❌ [AdminAnalytics] Error fetching admin analytics: AxiosError
```

### **Sử dụng tại:**

- `src/pages/admin/AdminAnalytics.jsx`
- `src/services/analyticsService.js`

### **Nguyên nhân có thể:**

1. ❌ Backend chưa implement Analytics endpoints
2. ❌ Database aggregation query lỗi
3. ❌ Missing data/empty tables
4. ❌ Permission/Authorization issues

### **Frontend đang mong đợi response:**

```javascript
// GET /api/admin/analytics/questions/overview
{
  "totalQuestions": 150,
  "byDifficulty": {
    "EASY": 50,
    "MEDIUM": 60,
    "HARD": 40
  },
  "byTopic": [
    { "topicName": "Đại số", "count": 45 },
    { "topicName": "Hình học", "count": 38 }
  ],
  "byType": {
    "MULTIPLE_CHOICE": 120,
    "TRUE_FALSE": 20,
    "SHORT_ANSWER": 10
  }
}

// GET /api/admin/analytics/questions/usage-ranking?limit=10
[
  {
    "questionId": 123,
    "questionText": "Giải phương trình...",
    "usageCount": 45,
    "topic": "Đại số",
    "difficulty": "MEDIUM"
  }
]
```

### **Backend cần làm:**

- [ ] Implement Analytics Controller
- [ ] Tạo aggregation queries (COUNT, GROUP BY)
- [ ] Add caching layer (Redis) để tăng performance
- [ ] Handle empty data gracefully
- [ ] Return proper error messages

---

## ❌ 2. Users API - 400 Bad Request

### **Endpoint bị lỗi:**

```http
GET /api/users
```

### **Error Log:**

```javascript
adminService.js:108 Lỗi khi lấy danh sách người dùng: Error: Lấy danh sách người dùng thất bại
Dashboard.jsx:173 Error at fetchStats
```

### **Sử dụng tại:**

- `src/pages/admin/Dashboard.jsx` (fetchStats function)
- `src/services/adminService.js` (getAllUsers)

### **Frontend đang gọi:**

```javascript
// adminService.js
const getAllUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};
```

### **Nguyên nhân có thể:**

1. ❌ API yêu cầu pagination parameters: `?page=0&size=100`
2. ❌ API yêu cầu role filter: `?role=STUDENT`
3. ❌ Missing authentication token
4. ❌ Endpoint path sai (cần `/api/admin/users` thay vì `/api/users`?)

### **Backend cần làm:**

- [ ] Xác định endpoint chính xác: `/api/users` hay `/api/admin/users`
- [ ] Document required query parameters
- [ ] Có pagination không? Format như thế nào?
- [ ] Response format: `Array` hay `{ content: [], totalElements: 0 }`?

### **Đề xuất API Spec:**

```http
GET /api/admin/users?page=0&size=100&role=STUDENT

Response:
{
  "content": [
    {
      "userId": 1,
      "username": "student001",
      "fullName": "Nguyễn Văn A",
      "email": "student@example.com",
      "role": "STUDENT",
      "isActive": true
    }
  ],
  "totalElements": 150,
  "totalPages": 2,
  "pageNumber": 0,
  "pageSize": 100
}
```

---

## ❌ 3. Class Subjects API - 400 Bad Request

### **Endpoint bị lỗi:**

```http
GET /api/class-subjects (hoặc tương tự)
```

### **Error Log:**

```javascript
classSubjectService.js:106 Lỗi khi lấy danh sách môn học của lớp: Error: Lấy danh sách môn học của lớp thất bại
AttendanceContext.jsx:126 Lỗi fetch hoặc subscribe: TypeError: Cannot read properties of null (reading 'filter')
```

### **Sử dụng tại:**

- `src/contexts/AttendanceContext.jsx` (fetchAndSubscribe)
- `src/services/classSubjectService.js` (getAllClassSubjects)

### **Frontend đang gọi:**

```javascript
// AttendanceContext.jsx line 22
const classSubjects = await classSubjectService.getAllClassSubjects();
const filteredSubjects = classSubjects.filter(...); // ❌ Lỗi vì classSubjects = null
```

### **Nguyên nhân có thể:**

1. ❌ API yêu cầu `teacherId` hoặc `classId` trong query
2. ❌ Response trả về `null` thay vì empty array `[]`
3. ❌ Endpoint path không đúng
4. ❌ Missing authentication/authorization

### **Backend cần làm:**

- [ ] Xác định endpoint chính xác
- [ ] **QUAN TRỌNG**: Không return `null`, phải return `[]` khi empty
- [ ] Document required parameters (teacherId? classId?)
- [ ] Add proper error handling

### **Đề xuất API Spec:**

```http
GET /api/class-subjects?teacherId=123

Response (thành công):
[
  {
    "classSubjectId": 1,
    "className": "10A1",
    "subjectName": "Toán",
    "teacherName": "Nguyễn Văn A",
    "scheduleInfo": "Thứ 2, Tiết 1-2"
  }
]

Response (không có data):
[]  // ❌ KHÔNG return null

Response (lỗi):
{
  "message": "Teacher not found",
  "error": "TEACHER_NOT_FOUND"
}
```

---

## ❌ 4. Topics API - 400 Bad Request

### **Endpoint bị lỗi:**

```http
GET /api/topics?subjectId=1
```

### **Error Log:**

```javascript
topicService.js:96 Lỗi khi lấy danh sách chủ đề: Error: Lấy danh sách chủ đề thất bại
ManageTopics.jsx:122 Error loading topics
```

### **Sử dụng tại:**

- `src/pages/admin/ManageTopics.jsx` (fetchTopics)
- `src/services/topicService.js` (getTopics)

### **Frontend đang gọi:**

```javascript
// topicService.js
const getTopics = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.subjectId) params.append('subjectId', filters.subjectId);
  if (filters.gradeLevel) params.append('gradeLevel', filters.gradeLevel);
  if (filters.volume) params.append('volume', filters.volume);
  
  const response = await api.get(`/topics?${params.toString()}`);
  return response.data;
};
```

### **Nguyên nhân có thể:**

1. ❌ `subjectId=1` không tồn tại trong database
2. ❌ API yêu cầu thêm parameters: `gradeLevel`, `volume`
3. ❌ Query string format không đúng
4. ❌ Validation rules quá strict

### **Backend cần làm:**

- [ ] Verify subjectId validation logic
- [ ] Support optional filters (gradeLevel, volume)
- [ ] Return empty array `[]` nếu không có topics
- [ ] Add proper error messages

### **Đề xuất API Spec:**

```http
GET /api/topics?subjectId=1&gradeLevel=GRADE_10&volume=1

Response (thành công):
[
  {
    "topicId": 1,
    "name": "Phương trình bậc 2",
    "description": "...",
    "orderIndex": 1,
    "volume": 1,
    "gradeLevel": "GRADE_10",
    "subjectId": 1,
    "subjectName": "Toán"
  }
]

Response (không có topics):
[]

Response (subjectId không tồn tại):
{
  "message": "Subject not found",
  "error": "SUBJECT_NOT_FOUND"
}
```

---

## 🔧 Checklist Tổng Hợp

### **🔴 Ưu tiên 1 - Critical (Cần fix ngay)**

- [ ] **Analytics APIs** - Implement `/api/admin/analytics/questions/overview`
- [ ] **Analytics APIs** - Implement `/api/admin/analytics/questions/usage-ranking`
- [ ] **Users API** - Fix `/api/users` 400 error
- [ ] **Users API** - Document pagination & query parameters

### **🟡 Ưu tiên 2 - High (Ảnh hưởng chức năng chính)**

- [ ] **Class Subjects API** - Fix 400 error
- [ ] **Class Subjects API** - ⚠️ **QUAN TRỌNG**: Return `[]` thay vì `null`
- [ ] **Class Subjects API** - Document required parameters

### **🟢 Ưu tiên 3 - Medium (Chức năng phụ)**

- [ ] **Topics API** - Fix `/api/topics?subjectId=1` validation
- [ ] **Topics API** - Support optional filters

---

## 📝 Chuẩn hóa Response Format

### **✅ Success Response (có data):**

```json
{
  "data": [...],
  "message": "Success"
}
```

### **✅ Success Response (empty):**

```json
{
  "data": [],
  "message": "No data found"
}
```

### **✅ Paginated Response:**

```json
{
  "content": [...],
  "pageNumber": 0,
  "pageSize": 20,
  "totalElements": 150,
  "totalPages": 8,
  "last": false
}
```

### **❌ Error Response:**

```json
{
  "message": "Validation failed",
  "error": "BAD_REQUEST",
  "details": {
    "subjectId": "Subject ID is required"
  },
  "timestamp": "2025-12-09T10:30:00Z"
}
```

---

## 🎯 Hành động tiếp theo

### **Backend Team:**

1. Review 4 nhóm API trên
2. Fix theo thứ tự ưu tiên (Critical → High → Medium)
3. Document API specs rõ ràng
4. Test với Postman trước khi deploy
5. **⚠️ Đặc biệt chú ý**: Không return `null`, luôn return `[]` hoặc `{}`

### **Frontend Team:**

1. Chờ Backend fix APIs
2. Có thể thêm fallback handling:
   ```javascript
   const data = response?.data || [];
   ```
3. Thêm loading states & error messages cho users
4. Test lại sau khi Backend deploy fixes

---

## 📞 Contact

- **Frontend Lead**: [Tên của bạn]
- **Backend Lead**: [Cần cung cấp]
- **Document này**: `API_ERRORS_SUMMARY.md`
- **Last Updated**: 9/12/2025

---

**Note**: File này được tạo tự động từ Console Errors. Vui lòng cập nhật status khi fix xong từng API.
