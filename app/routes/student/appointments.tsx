import { useState, useEffect } from "react";
import { Link, redirect } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import "../../src/config/firebase";
import { useAuth } from "../../src/contexts/AuthContext";

export function meta() {
  return [
    { title: "Lịch hẹn của tôi – SafeSchool Hub" },
    {
      name: "description",
      content: "Quản lý các lịch hẹn tư vấn với chuyên gia tâm lý học đường.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function clientLoader() {
  const auth = getAuth(getApp());
  const user = await new Promise<import("firebase/auth").User | null>((resolve) => {
    const unsub = auth.onAuthStateChanged((u) => { unsub(); resolve(u); });
  });
  if (!user) throw redirect("/auth/login?redirect=/student/appointments");
  const role = localStorage.getItem("userRole");
  if (role && role !== "student") throw redirect("/auth/login?error=access_denied");
  return null;
}

type Appointment = {
  id: string;
  expertName: string;
  expertSpecialty: string;
  expertAvatar: string;
  date: string;
  time: string;
  reason: string;
  note: string;
  status: "pending" | "confirmed" | "cancelled" | "done";
  createdAt: { seconds: number } | null;
};

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

export default function StudentAppointmentsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const { user } = useAuth();
  const db = getFirestore(getApp());

  useEffect(() => {
    if (!user?.uid) return;

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "appointments"),
          where("studentId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];
        setAppointments(data);
      } catch (err) {
        console.error("Lỗi tải lịch hẹn:", err);
        // Fallback: try without orderBy in case index not created
        try {
          const q2 = query(
            collection(db, "appointments"),
            where("studentId", "==", user.uid)
          );
          const snap2 = await getDocs(q2);
          const data2 = snap2.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Appointment[];
          setAppointments(data2);
        } catch (err2) {
          console.error("Lỗi tải dự phòng:", err2);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user?.uid]);

  const filtered = activeFilter === "all"
    ? appointments
    : appointments.filter((a) => a.status === activeFilter);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* ── Header ── */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>

            <Link
              to="/student/dashboard"
              className="flex items-center gap-2 text-primary font-serif font-extrabold text-[17px] tracking-tight select-none"
            >
              <Icon name="shield" filled size={22} />
              An Toàn Trường Học
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="Appointments navigation">
              <Link
                to="/student/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="home" size={18} />
                Trang chủ
              </Link>
              <Link
                to="/student/experts"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="psychology" size={18} />
                Chuyên gia tư vấn
              </Link>
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm">
                <Icon name="calendar_month" size={18} filled />
                Lịch hẹn của tôi
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/experts"
              className="hidden sm:flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <Icon name="add" size={16} />
              Đặt lịch mới
            </Link>
            <button className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/30 hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0">
              <img
                src={user?.photoURL || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&auto=format&fit=crop"}
                alt="Ảnh đại diện"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* ── Body ── */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8 animate-fade-in">
          <div className="max-w-[860px] mx-auto">
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-on-surface mb-1">
                Lịch hẹn của tôi
              </h1>
              <p className="text-sm text-on-surface-variant">
                Theo dõi trạng thái các buổi tư vấn đã đặt với chuyên gia.
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {(["all", "pending", "confirmed", "done"] as const).map((key) => {
                const count = key === "all" ? appointments.length : appointments.filter(a => a.status === key).length;
                const cfg = key === "all"
                  ? { label: "Tổng cộng", color: "#0058bd", bg: "#eff6ff", icon: "calendar_month" }
                  : STATUS_CONFIG[key];
                return (
                  <div key={key} className="bg-white border border-[#e8eaf0] rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                      <Icon name={cfg.icon} size={20} filled style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-on-surface">{count}</p>
                      <p className="text-[11px] text-on-surface-variant font-medium">{cfg.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap mb-5">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === tab.key
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-white border border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium">Đang tải lịch hẹn...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
                  <Icon name="calendar_month" size={40} style={{ color: "#9ca3af" }} />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface mb-1">Chưa có lịch hẹn nào</p>
                  <p className="text-sm text-on-surface-variant">
                    {activeFilter === "all"
                      ? "Hãy đặt lịch hẹn với chuyên gia để bắt đầu!"
                      : `Không có lịch hẹn nào ở trạng thái này.`}
                  </p>
                </div>
                <Link
                  to="/student/experts"
                  className="mt-2 flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Icon name="add" size={18} />
                  Đặt lịch hẹn ngay
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map((appt) => {
                  const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
                  return (
                    <div
                      key={appt.id}
                      className="bg-white border border-[#e8eaf0] rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center gap-5"
                    >
                      {/* Expert Avatar */}
                      <img
                        src={appt.expertAvatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop"}
                        alt={appt.expertName}
                        className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border border-outline-variant/20"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <h3 className="text-base font-bold text-on-surface">{appt.expertName}</h3>
                            <p className="text-xs font-semibold text-primary">{appt.expertSpecialty}</p>
                          </div>
                          {/* Status Badge */}
                          <span
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border flex-shrink-0"
                            style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
                          >
                            <Icon name={cfg.icon} size={13} filled />
                            {cfg.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                          <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <Icon name="calendar_today" size={14} style={{ color: "#0058bd" }} />
                            {formatDate(appt.date)}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <Icon name="schedule" size={14} style={{ color: "#0058bd" }} />
                            {appt.time}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <Icon name="label" size={14} style={{ color: "#0058bd" }} />
                            {appt.reason}
                          </span>
                        </div>

                        {appt.note && (
                          <p className="text-xs text-on-surface-variant mt-2 bg-surface-container/30 rounded-xl px-3 py-2 border border-outline-variant/20 leading-relaxed">
                            📝 {appt.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
