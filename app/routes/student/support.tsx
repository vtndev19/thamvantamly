import { useState } from "react";
import { Link } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";

export function meta() {
  return [
    { title: "Hỗ trợ khẩn cấp – SafeSchool Hub" },
    {
      name: "description",
      content:
        "Trang hỗ trợ khẩn cấp dành cho học sinh. Gọi ngay đường dây hỗ trợ tâm lý và an toàn học đường 24/7.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

// ── Data ────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    step: 1,
    title: "Di chuyển đến nơi an toàn",
    desc: "Tìm một khu vực đông người hoặc phòng có thể khóa cửa lại.",
  },
  {
    step: 2,
    title: "Giữ bình tĩnh",
    desc: "Hít thở sâu. Đừng cố gắng đối đầu nếu không cần thiết.",
  },
  {
    step: 3,
    title: "Bấm gọi hỗ trợ",
    desc: "Sử dụng nút gọi khẩn cấp bên cạnh hoặc gọi cho người tin cậy.",
  },
];

const CONTACTS = [
  {
    name: "An ninh nhà trường",
    sub: "Trực 24/7 tại khuôn viên",
    icon: "shield",
    iconBg: "#e8ecf4",
    iconColor: "#0058bd",
  },
  {
    name: "Chuyên gia tâm lý trực ban",
    sub: "Cô Lan – Phòng Y tế",
    icon: "psychology",
    iconBg: "#fff2e8",
    iconColor: "#994100",
  },
];

const HOT_LINES = [
  { number: "111", label: "Tổng đài Trẻ em" },
  { number: "113", label: "Cảnh sát" },
];

// ── Page ────────────────────────────────────────────────────────────────────
export default function StudentSupportPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* ── Top Header ── */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          {/* Left: burger + logo/tabs */}
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>

            {/* Logo */}
            <Link
              to="/student/dashboard"
              className="flex items-center gap-2 text-primary font-serif font-extrabold text-[17px] tracking-tight select-none"
            >
              <Icon name="shield" filled size={22} />
              An Toàn Trường Học
            </Link>

            {/* Tab nav (hidden on mobile) */}
            <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="Support navigation">
              {[
                { label: "Trang chủ", to: "/student/dashboard", icon: "home" },
                { label: "Báo cáo", to: "/student/reports", icon: "add_circle" },
                { label: "Hồ sơ", to: "/student/profile", icon: "history" },
              ].map((tab) => (
                <Link
                  key={tab.label}
                  to={tab.to}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                >
                  <Icon name={tab.icon} size={18} />
                  {tab.label}
                </Link>
              ))}
              {/* Active Tab: Hỗ trợ */}
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm">
                <Icon name="emergency" size={18} filled />
                Hỗ trợ
              </span>
            </nav>
          </div>

          {/* Right: actions + avatar */}
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Thông báo"
            >
              <Icon name="notifications" size={22} />
            </button>
            <button
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Trợ giúp"
            >
              <Icon name="help" size={22} />
            </button>
            <button className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/30 hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&auto=format&fit=crop"
                alt="Ảnh đại diện"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* ── Body ── */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8 animate-fade-in">
          <div className="max-w-[1000px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

            {/* ──── LEFT COLUMN ──── */}
            <div className="flex flex-col gap-4">

              {/* Emergency Call Card */}
              <div className="relative overflow-hidden rounded-3xl bg-[#fff0f0] border border-[#ffd9d9] px-8 py-10 flex flex-col items-center text-center gap-5 shadow-sm">
                {/* Warning icon */}
                <div className="w-16 h-16 rounded-full bg-[#ffdad6] flex items-center justify-center">
                  <Icon name="warning" size={30} filled style={{ color: "#ba1a1a" }} />
                </div>

                <div>
                  <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-[#7b0000] leading-snug mb-3">
                    Bạn đang cần trợ giúp khẩn cấp?
                  </h1>
                  <p className="text-sm md:text-base text-[#ba1a1a]/80 font-medium leading-relaxed max-w-sm mx-auto">
                    Chúng tôi ở đây để giúp bạn. Đừng ngần ngại liên hệ nếu bạn cảm thấy không an toàn.
                  </p>
                </div>

                {/* Big CTA Button */}
                <button className="flex items-center gap-3 bg-[#ba1a1a] hover:bg-[#9a1414] active:scale-95 text-white text-base font-extrabold px-10 py-4 rounded-full shadow-lg transition-all duration-200 cursor-pointer tracking-wide">
                  <Icon name="call" size={22} filled />
                  GỌI HỖ TRỢ NGAY
                </button>
              </div>

              {/* Location Share Card */}
              <div className="flex items-center gap-4 bg-white border border-[#e8eaf0] rounded-2xl px-6 py-4 shadow-sm">
                <div className="w-11 h-11 rounded-full bg-[#ffdad6] flex items-center justify-center flex-shrink-0">
                  <Icon name="location_on" size={22} filled style={{ color: "#ba1a1a" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface">Chia sẻ vị trí khẩn cấp</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Gửi vị trí hiện tại của bạn cho đội ngũ an ninh nhà trường.
                  </p>
                </div>
                <button className="flex-shrink-0 px-4 py-2 rounded-full border-2 border-[#ba1a1a] text-[#ba1a1a] text-xs font-bold hover:bg-[#ba1a1a] hover:text-white transition-all duration-200 cursor-pointer whitespace-nowrap">
                  Gửi cảnh báo vị trí
                </button>
              </div>
            </div>

            {/* ──── RIGHT COLUMN ──── */}
            <div className="flex flex-col gap-5">

              {/* Steps Card */}
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-5">
                  <Icon name="psychology" size={22} filled style={{ color: "#0058bd" }} />
                  <h2 className="text-base font-serif font-bold text-on-surface leading-snug">
                    Các bước cần làm nếu bạn không an toàn
                  </h2>
                </div>
                <div className="flex flex-col gap-4">
                  {STEPS.map((s) => (
                    <div key={s.step} className="flex items-start gap-4">
                      <span className="w-7 h-7 rounded-full bg-primary text-on-primary text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {s.step}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-on-surface mb-0.5">{s.title}</p>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contacts Card */}
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <Icon name="contacts" size={20} filled style={{ color: "#0058bd" }} />
                  <h2 className="text-base font-serif font-bold text-on-surface">Danh bạ liên hệ</h2>
                </div>
                <div className="flex flex-col divide-y divide-outline-variant/20">
                  {CONTACTS.map((c, i) => (
                    <div key={i} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: c.iconBg }}
                      >
                        <Icon name={c.icon} size={20} filled style={{ color: c.iconColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface">{c.name}</p>
                        <p className="text-[11px] text-on-surface-variant">{c.sub}</p>
                      </div>
                      <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors cursor-pointer flex-shrink-0">
                        <Icon name="phone_forwarded" size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hotline Numbers */}
              <div className="grid grid-cols-2 gap-4">
                {HOT_LINES.map((h) => (
                  <button
                    key={h.number}
                    className="bg-white border border-[#e8eaf0] rounded-2xl p-4 text-center hover:shadow-md hover:border-[#ffdad6] transition-all duration-200 cursor-pointer group"
                  >
                    <p className="text-2xl font-extrabold text-[#ba1a1a] group-hover:scale-105 transition-transform duration-200">
                      {h.number}
                    </p>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">{h.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
