# 👥 Cấu trúc User và Phân quyền Hệ thống

## 📋 Tổng quan

Hệ thống có **3 role chính** với phân quyền khác nhau:

```
1. ADMIN (Quản trị hệ thống)
2. TEACHER (Giáo viên)
   ├── admin: true  → Giáo vụ (quản lý môn học toàn trường)
   └── admin: false → Giáo viên thông thường
3. STUDENT (Học sinh)
```

---

## 🎭 Chi tiết từng Role

### 1. ADMIN - Quản trị viên hệ thống
```json
{
  "userId": 1,
  "username": "admin",
  "role": "ADMIN",
  "fullName": "Quản trị viên",
  "email": "admin@example.com"
}
```

**Quyền hạn:**
- ✅ Quản lý tất cả users (thêm, sửa, xóa)
- ✅ Quản lý trường học
- ✅ Quản lý lớp học toàn hệ thống
- ✅ Xem báo cáo tổng hợp
- ✅ Quản lý môn học admin (global subjects)
- ✅ Quản lý topics và question bank

**Trang truy cập:**
- `/admin/dashboard`
- `/admin/manage-users`
- `/admin/manage-schools`
- `/admin/manage-classes`
- `/admin/manage-subjects`
- `/admin/manage-topics`
- `/admin/manage-question-bank`

---

### 2. TEACHER - Giáo viên

#### 2.1. Teacher admin = true (Giáo vụ)
```json
{
  "userId": 76,
  "username": "giaovu01",
  "role": "TEACHER",
  "admin": true,  // ⭐ Giáo vụ (field name là "admin" - lowercase)
  "teacherCode": "TEA1761798263428",
  "fullName": "ĐINH NGUYÊN CHUNG",
  "email": "nguyenchung110297@gmail.com",
  "numberPhone": "0334080907",
  "dob": "2000-04-24",
  "hireDate": "2025-10-30",
  "homeroomTeacher": false,
  "school": {
    "schoolId": 1,
    "schoolCode": "SCU1111",
    "schoolName": "THPT DTNT tỉnh Quảng Ngãi",
    "address": "12 Nguyễn Thông",
    "contactEmail": "dtntqn@gmail.com"
  }
}
```

**Quyền hạn đặc biệt:**
- ✅ **Xem TẤT CẢ môn học** trong hệ thống (không filter theo trường)
- ✅ **Thêm môn học global** (không gắn với trường cụ thể)
- ✅ **Import Excel môn học** global
- ✅ Quản lý lịch dạy toàn trường
- ✅ Quản lý điểm danh toàn trường
- ✅ Xem báo cáo toàn trường

**Trang truy cập:**
- `/teacher/dashboard`
- `/teacher/manage-subjects` (xem tất cả môn học)
- `/teacher/manage-schedules`
- `/teacher/manage-attendance`
- `/teacher/reports`

**UI đặc biệt:**
- Title: **"Quản lý môn học (Giáo vụ)"**
- Description: "Quản lý tất cả môn học trong hệ thống..."

---

#### 2.2. Teacher admin = false (Giáo viên thông thường)
```json
{
  "userId": 20,
  "username": "teacher01",
  "role": "TEACHER",
  "admin": false,  // ⭐ Giáo viên thông thường
  "fullName": "Trần Thị B",
  "email": "teacher@school.com",
  "school": {
    "schoolId": 5,
    "name": "THPT Lê Quý Đôn"
  }
}
```

**Quyền hạn:**
- ✅ Xem **chỉ môn học của trường** (filter theo schoolId)
- ✅ Thêm môn học cho trường mình
- ✅ Quản lý lớp học của mình
- ✅ Quản lý bài tập của lớp mình
- ✅ Điểm danh lớp mình
- ✅ Nhập điểm học sinh

**Trang truy cập:**
- `/teacher/dashboard`
- `/teacher/my-classes`
- `/teacher/manage-subjects` (chỉ môn học của trường)
- `/teacher/teaching-schedule`
- `/teacher/manage-attendance`

**UI đặc biệt:**
- Title: **"Quản lý môn học"**
- Description: "Quản lý môn học giúp giáo viên tổ chức..."

---

### 3. STUDENT - Học sinh
```json
{
  "userId": 100,
  "username": "student01",
  "role": "STUDENT",
  "fullName": "Lê Văn C",
  "email": "student@school.com",
  "school": {
    "schoolId": 5,
    "name": "THPT Lê Quý Đôn"
  }
}
```

**Quyền hạn:**
- ✅ Xem lớp học của mình
- ✅ Xem bài tập
- ✅ Nộp bài tập
- ✅ Xem điểm số
- ✅ Xem lịch học

**Trang truy cập:**
- `/student/dashboard`
- `/student/my-classes`
- `/student/assignments`
- `/student/grades`

---

## 🔐 Logic phân quyền - Quản lý Môn học

### Code implementation:

```jsx
// src/pages/teacher/ManageSubjects.jsx

export default function ManageSubjects() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user.school?.schoolId;
  const isAdmin = user.isAdmin === true; // ⭐ Kiểm tra Teacher có isAdmin không

  useEffect(() => {
    const fetchSubjects = async () => {
      const result = await subjectService.getAllSubjects();
      
      if (result) {
        // Logic phân quyền:
        const filtered = isAdmin
          ? result // Teacher isAdmin → lấy TẤT CẢ môn học
          : result.filter((s) => // Teacher thông thường → filter theo trường
              s.schools?.some((sch) => sch.schoolId === schoolId)
            );
        
        setSubjects(filtered);
      }
    };
    fetchSubjects();
  }, [schoolId, isAdmin]);

  // Khi thêm/sửa môn học:
  const handleSaveSubject = async () => {
    const payload = isAdmin
      ? { name, description } // Teacher isAdmin → không gửi schoolId (global)
      : { name, description, schoolId }; // Teacher thông thường → gửi schoolId
    
    await subjectService.addSubject(payload);
  };
}
```

---

## 📊 So sánh quyền hạn

| Tính năng | ADMIN | Teacher (isAdmin=true) | Teacher (isAdmin=false) | STUDENT |
|-----------|-------|------------------------|-------------------------|---------|
| **Quản lý Users** | ✅ Tất cả | ❌ | ❌ | ❌ |
| **Quản lý Schools** | ✅ Tất cả | ❌ | ❌ | ❌ |
| **Xem môn học** | ✅ Global subjects | ✅ Tất cả môn học | ⚠️ Chỉ của trường | ⚠️ Của lớp mình |
| **Thêm môn học** | ✅ Global | ✅ Global | ⚠️ Cho trường mình | ❌ |
| **Import Excel** | ✅ Global | ✅ Global | ⚠️ Cho trường mình | ❌ |
| **Quản lý lớp** | ✅ Tất cả | ✅ Của trường | ⚠️ Lớp mình dạy | ⚠️ Lớp mình học |
| **Điểm danh** | ❌ | ✅ Toàn trường | ✅ Lớp mình | ❌ |
| **Nhập điểm** | ❌ | ✅ Toàn trường | ✅ Lớp mình | ❌ |
| **Xem báo cáo** | ✅ Toàn hệ thống | ✅ Toàn trường | ⚠️ Lớp mình | ⚠️ Của mình |

---

## 🎯 Use Cases

### Use Case 1: Giáo vụ tạo môn học mới
**Actor:** Teacher với `isAdmin = true`

**Steps:**
1. Login với user giáo vụ
2. Vào "Quản lý môn học"
3. Click "Thêm mới môn học"
4. Nhập: Tên = "Hóa học", Mô tả = "Môn Hóa THPT"
5. Click "Lưu"

**Kết quả:**
```json
// Payload gửi lên server:
{
  "name": "Hóa học",
  "description": "Môn Hóa THPT"
  // Không có schoolId → Môn học GLOBAL
}
```

**Impact:**
- ✅ Môn học được tạo cho **TẤT CẢ trường** trong hệ thống
- ✅ Mọi trường đều có thể sử dụng môn này
- ✅ Giáo vụ các trường khác cũng thấy được

---

### Use Case 2: Giáo viên thông thường thêm môn học
**Actor:** Teacher với `isAdmin = false`

**Steps:**
1. Login với user giáo viên (schoolId = 5)
2. Vào "Quản lý môn học"
3. Click "Thêm mới môn học"
4. Nhập: Tên = "Tin học ứng dụng", Mô tả = "Môn tự chọn"
5. Click "Lưu"

**Kết quả:**
```json
// Payload gửi lên server:
{
  "name": "Tin học ứng dụng",
  "description": "Môn tự chọn",
  "schoolId": 5  // ⭐ Có schoolId
}
```

**Impact:**
- ✅ Môn học chỉ cho **trường có schoolId = 5**
- ✅ Giáo viên trường khác KHÔNG thấy được
- ✅ Chỉ giáo vụ (isAdmin=true) mới thấy trong danh sách toàn bộ

---

### Use Case 3: Import Excel môn học
**Actor:** Teacher với `isAdmin = true`

**File Excel:**
```csv
name,description
Toán,Môn Toán chương trình THPT
Văn,Ngữ văn chương trình THPT
Anh,Tiếng Anh chương trình THPT
```

**Kết quả:**
```json
// 3 requests gửi lên:
{ "name": "Toán", "description": "Môn Toán chương trình THPT" }
{ "name": "Văn", "description": "Ngữ văn chương trình THPT" }
{ "name": "Anh", "description": "Tiếng Anh chương trình THPT" }
// Không có schoolId → 3 môn học GLOBAL
```

**Impact:**
- ✅ 3 môn học được tạo cho tất cả trường
- ✅ Toast: "Import thành công 3 môn học."

---

## 🔍 Kiểm tra isAdmin

### Frontend check:
```jsx
const user = JSON.parse(localStorage.getItem("user") || "{}");
const isAdmin = user.admin === true; // ⚠️ Field name là "admin" (lowercase)

if (isAdmin) {
  // Logic cho giáo vụ
} else {
  // Logic cho giáo viên thông thường
}
```

### Backend API expected:
```json
// GET /api/auth/login
{
  "accessToken": "eyJhbGc...",
  "user": {
    "userId": 76,
    "username": "giaovu01",
    "role": "TEACHER",
    "admin": true,  // ⭐ Backend trả về field "admin" (lowercase)
    "teacherCode": "TEA1761798263428",
    "school": {
      "schoolId": 1,
      "schoolName": "THPT DTNT tỉnh Quảng Ngãi"
    }
  }
}
```

---

## 🎨 UI Differences

### Teacher isAdmin = true:
```jsx
<h1>Quản lý môn học (Giáo vụ)</h1>
<p>Quản lý tất cả môn học trong hệ thống. Bạn có thể thêm, chỉnh sửa hoặc xóa môn học và import/export Excel dễ dàng.</p>

// Button thêm môn học → tạo global subject
// Import Excel → tạo global subjects
// Table hiển thị → TẤT CẢ môn học
```

### Teacher isAdmin = false:
```jsx
<h1>Quản lý môn học</h1>
<p>Quản lý môn học giúp giáo viên tổ chức và quản lý điểm danh, bài tập và đánh giá học sinh...</p>

// Button thêm môn học → tạo subject cho trường mình
// Import Excel → tạo subjects cho trường mình  
// Table hiển thị → Chỉ môn học của trường
```

---

## 📝 Database Schema (Expected)

### Users Table:
```sql
CREATE TABLE users (
  user_id INT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'TEACHER', 'STUDENT') NOT NULL,
  admin BOOLEAN DEFAULT FALSE,  -- ⭐ Field name là "admin" (lowercase)
  school_id INT,
  full_name VARCHAR(100),
  email VARCHAR(100),
  FOREIGN KEY (school_id) REFERENCES schools(school_id)
);
```

### Subjects Table:
```sql
CREATE TABLE subjects (
  subject_id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  school_id INT NULL,  -- ⭐ NULL = global subject, NOT NULL = school-specific
  created_by INT,
  created_at TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(school_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

**Logic:**
- `school_id = NULL` → **Global subject** (tạo bởi Admin hoặc Teacher isAdmin=true)
- `school_id = 5` → **School-specific subject** (tạo bởi Teacher isAdmin=false của trường 5)

---

## 🚀 Workflow tổng quan

### 1. Login Flow:
```mermaid
User → [Login Page] → [API: /auth/login] 
  → Response: { user: { role, isAdmin, school } }
  → localStorage.setItem("user", JSON.stringify(user))
  → Redirect based on role
```

### 2. Access Control Flow:
```mermaid
[ManageSubjects Page]
  → Get user from localStorage
  → Check user.isAdmin
    → TRUE: Fetch ALL subjects (no filter)
    → FALSE: Fetch subjects WHERE school_id = user.school.schoolId
  → Render subjects list
```

### 3. Add Subject Flow:
```mermaid
[Add Subject Form]
  → User enters name, description
  → Check user.isAdmin
    → TRUE: payload = { name, description }  // Global
    → FALSE: payload = { name, description, schoolId }  // School-specific
  → POST /api/subjects
  → Server creates subject with correct scope
```

---

## 🧪 Testing Checklist

### Test User isAdmin = true:
- [ ] Login với user có `isAdmin: true`
- [ ] Vào "Quản lý môn học"
- [ ] Verify title hiển thị "(Giáo vụ)"
- [ ] Verify thấy TẤT CẢ môn học (bao gồm global và của các trường)
- [ ] Thêm môn học mới
- [ ] Verify payload không có `schoolId`
- [ ] Verify môn học mới là global
- [ ] Import Excel
- [ ] Verify tất cả môn import là global

### Test User isAdmin = false:
- [ ] Login với user có `isAdmin: false`
- [ ] Vào "Quản lý môn học"
- [ ] Verify title KHÔNG có "(Giáo vụ)"
- [ ] Verify chỉ thấy môn học của trường mình
- [ ] Thêm môn học mới
- [ ] Verify payload CÓ `schoolId`
- [ ] Verify môn học mới chỉ thuộc trường mình
- [ ] Import Excel
- [ ] Verify tất cả môn import thuộc trường mình

---

## ✅ Summary

**Cấu trúc phân quyền:**
```
ADMIN (role: "ADMIN")
  └─ Quản trị toàn hệ thống

TEACHER (role: "TEACHER")
  ├─ admin: true  → Giáo vụ
  │   ├─ Xem tất cả môn học
  │   ├─ Thêm môn học global
  │   └─ Quản lý toàn trường
  │
  └─ admin: false → Giáo viên thông thường
      ├─ Xem môn học của trường
      ├─ Thêm môn học cho trường
      └─ Quản lý lớp mình dạy

STUDENT (role: "STUDENT")
  └─ Học sinh
      ├─ Xem lớp mình học
      └─ Nộp bài tập, xem điểm
```

**Key field:** `user.admin` (boolean) - Quyết định Teacher có phải Giáo vụ không

⚠️ **Lưu ý:** Field name là **`admin`** (lowercase), KHÔNG phải `isAdmin`!

---

**Date:** October 30, 2025  
**Version:** 1.0  
**Status:** ✅ DOCUMENTED
