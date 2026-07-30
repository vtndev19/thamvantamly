import { useState, useRef, useEffect } from "react";
import { Link, redirect } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import "../../src/config/firebase";
import { createPortal } from "react-dom";
import { useAuth } from "../../src/contexts/AuthContext";
import { openDoctorChat } from "../../components/student/DoctorChatWidget";
import { DoctorChatService as ChatSvc, type DoctorProfile } from "../../src/services/doctorChatService";


// ─── Types ───────────────────────────────────────────────────────────────────

type Message = { id: string; sender: "student" | "expert"; text: string; time: string };

type BookingStep = "calendar" | "timeslot" | "details" | "success";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "13:30", "14:00", "14:30", "15:00", "15:30", "16:00",
];

const REASONS = [
  "Áp lực học tập",
  "Bạo lực học đường",
  "Quan hệ bạn bè",
  "Định hướng nghề nghiệp",
  "Vấn đề gia đình",
  "Khác",
];

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_VI = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

// ─── Fallback Experts (dùng khi Firebase trống) ───────────────────────────────

const FALLBACK_DOCTORS: DoctorProfile[] = [
  {
    uid: "fallback_1",
    displayName: "ThS. Trần Thị Lan",
    email: null,
    specialization: "Tâm lý học đường",
    hospital: "Trung tâm Sức khỏe Tâm thần",
    licenseNumber: "CCHN-001",
    photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    role: "doctor",
  },
  {
    uid: "fallback_2",
    displayName: "TS. Nguyễn Văn Nam",
    email: null,
    specialization: "Tư vấn hướng nghiệp",
    hospital: "Bệnh viện Tâm thần Trung ương",
    licenseNumber: "CCHN-002",
    photoURL: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
    role: "doctor",
  },
  {
    uid: "fallback_3",
    displayName: "Chuyên viên Lê Hoàng",
    email: null,
    specialization: "Phát triển kỹ năng mềm",
    hospital: "Phòng tư vấn học đường THPT",
    licenseNumber: "CCHN-003",
    photoURL: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop",
    role: "doctor",
  },
];

function getNow(): string {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// ─── Mini Calendar Component ─────────────────────────────────────────────────

function MiniCalendar({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (dateStr: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const toDateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isPast = (day: number) => new Date(viewYear, viewMonth, day) < today;
  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const isSelected = (day: number) => toDateStr(day) === selectedDate;

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
        >
          <Icon name="chevron_left" size={20} />
        </button>
        <span className="text-sm font-bold text-on-surface">
          {MONTHS_VI[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={goNext}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold text-on-surface-variant py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const past = isPast(day);
          const todayCell = isToday(day);
          const sel = isSelected(day);

          return (
            <button
              key={day}
              type="button"
              disabled={past}
              onClick={() => !past && onSelect(toDateStr(day))}
              className={`
                aspect-square w-full flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer
                ${past ? "text-on-surface-variant/30 cursor-not-allowed" : ""}
                ${sel
                  ? "bg-primary text-on-primary shadow-md scale-110"
                  : todayCell
                  ? "bg-primary/10 text-primary border border-primary/40 font-extrabold"
                  : !past
                  ? "hover:bg-primary/10 hover:text-primary text-on-surface"
                  : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Booking Modal ────────────────────────────────────────────────────────────

function BookingModal({
  expert,
  onClose,
  db,
  user,
}: {
  expert: { id: string; name: string; specialty: string; description: string; avatar: string; status: string; greeting: string };
  onClose: () => void;
  db: ReturnType<typeof getFirestore>;
  user: { uid?: string; displayName?: string | null } | null;
}) {
  const [step, setStep] = useState<BookingStep>("calendar");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDateVI = (d: string) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const handleDateConfirm = () => {
    if (!selectedDate) return;
    setStep("timeslot");
  };

  const handleTimeConfirm = () => {
    if (!selectedTime) return;
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "appointments"), {
        expertId: expert.id,
        expertName: expert.name,
        expertSpecialty: expert.specialty,
        expertAvatar: expert.avatar,
        studentId: user?.uid,
        studentName: user?.displayName || "Học sinh",
        date: selectedDate,
        time: selectedTime,
        reason,
        note,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setStep("success");
    } catch (err) {
      console.error("Lỗi đặt lịch:", err);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const STEPS_LABELS = ["Chọn ngày", "Chọn giờ", "Xác nhận"];
  const stepIndex = step === "calendar" ? 0 : step === "timeslot" ? 1 : step === "details" ? 2 : 3;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(10, 15, 29, 0.6)",
        backdropFilter: "blur(12px)",
        zIndex: 99999,
        animation: "fadeIn 0.25s ease-out"
      }}
      onClick={onClose}
    >
      <div
        className="bg-white flex flex-col border border-[#e4efff] overflow-hidden"
        style={{
          width: "calc(100% - 32px)",
          maxWidth: "448px",
          height: "auto",
          maxHeight: "90vh",
          borderRadius: "32px",
          boxShadow: "0 25px 60px -15px rgba(0, 88, 189, 0.3)",
          animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative px-6 py-5 flex items-center gap-4 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #3b82f6 100%)" }}
        >
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
            <Icon name="calendar_month" size={20} style={{ color: "white" }} filled />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-extrabold text-sm tracking-wide">Đăng ký Lịch Hẹn</p>
            <p className="text-blue-100 text-[11px] font-semibold mt-0.5 truncate">{expert.name} · {expert.specialty}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer border-none"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        {step !== "success" && (
          <div className="flex items-center justify-between px-6 py-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex-shrink-0">
            {STEPS_LABELS.map((label, idx) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 transition-all duration-300 ${
                      idx < stepIndex
                        ? "bg-[#1d4ed8] text-white shadow-sm"
                        : idx === stepIndex
                        ? "bg-[#1d4ed8] text-white ring-4 ring-blue-500/20"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {idx < stepIndex ? <Icon name="check" size={12} /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-bold ${idx === stepIndex ? "text-[#1d4ed8]" : "text-gray-400"} hidden sm:inline`}>
                    {label}
                  </span>
                </div>
                {idx < STEPS_LABELS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-3 rounded ${idx < stepIndex ? "bg-[#1d4ed8]" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Step 1: Calendar */}
          {step === "calendar" && (
            <div className="p-6 flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">Bước 1: Chọn ngày gặp</h3>
                <p className="text-xs text-gray-400 leading-relaxed">Chọn ngày bạn muốn tư vấn. Hệ thống chỉ hỗ trợ đặt lịch cho các ngày trong tương lai.</p>
              </div>

              <div className="bg-[#f8fafc] rounded-2xl p-4 border border-[#e2e8f0]">
                <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
              </div>

              <div className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all ${selectedDate ? "bg-blue-50/50 border-blue-200 text-[#1d4ed8]" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                <Icon name="event" size={20} />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Ngày đặt hẹn</p>
                  <p className="text-sm font-extrabold mt-0.5">
                    {selectedDate ? formatDateVI(selectedDate) : "Vui lòng chọn từ lịch trên"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!selectedDate}
                onClick={handleDateConfirm}
                className="w-full flex items-center justify-center gap-2 bg-[#1d4ed8] text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-[#1e40af] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/10 cursor-pointer border-none"
              >
                Tiếp tục
                <Icon name="arrow_forward" size={18} />
              </button>
            </div>
          )}

          {/* Step 2: Time Slots */}
          {step === "timeslot" && (
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("calendar")}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer border-none bg-none"
                >
                  <Icon name="arrow_back" size={18} />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Bước 2: Chọn khung giờ</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Lịch tư vấn ngày {formatDateVI(selectedDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`py-3 text-sm font-extrabold rounded-2xl border transition-all duration-150 cursor-pointer ${
                      selectedTime === slot
                        ? "bg-[#1d4ed8] text-white border-[#1d4ed8] shadow-md scale-105"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {selectedTime && (
                <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-200 rounded-2xl px-4 py-3.5 text-[#1d4ed8]">
                  <Icon name="schedule" size={20} />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Giờ tư vấn đã chọn</p>
                    <p className="text-sm font-extrabold mt-0.5">{selectedTime}</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={!selectedTime}
                onClick={handleTimeConfirm}
                className="w-full flex items-center justify-center gap-2 bg-[#1d4ed8] text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-[#1e40af] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/10 cursor-pointer border-none"
              >
                Xác nhận giờ hẹn
                <Icon name="arrow_forward" size={18} />
              </button>
            </div>
          )}

          {/* Step 3: Details form */}
          {step === "details" && (
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("timeslot")}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer border-none bg-none"
                >
                  <Icon name="arrow_back" size={18} />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Bước 3: Chi tiết yêu cầu</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateVI(selectedDate)} · {selectedTime}</p>
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex items-center gap-3.5">
                <img src={expert.avatar} alt={expert.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-gray-800 truncate">{expert.name}</p>
                  <p className="text-xs font-bold text-blue-600 truncate">{expert.specialty}</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    📅 {formatDateVI(selectedDate)} &nbsp;·&nbsp; 🕐 {selectedTime}
                  </p>
                </div>
              </div>

              {/* Reason selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Lý do tư vấn <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`py-2.5 px-3 text-xs font-bold rounded-xl border text-left transition-all cursor-pointer ${
                        reason === r
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-600 hover:text-blue-600"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note textarea */}
              <div className="flex flex-col gap-2">
                <label htmlFor="appt-note" className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                  <span>Ghi chú thêm</span>
                  <span className="text-[10px] font-normal text-gray-400 normal-case">(Tùy chọn)</span>
                </label>
                <textarea
                  id="appt-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Chia sẻ ngắn gọn điều bạn mong muốn thảo luận..."
                  rows={3}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !reason}
                className="w-full flex items-center justify-center gap-2 bg-[#1d4ed8] text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-[#1e40af] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/15 cursor-pointer border-none"
              >
                {isSubmitting ? (
                  <><Icon name="sync" size={18} className="animate-spin" /> Đang gửi yêu cầu...</>
                ) : (
                  <><Icon name="event_available" size={18} /> Xác nhận đặt lịch</>
                )}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-5 min-h-[320px]">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-2 animate-bounce">
                <Icon name="check_circle" size={48} filled style={{ color: "#1d4ed8" }} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-800">Đặt Lịch Thành Công!</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed max-w-[280px]">
                  Yêu cầu đặt hẹn với <strong>{expert.name}</strong> vào ngày <strong>{formatDateVI(selectedDate)} ({selectedTime})</strong> đã được gửi đi. Vui lòng theo dõi trạng thái lịch hẹn.
                </p>
              </div>
              <div className="flex gap-2.5 w-full mt-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer border-none"
                >
                  Đóng
                </button>
                <Link
                  to="/student/appointments"
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-[#1d4ed8] hover:bg-[#1e40af] text-white transition-colors flex items-center justify-center gap-1 shadow-sm"
                  onClick={onClose}
                >
                  <Icon name="calendar_month" size={14} />
                  Xem lịch hẹn
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Meta & Loader ────────────────────────────────────────────────────────────

export function meta() {
  return [
    { title: "Chuyên gia Tư vấn – SafeSchool Hub" },
    {
      name: "description",
      content: "Liên hệ và gửi câu hỏi trực tiếp cho các chuyên gia tâm lý, tư vấn học đường.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function clientLoader() {
  const auth = getAuth(getApp());
  const user = await new Promise<import("firebase/auth").User | null>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((u) => { unsubscribe(); resolve(u); });
  });
  if (!user) throw redirect("/auth/login?redirect=/student/experts");
  const role = localStorage.getItem("userRole");
  if (role && role !== "student") throw redirect("/auth/login?error=access_denied");
  return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentExpertsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Search and Category filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  // Booking state - vẫn dùng mock expert object để tương thích BookingModal
  const [bookingDoctor, setBookingDoctor] = useState<DoctorProfile | null>(null);

  // Doctor info modal
  const [viewDoctor, setViewDoctor] = useState<DoctorProfile | null>(null);
  const [modalTab, setModalTab] = useState<"info" | "experience">("info");

  const { user } = useAuth();
  const db = getFirestore(getApp());

  // ── Tải danh sách bác sĩ từ Firebase ──────────────────────────────────────
  useEffect(() => {
    async function loadDoctors() {
      setLoadingDoctors(true);
      try {
        const data = await ChatSvc.getDoctors();
        setDoctors(data.length > 0 ? data : FALLBACK_DOCTORS);
      } catch {
        setDoctors(FALLBACK_DOCTORS);
      } finally {
        setLoadingDoctors(false);
      }
    }
    loadDoctors();
  }, []);

  // Tạo booking expert object từ DoctorProfile
  const toBookingExpert = (doc: DoctorProfile) => ({
    id: doc.uid,
    name: doc.displayName || "Bác sĩ",
    specialty: doc.specialization || "Chuyên gia tâm lý",
    description: `${doc.hospital || ""}`,
    avatar: doc.photoURL || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop",
    status: "online" as const,
    greeting: `Xin chào! Tôi là ${doc.displayName}. Hãy chia sẻ vấn đề của bạn.`,
  });

  const CATEGORIES = ["Tất cả", "Tâm lý học đường", "Tư vấn hướng nghiệp", "Phát triển kỹ năng mềm"];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      (doc.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.specialization || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.hospital || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === "Tất cả") return matchesSearch;
    return (doc.specialization || "").toLowerCase() === selectedCategory.toLowerCase() && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* ── Header ── */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer" aria-label="Mở menu">
              <Icon name="menu" size={24} />
            </button>
            <Link to="/student/dashboard" className="flex items-center gap-2 text-primary font-serif font-extrabold text-[17px] tracking-tight select-none">
              <Icon name="shield" filled size={22} />
              An Toàn Trường Học
            </Link>
            <nav className="hidden md:flex items-center gap-1 ml-6">
              <Link to="/student/dashboard" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
                <Icon name="home" size={18} /> Trang chủ
              </Link>
              <Link to="/student/qna" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
                <Icon name="forum" size={18} /> Hỏi đáp chung
              </Link>
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-[#0058bd] text-white shadow-sm">
                <Icon name="psychology" size={18} filled /> Chuyên gia tư vấn
              </span>
              <Link to="/student/appointments" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
                <Icon name="calendar_month" size={18} /> Lịch hẹn của tôi
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/30 hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0">
              <img src={user?.photoURL || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&auto=format&fit=crop"} alt="Ảnh đại diện" className="w-full h-full object-cover" />
            </button>
          </div>
        </header>

        {/* ── Body ── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-[1100px] w-full mx-auto animate-fade-in">
          {/* Banner tương tự Dashboard */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ebf3fe] via-[#f1f6ff] to-[#e4efff] border border-[#d3e5fe] px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="flex flex-col items-start text-left relative z-10 flex-1 min-w-0">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#0058bd]/8 text-[#0058bd] tracking-wide mb-3 inline-block whitespace-nowrap">
                Kết nối & sẻ chia
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-extrabold text-[#001a41] leading-snug tracking-tight mb-2">
                Không gian Tư vấn Chuyên nghiệp
              </h2>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-[560px]">
                Đội ngũ chuyên gia tâm lý học đường luôn sẵn sàng lắng nghe, hỗ trợ và đồng hành giúp bạn gỡ rối những khúc mắc trong cuộc sống và học tập.
              </p>
            </div>
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-inner">
              <Icon name="psychology" size={48} filled />
            </div>
          </section>

          {/* Search & Filter section */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#e8eaf0] rounded-3xl p-4 shadow-sm">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Icon name="search" size={20} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm chuyên gia theo tên, chuyên môn hoặc đơn vị..."
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3 text-sm text-[#1e293b] outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-[#f1f5f9] text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* Expert List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                {loadingDoctors ? "Đang tải danh sách..." : `Danh sách chuyên gia (${filteredDoctors.length})`}
              </h3>
            </div>

            {/* Loading skeleton */}
            {loadingDoctors ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-[#e8eaf0] rounded-3xl p-6 shadow-sm animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-24" />
                      </div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-4/5 mb-6" />
                    <div className="flex gap-2">
                      <div className="flex-1 h-11 bg-gray-100 rounded-2xl" />
                      <div className="flex-1 h-11 bg-gray-100 rounded-2xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white border border-[#e8eaf0] rounded-3xl p-8">
                <Icon name="person_search" size={56} style={{ color: "#cbd5e1" }} />
                <p className="text-base font-bold text-gray-600">Không tìm thấy chuyên gia phù hợp</p>
                <p className="text-sm text-gray-400 max-w-sm">Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor) => (
                  <div key={doctor.uid} className="bg-white border border-[#e8eaf0] rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group hover:-translate-y-1">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#e2e8f0] group-hover:border-blue-400 transition-colors shadow-sm">
                          {doctor.photoURL ? (
                            <img src={doctor.photoURL} alt={doctor.displayName || ""} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-700 font-extrabold text-xl">
                              {(doctor.displayName || "BS").split(" ").slice(-1)[0]?.[0] || "B"}
                            </div>
                          )}
                        </div>
                        {/* Online indicator */}
                        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-400 shadow-sm" title="Đang hoạt động" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-extrabold text-[#1e293b] truncate group-hover:text-blue-800 transition-colors">
                          {doctor.displayName}
                        </h3>
                        <p className="text-xs font-bold text-blue-600 mt-0.5">{doctor.specialization || "Chuyên gia tâm lý"}</p>
                        {doctor.hospital && (
                          <p className="text-[11px] text-gray-500 truncate mt-1 flex items-center gap-1">
                            <span>🏥</span> {doctor.hospital}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
                      Đồng hành cùng học sinh trong các vấn đề tâm lý học đường, hỗ trợ định hướng và giải quyết xung đột cuộc sống.
                    </p>

                    {/* License badge */}
                    {doctor.licenseNumber && (
                      <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl w-fit">
                        <Icon name="verified" size={13} style={{ color: "#0058bd" }} filled />
                        <span className="text-[10px] font-bold text-blue-700">Đã kiểm duyệt · {doctor.licenseNumber}</span>
                      </div>
                    )}

                    <div className="flex-1" />

                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                      {/* Xem thông tin */}
                      <button
                        id={`btn-info-${doctor.uid}`}
                        onClick={() => { setViewDoctor(doctor); setModalTab("info"); }}
                        className="flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-[#1e293b] text-xs font-bold px-3 py-3 rounded-2xl transition-all duration-200 cursor-pointer border border-[#e2e8f0]"
                        title="Xem hồ sơ chuyên môn"
                      >
                        <Icon name="info" size={16} />
                        Hồ sơ
                      </button>
                      {/* Chat với bác sĩ */}
                      <button
                        id={`btn-chat-${doctor.uid}`}
                        onClick={() => openDoctorChat(doctor)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-3 rounded-2xl transition-all duration-200 cursor-pointer text-white"
                        style={{
                          background: "linear-gradient(135deg, #1a73e8 0%, #0058bd 100%)",
                          boxShadow: "0 4px 12px rgba(0,88,189,0.25)",
                        }}
                      >
                        <Icon name="chat_bubble" size={15} /> Chat ngay
                      </button>
                      {/* Đặt lịch */}
                      <button
                        id={`btn-book-${doctor.uid}`}
                        onClick={() => setBookingDoctor(doctor)}
                        className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3.5 py-3 rounded-2xl transition-all duration-200 cursor-pointer"
                        title="Đặt lịch tư vấn trực tiếp"
                      >
                        <Icon name="calendar_month" size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ──── DOCTOR INFO MODAL ──── */}
      {viewDoctor && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backgroundColor: "rgba(10, 15, 29, 0.6)",
            backdropFilter: "blur(12px)",
            zIndex: 99999,
            animation: "fadeIn 0.25s ease-out"
          }}
          onClick={() => setViewDoctor(null)}
        >
          <div
            className="bg-white flex flex-col border border-[#e4efff] overflow-hidden"
            style={{
              width: "calc(100% - 32px)",
              maxWidth: "520px",
              height: "auto",
              maxHeight: "90vh",
              borderRadius: "32px",
              boxShadow: "0 25px 60px -15px rgba(0, 88, 189, 0.35)",
              animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="relative flex flex-col items-center pt-12 pb-6 px-6" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #3b82f6 100%)" }}>
              <button
                onClick={() => setViewDoctor(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer border-none"
              >
                <Icon name="close" size={18} />
              </button>
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 shadow-xl mb-3 relative">
                {viewDoctor.photoURL ? (
                  <img src={viewDoctor.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-white font-extrabold text-3xl">
                    {(viewDoctor.displayName || "BS").split(" ").slice(-1)[0]?.[0] || "B"}
                  </div>
                )}
              </div>
              
              <h2 className="text-white font-black text-xl text-center tracking-tight">{viewDoctor.displayName}</h2>
              
              <span className="mt-1 px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-blue-100 tracking-wide uppercase">
                {viewDoctor.specialization || "Chuyên gia tư vấn"}
              </span>

              {/* Star Rating Section */}
              <div className="flex items-center gap-1 bg-amber-500/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-black text-amber-200 mt-3 select-none">
                <Icon name="star" size={14} className="text-amber-400" filled />
                <span>4.9 / 5.0 (18 đánh giá chuyên môn)</span>
              </div>
            </div>

            {/* Tab Switched Header */}
            <div className="flex border-b border-gray-100 px-6 bg-gray-50/50">
              {[
                { id: "info", label: "Giới thiệu & Liên hệ" },
                { id: "experience", label: "Kinh nghiệm & Bằng cấp" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id as any)}
                  className={`flex-1 py-3.5 text-xs font-bold border-b-2 text-center transition-all cursor-pointer ${
                    modalTab === tab.id
                      ? "border-blue-600 text-blue-600 font-extrabold"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Doctor info content (Scrollable if height exceeds) */}
            <div className="p-6 overflow-y-auto max-h-[420px] flex flex-col gap-4 no-scrollbar">
              {modalTab === "info" ? (
                <>
                  <p className="text-xs text-gray-500 leading-relaxed italic text-center px-4 bg-[#f8fafc] py-3 rounded-2xl border border-gray-100">
                    "{viewDoctor.bio || "Tôi luôn tin rằng mỗi học sinh đều có tiềm năng vượt qua thử thách khi có một người đồng hành tin cậy sẵn sàng lắng nghe."}"
                  </p>

                  <div className="grid grid-cols-1 gap-2.5">
                    {viewDoctor.hospital && (
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-blue-50/40 border border-blue-100/50">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Icon name="domain" size={16} className="text-blue-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Đơn vị công tác</p>
                          <p className="text-xs font-extrabold text-gray-800 truncate">{viewDoctor.hospital}</p>
                        </div>
                      </div>
                    )}
                    {viewDoctor.licenseNumber && (
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#f8fafc] border border-gray-200/60">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                          <Icon name="verified" size={15} style={{ color: "#059669" }} filled />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Chứng chỉ hành nghề</p>
                          <p className="text-xs font-extrabold text-gray-800 truncate">{viewDoctor.licenseNumber}</p>
                        </div>
                      </div>
                    )}
                    {viewDoctor.phone && (
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#f8fafc] border border-gray-200/60">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 border border-purple-100">
                          <Icon name="phone" size={15} style={{ color: "#7c3aed" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Số điện thoại</p>
                          <p className="text-xs font-extrabold text-gray-800 truncate">{viewDoctor.phone}</p>
                        </div>
                      </div>
                    )}
                    {viewDoctor.email && (
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#f8fafc] border border-gray-200/60">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 border border-orange-100">
                          <Icon name="mail" size={15} style={{ color: "#ea580c" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Hòm thư điện tử</p>
                          <p className="text-xs font-extrabold text-[#334155] truncate">{viewDoctor.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Experience */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
                      <Icon name="medical_services" size={15} className="text-blue-600" />
                      Kinh nghiệm lâm sàng & làm việc
                    </h4>
                    <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-2xl border border-gray-100/70 min-h-[90px]">
                      {viewDoctor.experience || "Chuyên gia chưa cập nhật thông tin về kinh nghiệm làm việc."}
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
                      <Icon name="school" size={15} className="text-blue-600" />
                      Học vấn & Thành tích nổi bật
                    </h4>
                    <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-2xl border border-gray-100/70 min-h-[90px]">
                      {viewDoctor.achievements || "Chuyên gia chưa cập nhật thông tin về học vấn, thành tích."}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions footer */}
              <div className="flex gap-3 mt-2 border-t border-gray-100 pt-4 flex-shrink-0">
                <button
                  onClick={() => { setViewDoctor(null); setBookingDoctor(viewDoctor); }}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-extrabold bg-[#f1f5f9] hover:bg-gray-200 text-gray-700 cursor-pointer border-none transition-colors"
                >
                  Đặt lịch hẹn
                </button>
                <button
                  onClick={() => { setViewDoctor(null); openDoctorChat(viewDoctor); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-extrabold text-white cursor-pointer border-none transition-all shadow-md shadow-blue-500/15"
                  style={{ background: "linear-gradient(135deg, #1a73e8 0%, #0058bd 100%)" }}
                >
                  <Icon name="chat_bubble" size={15} /> Chat ngay
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ──── BOOKING POPUP ──── */}
      {bookingDoctor && createPortal(
        <BookingModal
          expert={toBookingExpert(bookingDoctor)}
          onClose={() => setBookingDoctor(null)}
          db={db}
          user={user}
        />,
        document.body
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
