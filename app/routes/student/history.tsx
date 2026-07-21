import { useState } from "react";
import { Link } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";

export function meta() {
  return [
    { title: "Lịch sử hoạt động – SafeSchool Hub" },
    {
      name: "description",
      content: "Xem lại toàn bộ lịch sử tư vấn, báo cáo và hoạt động của bạn trên SafeSchool Hub.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

type ActivityType = "appointment" | "report" | "chat" | "resource";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  status: "completed" | "pending" | "cancelled";
  icon: string;
  color: string;
  bg: string;
}

const ACTIVITIES: Activity[] = [
  {
    id: "1",
    type: "appointment",
    title: "Buổi tư vấn tâm lý",
    description: "ThS. Nguyễn Thu Hà – Phòng tư vấn số 3",
    date: "17/07/2026 · 09:00",
    status: "completed",
    icon: "psychology",
    color: "#0058bd",
    bg: "#e8f0fe",
  },
  {
    id: "2",
    type: "report",
    title: "Báo cáo bạo lực học đường",
    description: "Phản ánh 익명 đã được gửi đến ban giám hiệu",
    date: "15/07/2026 · 14:32",
    status: "pending",
    icon: "flag",
    color: "#ba1a1a",
    bg: "#ffdad6",
  },
  {
    id: "3",
    type: "chat",
    title: "Trò chuyện với chuyên gia",
    description: "BS. Trần Văn Dũng – Tư vấn định hướng học tập",
    date: "12/07/2026 · 16:15",
    status: "completed",
    icon: "chat",
    color: "#059669",
    bg: "#d1fae5",
  },
  {
    id: "4",
    type: "resource",
    title: "Đọc tài nguyên tinh thần",
    description: "\"Kỹ năng quản lý căng thẳng\" – 12 phút đọc",
    date: "10/07/2026 · 20:45",
    status: "completed",
    icon: "menu_book",
    color: "#994100",
    bg: "#fff2e8",
  },
  {
    id: "5",
    type: "appointment",
    title: "Đặt lịch hẹn",
    description: "Lịch hẹn đã bị hủy – lý do cá nhân",
    date: "08/07/2026 · 11:00",
    status: "cancelled",
    icon: "event_busy",
    color: "#727785",
    bg: "#f3f4f6",
  },
];

const STATUS_CONFIG = {
  completed: { label: "Hoàn thành", color: "#059669", bg: "#d1fae5" },
  pending: { label: "Đang xử lý", color: "#994100", bg: "#fff2e8" },
  cancelled: { label: "Đã hủy", color: "#727785", bg: "#f3f4f6" },
};

const FILTER_OPTIONS: { key: ActivityType | "all"; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "appointment", label: "Tư vấn" },
  { key: "report", label: "Báo cáo" },
  { key: "chat", label: "Trò chuyện" },
  { key: "resource", label: "Tài nguyên" },
];

export default function StudentHistoryPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActivityType | "all">("all");

  const filtered = activeFilter === "all"
    ? ACTIVITIES
    : ACTIVITIES.filter((a) => a.type === activeFilter);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header */}
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
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Thông báo"
            >
              <Icon name="notifications" size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse" />
            </button>
            <button
              className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/30 cursor-pointer flex-shrink-0"
              aria-label="Hồ sơ"
            >
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop"
                alt="Ảnh đại diện"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[860px] w-full mx-auto animate-fade-in space-y-6">
          {/* Page Title */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-serif font-bold text-on-surface">Lịch sử hoạt động</h1>
              <p className="text-xs text-on-surface-variant mt-1">Xem lại các hoạt động và tương tác của bạn</p>
            </div>
            <button
              id="btn-export-history"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline-variant/40 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <Icon name="download" size={16} />
              Xuất PDF
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.key}
                id={`filter-${f.key}`}
                onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activeFilter === f.key
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Activity Timeline */}
          <div className="flex flex-col gap-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-on-surface-variant">
                <Icon name="history" size={48} style={{ color: "currentColor", opacity: 0.3 }} />
                <p className="mt-3 text-sm font-medium">Chưa có hoạt động nào</p>
              </div>
            ) : (
              filtered.map((activity) => {
                const status = STATUS_CONFIG[activity.status];
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 bg-white border border-[#e8eaf0] rounded-2xl px-5 py-4 shadow-xs hover:shadow-sm transition-shadow duration-200"
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: activity.bg }}
                    >
                      <Icon name={activity.icon} size={20} filled style={{ color: activity.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="text-sm font-bold text-on-surface">{activity.title}</p>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                          style={{ backgroundColor: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{activity.description}</p>
                      <p className="text-[11px] text-on-surface-variant/70 mt-1.5 flex items-center gap-1">
                        <Icon name="schedule" size={12} />
                        {activity.date}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More */}
          <div className="flex justify-center pb-8">
            <button
              id="btn-load-more-history"
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              <Icon name="expand_more" size={18} />
              Xem thêm
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
