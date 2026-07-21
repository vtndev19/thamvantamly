import { useState } from "react";
import { TeacherSidebar } from "../../components/teacher/TeacherSidebar";
import { Icon } from "../../components/ui/Icon";

export function meta() {
  return [
    { title: "Hỗ trợ tâm lý – SafeSchool Hub Giáo viên" },
    {
      name: "description",
      content: "Quản lý và hỗ trợ học sinh cần tư vấn tâm lý trong lớp học.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const SUPPORT_CASES = [
  {
    id: "C001",
    student: "Nguyễn Văn An",
    class: "10A1",
    issue: "Căng thẳng thi cử",
    assigned: "ThS. Nguyễn Thu Hà",
    date: "17/07/2026",
    status: "open",
    priority: "medium",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=60&auto=format&fit=crop",
  },
  {
    id: "C002",
    student: "Trần Thị Bình",
    class: "10A1",
    issue: "Bạo lực bạn bè",
    assigned: "BS. Trần Văn Dũng",
    date: "16/07/2026",
    status: "escalated",
    priority: "high",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=60&auto=format&fit=crop",
  },
  {
    id: "C003",
    student: "Hoàng Văn Em",
    class: "12A3",
    issue: "Áp lực gia đình",
    assigned: "Chưa phân công",
    date: "15/07/2026",
    status: "pending",
    priority: "low",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=60&auto=format&fit=crop",
  },
];

const PRIORITY_CONFIG = {
  high: { label: "Cao", color: "#dc2626", bg: "#fee2e2" },
  medium: { label: "Trung bình", color: "#994100", bg: "#fff2e8" },
  low: { label: "Thấp", color: "#059669", bg: "#d1fae5" },
};

const STATUS_CONFIG = {
  open: { label: "Đang mở", color: "#0058bd", bg: "#e8f0fe" },
  escalated: { label: "Leo thang", color: "#dc2626", bg: "#fee2e2" },
  pending: { label: "Chờ phân công", color: "#994100", bg: "#fff2e8" },
  resolved: { label: "Đã giải quyết", color: "#059669", bg: "#d1fae5" },
};

export default function TeacherSupportPage() {
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
          <button className="relative p-2 text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer">
            <Icon name="notifications" size={22} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1000px] w-full mx-auto animate-fade-in space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-base font-semibold text-on-surface">Hỗ trợ tâm lý học sinh</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">Theo dõi và quản lý các trường hợp cần hỗ trợ</p>
            </div>
            <button
              id="btn-new-support-case"
              className="flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
            >
              <Icon name="add" size={18} style={{ color: "white" }} />
              Tạo hồ sơ mới
            </button>
          </div>

          {/* Cases */}
          <div className="flex flex-col gap-4">
            {SUPPORT_CASES.map((c) => {
              const priority = PRIORITY_CONFIG[c.priority as keyof typeof PRIORITY_CONFIG];
              const status = STATUS_CONFIG[c.status as keyof typeof STATUS_CONFIG];
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-[#e8eaf0] shadow-xs p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <img src={c.avatar} alt={c.student} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{c.student}</p>
                          <p className="text-xs text-on-surface-variant">Lớp {c.class} · Mã: {c.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ backgroundColor: priority.bg, color: priority.color }}>
                            {priority.label}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ backgroundColor: status.bg, color: status.color }}>
                            {status.label}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col gap-1.5 text-xs text-on-surface-variant">
                        <div className="flex items-center gap-2">
                          <Icon name="psychology" size={14} style={{ color: "#059669" }} />
                          <span className="font-medium text-on-surface">{c.issue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="person_4" size={14} />
                          <span>Chuyên gia: {c.assigned}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="calendar_today" size={14} />
                          <span>Tạo: {c.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 border-t border-outline-variant/20 pt-4">
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#d1fae5] text-[#059669] text-xs font-bold hover:bg-[#a7f3d0] transition-colors cursor-pointer">
                      <Icon name="visibility" size={14} />
                      Xem chi tiết
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-outline-variant/30 text-on-surface-variant text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer">
                      <Icon name="forward" size={14} />
                      Chuyển tiếp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
