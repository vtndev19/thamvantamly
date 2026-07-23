import { useState, useRef, useEffect } from "react";
import { Link, redirect } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import "../../src/config/firebase";
import { useAuth } from "../../src/contexts/AuthContext";

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

// ─── Experts Data ─────────────────────────────────────────────────────────────

const EXPERTS = [
  {
    id: "e1",
    name: "ThS. Trần Thị Lan",
    specialty: "Tâm lý học đường",
    description: "Chuyên gia tư vấn các vấn đề về áp lực học tập, mối quan hệ bạn bè và bạo lực học đường.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    status: "online",
    greeting: "Xin chào! Tôi là ThS. Trần Thị Lan, chuyên gia tâm lý học đường. Bạn có thể chia sẻ vấn đề bạn đang gặp phải, tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. 💙",
  },
  {
    id: "e2",
    name: "TS. Nguyễn Văn Nam",
    specialty: "Tư vấn hướng nghiệp",
    description: "Hỗ trợ định hướng nghề nghiệp, giải tỏa căng thẳng trước các kỳ thi quan trọng.",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
    status: "offline",
    greeting: "Chào bạn! Tôi là TS. Nguyễn Văn Nam. Hiện tại tôi đang ngoại tuyến, nhưng câu hỏi của bạn sẽ được ghi lại và tôi sẽ phản hồi sớm nhất có thể. 🌟",
  },
  {
    id: "e3",
    name: "Chuyên viên Lê Hoàng",
    specialty: "Phát triển kỹ năng mềm",
    description: "Đồng hành cùng học sinh trong việc rèn luyện sự tự tin, kỹ năng giao tiếp và xử lý tình huống.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&auto=format&fit=crop",
    status: "online",
    greeting: "Chào bạn! Tôi là chuyên viên Lê Hoàng. Hãy cứ tự nhiên chia sẻ nhé – không có câu hỏi nào là nhỏ cả. Tôi ở đây để đồng hành cùng bạn! 🤝",
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
  expert: typeof EXPERTS[0];
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

  const STEPS_LABELS = ["Chọn ngày", "Chọn giờ", "Chi tiết"];
  const stepIndex = step === "calendar" ? 0 : step === "timeslot" ? 1 : step === "details" ? 2 : 3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      style={{ animation: "fadeIn 0.2s ease" }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden flex flex-col"
        style={{ animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-6 py-4 border-b border-white/20 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #1a73e8 0%, #0058bd 100%)" }}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon name="calendar_month" size={22} style={{ color: "white" }} filled />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Đặt lịch hẹn</p>
            <p className="text-white/70 text-[11px]">{expert.name} · {expert.specialty}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer flex-shrink-0"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* ── Step Indicator (only for non-success steps) ── */}
        {step !== "success" && (
          <div className="flex items-center gap-0 px-6 py-3 bg-surface-container/30 border-b border-outline-variant/20 flex-shrink-0">
            {STEPS_LABELS.map((label, idx) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 transition-colors ${
                      idx < stepIndex
                        ? "bg-primary text-on-primary"
                        : idx === stepIndex
                        ? "bg-primary text-on-primary ring-2 ring-primary/30 ring-offset-1"
                        : "bg-outline-variant/30 text-on-surface-variant"
                    }`}
                  >
                    {idx < stepIndex ? <Icon name="check" size={12} /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-semibold hidden sm:block ${idx === stepIndex ? "text-primary" : "text-on-surface-variant"}`}>
                    {label}
                  </span>
                </div>
                {idx < STEPS_LABELS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-2 rounded ${idx < stepIndex ? "bg-primary" : "bg-outline-variant/30"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* STEP 1: Calendar */}
          {step === "calendar" && (
            <div className="p-6 flex flex-col gap-5">
              <div>
                <h3 className="text-base font-bold text-on-surface mb-1">Chọn ngày hẹn</h3>
                <p className="text-xs text-on-surface-variant">Nhấn vào ngày bạn muốn đặt lịch (không thể chọn ngày trong quá khứ).</p>
              </div>

              <div className="bg-surface-container/20 rounded-2xl p-4 border border-outline-variant/20">
                <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
              </div>

              {/* Selected date display */}
              <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all ${selectedDate ? "bg-primary/5 border-primary/30" : "bg-surface-container/30 border-outline-variant/20"}`}>
                <Icon name="event" size={20} style={{ color: selectedDate ? "#0058bd" : "#9ca3af" }} />
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant">Ngày đã chọn</p>
                  <p className={`text-sm font-bold ${selectedDate ? "text-primary" : "text-on-surface-variant/50"}`}>
                    {selectedDate ? formatDateVI(selectedDate) : "Chưa chọn ngày"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!selectedDate}
                onClick={handleDateConfirm}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-2xl text-sm font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              >
                Xác nhận ngày
                <Icon name="arrow_forward" size={18} />
              </button>
            </div>
          )}

          {/* STEP 2: Time Slot */}
          {step === "timeslot" && (
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep("calendar")}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer transition-colors flex-shrink-0"
                >
                  <Icon name="arrow_back" size={18} />
                </button>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Chọn khung giờ</h3>
                  <p className="text-xs text-on-surface-variant">Ngày: <strong className="text-primary">{formatDateVI(selectedDate)}</strong></p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`py-3 text-sm font-bold rounded-2xl border transition-all duration-150 cursor-pointer ${
                      selectedTime === slot
                        ? "bg-primary text-on-primary border-primary shadow-md scale-105"
                        : "bg-surface-container/30 text-on-surface-variant border-outline-variant/40 hover:border-primary hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {selectedTime && (
                <div className="flex items-center gap-3 bg-primary/5 border border-primary/30 rounded-2xl px-4 py-3">
                  <Icon name="schedule" size={20} style={{ color: "#0058bd" }} />
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant">Giờ đã chọn</p>
                    <p className="text-sm font-bold text-primary">{selectedTime}</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={!selectedTime}
                onClick={handleTimeConfirm}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-2xl text-sm font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              >
                Xác nhận giờ
                <Icon name="arrow_forward" size={18} />
              </button>
            </div>
          )}

          {/* STEP 3: Details */}
          {step === "details" && (
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep("timeslot")}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer transition-colors flex-shrink-0"
                >
                  <Icon name="arrow_back" size={18} />
                </button>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Chi tiết lịch hẹn</h3>
                  <p className="text-xs text-on-surface-variant">{formatDateVI(selectedDate)} · {selectedTime}</p>
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
                <img src={expert.avatar} alt={expert.name} className="w-11 h-11 rounded-full object-cover border-2 border-primary/20" />
                <div>
                  <p className="text-sm font-bold text-on-surface">{expert.name}</p>
                  <p className="text-[11px] text-primary font-semibold">{expert.specialty}</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    📅 {formatDateVI(selectedDate)} &nbsp;·&nbsp; 🕐 {selectedTime}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="appt-reason" className="text-sm font-bold text-on-surface">
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
                          ? "bg-primary text-on-primary border-primary shadow-sm"
                          : "bg-surface-container/30 text-on-surface-variant border-outline-variant/40 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="appt-note" className="text-sm font-bold text-on-surface">
                  Ghi chú thêm <span className="text-[11px] text-on-surface-variant font-normal">(không bắt buộc)</span>
                </label>
                <textarea
                  id="appt-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Mô tả ngắn gọn vấn đề bạn muốn chia sẻ..."
                  rows={3}
                  className="w-full bg-surface-container/30 border border-outline-variant/50 rounded-2xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !reason}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-2xl text-sm font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              >
                {isSubmitting
                  ? <><Icon name="sync" size={18} /> Đang đặt lịch...</>
                  : <><Icon name="event_available" size={18} /> Xác nhận đặt lịch</>}
              </button>
            </form>
          )}

          {/* STEP 4: Success */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-4 min-h-[300px]">
              <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-2" style={{ animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <Icon name="check_circle" size={52} filled style={{ color: "#10b981" }} />
              </div>
              <h3 className="text-xl font-bold text-on-surface">Đặt lịch thành công!</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed max-w-[280px]">
                Lịch hẹn với <strong>{expert.name}</strong> vào{" "}
                <strong>{selectedTime}</strong> ngày{" "}
                <strong>{formatDateVI(selectedDate)}</strong> đã được ghi nhận. Chuyên gia sẽ xác nhận sớm nhất có thể.
              </p>
              <div className="flex gap-3 mt-2 flex-wrap justify-center">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-sm font-bold bg-surface-container hover:bg-surface-container/80 text-on-surface transition-colors cursor-pointer border border-outline-variant/30"
                >
                  Đóng
                </button>
                <Link
                  to="/student/appointments"
                  className="px-5 py-2.5 rounded-full text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                  onClick={onClose}
                >
                  <Icon name="calendar_month" size={16} />
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

  // Chat state
  const [chatExpert, setChatExpert] = useState<typeof EXPERTS[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Booking state
  const [bookingExpert, setBookingExpert] = useState<typeof EXPERTS[0] | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const db = getFirestore(getApp());

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { if (chatExpert) setTimeout(() => inputRef.current?.focus(), 100); }, [chatExpert]);

  const handleOpenChat = (expert: typeof EXPERTS[0]) => {
    setChatExpert(expert);
    setInputText("");
    setMessages([{ id: "greeting", sender: "expert", text: expert.greeting, time: getNow() }]);
  };

  const handleCloseChat = () => { setChatExpert(null); setMessages([]); setInputText(""); setIsTyping(false); };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatExpert || isSubmitting) return;
    const msg: Message = { id: Date.now().toString(), sender: "student", text: inputText.trim(), time: getNow() };
    setMessages((p) => [...p, msg]);
    const sent = inputText.trim();
    setInputText("");
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "expert_questions"), {
        expertId: chatExpert.id, expertName: chatExpert.name,
        studentId: user?.uid, studentName: user?.displayName || "Học sinh",
        content: sent, status: "pending", createdAt: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
    setIsSubmitting(false);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        "Cảm ơn bạn đã chia sẻ! Tôi sẽ phản hồi chi tiết sớm nhất có thể. 📝",
        "Tôi hiểu vấn đề của bạn. Hãy để tôi xem xét và đưa ra lời khuyên phù hợp! 💙",
        "Câu hỏi của bạn rất hay! Bạn có thể chia sẻ thêm không? 🌟",
      ];
      setMessages((p) => [...p, { id: Date.now() + "_r", sender: "expert", text: replies[Math.floor(Math.random() * replies.length)], time: getNow() }]);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
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
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm">
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
        <main className="flex-1 overflow-y-auto p-5 md:p-8 animate-fade-in">
          <div className="max-w-[1050px] mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-on-surface mb-2">Đội ngũ Chuyên gia Tư vấn</h1>
              <p className="text-sm text-on-surface-variant">Chọn một chuyên gia phù hợp với vấn đề của bạn để nhận được lời khuyên và sự hỗ trợ tốt nhất.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {EXPERTS.map((expert) => (
                <div key={expert.id} className="bg-white border border-[#e8eaf0] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <img src={expert.avatar} alt={expert.name} className="w-16 h-16 rounded-full object-cover border-2 border-surface-container group-hover:border-primary/30 transition-colors" />
                      <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: expert.status === "online" ? "#10b981" : "#9ca3af" }} title={expert.status === "online" ? "Đang trực tuyến" : "Ngoại tuyến"} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">{expert.name}</h3>
                      <p className="text-xs font-semibold text-primary">{expert.specialty}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: expert.status === "online" ? "#10b981" : "#9ca3af" }}>
                        ● {expert.status === "online" ? "Đang trực tuyến" : "Ngoại tuyến"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed flex-1 mb-6">{expert.description}</p>
                  <div className="flex gap-2">
                    <button
                      id={`btn-chat-${expert.id}`}
                      onClick={() => handleOpenChat(expert)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary text-sm font-bold px-3 py-3 rounded-2xl transition-all duration-200 cursor-pointer"
                    >
                      <Icon name="chat_bubble" size={17} /> Hỏi đáp riêng
                    </button>
                    <button
                      id={`btn-book-${expert.id}`}
                      onClick={() => setBookingExpert(expert)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-surface-container hover:bg-secondary/20 text-on-surface-variant hover:text-on-surface text-sm font-bold px-3 py-3 rounded-2xl transition-all duration-200 cursor-pointer border border-outline-variant/40"
                    >
                      <Icon name="calendar_month" size={17} /> Đặt lịch hẹn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* ──── CHAT POPUP ──── */}
      {chatExpert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/30 backdrop-blur-sm" style={{ animation: "fadeIn 0.2s ease" }} onClick={handleCloseChat}>
          <div className="flex flex-col bg-white rounded-[28px] shadow-2xl overflow-hidden" style={{ width: "min(480px, calc(100vw - 2rem))", height: "min(680px, calc(100vh - 4rem))", animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)" }} onClick={(e) => e.stopPropagation()}>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/20 flex-shrink-0" style={{ background: "linear-gradient(135deg, #0058bd 0%, #1a73e8 100%)" }}>
              <div className="relative flex-shrink-0">
                <img src={chatExpert.avatar} alt={chatExpert.name} className="w-11 h-11 rounded-full object-cover border-2 border-white/40" />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: chatExpert.status === "online" ? "#10b981" : "#9ca3af" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{chatExpert.name}</p>
                <p className="text-white/70 text-[11px]">{chatExpert.specialty}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: chatExpert.status === "online" ? "#6ee7b7" : "#d1d5db" }}>● {chatExpert.status === "online" ? "Đang trực tuyến" : "Ngoại tuyến"}</p>
              </div>
              <button onClick={handleCloseChat} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex-shrink-0"><Icon name="close" size={20} /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4" style={{ background: "#f5f7fb" }}>
              {messages.map((msg) => {
                const isStudent = msg.sender === "student";
                return (
                  <div key={msg.id} className={`flex items-end gap-2.5 ${isStudent ? "flex-row-reverse" : "flex-row"}`}>
                    {!isStudent && <img src={chatExpert.avatar} alt={chatExpert.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mb-1" />}
                    <div className={`max-w-[75%] flex flex-col ${isStudent ? "items-end" : "items-start"}`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isStudent ? "bg-primary text-on-primary rounded-br-md" : "bg-white text-on-surface rounded-bl-md border border-outline-variant/20"}`} style={{ wordBreak: "break-word" }}>{msg.text}</div>
                      <span className="text-[10px] text-on-surface-variant mt-1 px-1">{msg.time}</span>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex items-end gap-2.5">
                  <img src={chatExpert.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mb-1" />
                  <div className="bg-white border border-outline-variant/20 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-on-surface-variant/40 rounded-full" style={{ animation: "bounce 1s infinite" }} />
                    <span className="w-2 h-2 bg-on-surface-variant/40 rounded-full" style={{ animation: "bounce 1s infinite 0.2s" }} />
                    <span className="w-2 h-2 bg-on-surface-variant/40 rounded-full" style={{ animation: "bounce 1s infinite 0.4s" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-outline-variant/20 bg-white px-4 py-3">
              <div className="flex items-end gap-3 bg-surface-container/40 rounded-2xl px-4 py-2.5 border border-outline-variant/30 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                <textarea ref={inputRef} id="chat-input" value={inputText} onChange={(e) => { setInputText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }} onKeyDown={handleKeyDown} placeholder="Nhập tin nhắn... (Enter để gửi)" rows={1} className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none resize-none leading-relaxed py-0.5" style={{ maxHeight: "120px" }} disabled={isSubmitting} />
                <button id="btn-send-message" onClick={handleSendMessage} disabled={!inputText.trim() || isSubmitting} className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm">
                  {isSubmitting ? <Icon name="sync" size={18} /> : <Icon name="send" size={18} />}
                </button>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-2 text-center">🔒 Nội dung trò chuyện được bảo mật.</p>
            </div>
          </div>
        </div>
      )}

      {/* ──── BOOKING POPUP ──── */}
      {bookingExpert && (
        <BookingModal
          expert={bookingExpert}
          onClose={() => setBookingExpert(null)}
          db={db}
          user={user}
        />
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
