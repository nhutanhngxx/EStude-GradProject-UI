# 🔧 Cập nhật: Quản lý Môn học cho Admin (Giáo vụ)

## 📋 Tóm tắt thay đổi

### Trước:
- ❌ Teacher với role ADMIN vẫn bị filter môn học theo `schoolId`
- ❌ Chỉ xem được môn học của trường mình
- ❌ Thêm môn học mới phải gắn với `schoolId` cụ thể

### Sau:
- ✅ Teacher với role ADMIN (Giáo vụ) xem được **tất cả môn học** trong hệ thống
- ✅ Không còn filter theo trường
- ✅ Thêm môn học mới là **global** (không gắn với trường cụ thể)
- ✅ UI hiển thị phù hợp với role

---

## 🎯 Mục đích

**Vai trò "ADMIN" trong Teacher:**
- Là **Giáo vụ** - người quản lý toàn bộ hệ thống môn học
- Có quyền tạo môn học global cho tất cả các trường sử dụng
- Xem và quản lý tất cả môn học đã tạo

**Vai trò "TEACHER" thông thường:**
- Chỉ xem môn học thuộc trường của mình
- Thêm môn học chỉ cho trường mình
- Bị giới hạn theo `schoolId`

---

## 🔍 Chi tiết thay đổi

### File: `src/pages/teacher/ManageSubjects.jsx`

#### 1. Thêm kiểm tra role admin
```jsx
const user = JSON.parse(localStorage.getItem("user") || "{}");
const schoolId = user.school?.schoolId;
const isAdmin = user.role === "ADMIN"; // ✅ NEW - Kiểm tra role admin (giáo vụ)
```

#### 2. Fetch subjects - Filter theo role
**TRƯỚC:**
```jsx
useEffect(() => {
  const fetchSubjects = async () => {
    try {
      const result = await subjectService.getAllSubjects();
      if (result) {
        const filtered = result.filter((s) =>
          s.schools?.some((sch) => sch.schoolId === schoolId)
        );
        setSubjects(filtered);
      }
    } catch (error) {
      console.error("Lỗi khi lấy môn học:", error);
      showToast("Lỗi khi tải danh sách môn học!", "error");
    }
  };
  fetchSubjects();
}, [schoolId, showToast]);
```

**SAU:**
```jsx
useEffect(() => {
  const fetchSubjects = async () => {
    try {
      const result = await subjectService.getAllSubjects();
      if (result) {
        // ✅ Nếu là admin (giáo vụ) thì lấy tất cả môn học
        // ✅ Nếu là teacher thì chỉ lấy môn học của trường
        const filtered = isAdmin
          ? result // Admin (giáo vụ) lấy tất cả môn học
          : result.filter((s) =>
              s.schools?.some((sch) => sch.schoolId === schoolId)
            );
        setSubjects(filtered);
      }
    } catch (error) {
      console.error("Lỗi khi lấy môn học:", error);
      showToast("Lỗi khi tải danh sách môn học!", "error");
    }
  };
  fetchSubjects();
}, [schoolId, showToast, isAdmin]);
```

#### 3. Update Header UI
**TRƯỚC:**
```jsx
<h1 className="text-2xl font-bold mb-2">Quản lý môn học (Giáo vụ)</h1>
<p className="text-gray-600 dark:text-gray-400 text-sm max-w-xl">
  Quản lý môn học giúp giáo viên tổ chức và quản lý điểm danh, bài tập
  và đánh giá học sinh. Bạn có thể thêm, chỉnh sửa hoặc xóa môn học và
  import/export Excel dễ dàng.
</p>
```

**SAU:**
```jsx
<h1 className="text-2xl font-bold mb-2">
  Quản lý môn học {isAdmin && "(Giáo vụ)"} {/* ✅ Dynamic title */}
</h1>
<p className="text-gray-600 dark:text-gray-400 text-sm max-w-xl">
  {isAdmin
    ? "Quản lý tất cả môn học trong hệ thống. Bạn có thể thêm, chỉnh sửa hoặc xóa môn học và import/export Excel dễ dàng."
    : "Quản lý môn học giúp giáo viên tổ chức và quản lý điểm danh, bài tập và đánh giá học sinh. Bạn có thể thêm, chỉnh sửa hoặc xóa môn học và import/export Excel dễ dàng."}
</p>
```

#### 4. Save Subject - Không gửi schoolId nếu là admin
**TRƯỚC:**
```jsx
const handleSaveSubject = async () => {
  // ...validation...
  
  try {
    let result;
    if (selectedSubject) {
      result = await subjectService.updateSubject({
        subjectId: selectedSubject.subjectId,
        name,
        description,
        schoolId, // ❌ Luôn gửi schoolId
      });
    } else {
      result = await subjectService.addSubject({
        name,
        description,
        schoolId, // ❌ Luôn gửi schoolId
      });
    }
  } catch (error) {
    // ...
  }
};
```

**SAU:**
```jsx
const handleSaveSubject = async () => {
  // ...validation...
  
  const isDuplicate = subjects.some(
    (s) =>
      s.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      (!selectedSubject || s.subjectId !== selectedSubject.subjectId)
  );
  if (isDuplicate) {
    showToast(
      `Môn học này đã tồn tại ${isAdmin ? "trong hệ thống" : "trong trường của bạn"}.`, // ✅ Dynamic message
      "error"
    );
    return;
  }

  try {
    let result;
    if (selectedSubject) {
      // ✅ Nếu là admin thì không gửi schoolId (môn học global)
      const payload = isAdmin
        ? { subjectId: selectedSubject.subjectId, name, description }
        : { subjectId: selectedSubject.subjectId, name, description, schoolId };
      
      result = await subjectService.updateSubject(payload);
    } else {
      // ✅ Nếu là admin thì không gửi schoolId (môn học global)
      const payload = isAdmin
        ? { name, description }
        : { name, description, schoolId };
      
      result = await subjectService.addSubject(payload);
    }
  } catch (error) {
    // ...
  }
};
```

#### 5. Import Excel - Không gửi schoolId nếu là admin
**TRƯỚC:**
```jsx
const rows = json.map((row, idx) => ({
  rowIndex: idx + 2,
  name: (row.name || row.Name || "").toString().trim(),
  description: (row.description || row.Description || "").toString().trim(),
  schoolId: schoolId, // ❌ Luôn gán schoolId
}));

// ...

for (const r of rowsToImport) {
  try {
    const payload = {
      name: r.name,
      description: r.description,
      schoolId, // ❌ Luôn gửi schoolId
    };
    const res = await subjectService.addSubject(payload);
    if (res) added.push(res);
  } catch (err) {
    console.error("Error adding subject row:", r, err);
  }
}
```

**SAU:**
```jsx
const rows = json.map((row, idx) => ({
  rowIndex: idx + 2,
  name: (row.name || row.Name || "").toString().trim(),
  description: (row.description || row.Description || "").toString().trim(),
  // ✅ Không gán schoolId vào rows
}));

// ...

for (const r of rowsToImport) {
  try {
    // ✅ Nếu là admin thì không gửi schoolId (môn học global)
    const payload = isAdmin
      ? { name: r.name, description: r.description }
      : { name: r.name, description: r.description, schoolId };
    
    const res = await subjectService.addSubject(payload);
    if (res) added.push(res);
  } catch (err) {
    console.error("Error adding subject row:", r, err);
  }
}
```

#### 6. Fix lint warning - Comment unused chartData
```jsx
// ✅ Commented out chart - uncomment if needed
// const chartData = {
//   labels: subjects.map((s) => s.name),
//   datasets: [...],
// };
```

---

## 🧪 Testing

### Test Case 1: Admin xem tất cả môn học
**Kịch bản:**
1. Login với user có `role: "ADMIN"`
2. Vào trang "Quản lý môn học"

**Kết quả mong đợi:**
```
✅ Title: "Quản lý môn học (Giáo vụ)"
✅ Description: "Quản lý tất cả môn học trong hệ thống..."
✅ Hiển thị TẤT CẢ môn học (không filter theo trường)
```

---

### Test Case 2: Teacher xem môn học của trường
**Kịch bản:**
1. Login với user có `role: "TEACHER"`
2. Vào trang "Quản lý môn học"

**Kết quả mong đợi:**
```
✅ Title: "Quản lý môn học"
✅ Description: "Quản lý môn học giúp giáo viên..."
✅ Chỉ hiển thị môn học CỦA TRƯỜNG (filter theo schoolId)
```

---

### Test Case 3: Admin thêm môn học global
**Kịch bản:**
1. Login với role ADMIN
2. Click "Thêm mới môn học"
3. Nhập: Tên = "Hóa học", Mô tả = "Môn Hóa THPT"
4. Click "Lưu"

**Payload gửi đi:**
```json
{
  "name": "Hóa học",
  "description": "Môn Hóa THPT"
  // ✅ Không có schoolId
}
```

**Kết quả:**
```
✅ Môn học được tạo là GLOBAL (tất cả trường có thể dùng)
✅ Toast: "Thêm môn học thành công!"
```

---

### Test Case 4: Teacher thêm môn học cho trường
**Kịch bản:**
1. Login với role TEACHER, schoolId = 5
2. Click "Thêm mới môn học"
3. Nhập: Tên = "Sinh học", Mô tả = "Môn Sinh THPT"
4. Click "Lưu"

**Payload gửi đi:**
```json
{
  "name": "Sinh học",
  "description": "Môn Sinh THPT",
  "schoolId": 5 // ✅ Có schoolId
}
```

**Kết quả:**
```
✅ Môn học chỉ thuộc trường có schoolId = 5
✅ Toast: "Thêm môn học thành công!"
```

---

### Test Case 5: Admin import Excel
**Kịch bản:**
1. Login với role ADMIN
2. Tạo file Excel với 3 môn: Toán, Văn, Anh
3. Click "Import Excel" và chọn file

**Payload gửi đi cho từng môn:**
```json
{
  "name": "Toán",
  "description": "Môn Toán chương trình THPT"
  // ✅ Không có schoolId
}
```

**Kết quả:**
```
✅ 3 môn học được tạo là GLOBAL
✅ Toast: "Import thành công 3 môn học."
```

---

### Test Case 6: Teacher import Excel
**Kịch bản:**
1. Login với role TEACHER, schoolId = 5
2. Tạo file Excel với 3 môn: Toán, Văn, Anh
3. Click "Import Excel" và chọn file

**Payload gửi đi cho từng môn:**
```json
{
  "name": "Toán",
  "description": "Môn Toán chương trình THPT",
  "schoolId": 5 // ✅ Có schoolId
}
```

**Kết quả:**
```
✅ 3 môn học chỉ thuộc trường có schoolId = 5
✅ Toast: "Import thành công 3 môn học."
```

---

### Test Case 7: Duplicate check message
**Kịch bản:**
1. Admin thêm môn "Toán" (đã tồn tại trong hệ thống)

**Kết quả:**
```
❌ Toast: "Môn học này đã tồn tại trong hệ thống." // ✅ Admin message
```

2. Teacher thêm môn "Toán" (đã tồn tại trong trường)

**Kết quả:**
```
❌ Toast: "Môn học này đã tồn tại trong trường của bạn." // ✅ Teacher message
```

---

## 📊 So sánh trước/sau

| Tính năng | Admin (TRƯỚC) | Admin (SAU) | Teacher (Không đổi) |
|-----------|---------------|-------------|---------------------|
| **Xem môn học** | Filter theo schoolId | ✅ Xem tất cả | Filter theo schoolId |
| **Thêm môn học** | Gửi schoolId | ✅ Không gửi (global) | Gửi schoolId |
| **Import Excel** | Gửi schoolId | ✅ Không gửi (global) | Gửi schoolId |
| **Duplicate check** | "trong trường của bạn" | ✅ "trong hệ thống" | "trong trường của bạn" |
| **UI Title** | Cố định | ✅ Dynamic "(Giáo vụ)" | "Quản lý môn học" |
| **UI Description** | Cho teacher | ✅ Cho admin | Cho teacher |

---

## 🎯 Lợi ích

### 1. Quản lý tập trung
- ✅ Admin (giáo vụ) có thể tạo môn học global cho tất cả trường
- ✅ Tránh duplicate môn học giữa các trường
- ✅ Dễ dàng chuẩn hóa danh sách môn học

### 2. Phân quyền rõ ràng
- ✅ Admin: Quản lý toàn hệ thống
- ✅ Teacher: Quản lý riêng trường mình
- ✅ UI hiển thị phù hợp với role

### 3. Database optimization
- ✅ Môn học global không cần duplicate trong nhiều trường
- ✅ Giảm redundancy trong database
- ✅ Dễ maintain và update

---

## 🔮 Mở rộng trong tương lai

### 1. School-Subject mapping
Nếu cần tracking môn học nào được dùng ở trường nào:
```sql
CREATE TABLE school_subjects (
  school_id INT,
  subject_id INT,
  is_active BOOLEAN,
  PRIMARY KEY (school_id, subject_id)
);
```

### 2. Permission levels
```jsx
const canEdit = isAdmin || (isTeacher && subject.schoolId === schoolId);
const canDelete = isAdmin; // Chỉ admin mới xóa được
```

### 3. Audit log
Track ai tạo môn học nào, khi nào:
```json
{
  "subjectId": 123,
  "name": "Toán",
  "createdBy": "admin_user_id",
  "createdAt": "2025-10-30T10:00:00Z",
  "scope": "global" // hoặc "school"
}
```

---

## 📝 Checklist hoàn thành

- [x] Thêm `isAdmin` constant
- [x] Filter subjects theo role
- [x] Cập nhật UI title và description
- [x] Sửa duplicate check message
- [x] Update payload add/edit (không gửi schoolId nếu admin)
- [x] Update import Excel (không gửi schoolId nếu admin)
- [x] Fix lint warning (comment chartData)
- [x] Test với role ADMIN
- [x] Test với role TEACHER
- [x] Verify no errors
- [x] Create documentation

---

## ✅ Status

**COMPLETED** - Quản lý môn học đã hỗ trợ đầy đủ cho Admin (Giáo vụ)

**Changed files:**
- `src/pages/teacher/ManageSubjects.jsx` ✅

**Impact:**
- ✅ Admin xem được tất cả môn học
- ✅ Admin tạo môn học global (không gắn trường)
- ✅ Teacher vẫn hoạt động như cũ (filter theo trường)
- ✅ UI phân biệt rõ ràng giữa Admin và Teacher

---

**Date:** October 30, 2025  
**Feature:** Admin Subject Management  
**Status:** ✅ COMPLETE
