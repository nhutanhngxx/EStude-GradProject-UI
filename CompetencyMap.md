# Tài liệu Bản đồ Năng lực (Competency Map)

## 📋 Mục lục
1. [Tổng quan](#tổng-quan)
2. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
3. [Tính năng chính](#tính-năng-chính)
4. [Chi tiết kỹ thuật](#chi-tiết-kỹ-thuật)
5. [Cấu trúc dữ liệu](#cấu-trúc-dữ-liệu)
6. [Thuật toán tính toán](#thuật-toán-tính-toán)
7. [Giao diện người dùng](#giao-diện-người-dùng)

---

## 🎯 Tổng quan

### Mô tả
**Bản đồ Năng lực** là một hệ thống phân tích và theo dõi tiến độ học tập cá nhân hóa, giúp học sinh:
- Theo dõi năng lực học tập theo từng môn học và chủ đề
- Xem lộ trình phát triển năng lực từ Cơ bản → Vững vàng
- Phân tích xu hướng cải thiện theo thời gian
- Xác định điểm mạnh và điểm cần cải thiện

### Mục đích
- Cá nhân hóa trải nghiệm học tập
- Tăng động lực học tập thông qua visualization tiến trình
- Cung cấp insights để cải thiện hiệu quả học tập
- Giúp giáo viên và học sinh theo dõi tiến độ một cách trực quan

---

## 🏗️ Kiến trúc hệ thống

### Các màn hình chính

```
CompetencyMapScreen (Danh sách môn học)
    ↓
SubjectCompetencyDetailScreen (Chi tiết môn học)
    ├── Tab: Lộ trình (CompetencyRoadmap Component)
    ├── Tab: Chi tiết chủ đề (Topics với Line Chart)
    └── Tab: Lịch sử đánh giá (History)
```

### Thành phần hệ thống

#### 1. **CompetencyMapScreen.js**
- **Vai trò**: Màn hình tổng quan hiển thị danh sách các môn học
- **Chức năng**:
  - Lấy dữ liệu improvement từ API
  - Xử lý và nhóm dữ liệu theo môn học
  - Tính toán thống kê tổng quan
  - Hiển thị overview card và danh sách môn học

#### 2. **SubjectCompetencyDetailScreen.js**
- **Vai trò**: Màn hình chi tiết môn học với 3 tabs
- **Chức năng**:
  - Hiển thị tổng quan năng lực của môn học
  - Tab Lộ trình: Visual roadmap 4 cấp độ
  - Tab Chủ đề: Chi tiết từng topic với line chart
  - Tab Lịch sử: Lịch sử các lần đánh giá

#### 3. **CompetencyRoadmap.js**
- **Vai trò**: Component hiển thị lộ trình 4 cấp độ năng lực
- **Chức năng**:
  - Visual roadmap với 4 nodes
  - Hiển thị vị trí hiện tại
  - Tính toán tiến trình tổng thể
  - Đề xuất mục tiêu tiếp theo

---

## ⚡ Tính năng chính

### 1. Tổng quan Năng lực (Competency Overview)

**Màn hình**: `CompetencyMapScreen`

#### Thống kê tổng quan
```javascript
- Số môn học
- Tổng số chủ đề
- Số chủ đề đã vững (≥80%)
- Số chủ đề cần luyện (<50%)
```

#### Dữ liệu hiển thị cho từng môn học
```javascript
{
  subject: "Toán học",
  avgAccuracy: 75.5,                    // Tỷ lệ đạt trung bình
  overallImprovement: 12.3,             // % cải thiện so với lần trước
  totalTopics: 15,                      // Tổng số chủ đề
  mastered: 8,                          // Số chủ đề vững (≥80%)
  progressing: 5,                       // Số chủ đề tiến bộ (50-79%)
  needsWork: 2,                         // Số chủ đề cần luyện (<50%)
  lastEvaluated: "2025-12-07T10:30:00Z" // Thời gian đánh giá gần nhất
}
```

#### Phân cấp năng lực (Competency Levels)
```javascript
const getCompetencyLevel = (accuracy) => {
  if (accuracy >= 80) return "Vững vàng"    // Màu: #4CAF50 (Xanh lá)
  if (accuracy >= 60) return "Nâng cao"     // Màu: #2196F3 (Xanh dương)
  if (accuracy >= 40) return "Trung bình"   // Màu: #FF9800 (Cam)
  return "Cơ bản"                           // Màu: #F44336 (Đỏ)
}
```

#### Biểu tượng cải thiện (Improvement Icons)
```javascript
const getImprovementIcon = (improvement) => {
  if (improvement > 20)  return "trending-up"   // Màu: #4CAF50
  if (improvement > 0)   return "arrow-up"      // Màu: #8BC34A
  if (improvement === 0) return "remove"        // Màu: #9E9E9E
  if (improvement > -20) return "arrow-down"    // Màu: #FF9800
  return "trending-down"                        // Màu: #F44336
}
```

---

### 2. Lộ trình Năng lực (Competency Roadmap)

**Component**: `CompetencyRoadmap.js`

#### 4 Cấp độ Lộ trình

| Cấp độ | Khoảng điểm | Icon | Màu sắc | Mô tả |
|--------|-------------|------|---------|-------|
| **Cơ bản** | 0% - 40% | book-outline | #F44336 (Đỏ) | Bắt đầu làm quen |
| **Trung bình** | 40% - 60% | school | #FF9800 (Cam) | Đang phát triển |
| **Nâng cao** | 60% - 80% | trending-up | #2196F3 (Xanh dương) | Tiến bộ tốt |
| **Vững vàng** | 80% - 100% | trophy | #4CAF50 (Xanh lá) | Thành thạo |

#### Thông tin hiển thị
```javascript
- Vị trí hiện tại (Current position)
  → Hiển thị accuracy hiện tại
  → Highlight node đang ở

- Tiến trình tổng thể (Overall Progress)
  → Progress bar: masteredTopics / totalTopics
  → Ví dụ: "8/15 chủ đề đã vững (53%)"

- Mục tiêu tiếp theo (Next Goal)
  → Số % cần cải thiện để lên cấp
  → Ví dụ: "Còn 4.5% nữa để lên cấp Vững vàng"
```

#### Visual Design
```
[○] Cơ bản (0-40%)
 |
[○] Trung bình (40-60%)
 |
[●] Nâng cao (60-80%) ← Vị trí hiện tại: 75.5%
 |
[○] Vững vàng (80-100%)

Progress: ██████████░░░░░░░░░░ 53%
Mục tiêu: Còn 4.5% nữa để lên Vững vàng
```

---

### 3. Chi tiết Chủ đề (Topic Details)

**Màn hình**: `SubjectCompetencyDetailScreen` → Tab "Chủ đề"

#### Thông tin từng chủ đề

```javascript
{
  topic: "Phương trình bậc 2",
  avgAccuracy: 82.5,              // Trung bình độ chính xác
  avgImprovement: 15.3,           // Trung bình cải thiện
  accuracyHistory: [75, 78, 80, 85, 82], // Lịch sử accuracy
  improvementHistory: [10, 5, 12, 18, 20] // Lịch sử improvement
}
```

#### Phân loại trạng thái cải thiện

```javascript
const getImprovementStatus = (avgImprovement) => {
  if (avgImprovement >= 20)  return "Tiến bộ rõ rệt"      // #4CAF50
  if (avgImprovement >= 5)   return "Có cải thiện"       // #2196F3
  if (avgImprovement >= -4)  return "Ổn định"            // #9E9E9E
  if (avgImprovement >= -19) return "Giảm nhẹ"           // #FF9800
  return "Cần cải thiện gấp"                             // #F44336
}
```

#### Biểu đồ xu hướng (Trend Chart)

**Loại**: Line Chart với điểm dữ liệu kèm giá trị

**Đặc điểm**:
- Hiển thị tối đa 6 điểm gần nhất
- Trục Y: -100% đến +100%
- Grid lines: 3 mức (100%, 0%, -100%)
- Đường 0% được highlight đậm hơn
- Màu điểm và đường nối:
  - Xanh lá (#4CAF50): improvement > 5%
  - Cam (#FF9800): improvement từ -5% đến 5%
  - Đỏ (#F44336): improvement < -5%

**Thành phần**:
```javascript
- Y-axis labels: 100%, 0%, -100%
- Data points: Điểm tròn với border màu status
- Point values: Hiển thị giá trị improvement
- Connecting lines: Đường nối diagonal giữa các điểm
- X-axis labels: T0, T1, T2, ... (Timeline)
- Legend: Tốt (>5%), Ổn định, Giảm (<-5%)
```

**Calculation Logic**:
```javascript
// Normalize improvement value (-100 to +100) to chart position (0% to 100%)
const normalizedValue = ((improvement + 100) / 200) * 100;
const bottomPosition = Math.max(0, Math.min(100, normalizedValue));

// Diagonal line calculation
const deltaYPercent = nextBottom - bottomPosition;
const deltaYPx = -(deltaYPercent / 100) * chartHeightPx;
const lineLength = Math.sqrt(segmentWidthPx ** 2 + deltaYPx ** 2);
const lineAngle = Math.atan2(deltaYPx, segmentWidthPx) * (180 / Math.PI);
```

---

### 4. Lịch sử Đánh giá (Evaluation History)

**Màn hình**: `SubjectCompetencyDetailScreen` → Tab "Lịch sử"

#### Thông tin mỗi đánh giá

```javascript
{
  generatedAt: "2025-12-07T10:30:00Z",
  detailedAnalysis: {
    subject: "Toán học",
    summary: "Có tiến bộ rõ rệt trong việc giải phương trình...",
    overall_improvement: {
      improvement: 12.5,
      new_average: 78.3,
      previous_average: 65.8
    },
    topics: [
      {
        topic: "Phương trình bậc 2",
        new_accuracy: 85,
        improvement: 15,
        status: "Tiến bộ tốt"
      },
      // ... more topics
    ]
  }
}
```

#### Hiển thị
- **Tiêu đề**: Ngày giờ đánh giá (định dạng vi-VN)
- **Badge**: Improvement percentage (màu xanh nếu dương, đỏ nếu âm)
- **Summary**: Tóm tắt đánh giá (tối đa 3 dòng)
- **Topics**: Danh sách chủ đề với accuracy và improvement

---

## 🔧 Chi tiết kỹ thuật

### Luồng dữ liệu (Data Flow)

```
1. User mở CompetencyMapScreen
    ↓
2. fetchImprovements() gọi API
    ↓
3. aiService.getAllUserImprovements(token)
    ↓ Response
4. processSubjectStats(data)
    ↓
5. Nhóm theo môn học (subject)
    ↓
6. Tính trung bình cho mỗi topic (avgAccuracy, avgImprovement)
    ↓
7. Tính thống kê môn học (mastered, progressing, needsWork)
    ↓
8. Sắp xếp theo avgAccuracy giảm dần
    ↓
9. Hiển thị danh sách môn học
```

### API Endpoint

```javascript
// File: aiService.js
endpoint: "/api/ai/me/improvement"
method: GET
headers: { Authorization: `Bearer ${token}` }

Response format:
[
  {
    _id: "...",
    userId: "...",
    generatedAt: "ISO Date String",
    detailedAnalysis: {
      subject: "String",
      summary: "String",
      overall_improvement: {
        improvement: Number,
        new_average: Number,
        previous_average: Number
      },
      topics: [
        {
          topic: "String",
          new_accuracy: Number,
          old_accuracy: Number,
          improvement: Number,
          status: "String"
        }
      ]
    }
  }
]
```

---

## 📊 Cấu trúc dữ liệu

### SubjectStats Object

```typescript
interface SubjectStats {
  subject: string;              // Tên môn học
  avgAccuracy: number;          // Trung bình accuracy của tất cả topics
  overallImprovement: number;   // Trung bình improvement của tất cả topics
  totalTopics: number;          // Tổng số topics
  mastered: number;             // Số topics có avgAccuracy >= 80
  progressing: number;          // Số topics có avgAccuracy 50-79
  needsWork: number;            // Số topics có avgAccuracy < 50
  topics: Topic[];              // Danh sách topics
  evaluations: Evaluation[];    // Danh sách evaluations
  lastEvaluated: string;        // ISO date string của evaluation mới nhất
}
```

### Topic Object

```typescript
interface Topic {
  topic: string;                    // Tên chủ đề
  avgAccuracy: number;              // Trung bình accuracy
  avgImprovement: number;           // Trung bình improvement
  accuracyHistory: number[];        // Lịch sử accuracy từng lần
  improvementHistory: number[];     // Lịch sử improvement từng lần
  count: number;                    // Số lần xuất hiện
}
```

### Evaluation Object

```typescript
interface Evaluation {
  _id: string;
  userId: string;
  generatedAt: string;
  detailedAnalysis: {
    subject: string;
    summary: string;
    overall_improvement: {
      improvement: number;
      new_average: number;
      previous_average: number;
    };
    topics: TopicEvaluation[];
  };
}

interface TopicEvaluation {
  topic: string;
  new_accuracy: number;
  old_accuracy: number;
  improvement: number;
  status: string;
}
```

---

## 🧮 Thuật toán tính toán

### 1. Nhóm dữ liệu theo môn học

```javascript
// File: CompetencyMapScreen.js - processSubjectStats()

const subjectMap = {};

data.forEach((item) => {
  const subject = item.detailedAnalysis?.subject || "Không rõ";
  
  if (!subjectMap[subject]) {
    subjectMap[subject] = {
      subject,
      evaluations: [],
      topics: {},
      totalEvaluations: 0
    };
  }
  
  subjectMap[subject].evaluations.push(item);
  subjectMap[subject].totalEvaluations++;
});
```

### 2. Tổng hợp topics và tính trung bình

```javascript
// Normalize topic name để nhóm topics giống nhau
const normalizedTopicName = topicName.trim().toLowerCase();

if (!subjectMap[subject].topics[normalizedTopicName]) {
  subjectMap[subject].topics[normalizedTopicName] = {
    topic: topicName,           // Giữ tên gốc
    accuracyHistory: [],
    improvementHistory: [],
    count: 0
  };
}

// Lưu tất cả giá trị để tính trung bình
subjectMap[subject].topics[normalizedTopicName].accuracyHistory.push(
  topic.new_accuracy
);
subjectMap[subject].topics[normalizedTopicName].improvementHistory.push(
  topic.improvement
);
subjectMap[subject].topics[normalizedTopicName].count++;
```

### 3. Tính trung bình cho mỗi topic

```javascript
const topicsList = Object.values(subjectData.topics).map((topic) => {
  // Tính trung bình accuracy
  const avgAccuracy = 
    topic.accuracyHistory.reduce((sum, val) => sum + val, 0) / topic.count;
  
  // Tính trung bình improvement
  const avgImprovement = 
    topic.improvementHistory.reduce((sum, val) => sum + val, 0) / topic.count;
  
  return {
    topic: topic.topic,
    avgAccuracy: Math.round(avgAccuracy * 10) / 10,  // Làm tròn 1 chữ số
    avgImprovement: Math.round(avgImprovement * 10) / 10,
    accuracyHistory: topic.accuracyHistory,
    improvementHistory: topic.improvementHistory
  };
});
```

### 4. Tính thống kê môn học

```javascript
// Tính tỷ lệ đạt trung bình của môn
const totalAvgAccuracy = topicsList.reduce((sum, t) => sum + t.avgAccuracy, 0);
const avgAccuracy = topicsList.length > 0 
  ? totalAvgAccuracy / topicsList.length 
  : 0;

// Tính overall improvement của môn
const totalAvgImprovement = topicsList.reduce((sum, t) => sum + t.avgImprovement, 0);
const overallImprovement = topicsList.length > 0 
  ? totalAvgImprovement / topicsList.length 
  : 0;

// Đếm số topics theo mức độ
const mastered = topicsList.filter(t => t.avgAccuracy >= 80).length;
const progressing = topicsList.filter(t => t.avgAccuracy >= 50 && t.avgAccuracy < 80).length;
const needsWork = topicsList.filter(t => t.avgAccuracy < 50).length;
```

### 5. Tìm evaluation mới nhất

```javascript
const latestEval = subjectData.evaluations.reduce((latest, current) => {
  if (!latest) return current;
  const latestDate = new Date(latest.generatedAt);
  const currentDate = new Date(current.generatedAt);
  return currentDate > latestDate ? current : latest;
}, null);
```

### 6. Sắp xếp kết quả

```javascript
// Sắp xếp môn học theo avgAccuracy giảm dần
stats.sort((a, b) => b.avgAccuracy - a.avgAccuracy);

// Sắp xếp topics theo avgAccuracy giảm dần
const sortedTopics = [...subjectData.topics].sort((a, b) => {
  return (b.avgAccuracy || 0) - (a.avgAccuracy || 0);
});

// Sắp xếp evaluations theo thời gian mới nhất
const sortedEvaluations = [...subjectData.evaluations].sort(
  (a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)
);
```

---

## 🎨 Giao diện người dùng

### Theme Colors

```javascript
const themeColors = {
  primary: "#00cc66",      // Xanh lá chính
  success: "#4CAF50",      // Xanh lá (Vững vàng)
  info: "#2196F3",         // Xanh dương (Nâng cao)
  warning: "#FF9800",      // Cam (Trung bình / Cần luyện)
  danger: "#F44336",       // Đỏ (Cơ bản / Giảm)
  text: "#333",            // Text chính
  textLight: "#666",       // Text phụ
  textMuted: "#999",       // Text mờ
  background: "#f5f5f5",   // Background chính
  white: "#fff",           // Background card
  border: "#eee"           // Border
};
```

### Typography

```javascript
const typography = {
  // Headers
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  overviewTitle: { fontSize: 18, fontWeight: "bold" },
  sectionTitle: { fontSize: 16, fontWeight: "bold" },
  
  // Values
  bigAccuracyValue: { fontSize: 48, fontWeight: "bold" },
  statValue: { fontSize: 24, fontWeight: "bold" },
  accuracyBig: { fontSize: 28, fontWeight: "bold" },
  
  // Body text
  subjectName: { fontSize: 16, fontWeight: "bold" },
  topicName: { fontSize: 15, fontWeight: "bold" },
  bodyText: { fontSize: 14 },
  smallText: { fontSize: 12 },
  tinyText: { fontSize: 11 }
};
```

### Spacing

```javascript
const spacing = {
  padding: 16,
  paddingCard: 16,
  margin: 16,
  marginCard: 12,
  borderRadius: 12,
  borderRadiusBadge: 12,
  iconSize: 24,
  iconSizeLarge: 28
};
```

### Elevation & Shadow

```javascript
const shadow = {
  elevation: 2,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4
};
```

### Progress Bar

```javascript
const progressBar = {
  height: 8,           // Chiều cao progress bar
  heightLarge: 10,     // Chiều cao progress bar lớn
  borderRadius: 4,     // Bo góc
  backgroundColor: "#e0f2e9",  // Background (màu xanh nhạt)
  fillColor: "dynamic" // Màu fill theo competency level
};
```

---

## 🔄 State Management

### CompetencyMapScreen States

```javascript
const [loading, setLoading] = useState(true);           // Loading state
const [refreshing, setRefreshing] = useState(false);    // Pull-to-refresh state
const [improvements, setImprovements] = useState([]);   // Raw data từ API
const [subjectStats, setSubjectStats] = useState([]);   // Processed data
```

### SubjectCompetencyDetailScreen States

```javascript
const [selectedTab, setSelectedTab] = useState("roadmap"); 
// Tabs: "roadmap" | "topics" | "history"
```

---

## 📱 Navigation

### Navigation Flow

```javascript
// Từ màn hình danh sách → Chi tiết môn học
navigation.navigate("SubjectCompetencyDetail", {
  subjectData: {
    subject: "Toán học",
    avgAccuracy: 75.5,
    // ... other fields
  }
});

// Back navigation
navigation.goBack();
```

---

## 🔍 User Interactions

### Pull-to-Refresh

```javascript
<RefreshControl
  refreshing={refreshing}
  onRefresh={onRefresh}
  colors={["#00cc66"]}
  tintColor="#00cc66"
/>
```

### Touch Feedback

```javascript
<TouchableOpacity
  activeOpacity={0.8}
  onPress={() => navigation.navigate(...)}
>
  {/* Content */}
</TouchableOpacity>
```

### Tab Switching

```javascript
<TouchableOpacity
  style={[styles.tab, selectedTab === "roadmap" && styles.tabActive]}
  onPress={() => setSelectedTab("roadmap")}
>
  <Text style={[styles.tabText, selectedTab === "roadmap" && styles.tabTextActive]}>
    Lộ trình
  </Text>
</TouchableOpacity>
```

---

## 🎯 Business Logic

### Phân loại năng lực

**Cơ bản (0-40%)**:
- Icon: book-outline
- Màu: Đỏ (#F44336)
- Trạng thái: Bắt đầu làm quen
- Hành động đề xuất: Ôn lại kiến thức cơ bản, làm bài tập dễ

**Trung bình (40-60%)**:
- Icon: school
- Màu: Cam (#FF9800)
- Trạng thái: Đang phát triển
- Hành động đề xuất: Luyện tập thường xuyên, tăng độ khó

**Nâng cao (60-80%)**:
- Icon: trending-up
- Màu: Xanh dương (#2196F3)
- Trạng thái: Tiến bộ tốt
- Hành động đề xuất: Thử thách bản thân với bài khó hơn

**Vững vàng (80-100%)**:
- Icon: trophy
- Màu: Xanh lá (#4CAF50)
- Trạng thái: Thành thạo
- Hành động đề xuất: Duy trì và nâng cao thêm

### Phân tích cải thiện

**Tiến bộ rõ rệt (≥20%)**:
- Màu: Xanh lá (#4CAF50)
- Đánh giá: Xuất sắc, tiếp tục phát huy

**Có cải thiện (5% - 19%)**:
- Màu: Xanh dương (#2196F3)
- Đánh giá: Tốt, duy trì đà tiến bộ

**Ổn định (-4% - 4%)**:
- Màu: Xám (#9E9E9E)
- Đánh giá: Ổn định, cần thêm nỗ lực để cải thiện

**Giảm nhẹ (-19% - -5%)**:
- Màu: Cam (#FF9800)
- Đánh giá: Cảnh báo, cần chú ý ôn luyện

**Cần cải thiện gấp (<-19%)**:
- Màu: Đỏ (#F44336)
- Đánh giá: Nghiêm trọng, cần hành động ngay

---

## 🚀 Performance Optimization

### Memoization
```javascript
// Sử dụng useMemo cho dữ liệu đã xử lý
const sortedTopics = useMemo(() => {
  return [...subjectData.topics].sort((a, b) => 
    (b.avgAccuracy || 0) - (a.avgAccuracy || 0)
  );
}, [subjectData.topics]);
```

### Lazy Loading
- Load dữ liệu khi mở màn hình
- Pull-to-refresh để cập nhật
- Cache data trong state

### Rendering Optimization
- FlatList cho danh sách dài (nếu cần)
- Tránh re-render không cần thiết
- Sử dụng key prop hợp lý

---

## 🧪 Test Cases

### CompetencyMapScreen

**TC1**: Hiển thị loading khi fetch data
- Input: User mở màn hình
- Expected: Hiển thị ActivityIndicator

**TC2**: Hiển thị empty state khi không có data
- Input: API trả về []
- Expected: Hiển thị message "Chưa có dữ liệu đánh giá năng lực"

**TC3**: Hiển thị danh sách môn học
- Input: API trả về data hợp lệ
- Expected: Hiển thị overview + danh sách môn học

**TC4**: Pull-to-refresh
- Input: User kéo xuống để refresh
- Expected: Gọi API và cập nhật data

**TC5**: Navigate to detail
- Input: User tap vào môn học
- Expected: Navigate đến SubjectCompetencyDetailScreen

### SubjectCompetencyDetailScreen

**TC6**: Hiển thị tổng quan môn học
- Input: Receive subjectData từ params
- Expected: Hiển thị avgAccuracy, mastered, progressing, needsWork

**TC7**: Switch tabs
- Input: User tap vào tab khác
- Expected: Hiển thị nội dung tab tương ứng

**TC8**: Tab Lộ trình
- Input: selectedTab === "roadmap"
- Expected: Hiển thị CompetencyRoadmap component

**TC9**: Tab Chủ đề với line chart
- Input: selectedTab === "topics"
- Expected: Hiển thị danh sách topics với chart

**TC10**: Tab Lịch sử
- Input: selectedTab === "history"
- Expected: Hiển thị danh sách evaluations

### CompetencyRoadmap

**TC11**: Hiển thị current level
- Input: currentAccuracy = 75
- Expected: Highlight node "Nâng cao"

**TC12**: Hiển thị next goal
- Input: currentAccuracy = 75
- Expected: "Còn 5% nữa để lên cấp Vững vàng"

**TC13**: Đã đạt max level
- Input: currentAccuracy = 95
- Expected: Không hiển thị next goal

---

## 📝 Notes & Best Practices

### Data Processing
- **Normalize topic names**: Lowercase và trim để nhóm topics giống nhau
- **Round numbers**: Làm tròn 1 chữ số thập phân cho accuracy và improvement
- **Handle edge cases**: Check null/undefined trước khi tính toán

### UI/UX
- **Consistent colors**: Sử dụng bảng màu thống nhất
- **Visual hierarchy**: Sử dụng font size và weight hợp lý
- **Touch feedback**: activeOpacity 0.8 cho interactive elements
- **Loading states**: Hiển thị loading khi fetch data
- **Empty states**: Hiển thị message khi không có data

### Code Quality
- **Component reusability**: Tách component nhỏ (CompetencyRoadmap)
- **Separation of concerns**: Logic tính toán tách riêng
- **Type safety**: Validate data trước khi sử dụng
- **Error handling**: Try-catch cho API calls

### Performance
- **Avoid unnecessary re-renders**: Sử dụng memoization
- **Optimize list rendering**: Key prop, FlatList
- **Cache data**: Lưu data trong state, không fetch lại mỗi lần render

---

## 🔮 Future Enhancements

### 1. Export Reports
- Export bản đồ năng lực dưới dạng PDF
- Share progress với phụ huynh/giáo viên

### 2. Goal Setting
- Cho phép user đặt mục tiêu cá nhân
- Notification khi đạt milestone

### 3. Recommendations
- AI đề xuất bài tập phù hợp dựa trên năng lực
- Lộ trình học tập cá nhân hóa

### 4. Comparison
- So sánh tiến độ với bạn bè
- Benchmark với trung bình lớp

### 5. Gamification
- Badges khi đạt achievements
- Leaderboard theo môn học

### 6. Advanced Analytics
- Predict future performance
- Identify learning patterns
- Time-series analysis

---

## 📞 Contact & Support

**Development Team**: EStude Development Team  
**Last Updated**: December 7, 2025  
**Version**: 1.0.0

---

*Tài liệu này được tạo ra để hỗ trợ việc hiểu và phát triển tính năng Bản đồ Năng lực trong hệ thống EStude.*
