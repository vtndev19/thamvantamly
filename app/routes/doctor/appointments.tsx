import { useState, useEffect } from "react";
import { Link, redirect } from "react-router";
import { DoctorSidebar } from "../../components/doctor/DoctorSidebar";
import { Icon } from "../../components/ui/Icon";
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
import { useAuth } from "../../src/contexts/AuthContext";

export function meta() {
  return [
    { title: "Quản lý Lịch hẹn tư vấn – SafeSchool Hub dành cho Bác sĩ" },
    {
      name: "description",
      content: "Bảng quản lý các yêu cầu đặt lịch hẹn và tư vấn tâm lý học đường từ học sinh.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function clientLoader() {
  const auth = getAuth(getApp());
  const user = await new Promise<import("firebase/auth").User | null>((resolve) => {
    const unsub = auth.onAuthStateChanged((u) => {
      unsub();
      resolve(u);
    });
  });

  if (!user) {
    throw redirect("/auth/login?redirect=/doctor/appointments");
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

const STATUS_CONFIG = {
  pending: { label: "Chờ xác nhận", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", icon: "schedule" },
  confirmed: { label: "Đã xác nhận", color: "#0058bd", bg: "#eff6ff", border: "#bfdbfe", icon: "event_available" },
  cancelled: { label: "Đã hủy", color: "#ef4444", bg: "#fef2f2", border: "#fecaca", icon: "event_busy" },
  done: { label: "Đã hoàn thành", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", icon: "task_alt" },
};

const FILTER_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "done", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

export default function DoctorAppointmentsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const { user } = useAuth();
  const db = getFirestore(getApp());

  useEffect(() => {
    if (!user?.uid) return;

    // Lắng nghe real-time lịch hẹn từ Firestore
    const q = query(
      collection(db, "appointments"),
      where("expertId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi khi tải lịch hẹn bác sĩ:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, db]);

  const handleUpdateStatus = async (id: string, newStatus: Appointment["status"]) => {
    try {
      const docRef = doc(db, "appointments", id);
      await updateDoc(docRef, { status: newStatus });
    } catch (err) {
      console.error("Lỗi cập nhật lịch hẹn:", err);
      alert("Không thể cập nhật lịch hẹn. Vui lòng thử lại.");
    }
  };

  const filtered = activeFilter === "all"
    ? appointments
    : appointments.filter((a) => a.status === activeFilter);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <DoctorSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer border-none bg-transparent"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>

            <Link
              to="/doctor/dashboard"
              className="flex items-center gap-2 text-primary font-serif font-extrabold text-[17px] tracking-tight select-none"
            >
              <Icon name="shield" filled size={22} />
              SafeSchool Hub - Bác Sĩ
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="Appointments navigation">
              <Link
                to="/doctor/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="home" size={18} />
                Trang chủ
              </Link>
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm">
                <Icon name="calendar_today" size={18} filled />
                Lịch hẹn tư vấn
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant/30 flex-shrink-0">
              <img
                src={user?.photoURL || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=150&auto=format&fit=crop"}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Scrollable workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-[1100px] w-full mx-auto animate-fade-in">
          {/* Page Title banner */}
          <section className="bg-gradient-to-br from-[#ebf3fe] via-[#f1f6ff] to-[#e4efff] border border-[#d3e5fe] p-6 rounded-3xl flex items-center justify-between gap-4 shadow-xs">
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary tracking-wide uppercase">
                Chuyên gia học đường
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#001a41] mt-2">
                Quản lý Lịch hẹn tư vấn 📅
              </h2>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-[500px]">
                Theo dõi, phê duyệt và hoàn thành các cuộc hẹn tư vấn tâm lý trực tiếp với các em học sinh.
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner flex-shrink-0">
              <Icon name="event" size={32} filled />
            </div>
          </section>

          {/* Filter Tabs */}
          <section className="flex border-b border-[#e2e8f0] pb-px overflow-x-auto gap-4 scrollbar-none">
            {FILTER_TABS.map((tab) => {
              const count = tab.key === "all"
                ? appointments.length
                : appointments.filter((a) => a.status === tab.key).length;
              const isAct = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isAct
                      ? "border-[#0058bd] text-[#0058bd]"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isAct ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </section>

          {/* Appointments list */}
          <section className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Đang tải danh sách lịch hẹn...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white border border-[#e8eaf0] rounded-3xl p-8 shadow-xs">
                <Icon name="event_busy" size={56} style={{ color: "#cbd5e1" }} />
                <p className="text-base font-bold text-gray-600">Không có lịch hẹn nào</p>
                <p className="text-sm text-gray-400 max-w-sm">Hiện không ghi nhận lịch hẹn nào trong bộ lọc này.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map((appt) => {
                  const conf = STATUS_CONFIG[appt.status];
                  return (
                    <div
                      key={appt.id}
                      className="bg-white border border-[#e8eaf0] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Upper info */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-extrabold text-base flex-shrink-0">
                              {appt.studentName ? appt.studentName.split(" ").slice(-1)[0]?.[0]?.toUpperCase() : "H"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-extrabold text-gray-800 truncate">
                                {appt.studentName}
                              </h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">Học sinh</p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div
                            style={{
                              backgroundColor: conf.bg,
                              color: conf.color,
                              borderColor: conf.border,
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wide flex-shrink-0"
                          >
                            <Icon name={conf.icon} size={13} style={{ color: "currentColor" }} filled />
                            <span>{conf.label}</span>
                          </div>
                        </div>

                        {/* Booking details card */}
                        <div className="bg-[#f8fafc] rounded-2xl p-4 border border-[#e2e8f0]/60 space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                            <Icon name="event" size={16} className="text-gray-400" />
                            <span>Ngày hẹn:</span>
                            <span className="text-primary font-extrabold ml-1">{formatDate(appt.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                            <Icon name="schedule" size={16} className="text-gray-400" />
                            <span>Khung giờ:</span>
                            <span className="text-primary font-extrabold ml-1">{appt.time}</span>
                          </div>
                          {appt.reason && (
                            <div className="text-xs text-gray-600 bg-white p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                              <p className="font-bold text-gray-700 mb-0.5 uppercase text-[9px] tracking-wider">Lý do tư vấn:</p>
                              {appt.reason}
                            </div>
                          )}
                          {appt.note && (
                            <div className="text-xs text-gray-500 italic bg-white/50 p-2.5 rounded-xl border border-gray-100/30 leading-relaxed">
                              <p className="font-bold text-gray-400 not-italic uppercase text-[9px] tracking-wider mb-0.5">Ghi chú của học sinh:</p>
                              "{appt.note}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2.5 border-t border-gray-100 pt-4 mt-2">
                        {appt.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "confirmed")}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white py-3 rounded-xl text-xs font-extrabold shadow-sm transition-colors cursor-pointer border-none"
                            >
                              <Icon name="check" size={14} />
                              Xác nhận lịch
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl text-xs font-extrabold border border-red-200 transition-colors cursor-pointer"
                            >
                              <Icon name="close" size={14} />
                              Từ chối lịch
                            </button>
                          </>
                        )}
                        {appt.status === "confirmed" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "done")}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-[#0058bd] hover:bg-[#00479b] text-white py-3 rounded-xl text-xs font-extrabold shadow-sm transition-colors cursor-pointer border-none"
                            >
                              <Icon name="task_alt" size={14} />
                              Đã hoàn thành
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl text-xs font-extrabold border border-red-200 transition-colors cursor-pointer"
                            >
                              <Icon name="event_busy" size={14} />
                              Hủy lịch hẹn
                            </button>
                          </>
                        )}
                        {(appt.status === "done" || appt.status === "cancelled") && (
                          <div className="w-full text-center text-xs text-gray-400 font-bold py-2 bg-gray-50 rounded-xl border border-gray-100">
                            Không có hành động khả dụng cho trạng thái này
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
