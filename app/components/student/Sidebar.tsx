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
    { label: "Lịch hẹn", path: "/student/appointments", icon: "calendar_today" },
    { label: "Hỏi đáp", path: "/student/qna", icon: "help" },
    { label: "Kiểm tra", path: "/student/tests", icon: "fact_check" },
    { label: "Trò chuyện", path: "/student/chat", icon: "forum" },
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

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-[260px] flex-col justify-between border-r border-outline-variant/30 bg-surface-container-lowest px-6 py-8 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Section: Brand + Menu */}
        <div className="flex flex-col gap-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
              <Icon name="shield_lock" filled size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-primary tracking-wide leading-tight">
                SafeSchool
              </h1>
              <h1 className="font-bold text-lg text-primary tracking-wide leading-none">
                Hub
              </h1>
              <p className="text-[10px] text-outline-variant/80 font-medium mt-0.5">
                Cổng hỗ trợ tâm lý
              </p>
            </div>
            
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="absolute -right-2 top-1 p-1 text-outline hover:text-on-surface lg:hidden focus:outline-none"
              aria-label="Đóng menu"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-4" aria-label="Menu chính">
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
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
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
        </div>

        {/* Bottom Section: CTA + Settings/Logout */}
        <div className="flex flex-col gap-5">
          {/* Quick Appointment Button */}
          <Link
            to="/student/appointments/new"
            onClick={onClose}
            className="flex items-center justify-center w-full bg-primary hover:bg-primary-container text-on-primary text-sm font-bold py-3.5 rounded-xl transition-all duration-200 shadow-xs"
          >
            Đặt lịch ngay
          </Link>

          {/* Divider */}
          <div className="h-px bg-outline-variant/30 w-full" />

          {/* Settings & Logout Links */}
          <div className="flex flex-col gap-1">
            <Link
              to="/student/settings"
              onClick={onClose}
              className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all duration-200"
            >
              <Icon name="settings" size={20} style={{ color: "currentColor" }} />
              Cài đặt
            </Link>

            <Link
              to="/auth/login"
              className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-error hover:bg-error-container/20 transition-all duration-200"
            >
              <Icon name="logout" size={20} style={{ color: "currentColor" }} />
              Đăng xuất
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
