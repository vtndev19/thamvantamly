import { useState } from "react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { Icon } from "../../components/ui/Icon";

export function meta() {
  return [
    { title: "Báo cáo & Phân tích – SafeSchool Hub Admin" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const REPORT_STATS = [
  { label: "Tổng báo cáo", value: "248", delta: "+12 tháng này", icon: "flag", color: "#ba1a1a", bg: "#ffdad6" },
  { label: "Đang xử lý", value: "34", delta: "Cần xem xét", icon: "pending_actions", color: "#994100", bg: "#fff2e8" },
  { label: "Đã giải quyết", value: "201", delta: "81% tỉ lệ xử lý", icon: "task_alt", color: "#059669", bg: "#d1fae5" },
  { label: "Khẩn cấp", value: "13", delta: "Ưu tiên cao", icon: "warning", color: "#dc2626", bg: "#fee2e2" },
];

const RECENT_REPORTS = [
  { id: "R001", type: "Bạo lực thể chất", reporter: "Ẩn danh", grade: "10A1", date: "17/07/2026", severity: "high", status: "pending" },
  { id: "R002", type: "Bắt nạt trực tuyến", reporter: "Ẩn danh", grade: "11B2", date: "16/07/2026", severity: "medium", status: "processing" },
  { id: "R003", type: "Căng thẳng học tập", reporter: "Nam N.", grade: "12A3", date: "15/07/2026", severity: "low", status: "resolved" },
  { id: "R004", type: "Xung đột bạn bè", reporter: "Ẩn danh", grade: "10C1", date: "14/07/2026", severity: "medium", status: "resolved" },
  { id: "R005", type: "Bạo lực ngôn từ", reporter: "Ẩn danh", grade: "9A2", date: "13/07/2026", severity: "high", status: "pending" },
];

const SEVERITY_CONFIG = {
  high: { label: "Cao", color: "#dc2626", bg: "#fee2e2" },
  medium: { label: "Trung bình", color: "#994100", bg: "#fff2e8" },
  low: { label: "Thấp", color: "#059669", bg: "#d1fae5" },
};

const STATUS_CONFIG = {
  pending: { label: "Chờ xử lý", color: "#994100", bg: "#fff2e8" },
  processing: { label: "Đang xử lý", color: "#0058bd", bg: "#e8f0fe" },
  resolved: { label: "Đã xử lý", color: "#059669", bg: "#d1fae5" },
};

export default function AdminReportsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-container-low">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer" aria-label="Mở menu">
              <Icon name="menu" size={24} />
            </button>
            <h2 className="text-lg font-serif font-bold text-primary tracking-tight">SafeSchool Hub</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer">
              <Icon name="notifications" size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1200px] w-full mx-auto animate-fade-in space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-base font-semibold text-on-surface">Báo cáo & Phân tích</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">Tổng hợp tình hình báo cáo an toàn học đường</p>
            </div>
            <button
              id="btn-export-report"
              className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
            >
              <Icon name="download" size={18} style={{ color: "white" }} />
              Xuất báo cáo
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {REPORT_STATS.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-[#e8eaf0] shadow-xs p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                    <Icon name={s.icon} size={20} filled style={{ color: s.color }} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-on-surface">{s.value}</p>
                <p className="text-xs font-semibold text-on-surface mt-0.5">{s.label}</p>
                <p className="text-[11px] text-on-surface-variant mt-1">{s.delta}</p>
              </div>
            ))}
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-2xl border border-[#e8eaf0] shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e8eaf0] flex items-center gap-2">
              <Icon name="flag" size={18} filled style={{ color: "#ba1a1a" }} />
              <h2 className="text-sm font-bold text-on-surface">Báo cáo gần đây</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e8eaf0] bg-surface-container-low">
                    <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Mã</th>
                    <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Loại phản ánh</th>
                    <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Lớp</th>
                    <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Mức độ</th>
                    <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Ngày</th>
                    <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Trạng thái</th>
                    <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {RECENT_REPORTS.map((r) => {
                    const sev = SEVERITY_CONFIG[r.severity as keyof typeof SEVERITY_CONFIG];
                    const st = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG];
                    return (
                      <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-5 py-3.5 text-xs font-mono text-on-surface-variant">{r.id}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-on-surface">{r.type}</td>
                        <td className="px-5 py-3.5 text-sm text-on-surface-variant">{r.grade}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ backgroundColor: sev.bg, color: sev.color }}>{sev.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-on-surface-variant">{r.date}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer">
                            <Icon name="open_in_new" size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
