# 🔄 Update: Sửa logic kiểm tra Teacher admin

## 📋 Thay đổi

### Trước:
```jsx
const isAdmin = user.role === "ADMIN"; // ❌ SAI - kiểm tra role
```
Kiểm tra `user.role === "ADMIN"` để phân biệt giáo vụ → **SAI**

### Sau:
```jsx
const isAdmin = user.admin === true; // ✅ ĐÚNG - kiểm tra admin property
```
Kiểm tra `user.admin` để phân biệt Teacher giáo vụ → **ĐÚNG**

---

## 🎯 Lý do

Hệ thống có **3 roles**:
1. **ADMIN** - Quản trị hệ thống
2. **TEACHER** - Giáo viên
   - `admin: true` → Giáo vụ (quản lý toàn trường)
   - `admin: false` → Giáo viên thông thường
3. **STUDENT** - Học sinh

Teacher có 2 loại:
- **Giáo vụ** (admin=true): Quản lý tất cả môn học, tạo môn học global
- **Giáo viên thông thường** (admin=false): Chỉ xem môn học của trường

---

## 🔧 Code thay đổi

### File: `src/pages/teacher/ManageSubjects.jsx`

```jsx
export default function ManageSubjects() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user.school?.schoolId;
  const isAdmin = user.admin === true; // ✅ Kiểm tra admin của Teacher

  useEffect(() => {
    const fetchSubjects = async () => {
      const result = await subjectService.getAllSubjects();
      
      if (result) {
        const filtered = isAdmin
          ? result // Teacher admin (giáo vụ) → lấy TẤT CẢ
          : result.filter((s) => // Teacher thông thường → filter theo trường
              s.schools?.some((sch) => sch.schoolId === schoolId)
            );
        
        setSubjects(filtered);
      }
    };
    fetchSubjects();
  }, [schoolId, showToast, isAdmin]);
}
```

---

## 📊 Kết quả

### Teacher với admin = true (Giáo vụ):
```json
{
  "userId": 76,
  "role": "TEACHER",
  "admin": true,  // ⭐ Field name là "admin" (lowercase)
  "teacherCode": "TEA1761798263428",
  "fullName": "ĐINH NGUYÊN CHUNG",
  "school": {
    "schoolId": 1,
    "schoolName": "THPT DTNT tỉnh Quảng Ngãi"
  }
}
```
✅ Xem tất cả môn học  
✅ Thêm môn học global (không có schoolId)  
✅ UI: "Quản lý môn học (Giáo vụ)"

### Teacher với admin = false:
```json
{
  "userId": 20,
  "role": "TEACHER",
  "admin": false,  // ⭐
  "school": { "schoolId": 5 }
}
```
✅ Chỉ xem môn học của trường  
✅ Thêm môn học cho trường (có schoolId)  
✅ UI: "Quản lý môn học"

---

## ⚠️ Lưu ý quan trọng

**Field name trong user object:**
- ✅ `user.admin` (chữ thường) - **ĐÚNG**
- ❌ `user.isAdmin` (camelCase) - **SAI**

Backend trả về field là **`admin`** chứ không phải `isAdmin`!

---

## ✅ Files thay đổi

- `src/pages/teacher/ManageSubjects.jsx` - Sửa từ `user.isAdmin` → `user.admin`

---

## 📚 Documentation

Chi tiết đầy đủ xem tại:
- `USER_ROLES_STRUCTURE.md` - Cấu trúc user và phân quyền
- `ADMIN_SUBJECT_MANAGEMENT.md` - Logic quản lý môn học

---

**Date:** October 30, 2025  
**Change:** Fix admin check logic (isAdmin → admin)  
**Status:** ✅ COMPLETE
