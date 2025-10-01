import React, { createContext, useContext, useEffect, useState } from "react";
import socketService from "../services/socketService";
import { getAllSessionsOfTeacher } from "../services/attendanceHelper";
import { useToast } from "./ToastContext";
import classSubjectService from "../services/classSubjectService";

const AttendanceContext = createContext(null);

export const AttendanceProvider = ({ teacherId, children }) => {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [subscribedSessions, setSubscribedSessions] = useState([]); // Track subscribed session IDs
  const [subscribedClasses, setSubscribedClasses] = useState([]); // Track subscribed classSubject topics

  useEffect(() => {
    if (!teacherId) return;

    const fetchAndSubscribe = async () => {
      try {
        // 1. Lấy tất cả classSubject của giáo viên
        const allClassSubjects =
          await classSubjectService.getAllClassSubjects();
        const teacherClassSubjects = allClassSubjects.filter(
          (cs) => cs.teacher?.userId === teacherId
        );
        const classSubjectIds = teacherClassSubjects.map(
          (cs) => cs.classSubjectId
        );

        // 2. Subscribe vào topic sessions của từng classSubject
        classSubjectIds.forEach((classSubjectId) => {
          const topic = `/topic/class/${classSubjectId}/sessions`;
          if (!subscribedClasses.includes(topic)) {
            socketService.subscribe(topic, (newSession) => {
              // Thêm session mới vào state
              setSessions((prev) => {
                if (prev.find((s) => s.sessionId === newSession.sessionId))
                  return prev;
                return [...prev, newSession];
              });

              // Subscribe vào records của session mới
              const sessionId = newSession.sessionId;
              if (!subscribedSessions.includes(sessionId)) {
                socketService.subscribe(
                  `/topic/session/${sessionId}/records`,
                  (update) => {
                    if (!update.byTeacher) {
                      showToast(
                        `Học sinh ${
                          update.studentName || update.studentId
                        } vừa điểm danh!`,
                        "success"
                      );
                    }
                    // Cập nhật trạng thái session
                    setSessions((prev) =>
                      prev.map((s) =>
                        s.sessionId === sessionId
                          ? {
                              ...s,
                              students: s.students
                                ? s.students.map((st) =>
                                    st.studentId === update.studentId
                                      ? { ...st, status: update.status }
                                      : st
                                  )
                                : undefined,
                            }
                          : s
                      )
                    );
                  }
                );
                setSubscribedSessions((prev) => [...prev, sessionId]);
                console.log(`✅ Subscribed to new session: ${sessionId}`);
              }
            });
            setSubscribedClasses((prev) => [...prev, topic]);
            console.log(`✅ Subscribed to class topic: ${topic}`);
          }
        });

        // 3. Lấy và subscribe vào tất cả session hiện tại
        const fetchedSessions = await getAllSessionsOfTeacher(teacherId);
        setSessions(fetchedSessions);

        fetchedSessions.forEach((session) => {
          const sessionId = session.sessionId;
          if (!subscribedSessions.includes(sessionId)) {
            socketService.subscribe(
              `/topic/session/${sessionId}/records`,
              (update) => {
                if (!update.byTeacher) {
                  showToast(
                    `Học sinh ${
                      update.studentName || update.studentId
                    } vừa điểm danh!`,
                    "success"
                  );
                }
                // Cập nhật trạng thái session
                setSessions((prev) =>
                  prev.map((s) =>
                    s.sessionId === sessionId
                      ? {
                          ...s,
                          students: s.students
                            ? s.students.map((st) =>
                                st.studentId === update.studentId
                                  ? { ...st, status: update.status }
                                  : st
                              )
                            : undefined,
                        }
                      : s
                  )
                );
              }
            );
            setSubscribedSessions((prev) => [...prev, sessionId]);
            console.log(`✅ Subscribed to existing session: ${sessionId}`);
          }
        });
      } catch (err) {
        console.error("Lỗi fetch hoặc subscribe:", err);
        showToast("Không tải được dữ liệu điểm danh", "error");
      }
    };

    fetchAndSubscribe();

    // Cleanup
    return () => {
      subscribedClasses.forEach((topic) => socketService.unsubscribe(topic));
      subscribedSessions.forEach((sessionId) =>
        socketService.unsubscribe(`/topic/session/${sessionId}/records`)
      );
      setSubscribedClasses([]);
      setSubscribedSessions([]);
      console.log("🛑 Unsubscribed from all classes and sessions");
    };
  }, [teacherId, showToast]);

  return (
    <AttendanceContext.Provider value={{ sessions, setSessions }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const ctx = useContext(AttendanceContext);
  if (!ctx)
    throw new Error("useAttendance must be used inside AttendanceProvider");
  return ctx;
};
