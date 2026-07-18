import { useState } from "react";
import { Link } from "react-router";
import { TeacherSidebar } from "../../components/teacher/TeacherSidebar";
import { Icon } from "../../components/ui/Icon";

export function meta() {
  return [
    { title: "Lớp học – SafeSchool Hub Giáo viên" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const CLASSES = [
  { id: "1", name: "10A1", students: 38, subject: "Chủ nhiệm", schedule: "Thứ 2, 4, 6", alerts: 2, status: "active" },
  { id: "2", name: "10B2", students: 35, subject: "Toán học", schedule: "Thứ 3, 5", alerts: 0, status: "active" },
  { id: "3", name: "11B2", students: 40, subject: "Toán học", schedule: "Thứ 2, 4", alerts: 1, status: "active" },
  { id: "4", name: "12A3", students: 36, subject: "Toán nâng cao", schedule: "Thứ 3, 5, 7", alerts: 0, status: "active" },
];

export default function TeacherClassesPage() {
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
              <h1 className="text-base font-semibold text-on-surface">Lớp học của tôi</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">{CLASSES.length} lớp đang phụ trách</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CLASSES.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-[#e8eaf0] shadow-xs p-5 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#d1fae5] flex items-center justify-center">
                      <Icon name="class" size={24} filled style={{ color: "#059669" }} />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-on-surface">Lớp {cls.name}</h2>
                      <p className="text-xs text-on-surface-variant">{cls.subject}</p>
                    </div>
                  </div>
                  {cls.alerts > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-bold">
                      <Icon name="warning" size={12} filled />
                      {cls.alerts} cảnh báo
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 text-sm text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <Icon name="groups" size={16} style={{ color: "#059669" }} />
                    <span>{cls.students} học sinh</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="schedule" size={16} style={{ color: "#059669" }} />
                    <span>{cls.schedule}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link
                    to={`/teacher/students?class=${cls.name}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#d1fae5] text-[#059669] text-xs font-bold hover:bg-[#a7f3d0] transition-colors cursor-pointer"
                  >
                    <Icon name="groups" size={14} />
                    Học sinh
                  </Link>
                  <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/30 text-on-surface-variant text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer">
                    <Icon name="bar_chart" size={14} />
                    Thống kê
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
