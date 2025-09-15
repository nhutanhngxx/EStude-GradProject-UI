# **Xây dựng hệ thống quản lý học tập EStude tích hợp AI**

_(Hình ảnh minh họa banner dự án)_

## <b>Giới thiệu</b>

Dự án **EStude** là hệ thống quản lý học tập (Learning Management System - LMS) tích hợp trí tuệ nhân tạo (AI), được phát triển như một phần của đồ án tốt nghiệp. Hệ thống nhằm hỗ trợ giáo viên, học viên và quản trị viên trong việc quản lý khóa học, theo dõi tiến độ học tập, và sử dụng AI để gợi ý nội dung học tập cá nhân hóa, dự đoán kết quả học tập, cũng như hỗ trợ chatbots thông minh.

Phần EStude-Web-UI tập trung vào giao diện người dùng web, được thiết kế hiện đại, thân thiện và responsive, sử dụng các công cụ frontend tiên tiến để đảm bảo trải nghiệm người dùng mượt mà.

Phần EStude-App-UI tập trung vào giao diện người dùng trên thiết bị di động, cũng được thiết kế hiện đại, thân thiện và responsive, sử dụng các công cụ frontend tiên tiến để đảm bảo trải nghiệm người dùng mượt mà.

## <b>Thành viên</b>

Dự án được phát triển bởi nhóm 2 thành viên:

- **Nguyễn Nhựt Anh** (Quản lý dự án, Thiết kế UI/UX, Phát triển frontend chính).
- **Đinh Nguyên Chung** (Phát triển backend integration).

Repository này chứa mã nguồn cho phần UI web. Các repository liên quan khác (backend, AI module) có thể được liên kết riêng.

## **Tính năng chính**

**1. Quản lý khóa học:** Tạo, chỉnh sửa, xóa khóa học; thêm bài giảng, bài tập và tài liệu.

**2. Quản lý người dùng:** Đăng ký, đăng nhập, phân quyền (học viên, giáo viên, admin).

**3. Theo dõi tiến độ:** Bảng dashboard hiển thị tiến độ học tập, điểm số và thống kê.

**4. Tích hợp AI:**

- Gợi ý khóa học cá nhân hóa dựa trên hành vi người dùng.
- Chatbot hỗ trợ hỏi đáp tự động.
- Phân tích dữ liệu học tập để dự đoán rủi ro bỏ học.

**5. Giao diện responsive:** Hỗ trợ đa thiết bị (desktop, tablet, mobile).

**6. Bảo mật:** Sử dụng JWT cho authentication, mã hóa dữ liệu nhạy cảm.

_(Hình ảnh minh họa tính năng AI - Thiết kế hiện đại với biểu đồ gợi ý khóa học, chatbot interface, và biểu tượng neural network chuyên nghiệp.)_

## **Công nghệ sử dụng**

- **Frontend:** React.js, Context cho state management, Material-UI hoặc Ant Design cho components hiện đại.
- **CSS Framework:** Tailwind CSS để thiết kế responsive và chuyên nghiệp.
- **API Integration:** Axios cho kết nối với backend.
- **AI Integration:** Tích hợp API từ models như TensorFlow.js hoặc OpenAI cho gợi ý và chatbot.
- **Công cụ khác:** Vite cho build nhanh.

## **Hướng dẫn cài đặt**

**1. Yêu cầu hệ thống:**

- Node.js phiên bản 20+.
- NPM hoặc Yarn.
- Trình duyệt hiện đại (Edge, Chrome, Firefox).

**2. Clone repository:**

```
git clone https://github.com/nhutanhngxx/EStude-GradProject-UI.git
cd EStude-GradProject-UI
```

**3. Cài đặt dependencies:**

`npm install`
hoặc
`yarn install`

**4. Chạy ứng dụng:**

`npm run start`

Ứng dụng sẽ chạy tại `http://localhost:5173`.

**5. Build cho production:**

`npm run build`

_(Hình ảnh minh họa quy trình cài đặt - Screenshot terminal với lệnh git clone, npm install, thiết kế infographic hiện đại với icon bước đi.)_

## **Hướng dẫn sử dụng**

- **Đăng nhập:** Truy cập trang login, chọn role đăng nhập và sử dụng tài khoản demo (user: _none_, password: _none_)
- **Dashboard:** Sau đăng nhập, xem tiến độ học tập và gợi ý AI.
- **Tạo khóa học:** Chỉ dành cho giáo viên/admin, truy cập menu "Courses" > "Create New".
- **Chatbot AI:** Nhấn icon chat ở góc phải để hỏi đáp.

_(Hình ảnh minh họa dashboard - Giao diện hiện đại với sidebar, charts tiến độ, cards khóa học, màu sắc xanh dương chuyên nghiệp.)_

_(Hình ảnh minh họa trang đăng nhập - Thiết kế minimalistic, form trung tâm, background gradient với biểu tượng học tập.)_

_(Hình ảnh minh họa quản lý khóa học - Table listing courses, buttons CRUD, modal tạo mới chi tiết.)_

## **Đóng góp và Issue**

Nếu bạn tìm thấy bug hoặc muốn đóng góp, hãy tạo Issue hoặc Pull Request trên GitHub. Chúng tôi đánh giá cao sự đóng góp từ cộng đồng!

## **License \[Đang cập nhật]**

Cảm ơn bạn đã quan tâm đến dự án **EStude**! Nếu có câu hỏi, liên hệ qua email: `nhutanhngxx@gmail.com`.
