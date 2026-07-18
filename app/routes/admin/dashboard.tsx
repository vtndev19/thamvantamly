import { useState } from "react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { StatsGrid } from "../../components/admin/StatsCard";
import { TrendChart, GradeDistribution } from "../../components/admin/AdminCharts";
import { RecentAlerts } from "../../components/admin/RecentAlerts";
import { Icon } from "../../components/ui/Icon";
import type { Route } from "./+types/dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Dashboard – SafeSchool Hub" },
    {
      name: "description",
      content:
        "Bảng điều khiển quản trị SafeSchool Hub. Xem tổng quan tình hình an toàn học đường, phản ánh mới và cảnh báo khẩn cấp.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-container-low">
      {/* Admin Sidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>

            {/* Page Title */}
            <h2 className="text-lg font-serif font-bold text-primary tracking-tight">
              SafeSchool Hub
            </h2>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Thông báo"
            >
              <Icon name="notifications" size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse" />
            </button>

            {/* Help */}
            <button
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Trợ giúp"
            >
              <Icon name="help" size={22} />
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-[1200px] w-full mx-auto animate-fade-in">

          {/* Dashboard Heading + Export Button */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-base font-semibold text-on-surface">
                Tổng quan Dashboard
              </h1>
              <p className="text-sm text-on-surface-variant font-normal mt-0.5">
                Cập nhật nhanh tình hình an toàn học đường.
              </p>
            </div>
            <button className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer flex-shrink-0">
              <Icon name="download" size={18} style={{ color: "white" }} />
              Báo cáo
            </button>
          </div>

          {/* Stats Cards Grid */}
          <StatsGrid />

          {/* Charts Row */}
          <div className="flex flex-col lg:flex-row gap-5">
            <TrendChart />
            <GradeDistribution />
          </div>

          {/* Recent Alerts */}
          <RecentAlerts />

        </main>
      </div>
    </div>
  );
}
