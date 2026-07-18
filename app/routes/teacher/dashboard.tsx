import { useState } from "react";
import { TeacherSidebar } from "../../components/teacher/TeacherSidebar";
import { Icon } from "../../components/ui/Icon";

export function meta() {
  return [
    { title: "Dashboard Giáo viên – SafeSchool Hub" },
    {
      name: "description",
      content: "Tổng quan hoạt động lớp học và hỗ trợ học sinh của giáo viên trên SafeSchool Hub.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const STATS = [
  { label: "Học sinh phụ trách", value: "128", icon: "groups", color: "#059669", bg: "#d1fae5" },
  { label: "Lớp học", value: "4", icon: "class", color: "#0058bd", bg: "#e8f0fe" },
  { label: "Báo cáo chờ xem", value: "7", icon: "pending_actions", color: "#994100", bg: "#fff2e8" },
  { label: "Buổi hỗ trợ hôm nay", value: "3", icon: "psychology", color: "#ba1a1a", bg: "#ffdad6" },
];

const RECENT_ALERTS = [
  { student: "Nguyễn Văn An", class: "10A1", message: "Có dấu hiệu căng thẳng học tập", time: "30 phút trước", severity: "medium" },
  { student: "Trần Thị Bình", class: "10A1", message: "Báo cáo bạo lực bạn bè", time: "1 giờ trước", severity: "high" },
  { student: "Lê Văn Cường", class: "11B2", message: "Vắng mặt không lý do (3 buổi)", time: "2 giờ trước", severity: "low" },
];

export default function TeacherDashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer" aria-label="Mở menu">
              <Icon name="menu" size={24} />
            </button>
            <h2 className="text-lg font-serif font-bold text-[#059669] tracking-tight">SafeSchool Hub</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer" aria-label="Thông báo">
              <Icon name="notifications" size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse" />
            </button>
            <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer" aria-label="Trợ giúp">
              <Icon name="help" size={22} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-[1100px] w-full mx-auto animate-fade-in">
          {/* Greeting */}
          <div>
            <h1 className="text-xl font-serif font-bold text-on-surface">Chào buổi sáng, cô Lan 👋</h1>
            <p className="text-xs text-on-surface-variant mt-1">Hôm nay có 3 học sinh cần chú ý đặc biệt</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-[#e8eaf0] shadow-xs p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
                  <Icon name={s.icon} size={20} filled style={{ color: s.color }} />
                </div>
                <p className="text-2xl font-extrabold text-on-surface">{s.value}</p>
                <p className="text-xs text-on-surface-variant font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Alerts + Quick Actions */}
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Recent Alerts */}
            <div className="flex-[2] bg-white rounded-2xl border border-[#e8eaf0] shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e8eaf0] flex items-center gap-2">
                <Icon name="warning" size={18} filled style={{ color: "#ba1a1a" }} />
                <h2 className="text-sm font-bold text-on-surface">Cảnh báo gần đây</h2>
              </div>
              <div className="divide-y divide-outline-variant/20">
                {RECENT_ALERTS.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-4">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.severity === "high" ? "bg-[#dc2626]" : a.severity === "medium" ? "bg-[#f59e0b]" : "bg-[#6ee7b7]"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface">{a.student} <span className="text-[11px] text-on-surface-variant font-normal">· {a.class}</span></p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{a.message}</p>
                      <p className="text-[11px] text-on-surface-variant/60 mt-1">{a.time}</p>
                    </div>
                    <button className="text-primary hover:underline text-xs font-semibold cursor-pointer flex-shrink-0">Xem</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex-1 bg-white rounded-2xl border border-[#e8eaf0] shadow-xs p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-on-surface mb-1">Thao tác nhanh</h2>
              {[
                { label: "Xem danh sách học sinh", icon: "groups", to: "/teacher/students" },
                { label: "Quản lý lớp học", icon: "class", to: "/teacher/classes" },
                { label: "Hỗ trợ tâm lý", icon: "psychology", to: "/teacher/support" },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.to}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-sm font-semibold text-on-surface transition-colors cursor-pointer"
                >
                  <Icon name={action.icon} size={18} filled style={{ color: "#059669" }} />
                  {action.label}
                  <Icon name="chevron_right" size={16} style={{ color: "#727785", marginLeft: "auto" }} />
                </a>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
