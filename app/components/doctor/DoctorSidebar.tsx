import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { getUserProfile } from "../../src/services/userService";
import { Icon } from "../ui/Icon";
import type { UserProfile } from "../../src/types/user.types";

interface DoctorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOCTOR_LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AP1WRLtPJwzVyu0SJ8xN45WKCzH5KMeKK9K9uX29vpMTR6sWzLoA9dO7QdMLuGG-hA6QAMeI9pcSIaaiX60Xc-1pydPPs3WSF2AmHHz_HNtRG9ZV9mtQdKsVnOAnlu-xbXxQEnxRsyEquWNS5_NxMnROStalzNPPc7_kp-qNq7X-kdqE5-KUzG5XWST6nkVbAGS4vhFK0fqwGS8sik6exrBr08rd84Xkqw74sCEYy5vQ1WmhTRdqGGyrYVPBBdc";

export function DoctorSidebar({ isOpen, onClose }: DoctorSidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (user?.uid) {
        try {
          const prof = await getUserProfile(user.uid);
          setProfile(prof);
        } catch (e) {
          console.error("Lỗi khi tải thông tin bác sĩ ở sidebar:", e);
        }
      }
    }
    loadProfile();
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (e) {
      console.error("Lỗi đăng xuất:", e);
    }
  };

  const doctorName = profile?.displayName || user?.displayName || "Bác sĩ tâm lý";
  const specialization = profile?.specialization || "Chuyên gia tâm lý học đường";

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

      {/* Spacer for desktop layout */}
      <div className="hidden lg:block lg:w-[260px] lg:flex-shrink-0" />

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-[260px] flex-col justify-between border-r border-[#e8eaf0] bg-white px-6 py-8 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand logo + Menu */}
        <div className="flex flex-col gap-8">
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
              <p className="text-[10px] text-emerald-600 font-bold mt-1 tracking-wider uppercase">
                Chuyên gia tâm lý
              </p>
            </div>

            <button
              onClick={onClose}
              className="absolute -right-2 top-1 p-1 text-outline hover:text-on-surface lg:hidden focus:outline-none cursor-pointer"
              aria-label="Đóng menu"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <nav className="flex flex-col gap-1.5" aria-label="Menu bác sĩ">
            <Link
              to="/doctor/dashboard"
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                location.pathname === "/doctor/dashboard"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon name="space_dashboard" size={20} filled={location.pathname === "/doctor/dashboard"} />
              Tổng quan
            </Link>

            <Link
              to="/doctor/profile"
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                location.pathname === "/doctor/profile"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon name="person" size={20} filled={location.pathname === "/doctor/profile"} />
              Hồ sơ cá nhân
            </Link>

            <Link
              to="/doctor/qna"
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                location.pathname === "/doctor/qna"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon name="help" size={20} filled={location.pathname === "/doctor/qna"} />
              Hỏi đáp Q&A
            </Link>

            <Link
              to="/doctor/chat"
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                location.pathname === "/doctor/chat"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon name="chat_bubble" size={20} filled={location.pathname === "/doctor/chat"} />
              Chat với Học sinh
            </Link>

            <Link
              to="/student/appointments"
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                location.pathname === "/student/appointments"
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon name="calendar_today" size={20} filled={location.pathname === "/student/appointments"} />
              Lịch hẹn tư vấn
            </Link>
          </nav>
        </div>

        {/* Doctor profile & Logout */}
        <div className="flex flex-col gap-4">
          <div className="h-px bg-outline-variant/30 w-full" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-error hover:bg-red-50 hover:text-red-700 transition-all duration-200 text-left cursor-pointer border-none bg-transparent"
          >
            <Icon name="logout" size={20} style={{ color: "currentColor" }} />
            Đăng xuất tài khoản
          </button>
        </div>
      </aside>
    </>
  );
}
