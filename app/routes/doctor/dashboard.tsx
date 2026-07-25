import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { getUserProfile } from "../../src/services/userService";
import { Icon } from "../../components/ui/Icon";
import { DoctorSidebar } from "../../components/doctor/DoctorSidebar";
import type { UserProfile } from "../../src/types/user.types";

export function meta() {
  return [
    { title: "Bảng điều khiển Bác sĩ - SafeSchool Hub" },
    {
      name: "description",
      content:
        "Bảng điều khiển SafeSchool Hub dành riêng cho Bác sĩ & Chuyên gia tư vấn tâm lý học đường.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        try {
          const prof = await getUserProfile(user.uid);
          setProfile(prof);
        } catch (e) {
          console.error("Lỗi khi tải thông tin bác sĩ:", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (e) {
      console.error("Lỗi đăng xuất:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-on-surface-variant">Đang tải thông tin bảng điều khiển...</p>
        </div>
      </div>
    );
  }

  const doctorName = profile?.displayName || user?.displayName || "Bác sĩ tâm lý";
  const specialization = profile?.specialization || "Chuyên gia tâm lý học đường";
  const hospital = profile?.hospital || "Bệnh viện đối tác";

  const stats = [
    { label: "Ca tư vấn đã xử lý", value: "24", icon: "forum", color: "#0058bd", bg: "#e8f0fe" },
    { label: "Lịch hẹn hôm nay", value: "3", icon: "calendar_month", color: "#059669", bg: "#d1fae5" },
    { label: "Câu hỏi chờ trả lời", value: "6", icon: "contact_support", color: "#994100", bg: "#fff2e8" },
    { label: "Đánh giá chuyên môn", value: "4.9/5", icon: "star", color: "#eab308", bg: "#fef9c3" },
  ];

  const recentQuestions = [
    { id: "1", title: "Áp lực thi cử lớp 12 và stress nặng", time: "10 phút trước", student: "Học sinh 12A3", preview: "Em cảm thấy quá áp lực trước kỳ thi đại học sắp tới, thường xuyên mất ngủ và rụng tóc..." },
    { id: "2", title: "Làm thế nào để hòa đồng hơn trong lớp mới?", time: "2 giờ trước", student: "Học sinh 10B2", preview: "Em vừa chuyển trường và cảm thấy rất cô đơn, không thể bắt chuyện được với các bạn..." },
    { id: "3", title: "Bị cô lập và bạo lực mạng xã hội", time: "1 ngày trước", student: "Học sinh 11A1", preview: "Các bạn trong lớp lập nhóm chat nói xấu em và chế ảnh dìm hàng em lên mạng xã hội..." },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      
      {/* ── Doctor Sidebar ── */}
      <DoctorSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* ── Main Dashboard Panel ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>
            <h2 className="text-lg font-serif font-bold text-[#003884] tracking-tight">
              SafeSchool Hub - Bác Sĩ & Chuyên Gia
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer border-none bg-transparent">
              <Icon name="notifications" size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse" />
            </button>
            
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-outline-variant/30">
              <span className="text-xs text-on-surface-variant text-right">
                <span className="block font-bold text-on-surface">{hospital}</span>
                <span className="block text-[10px]">{specialization}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-[1100px] w-full mx-auto animate-fade-in">
          
          {/* Welcome section */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-[#ebf3fe] via-[#f1f6ff] to-[#e4efff] border border-[#d3e5fe] px-6 py-8 sm:px-8 rounded-3xl shadow-xs">
            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#0058bd]/8 text-[#0058bd] tracking-wide uppercase">
                Chào mừng ngày mới
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#001a41] mt-2">
                Xin chào, {doctorName} 👋
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Hệ thống ghi nhận trạng thái hoạt động của bạn tốt. Hãy cùng SafeSchool đồng hành bảo vệ các em học sinh nhé!
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate("/doctor/qna")}
                className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-xs cursor-pointer border-none"
              >
                Trả lời Q&A mới
              </button>
            </div>
          </section>

          {/* Quick Statistics Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-2xs flex flex-col justify-between h-[120px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface-variant truncate pr-2">{s.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg, color: s.color }}>
                    <Icon name={s.icon} size={18} style={{ color: "currentColor" }} />
                  </div>
                </div>
                <span className="text-2xl font-serif font-extrabold text-on-surface leading-none mt-2">{s.value}</span>
              </div>
            ))}
          </section>

          {/* Core lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Recent Questions List */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <h3 className="font-serif font-bold text-base text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#994100]">forum</span>
                  Câu hỏi học sinh mới gửi cần tư vấn
                </h3>
                <Link to="/doctor/qna" className="text-xs text-primary font-bold hover:underline">
                  Xem tất cả
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {recentQuestions.map((q) => (
                  <div key={q.id} className="p-4 rounded-2xl hover:bg-surface-container/50 border border-outline-variant/20 transition-all flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold bg-[#994100]/8 text-[#994100] px-2.5 py-0.5 rounded-full uppercase">
                        {q.student}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-medium">{q.time}</span>
                    </div>
                    <h4 className="text-sm font-bold text-on-surface leading-snug">{q.title}</h4>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{q.preview}</p>
                    <Link
                      to="/doctor/qna"
                      className="text-xs font-bold text-[#0058bd] hover:text-[#00479b] mt-1 inline-flex items-center gap-1 self-start"
                    >
                      Hỗ trợ giải đáp
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_right_alt</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick Doctor Checklist */}
            <div className="bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-2xs flex flex-col gap-4">
              <h3 className="font-serif font-bold text-base text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <span className="material-symbols-outlined text-[#059669]">task_alt</span>
                Lịch biểu hôm nay
              </h3>

              <div className="flex flex-col gap-3">
                {[
                  { title: "Kiểm duyệt hồ sơ ca tư vấn", done: true },
                  { title: "Tham vấn trực tuyến (14:00 - Học sinh ẩn danh)", done: false },
                  { title: "Phản hồi thắc mắc Q&A mới", done: false },
                  { title: "Cập nhật chuyên mục bài viết tâm lý", done: false },
                ].map((t, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/10 bg-surface-container/30">
                    <span className={`material-symbols-outlined mt-0.5 ${t.done ? "text-emerald-600" : "text-outline-variant"}`} style={{ fontSize: "18px" }}>
                      {t.done ? "check_box" : "check_box_outline_blank"}
                    </span>
                    <span className={`text-xs font-semibold leading-normal ${t.done ? "line-through text-on-surface-variant/60" : "text-on-surface"}`}>
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-outline-variant/30 text-center">
                <Link to="/student/appointments" className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 justify-center w-full">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>calendar_today</span>
                  Xem chi tiết lịch hẹn của bạn
                </Link>
              </div>
            </div>

          </div>
          
        </main>
      </div>

    </div>
  );
}
