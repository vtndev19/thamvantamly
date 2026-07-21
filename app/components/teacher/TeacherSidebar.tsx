import { Link, useLocation } from "react-router";
import { Icon } from "../ui/Icon";

interface TeacherSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeacherSidebar({ isOpen, onClose }: TeacherSidebarProps) {
  const location = useLocation();

  const menuItems = [
    { label: "Tổng quan", path: "/teacher/dashboard", icon: "space_dashboard" },
    { label: "Lớp học", path: "/teacher/classes", icon: "class" },
    { label: "Học sinh", path: "/teacher/students", icon: "groups" },
    { label: "Hỗ trợ tâm lý", path: "/teacher/support", icon: "psychology" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-[240px] flex-col justify-between border-r border-[#e8eaf0] bg-white px-5 py-7 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Section: Brand + Menu */}
        <div className="flex flex-col gap-7">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 relative">
            <div className="text-[#059669] flex items-center justify-center flex-shrink-0">
              <Icon name="shield" filled size={34} />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-[#059669] tracking-tight leading-tight">
                SafeSchool
              </h1>
              <h1 className="font-serif font-bold text-lg text-[#059669] tracking-tight leading-none">
                Hub
              </h1>
              <p className="text-[9px] text-[#727785] font-medium mt-0.5 tracking-wide">
                Giáo viên
              </p>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="absolute -right-1 top-0.5 p-1 text-outline hover:text-on-surface lg:hidden focus:outline-none cursor-pointer"
              aria-label="Đóng menu"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-1.5" aria-label="Teacher navigation">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[#059669] text-white shadow-md"
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

        {/* Bottom Section */}
        <div className="flex flex-col gap-4">
          <div className="h-px bg-outline-variant/30 w-full" />

          <Link
            to="/teacher/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all duration-200"
          >
            <Icon name="settings" size={20} style={{ color: "currentColor" }} />
            Cài đặt
          </Link>

          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop"
                alt="Teacher avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">Trần Thị Lan</p>
              <p className="text-[10px] text-on-surface-variant truncate">Giáo viên</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
