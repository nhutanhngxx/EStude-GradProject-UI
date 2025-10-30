// Script to create Excel template for question import
// Run: node create-excel-template.mjs

import XLSX from "xlsx";

// Sample questions data
const questions = [
  {
    questionText: "Mệnh đề nào sau đây là mệnh đề đúng?",
    points: 1.0,
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "EASY",
    optionA: "2 + 3 = 5",
    optionB: "2 + 3 = 6",
    optionC: "2 + 3 = 7",
    optionD: "2 + 3 = 4",
    correctAnswer: "A",
    attachmentUrl: "",
  },
  {
    questionText: 'Phủ định của mệnh đề "Mọi số tự nhiên đều là số nguyên" là:',
    points: 1.0,
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "MEDIUM",
    optionA: "Tồn tại số tự nhiên không là số nguyên",
    optionB: "Không có số tự nhiên nào là số nguyên",
    optionC: "Mọi số tự nhiên đều không phải là số nguyên",
    optionD: "Có ít nhất một số nguyên không phải là số tự nhiên",
    correctAnswer: "A",
    attachmentUrl: "",
  },
  {
    questionText: "Trong các câu sau, câu nào là mệnh đề?",
    points: 1.0,
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "EASY",
    optionA: "Hôm nay trời đẹp quá!",
    optionB: "Bạn học lớp mấy?",
    optionC: "2 + 2 = 4",
    optionD: "Chúc bạn thành công",
    correctAnswer: "C",
    attachmentUrl: "",
  },
  {
    questionText: "Số nghiệm của phương trình x² - 4 = 0 là:",
    points: 1.5,
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "MEDIUM",
    optionA: "0",
    optionB: "1",
    optionC: "2",
    optionD: "3",
    correctAnswer: "C",
    attachmentUrl: "",
  },
  {
    questionText: "Giá trị của sin(30°) là:",
    points: 1.0,
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: "EASY",
    optionA: "0.5",
    optionB: "0.707",
    optionC: "0.866",
    optionD: "1",
    correctAnswer: "A",
    attachmentUrl: "",
  },
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(questions);

// Set column widths
ws["!cols"] = [
  { wch: 50 }, // questionText
  { wch: 8 }, // points
  { wch: 18 }, // questionType
  { wch: 15 }, // difficultyLevel
  { wch: 30 }, // optionA
  { wch: 30 }, // optionB
  { wch: 30 }, // optionC
  { wch: 30 }, // optionD
  { wch: 15 }, // correctAnswer
  { wch: 30 }, // attachmentUrl
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, "Questions");

// Write to file
XLSX.writeFile(wb, "./public/files/questions-template.xlsx");

console.log("✅ File questions-template.xlsx đã được tạo thành công!");
console.log("📍 Vị trí: ./public/files/questions-template.xlsx");
