import { Link, useLocation } from "react-router";
import { Icon } from "../ui/Icon";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const menuItems = [
    { label: "Tổng quan", path: "/student/dashboard", icon: "space_dashboard" },
    { label: "Chuyên gia", path: "/student/experts", icon: "supervisor_account" },
    { label: "Nhắn tin", path: "/student/chat", icon: "chat" },
    { label: "Lịch hẹn", path: "/student/appointments", icon: "calendar_today" },
    { label: "Hỏi đáp", path: "/student/qna", icon: "help" },
    { label: "Tin tức", path: "/student/news", icon: "newspaper" },
    { label: "Kiểm tra", path: "/student/tests", icon: "fact_check" },
    { label: "Hỗ trợ khẩn cấp", path: "/student/support", icon: "emergency" },
    { label: "Báo cáo của tôi", path: "/student/reports", icon: "assignment" },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Spacer for desktop layout to preserve space for the fixed sidebar */}
      <div className="hidden lg:block lg:w-[260px] lg:flex-shrink-0" />

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-[260px] flex-col justify-between border-r border-[#e8eaf0] bg-white px-6 py-8 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-hidden`}
      >
        {/* Top Section: Brand Logo (fixed) */}
        <div className="flex-shrink-0 mb-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 relative">
            <div className="text-primary flex items-center justify-center flex-shrink-0">
              <Icon name="shield" filled size={38} />
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl text-[#003884] tracking-tight leading-tight">
                SafeSchool
              </h1>
              <h1 className="font-serif font-bold text-xl text-[#003884] tracking-tight leading-none">
                Hub
              </h1>
              <p className="text-[10px] text-[#727785] font-medium mt-1">
                Cổng hỗ trợ tâm lý
              </p>
            </div>
            
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="absolute -right-2 top-1 p-1 text-outline hover:text-on-surface lg:hidden focus:outline-none bg-transparent border-none"
              aria-label="Đóng menu"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* Center Section: Navigation Menu (scrollable) */}
        <nav className="flex-1 overflow-y-auto pr-1 scrollbar-thin flex flex-col gap-3" aria-label="Menu chính">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => {
                  // Close sidebar on mobile after clicking
                  onClose();
                }}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <Icon
                  name={item.icon}
                  size={20}
                  filled={isActive}
                  style={{ color: "currentColor" }}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section: CTA + Settings/Logout (fixed) */}
        <div className="flex-shrink-0 flex flex-col gap-4 pt-4 border-t border-outline-variant/30 mt-6">
          {/* Quick Appointment Button */}
          <Link
            to="/student/appointments/new"
            onClick={onClose}
            className="flex items-center justify-center w-full bg-primary hover:bg-primary-container text-on-primary text-sm font-bold py-3 rounded-xl transition-all duration-200 shadow-sm"
          >
            Đặt lịch ngay
          </Link>

          {/* Settings Link */}
          <div className="flex flex-col gap-1">
            <Link
              to="/student/settings"
              onClick={onClose}
              className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all duration-200"
            >
              <Icon name="settings" size={20} style={{ color: "currentColor" }} />
              Cài đặt
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
