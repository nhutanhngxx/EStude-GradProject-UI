import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, X, PlusCircle } from "lucide-react";
import attendanceService from "../../services/attendanceService";
import studentService from "../../services/studentService";
import classSubjectService from "../../services/classSubjectService";
import socketService from "../../services/socketService";
import { useToast } from "../../contexts/ToastContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import ConfirmModal from "../../components/common/ConfirmModal";

export default function AttendanceModal({
  classSubjectId,
  classId,
  teacherId,
  isOpen,
  onClose,
}) {
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { sessions, setSessions } = useAttendance();
  const [viewMode, setViewMode] = useState("SESSIONS");
  const [localSessions, setLocalSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionName, setSessionName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [useGPS, setUseGPS] = useState(false);
  const [gps, setGps] = useState({ lat: null, lng: null });
  const toastShown = useRef(false);

  useEffect(() => {
    if (!isOpen || !classSubjectId || !teacherId) return;

    const fetchSessions = async () => {
      try {
        const result =
          await attendanceService.getAttentanceSessionByClassSubjectForTeacher(
            classSubjectId,
            teacherId
          );
        if (result) setLocalSessions(result);
      } catch (err) {
        console.error("Lỗi tải sessions:", err);
        showToast("Không tải được danh sách buổi điểm danh", "error");
      }
    };

    fetchSessions();
  }, [isOpen, classSubjectId, teacherId, showToast]);

  useEffect(() => {
    setLocalSessions(
      sessions.filter((s) => s.classSubjectId === classSubjectId)
    );
  }, [sessions, classSubjectId]);

  useEffect(() => {
    if (!isOpen || !classSubjectId) return;

    socketService.subscribe(
      `/topic/class/${classSubjectId}/sessions`,
      (session) => {
        setLocalSessions((prev) => {
          if (prev.find((s) => s.sessionId === session.sessionId)) return prev;
          return [...prev, session];
        });
        setSessions((prev) => {
          if (prev.find((s) => s.sessionId === session.sessionId)) return prev;
          return [...prev, session];
        });
      }
    );

    return () => {
      socketService.unsubscribe(`/topic/class/${classSubjectId}/sessions`);
    };
  }, [isOpen, classSubjectId, setSessions]);

  const openSessionDetail = async (session) => {
    try {
      const allStudents = await studentService.getStudentsByClass(classId);
      const attendanceRecords =
        await attendanceService.getAttentanceStatusOfStudentsBySessionId(
          session.sessionId,
          teacherId
        );

      const merged = allStudents.map((st) => {
        const record = attendanceRecords.find((r) => r.studentId === st.userId);
        return {
          studentId: st.userId,
          studentCode: st.studentCode,
          fullName: st.fullName,
          status: record ? record.status : "NOT_YET",
        };
      });

      setSelectedSession({ ...session, students: merged });
      setViewMode("DETAIL");
    } catch (err) {
      console.error("Lỗi tải chi tiết session:", err);
      showToast("Không tải được chi tiết buổi điểm danh", "error");
    }
  };

  const handleMarkAttendance = async (studentId, newStatus) => {
    try {
      const res = await attendanceService.markAttendance(
        selectedSession.sessionId,
        studentId,
        teacherId,
        newStatus
      );
      if (res) {
        setSelectedSession((prev) => ({
          ...prev,
          students: prev.students.map((s) =>
            s.studentId === studentId ? { ...s, status: newStatus } : s
          ),
        }));

        if (!toastShown.current) {
          showToast("Điểm danh thành công!", "success");
          toastShown.current = true;
          setTimeout(() => (toastShown.current = false), 1000);
        }
      }
    } catch (err) {
      console.error("Điểm danh lỗi:", err);
      showToast("Điểm danh thất bại", "error");
    }
  };

  const handleCreateSession = async () => {
    if (!sessionName || !startTime || !endTime) {
      showToast("Vui lòng điền đầy đủ thông tin", "error");
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      showToast("Thời gian bắt đầu phải trước thời gian kết thúc", "error");
      return;
    }

    // Kiểm tra thời gian học kỳ
    try {
      const classSubjects = await classSubjectService.getAllClassSubjects();
      const classSubject = classSubjects.find(
        (cs) => cs.classSubjectId === classSubjectId
      );

      if (!classSubject) {
        showToast("Không tìm thấy thông tin lớp học", "error");
        return;
      }

      const currentDate = new Date();
      const termBeginDate = new Date(classSubject.term.beginDate);
      const termEndDate = new Date(classSubject.term.endDate);

      if (currentDate < termBeginDate || currentDate > termEndDate) {
        showToast("Không thể tạo vì lớp học đã hoàn thành!", "error");
        return;
      }

      // Tiếp tục tạo session nếu học kỳ hợp lệ
      await attendanceService.createAttendanceSession({
        teacherId,
        classSubjectId,
        sessionName,
        startTime,
        endTime,
        gpsLatitude: useGPS ? gps.lat : null,
        gpsLongitude: useGPS ? gps.lng : null,
      });

      const updated =
        await attendanceService.getAttentanceSessionByClassSubjectForTeacher(
          classSubjectId,
          teacherId
        );
      setLocalSessions(updated);
      setSessions((prev) => [
        ...prev.filter((s) => s.classSubjectId !== classSubjectId),
        ...updated,
      ]);

      // Reset form
      setSessionName("");
      setStartTime("");
      setEndTime("");
      setUseGPS(false);
      setGps({ lat: null, lng: null });
      setViewMode("SESSIONS");

      showToast("Tạo buổi điểm danh thành công!", "success");
    } catch (err) {
      console.error("Lỗi tạo session:", err);
      showToast("Tạo buổi điểm danh thất bại", "error");
    }
  };

  const handleToggleGPS = () => {
    if (!useGPS) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGps({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setUseGPS(true);
          },
          (err) => {
            console.error("Lỗi lấy vị trí GPS:", err);
            showToast("Không lấy được vị trí GPS", "error");
          }
        );
      } else {
        showToast("Trình duyệt không hỗ trợ GPS", "error");
      }
    } else {
      setUseGPS(false);
      setGps({ lat: null, lng: null });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-600 w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 max-w-6xl h-[80vh] rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <div className="flex items-center gap-2">
            <CalendarDays
              className="text-blue-600 dark:text-blue-400"
              size={20}
            />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {viewMode === "SESSIONS"
                ? "Danh sách buổi điểm danh"
                : viewMode === "CREATE"
                ? "Tạo buổi điểm danh"
                : `Chi tiết buổi – ${selectedSession?.sessionName}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* VIEW SESSIONS */}
          {viewMode === "SESSIONS" && (
            <>
              <div className="mb-4">
                <button
                  onClick={() => setViewMode("CREATE")}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <PlusCircle size={18} /> Tạo buổi điểm danh
                </button>
              </div>
              {localSessions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  Chưa có buổi điểm danh nào.
                </p>
              ) : (
                <ul className="space-y-2">
                  {localSessions.map((s) => (
                    <li
                      key={s.sessionId}
                      className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {s.sessionName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Bắt đầu:{" "}
                          {new Date(s.startTime).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false,
                          })}
                        </p>
                      </div>
                      <button
                        className="text-green-600 dark:text-green-200 hover:underline mt-2 sm:mt-0"
                        onClick={() => openSessionDetail(s)}
                      >
                        Xem chi tiết
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* CREATE SESSION */}
          {viewMode === "CREATE" && (
            <div className="space-y-4">
              <button
                onClick={() => setViewMode("SESSIONS")}
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <ArrowLeft size={18} /> Quay lại
              </button>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Tên buổi
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Bắt đầu
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Kết thúc
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useGPS}
                  onChange={handleToggleGPS}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-200 dark:focus:ring-blue-400"
                />
                <label className="text-gray-900 dark:text-gray-100">
                  Bật GPS
                </label>
              </div>
              {useGPS && gps.lat && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Vĩ độ: {gps.lat.toFixed(5)}, Kinh độ: {gps.lng.toFixed(5)}
                </p>
              )}
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={new Date(startTime) >= new Date(endTime)}
                className={`px-8 py-2 rounded-lg transition ${
                  new Date(startTime) >= new Date(endTime)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 dark:hover:bg-green-500 text-white"
                }`}
              >
                Lưu
              </button>
            </div>
          )}

          <ConfirmModal
            isOpen={confirmOpen}
            title="Xác nhận tạo buổi điểm danh"
            message="Bạn có chắc chắn muốn tạo buổi điểm danh này không?"
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              handleCreateSession();
              setConfirmOpen(false);
            }}
          />

          {/* SESSION DETAIL */}
          {viewMode === "DETAIL" && selectedSession && (
            <>
              <button
                onClick={() => setViewMode("SESSIONS")}
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-2"
              >
                <ArrowLeft size={18} /> Quay lại
              </button>
              <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600">
                <table
                  className="w-full text-sm text-left table-auto border-separate"
                  style={{ borderSpacing: 0 }}
                >
                  <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    <tr>
                      <th className="p-3 rounded-tl-lg">Mã SV</th>
                      <th className="p-3">Tên sinh viên</th>
                      <th className="p-3 rounded-tr-lg">Điểm danh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSession.students?.map((a) => (
                      <tr
                        key={a.studentId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="p-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                          {a.studentCode}
                        </td>
                        <td className="p-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                          {a.fullName}
                        </td>
                        <td className="p-3 border border-gray-300 dark:border-gray-600">
                          <div className="flex gap-2 flex-wrap">
                            {["NOT_YET", "PRESENT", "LATE", "ABSENT"].map(
                              (status) => {
                                const labels = {
                                  NOT_YET: "Chưa điểm danh",
                                  PRESENT: "Có mặt",
                                  LATE: "Trễ",
                                  ABSENT: "Vắng",
                                };
                                const colors = {
                                  NOT_YET:
                                    "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200",
                                  PRESENT:
                                    "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
                                  LATE: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
                                  ABSENT:
                                    "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
                                };
                                return (
                                  <label
                                    key={status}
                                    className={`px-2 py-1 rounded border cursor-pointer select-none ${
                                      a.status === status
                                        ? colors[status]
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`attendance-${a.studentId}`}
                                      value={status}
                                      checked={a.status === status}
                                      onChange={() =>
                                        handleMarkAttendance(
                                          a.studentId,
                                          status
                                        )
                                      }
                                      className="hidden"
                                    />
                                    {labels[status]}
                                  </label>
                                );
                              }
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
