import { useState } from "react";
import { TeacherSidebar } from "../../components/teacher/TeacherSidebar";
import { Icon } from "../../components/ui/Icon";

export function meta() {
  return [
    { title: "Danh sách học sinh – SafeSchool Hub Giáo viên" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const STUDENTS = [
  { id: "1", name: "Nguyễn Văn An", class: "10A1", status: "alert", statusLabel: "Cần chú ý", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=60&auto=format&fit=crop" },
  { id: "2", name: "Trần Thị Bình", class: "10A1", status: "danger", statusLabel: "Khẩn cấp", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=60&auto=format&fit=crop" },
  { id: "3", name: "Lê Văn Cường", class: "11B2", status: "normal", statusLabel: "Bình thường", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=60&auto=format&fit=crop" },
  { id: "4", name: "Phạm Thị Dung", class: "10A1", status: "normal", statusLabel: "Bình thường", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=60&auto=format&fit=crop" },
  { id: "5", name: "Hoàng Văn Em", class: "12A3", status: "alert", statusLabel: "Cần chú ý", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=60&auto=format&fit=crop" },
];

const STATUS_CONFIG = {
  normal: { color: "#059669", bg: "#d1fae5" },
  alert: { color: "#994100", bg: "#fff2e8" },
  danger: { color: "#dc2626", bg: "#fee2e2" },
};

export default function TeacherStudentsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = STUDENTS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.class.includes(search)
  );

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
              <h1 className="text-base font-semibold text-on-surface">Danh sách học sinh</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">{STUDENTS.length} học sinh đang theo dõi</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Icon name="search" size={18} style={{ color: "#727785", position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              id="search-students"
              type="search"
              placeholder="Tìm học sinh theo tên hoặc lớp…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e8eaf0] rounded-xl text-sm text-on-surface focus:outline-none focus:border-[#059669] transition-colors"
            />
          </div>

          {/* Students List */}
          <div className="bg-white rounded-2xl border border-[#e8eaf0] shadow-xs overflow-hidden">
            <div className="divide-y divide-outline-variant/20">
              {filtered.map((student) => {
                const st = STATUS_CONFIG[student.status as keyof typeof STATUS_CONFIG];
                return (
                  <div key={student.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low/50 transition-colors">
                    <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface">{student.name}</p>
                      <p className="text-xs text-on-surface-variant">Lớp {student.class}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>
                      {student.statusLabel}
                    </span>
                    <button className="p-1.5 text-on-surface-variant hover:text-[#059669] hover:bg-[#d1fae5] rounded-lg transition-colors cursor-pointer" aria-label="Xem chi tiết">
                      <Icon name="open_in_new" size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
