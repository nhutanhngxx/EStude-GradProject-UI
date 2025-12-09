Lấy kết quả đánh giá tiến bộ mới nhất

http://localhost:8080/api/ai/me/improvement/latest

Có Beer Token;

Json output:
```
{
    "resultId": 3,
    "predictedAverage": null,
    "predictedPerformance": null,
    "actualPerformance": null,
    "comment": "Improvement evaluation completed successfully",
    "suggestedActions": null,
    "detailedAnalysis": {
        "subject": "Toán",
        "summary": "Chúc mừng em đã có sự tiến bộ vượt bậc trong môn Toán! Em đã nắm vững kiến thức về tập hợp, các phép toán trên tập hợp và mệnh đề. Với nỗ lực và sự tập trung cao độ, em hãy tiếp tục phát huy để đạt được những thành tích cao hơn nữa nhé!",
        "topics": [
            {
                "topic": "Tập hợp và các phép toán trên tập hợp.",
                "improvement": 60.0,
                "status": "Tiến bộ vượt bậc",
                "previous_accuracy": 0.0,
                "new_accuracy": 60.0,
                "improvement_percentage": "+60.0%"
            },
            {
                "topic": "Mệnh đề",
                "improvement": 20.0,
                "status": "Tiến bộ rõ rệt",
                "previous_accuracy": 0.0,
                "new_accuracy": 20.0,
                "improvement_percentage": "+20.0%"
            }
        ],
        "submission_id": "1",
        "result_id": null,
        "previous_results_id": null,
        "student_id": 53,
        "evaluation_time": [
            2025,
            12,
            2,
            22,
            5,
            0,
            897557000
        ],
        "next_action": "Nên bắt đầu bằng việc ôn tập kỹ lý thuyết về định nghĩa tập hợp, các phép toán (hợp, giao, hiệu, bù) và các dạng bài tập cơ bản liên quan. Sau đó, luyện tập giải nhiều bài tập từ dễ đến khó, chú trọng các bài tập vận dụng để hiểu rõ bản chất và cách áp dụng kiến thức vào giải quyết vấn đề. Bước tiếp theo là tìm hiểu về mệnh đề, mệnh đề chứa biến và cách xét tính đúng sai của mệnh đề.",
        "overall_improvement": {
            "improvement": 40.0,
            "direction": "Tiến bộ",
            "previous_average": 0.0,
            "new_average": 40.0,
            "improvement_percentage": "+40.0%"
        }
    },
    "statistics": null,
    "generatedAt": "2025-12-02T22:05:00.90233",
    "requestId": 3
}
```
