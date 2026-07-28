import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, redirect } from "react-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { getUserProfile } from "../../src/services/userService";
import { Icon } from "../../components/ui/Icon";
import { DoctorSidebar } from "../../components/doctor/DoctorSidebar";
import type { UserProfile } from "../../src/types/user.types";

import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import "../../src/config/firebase";

export async function clientLoader() {
  const authInstance = getAuth(getApp());
  const user = await new Promise<import("firebase/auth").User | null>(
    (resolve) => {
      const unsubscribe = authInstance.onAuthStateChanged((u) => {
        unsubscribe();
        resolve(u);
      });
    }
  );

  if (!user) {
    throw redirect("/auth/login?redirect=/doctor/dashboard");
  }

  const role = localStorage.getItem("userRole");
  if (role && role !== "doctor" && role !== "admin") {
    throw redirect("/auth/login?error=access_denied");
  }

  return null;
}


interface Appointment {
  id: string;
  expertId: string;
  expertName: string;
  expertSpecialty: string;
  expertAvatar: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  reason: string;
  note: string;
  status: "pending" | "confirmed" | "cancelled" | "done";
  createdAt: any;
}

export function meta() {
  return [
    { title: "Bảng điều khiển Bác sĩ - SafeSchool Hub" },
    {
      name: "description",
      content:
        "Bảng điều khiển SafeSchool Hub dành riêng cho Bác sĩ & Chuyên gia tư vấn tâm lý học đường.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "all">("pending");
  const [apptToast, setApptToast] = useState<{ id: string; studentName: string; date: string; time: string } | null>(null);
  const db = getFirestore(getApp());
  const prevPendingRef = useRef<string[]>([]);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        try {
          const prof = await getUserProfile(user.uid);
          setProfile(prof);
        } catch (e) {
          console.error("Lỗi khi tải thông tin bác sĩ:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;

    // Lắng nghe real-time từ Firestore
    const q = query(
      collection(db, "appointments"),
      where("expertId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];
      
      // Sắp xếp giảm dần theo thời gian tạo
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      
      setAppointments(list);
    }, (error) => {
      console.error("Lỗi lắng nghe lịch hẹn:", error);
    });

    return () => unsubscribe();
  }, [user?.uid, db]);

  useEffect(() => {
    if (appointments.length === 0) return;

    const pendingIds = appointments
      .filter((a) => a.status === "pending")
      .map((a) => a.id);

    const isInitialLoad = prevPendingRef.current.length === 0 && appointments.length > 0;
    
    if (!isInitialLoad) {
      const newPendings = pendingIds.filter((id) => !prevPendingRef.current.includes(id));
      if (newPendings.length > 0) {
        const newAppt = appointments.find((a) => a.id === newPendings[0]);
        if (newAppt) {
          setApptToast({
            id: newAppt.id,
            studentName: newAppt.studentName,
            date: newAppt.date,
            time: newAppt.time,
          });
          // Phát âm thanh
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
            audio.volume = 0.4;
            audio.play().catch(() => {});
          } catch {}
        }
      }
    }
    
    prevPendingRef.current = pendingIds;
  }, [appointments]);

  useEffect(() => {
    if (apptToast) {
      const timer = setTimeout(() => setApptToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [apptToast]);

  const handleUpdateStatus = async (id: string, newStatus: "confirmed" | "cancelled") => {
    try {
      const apptRef = doc(db, "appointments", id);
      await updateDoc(apptRef, { status: newStatus });
      if (apptToast?.id === id) {
        setApptToast(null);
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái lịch hẹn:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (e) {
      console.error("Lỗi đăng xuất:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-on-surface-variant">Đang tải thông tin bảng điều khiển...</p>
        </div>
      </div>
    );
  }

  const doctorName = profile?.displayName || user?.displayName || "Bác sĩ tâm lý";
  const specialization = profile?.specialization || "Chuyên gia tâm lý học đường";
  const hospital = profile?.hospital || "Bệnh viện đối tác";

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const doneCount = appointments.filter((a) => a.status === "done").length;

  const stats = [
    { label: "Ca tư vấn đã xử lý", value: String(24 + doneCount), icon: "forum", color: "#0058bd", bg: "#e8f0fe" },
    { label: "Lịch hẹn chờ duyệt", value: String(pendingCount), icon: "calendar_month", color: "#059669", bg: "#d1fae5" },
    { label: "Lịch hẹn đã duyệt", value: String(confirmedCount), icon: "event_available", color: "#10b981", bg: "#ecfdf5" },
    { label: "Đánh giá chuyên môn", value: "4.9/5", icon: "star", color: "#eab308", bg: "#fef9c3" },
  ];

  const recentQuestions = [
    { id: "1", title: "Áp lực thi cử lớp 12 và stress nặng", time: "10 phút trước", student: "Học sinh 12A3", preview: "Em cảm thấy quá áp lực trước kỳ thi đại học sắp tới, thường xuyên mất ngủ và rụng tóc..." },
    { id: "2", title: "Làm thế nào để hòa đồng hơn trong lớp mới?", time: "2 giờ trước", student: "Học sinh 10B2", preview: "Em vừa chuyển trường và cảm thấy rất cô đơn, không thể bắt chuyện được với các bạn..." },
    { id: "3", title: "Bị cô lập và bạo lực mạng xã hội", time: "1 ngày trước", student: "Học sinh 11A1", preview: "Các bạn trong lớp lập nhóm chat nói xấu em và chế ảnh dìm hàng em lên mạng xã hội..." },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      
      {/* ── Doctor Sidebar ── */}
      <DoctorSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* ── Main Dashboard Panel ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>
            <h2 className="text-lg font-serif font-bold text-[#003884] tracking-tight">
              SafeSchool Hub - Bác Sĩ & Chuyên Gia
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer border-none bg-transparent">
              <Icon name="notifications" size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse" />
            </button>
            
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-outline-variant/30">
              <span className="text-xs text-on-surface-variant text-right">
                <span className="block font-bold text-on-surface">{hospital}</span>
                <span className="block text-[10px]">{specialization}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-[1100px] w-full mx-auto animate-fade-in">
          
          {/* Welcome section */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-[#ebf3fe] via-[#f1f6ff] to-[#e4efff] border border-[#d3e5fe] px-6 py-8 sm:px-8 rounded-3xl shadow-xs">
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#0058bd]/8 text-[#0058bd] tracking-wide uppercase">
                Chào mừng ngày mới
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#001a41] mt-2">
                Xin chào, {doctorName} 👋
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Hệ thống ghi nhận trạng thái hoạt động của bạn tốt. Hãy cùng SafeSchool đồng hành bảo vệ các em học sinh nhé!
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate("/doctor/qna")}
                className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-xs cursor-pointer border-none"
              >
                Trả lời Q&A mới
              </button>
            </div>
          </section>

          {/* Quick Statistics Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-2xs flex flex-col justify-between h-[120px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant truncate pr-2">{s.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg, color: s.color }}>
                    <Icon name={s.icon} size={18} style={{ color: "currentColor" }} />
                  </div>
                </div>
                <span className="text-2xl font-serif font-extrabold text-on-surface leading-none mt-2">{s.value}</span>
              </div>
            ))}
          </section>

          {/* Core lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Recent Questions List */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <h3 className="font-serif font-bold text-base text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#994100]">forum</span>
                  Câu hỏi học sinh mới gửi cần tư vấn
                </h3>
                <Link to="/doctor/qna" className="text-xs text-primary font-bold hover:underline">
                  Xem tất cả
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {recentQuestions.map((q) => (
                  <div key={q.id} className="p-4 rounded-2xl hover:bg-surface-container/50 border border-outline-variant/20 transition-all flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold bg-[#994100]/8 text-[#994100] px-2.5 py-0.5 rounded-full uppercase">
                        {q.student}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-medium">{q.time}</span>
                    </div>
                    <h4 className="text-sm font-bold text-on-surface leading-snug">{q.title}</h4>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{q.preview}</p>
                    <Link
                      to="/doctor/qna"
                      className="text-xs font-bold text-[#0058bd] hover:text-[#00479b] mt-1 inline-flex items-center gap-1 self-start"
                    >
                      Hỗ trợ giải đáp
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_right_alt</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick Appointments Manager */}
            <div className="bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-2xs flex flex-col gap-4">
              <h3 className="font-serif font-bold text-base text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-1">
                <span className="material-symbols-outlined text-[#059669]">calendar_month</span>
                Lịch hẹn tư vấn
              </h3>

              {/* Tabs */}
              <div className="flex gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                {[
                  { key: "pending", label: `Chờ duyệt (${pendingCount})` },
                  { key: "confirmed", label: `Đã duyệt (${confirmedCount})` },
                  { key: "all", label: "Tất cả" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === tab.key
                        ? "bg-white text-primary shadow-xs border border-gray-100"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                {appointments.filter(a => activeTab === "all" ? true : a.status === activeTab).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                    <Icon name="event_busy" size={32} style={{ color: "#cbd5e1" }} />
                    <span className="text-xs font-semibold">Không có lịch hẹn nào</span>
                  </div>
                ) : (
                  appointments
                    .filter(a => activeTab === "all" ? true : a.status === activeTab)
                    .map((appt) => {
                      const formattedDate = appt.date ? appt.date.split("-").reverse().join("/") : "";
                      return (
                        <div
                          key={appt.id}
                          className="p-3.5 rounded-2xl border border-outline-variant/20 bg-surface-container/20 flex flex-col gap-2 transition-all hover:bg-surface-container/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">
                                👤 {appt.studentName}
                              </p>
                              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                                📅 {formattedDate} &nbsp;·&nbsp; 🕐 {appt.time}
                              </p>
                            </div>
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                                appt.status === "pending"
                                  ? "bg-amber-50 text-amber-600 border-amber-200"
                                  : appt.status === "confirmed"
                                  ? "bg-blue-50 text-blue-600 border-blue-200"
                                  : appt.status === "cancelled"
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-200"
                              }`}
                            >
                              {appt.status === "pending"
                                ? "Chờ duyệt"
                                : appt.status === "confirmed"
                                ? "Đã duyệt"
                                : appt.status === "cancelled"
                                ? "Đã hủy"
                                : "Đã xong"}
                            </span>
                          </div>
                          
                          {appt.reason && (
                            <p className="text-[11px] text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded-lg border border-gray-100/50">
                              <span className="font-semibold text-gray-700">Lý do:</span> {appt.reason}
                            </p>
                          )}

                          {appt.status === "pending" && (
                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() => handleUpdateStatus(appt.id, "confirmed")}
                                className="flex-1 flex items-center justify-center gap-1 bg-[#059669] hover:bg-[#047857] text-white text-[10px] font-extrabold py-2 px-2.5 rounded-xl cursor-pointer border-none shadow-xs transition-colors"
                              >
                                <Icon name="check" size={12} />
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                                className="flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-extrabold py-2 px-2.5 rounded-xl cursor-pointer border border-red-200 transition-colors"
                              >
                                <Icon name="close" size={12} />
                                Từ chối
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>

          </div>
          
        </main>
      </div>

      {/* ── NOTIFICATION TOAST ── */}
      {apptToast && (
        <div
          onClick={() => {
            setActiveTab("pending");
            setApptToast(null);
          }}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 99999,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(12px)",
            border: "1.5px solid #0058bd",
            borderRadius: 24,
            padding: "16px 20px",
            width: 340,
            boxShadow: "0 20px 48px rgba(0, 88, 189, 0.25), 0 4px 16px rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "pointer",
            animation: "slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transition: "all 0.2s",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(0, 88, 189, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="notification_important" size={22} className="text-primary" filled />
          </div>
          
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1e293b" }}>
              Lịch Hẹn Mới Trực Tuyến!
            </p>
            <p style={{ margin: "3px 0 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>
              Học sinh <strong>{apptToast.studentName}</strong> vừa đăng ký lịch hẹn vào lúc {apptToast.time} ngày {apptToast.date.split("-").reverse().join("/")}.
            </p>
          </div>
          
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setApptToast(null);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: 4,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "flex-start",
            }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
