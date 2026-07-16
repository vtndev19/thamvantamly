import { useState } from "react";
import { Link } from "react-router";
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
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          {/* Left: burger + logo + tabs */}
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
            <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="Dashboard navigation">
              {/* Active Tab: Trang chủ */}
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm">
                <Icon name="home" size={18} filled />
                Trang chủ
              </span>
              {[
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
              {/* Hỗ trợ tab */}
              <Link
                to="/student/support"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="emergency" size={18} />
                Hỗ trợ
              </Link>
            </nav>
          </div>

          {/* Action Icons & Profile */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Thông báo"
            >
              <Icon name="notifications" size={22} />
              {/* Active Dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse" />
            </button>

            {/* Help Support → navigate to support page */}
            <Link
              to="/student/support"
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Hỗ trợ khẩn cấp"
            >
              <Icon name="help" size={22} />
            </Link>

            {/* Profile Picture */}
            <button
              className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/30 hover:opacity-95 transition-opacity focus:outline-none cursor-pointer flex-shrink-0"
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
          {/* Welcome greeting (mobile only fallback, now shown below header on mobile) */}
          <div className="-mt-2 -mb-2">
            <h2 className="text-xl md:text-[22px] font-serif font-bold text-on-surface leading-snug tracking-tight">
              Chào buổi sáng, Nam 👋
            </h2>
            <p className="text-xs text-on-surface-variant font-normal mt-1 tracking-wide">
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
