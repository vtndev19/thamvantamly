import { useState } from "react";
import { Sidebar } from "../../components/student/Sidebar";
import { QuickSupportGrid } from "../../components/student/QuickSupportCard";
import { FeaturedExperts } from "../../components/student/ExpertCard";
import { Icon } from "../../components/ui/Icon";

export function meta() {
  return [
    { title: "Tổng quan học sinh - SafeSchool Hub" },
    {
      name: "description",
      content:
        "Trang chủ hỗ trợ tâm lý SafeSchool Hub dành cho học sinh. Nơi chia sẻ, kết nối chuyên gia và tìm kiếm tài nguyên tinh thần.",
    },
  ];
}

export default function StudentDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Layout */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Row */}
        <header className="flex items-center justify-between px-6 py-5 bg-surface-container-lowest border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Burger Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-xl md:text-[22px] font-serif font-bold text-on-surface leading-snug tracking-tight">
                Chào buổi sáng, Nam 👋
              </h2>
              <p className="text-[11px] md:text-xs text-on-surface-variant font-normal mt-1 tracking-wide">
                Hôm nay bạn cảm thấy thế nào?
              </p>
            </div>
          </div>

          {/* Welcome Info for small mobile screens (displayed in header when title is too big) */}
          <div className="block sm:hidden flex-grow px-2">
            <h2 className="text-base font-serif font-bold text-on-surface leading-snug tracking-tight">
              Chào, Nam 👋
            </h2>
          </div>

          {/* Action Icons & Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Thông báo"
            >
              <Icon name="notifications" size={24} />
              {/* Active Dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse" />
            </button>

            {/* Help Support */}
            <button
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Hỏi đáp / Trợ giúp"
            >
              <Icon name="help" size={24} />
            </button>

            {/* Profile Picture */}
            <button
              className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 hover:opacity-95 transition-opacity focus:outline-none cursor-pointer"
              aria-label="Hồ sơ cá nhân"
            >
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop"
                alt="Ảnh đại diện Nam"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-[1100px] w-full mx-auto animate-fade-in">
          {/* Welcome subtitle for mobile display */}
          <div className="sm:hidden -mt-2 -mb-2">
            <p className="text-xs text-on-surface-variant font-normal tracking-wide">
              Hôm nay bạn cảm thấy thế nào?
            </p>
          </div>

          {/* Banner Card: "Bạn không cần phải đối mặt một mình" */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ebf3fe] via-[#f1f6ff] to-[#e4efff] border border-[#d3e5fe] px-8 py-10 md:py-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs animate-scale-in">
            {/* Left Content */}
            <div className="flex flex-col items-start text-left w-full relative z-10 flex-1 min-w-0">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#0058bd]/8 text-[#0058bd] tracking-wide mb-4 inline-block whitespace-nowrap">
                Trạm dừng tĩnh lặng
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-extrabold text-[#001a41] leading-snug tracking-tight mb-3">
                Bạn không cần phải đối mặt một mình
              </h3>
              <p className="text-sm md:text-base text-on-primary-fixed-variant leading-relaxed mb-6 font-medium">
                Chúng tôi ở đây để lắng nghe, thấu hiểu và đồng hành cùng bạn
                vượt qua những khúc mắc trong cuộc sống học đường.
              </p>
              <button className="bg-primary hover:bg-primary-container text-on-primary text-sm font-bold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer whitespace-nowrap">
                Bắt đầu chia sẻ
              </button>
            </div>

            {/* Right Graphic Illustration */}
            <div className="relative w-full max-w-[280px] md:max-w-[340px] flex-shrink-0 flex items-center justify-center">
              <img
                src="/dashboard_banner.png"
                alt="Tổng quan Hỗ trợ Tâm lý"
                className="w-full h-auto object-contain rounded-2xl drop-shadow-md select-none pointer-events-none"
              />
            </div>
          </section>

          {/* Quick Support Cards Grid */}
          <section>
            <QuickSupportGrid />
          </section>

          {/* Featured Psychology Experts */}
          <section className="pb-8">
            <FeaturedExperts />
          </section>
        </main>
      </div>
    </div>
  );
}
