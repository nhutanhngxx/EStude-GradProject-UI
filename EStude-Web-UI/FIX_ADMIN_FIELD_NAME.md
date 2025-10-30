# ✅ FIXED: Teacher admin không xem được môn học global

## ❌ Vấn đề

Teacher có `admin: true` vẫn **KHÔNG thể xem** được tất cả môn học (chỉ thấy môn của trường).

### User object thực tế:
```json
{
  "userId": 76,
  "role": "TEACHER",
  "admin": true,  // ⭐ Field name là "admin" (LOWERCASE)
  "teacherCode": "TEA1761798263428",
  "fullName": "ĐINH NGUYÊN CHUNG",
  "email": "nguyenchung110297@gmail.com",
  "school": {
    "schoolId": 1,
    "schoolName": "THPT DTNT tỉnh Quảng Ngãi"
  }
}
```

### Code đang kiểm tra SAI:
```jsx
const isAdmin = user.isAdmin === true; // ❌ Field "isAdmin" không tồn tại
```

**Kết quả:** `isAdmin` luôn là `undefined` → filter theo trường → không thấy môn global

---

## ✅ Nguyên nhân

Backend trả về field là **`admin`** (lowercase), nhưng code đang check **`isAdmin`** (camelCase)!

```
user.admin     ✅ Field thực tế (true/false)
user.isAdmin   ❌ Field không tồn tại (undefined)
```

---

## 🔧 Giải pháp

### File: `src/pages/teacher/ManageSubjects.jsx`

**TRƯỚC (SAI):**
```jsx
const isAdmin = user.isAdmin === true; // ❌ undefined
```

**SAU (ĐÚNG):**
```jsx
const isAdmin = user.admin === true; // ✅ true/false
```

---

## 🧪 Testing

### Test Case: Teacher admin = true

**Input:**
```json
{
  "userId": 76,
  "role": "TEACHER",
  "admin": true,
  "school": { "schoolId": 1 }
}
```

**TRƯỚC (SAI):**
```jsx
const isAdmin = user.isAdmin === true;
// → isAdmin = undefined === true
// → isAdmin = false
// → Filter theo trường → Chỉ thấy môn của schoolId 1
```

**SAU (ĐÚNG):**
```jsx
const isAdmin = user.admin === true;
// → isAdmin = true === true
// → isAdmin = true
// → Không filter → Thấy TẤT CẢ môn học ✅
```

---

## 📊 Kết quả

### Teacher admin = true (Giáo vụ):
✅ **Xem TẤT CẢ môn học** (global + của các trường)  
✅ **Thêm môn học global** (không gửi schoolId)  
✅ **Import Excel** tạo môn global  
✅ UI hiển thị: **"Quản lý môn học (Giáo vụ)"**

### Teacher admin = false:
✅ Xem chỉ môn học của trường (filter theo schoolId)  
✅ Thêm môn học cho trường (gửi schoolId)  
✅ Import Excel cho trường  
✅ UI hiển thị: **"Quản lý môn học"**

---

## ⚠️ Lưu ý quan trọng

### Backend field naming:
```json
{
  "admin": true     // ✅ ĐÚNG - lowercase
  "isAdmin": true   // ❌ SAI - không tồn tại
}
```

### Frontend check:
```jsx
// ✅ ĐÚNG
const isAdmin = user.admin === true;

// ❌ SAI
const isAdmin = user.isAdmin === true;
```

### Database column:
```sql
admin BOOLEAN DEFAULT FALSE  -- ✅ ĐÚNG - lowercase
is_admin BOOLEAN            -- ❌ SAI (nếu backend dùng tên này)
```

---

## 📝 Files đã sửa

1. ✅ `src/pages/teacher/ManageSubjects.jsx` - Sửa `user.isAdmin` → `user.admin`
2. ✅ `FIX_ISADMIN_CHECK.md` - Update documentation
3. ✅ `USER_ROLES_STRUCTURE.md` - Update field name examples

---

## 🎯 Checklist

- [x] Identify root cause: Field name mismatch (`admin` vs `isAdmin`)
- [x] Fix code: `user.admin === true`
- [x] Test with real user object (userId: 76)
- [x] Verify Teacher admin can see all subjects
- [x] Verify Teacher admin can add global subjects
- [x] Update all documentation
- [x] Add warning about field naming

---

## 💡 Bài học

### 1. Always inspect actual data structure
```jsx
// GOOD: Console log để kiểm tra structure
const user = JSON.parse(localStorage.getItem("user") || "{}");
console.log("User object:", user);
console.log("admin field:", user.admin);
console.log("isAdmin field:", user.isAdmin); // undefined!
```

### 2. Consistent naming between frontend/backend
- Backend trả về `admin` → Frontend dùng `admin`
- Hoặc backend trả về `isAdmin` → Frontend dùng `isAdmin`
- **Không nhất quán** = bug!

### 3. Use TypeScript for type safety
```typescript
interface User {
  userId: number;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  admin: boolean;  // ✅ TypeScript sẽ warning nếu dùng sai
  school?: {
    schoolId: number;
    schoolName: string;
  };
}

const user: User = JSON.parse(localStorage.getItem("user") || "{}");
const isAdmin = user.admin; // ✅ Type-safe
```

---

## ✅ Status

**RESOLVED** ✅

**Root cause:** Field name mismatch (`admin` vs `isAdmin`)  
**Solution:** Change code from `user.isAdmin` to `user.admin`  
**Verified:** Teacher userId 76 with `admin: true` can now see all subjects

---

**Date:** October 30, 2025  
**Issue:** Teacher admin cannot see global subjects  
**Fix:** Change field check from `isAdmin` to `admin`  
**Status:** ✅ FIXED & TESTED
