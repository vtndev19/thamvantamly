import { useState } from "react";
import { Link, redirect } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import "../../src/config/firebase";
import { useAuth } from "../../src/contexts/AuthContext";
import { IncidentReportModal } from "../../components/student/IncidentReportModal";

export function meta() {
  return [
    { title: "Hỗ trợ khẩn cấp & Phản ánh – SafeSchool Hub" },
    {
      name: "description",
      content:
        "Trang hỗ trợ khẩn cấp và báo cáo vụ việc bạo lực học đường dành cho học sinh.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function clientLoader() {
  const auth = getAuth(getApp());

  const user = await new Promise<import("firebase/auth").User | null>(
    (resolve) => {
      const unsubscribe = auth.onAuthStateChanged((u) => {
        unsubscribe();
        resolve(u);
      });
    }
  );

  if (!user) {
    throw redirect("/auth/login?redirect=/student/support");
  }

  const role = localStorage.getItem("userRole");
  if (role && role !== "student") {
    throw redirect("/auth/login?error=access_denied");
  }

  return null;
}

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
    title: "Tạo phản ánh khẩn cấp",
    desc: "Bấm nút 'Tạo phản ánh' bên cạnh nút gọi khẩn cấp để gửi tới Giáo viên trường bạn.",
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

export default function StudentSupportPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const { user } = useAuth();
  const userSchoolCode = user?.schoolCode || "THPT001";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* ── Top Header ── */}
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

            <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="Support navigation">
              <Link
                to="/student/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="home" size={18} />
                Trang chủ
              </Link>
              <Link
                to="/student/reports"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="assignment" size={18} />
                Báo cáo của tôi
              </Link>
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm">
                <Icon name="emergency" size={18} filled />
                Hỗ trợ khẩn cấp
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Icon name="report_problem" size={18} filled />
              TẠO PHẢN ÁNH
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
          <div className="max-w-[1050px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

            {/* ──── LEFT COLUMN ──── */}
            <div className="flex flex-col gap-6">

              {/* Toast Success Alert */}
              {showSuccessToast && (
                <div className="flex items-start justify-between gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-4 rounded-2xl animate-fade-in shadow-sm">
                  <div className="flex items-center gap-3">
                    <Icon name="check_circle" size={22} filled style={{ color: "#059669" }} />
                    <div>
                      <p className="font-bold text-sm">Báo cáo đã gửi thành công!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Thông báo khẩn đã được chuyển tới hệ thống của các Giáo viên thuộc trường [{userSchoolCode}].
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSuccessToast(false)}
                    className="p-1 hover:bg-emerald-100 rounded-full cursor-pointer"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              )}

              {/* Emergency Call & Report Action Card */}
              <div className="relative overflow-hidden rounded-3xl bg-[#fff0f0] border border-[#ffd9d9] px-6 py-8 md:px-8 md:py-10 flex flex-col items-center text-center gap-5 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#ffdad6] flex items-center justify-center">
                  <Icon name="warning" size={32} filled style={{ color: "#ba1a1a" }} />
                </div>

                <div className="w-full text-center flex flex-col items-center justify-center" style={{ width: "100%", maxWidth: "550px" }}>
                  <h1 className="text-xl md:text-2xl font-serif font-extrabold text-[#7b0000] leading-snug mb-2 text-center" style={{ width: "100%", display: "block" }}>
                    Bạn cần trợ giúp hoặc muốn báo cáo bạo lực?
                  </h1>
                  <p className="text-xs md:text-sm text-[#7b0000] opacity-90 font-medium leading-relaxed text-center" style={{ width: "100%", display: "block" }}>
                    Nếu gặp nguy hiểm trực tiếp, gọi ngay hotline khẩn cấp. Để phản ánh vụ việc cho Giáo viên trường bạn, bấm nút Tạo phản ánh bên dưới.
                  </p>
                </div>

                {/* 2 Buttons Side-by-Side: Call Emergency & Create Report */}
                <div className="flex items-center justify-center gap-3 flex-wrap w-full">
                  <button className="flex items-center justify-center gap-2 bg-[#ba1a1a] hover:bg-[#9a1414] active:scale-95 text-white text-xs md:text-sm font-extrabold px-6 py-3.5 rounded-full shadow-md transition-all duration-200 cursor-pointer">
                    <Icon name="call" size={20} filled />
                    GỌI KHẨN CẤP (111 / 113)
                  </button>

                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-container active:scale-95 text-on-primary text-xs md:text-sm font-extrabold px-6 py-3.5 rounded-full shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <Icon name="report_problem" size={20} filled />
                    TẠO PHẢN ÁNH BẠO LỰC
                  </button>
                </div>
              </div>

              {/* Shortcut Card to Track Submitted Reports */}
              <div className="bg-white border border-[#e8eaf0] rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Icon name="assignment" size={24} filled />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Theo dõi phản ánh đã gửi</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                      Kiểm tra tiến độ và trạng thái xử lý (Chờ xử lý, Đang xử lý, Đã giải quyết) từ các Giáo viên trường bạn.
                    </p>
                  </div>
                </div>

                <Link
                  to="/student/reports"
                  className="inline-flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-5 py-3 rounded-2xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  Xem tiến độ phản ánh <Icon name="chevron_right" size={18} />
                </Link>
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

      {/* Incident Report Modal */}
      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={() => {
          setShowSuccessToast(true);
        }}
      />
    </div>
  );
}
