import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  X,
  PlusCircle,
} from "lucide-react";
import attendanceService from "../../services/attendanceService";
import studentService from "../../services/studentService";

import { useToast } from "../../contexts/ToastContext";

export default function AttendanceModal({
  classSubjectId,
  classId,
  teacherId,
  isOpen,
  onClose,
}) {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState("SESSIONS");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  // form state
  const [sessionName, setSessionName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [useGPS, setUseGPS] = useState(false);
  const [gps, setGps] = useState({ lat: null, lng: null });

  useEffect(() => {
    const fetchSessions = async () => {
      if (!classSubjectId || !teacherId) return;
      const result =
        await attendanceService.getAttentanceSessionByClassSubjectForTeacher(
          classSubjectId,
          teacherId
        );
      if (result) setSessions(result);
    };
    fetchSessions();
  }, [classSubjectId, teacherId]);

  const handleToggleGPS = () => {
    setUseGPS(!useGPS);
    if (!useGPS) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.error("Không lấy được GPS:", err);
          showToast("Không thể lấy GPS, vui lòng bật định vị", "error");
          setUseGPS(false);
        }
      );
    } else {
      setGps({ lat: null, lng: null });
    }
  };

  const handleCreateSession = async () => {
    try {
      console.log(
        teacherId,
        classSubjectId,
        sessionName,
        startTime,
        endTime,
        useGPS ? gps.lat : null,
        useGPS ? gps.lng : null
      );

      const created = await attendanceService.createAttendanceSession({
        teacherId,
        classSubjectId,
        sessionName,
        startTime,
        endTime,
        gpsLatitude: useGPS ? gps.lat : null,
        gpsLongitude: useGPS ? gps.lng : null,
      });

      console.log("created:", created);

      if (created) {
        showToast("Tạo buổi điểm danh thành công!", "success");
        setSessions((prev) => [...prev, created]);
        setViewMode("SESSIONS");
        setSessionName("");
        setStartTime("");
        setEndTime("");
        setUseGPS(false);
        setGps({ lat: null, lng: null });
      }
    } catch (err) {
      console.error("Lỗi tạo buổi điểm danh:", err);
      showToast("Lỗi tạo buổi điểm danh, vui lòng thử lại", "error");
    }
  };

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
      showToast("Lỗi tải chi tiết buổi điểm danh, vui lòng thử lại", "error");
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
      if (res || res === null) {
        setSelectedSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            students: prev.students.map((s) =>
              s.studentId === studentId ? { ...s, status: newStatus } : s
            ),
          };
        });
        showToast("Điểm danh thành công cho học sinh!", "success");
      }
    } catch (err) {
      console.error("Điểm danh lỗi:", err);
      showToast("Điểm danh thất bại, vui lòng thử lại", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed -top-6 left-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-2/5 max-w-6xl h-3/5 p-6 relative shadow-lg overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* --- VIEW SESSIONS --- */}
        {viewMode === "SESSIONS" && (
          <>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CalendarDays size={20} className="text-blue-600" />
              Danh sách buổi điểm danh
            </h2>

            <div className="mb-4">
              <button
                onClick={() => setViewMode("CREATE")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                <PlusCircle size={18} /> Tạo buổi điểm danh
              </button>
            </div>

            {sessions.length === 0 ? (
              <p className="text-gray-500">Chưa có buổi điểm danh nào.</p>
            ) : (
              <ul className="space-y-2">
                {sessions.map((s) => (
                  <li
                    key={s.sessionId}
                    className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-medium">{s.sessionName}</p>
                      <p className="text-sm text-gray-500">
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
                      className="text-blue-600 hover:underline"
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

        {/* --- CREATE SESSION --- */}
        {viewMode === "CREATE" && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setViewMode("SESSIONS")}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={18} /> Quay lại
              </button>
            </div>

            <h2 className="text-lg font-semibold mb-3">Tạo buổi điểm danh</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên buổi
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Bắt đầu
                </label>
                <input
                  type="datetime-local"
                  className="w-full border rounded px-3 py-2"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kết thúc
                </label>
                <input
                  type="datetime-local"
                  className="w-full border rounded px-3 py-2"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useGPS}
                  onChange={handleToggleGPS}
                  className="w-4 h-4"
                />
                <label>Bật GPS</label>
              </div>
              {useGPS && gps.lat && (
                <p className="text-sm text-gray-500">
                  Vĩ độ: {gps.lat.toFixed(5)}, Kinh độ: {gps.lng.toFixed(5)}
                </p>
              )}
              <button
                onClick={handleCreateSession}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lưu
              </button>
            </div>
          </>
        )}

        {/* --- SESSION DETAIL --- */}
        {viewMode === "DETAIL" && selectedSession && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setViewMode("SESSIONS")}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={18} /> Quay lại
              </button>
            </div>

            <h2 className="text-lg font-semibold mb-3">
              Chi tiết buổi – {selectedSession.sessionName}
            </h2>

            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Mã SV</th>
                  <th className="p-2 border">Tên sinh viên</th>
                  <th className="p-2 border">Điểm danh</th>
                </tr>
              </thead>
              <tbody>
                {selectedSession.students?.map((a) => (
                  <tr key={a.studentId} className="hover:bg-gray-50">
                    <td className="p-2 border">{a.studentCode}</td>
                    <td className="p-2 border">{a.fullName}</td>
                    <td className="p-2 border text-center">
                      <select
                        value={a.status}
                        onChange={(e) =>
                          handleMarkAttendance(a.studentId, e.target.value)
                        }
                        className={`px-2 py-1 rounded border text-sm ${
                          a.status === "PRESENT"
                            ? "bg-green-100 text-green-700"
                            : a.status === "LATE"
                            ? "bg-yellow-100 text-yellow-700"
                            : a.status === "ABSENT"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <option value="NOT_YET">Chưa điểm danh</option>
                        <option value="PRESENT">Có mặt</option>
                        <option value="LATE">Trễ</option>
                        <option value="ABSENT">Vắng</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
