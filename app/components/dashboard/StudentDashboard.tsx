import { useNavigate, Link } from "react-router";
import { useAuth } from "../../src/contexts/AuthContext";

export function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Đăng xuất thất bại:", error);
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Học sinh";

  return (
    <div className="bg-surface dark:bg-surface-container-high text-on-surface font-body-md min-h-screen flex w-full">
      {/* Desktop SideNavBar */}
      <nav className="bg-surface-container-lowest dark:bg-surface-container-low border-r border-outline-variant dark:border-outline h-screen w-64 fixed left-0 top-0 hidden md:flex flex-col p-4 gap-2 z-40">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              health_and_safety
            </span>
          </div>
          <div>
            <h1 className="font-bold text-primary" style={{ fontSize: "20px" }}>SafeSchool Hub</h1>
            <p className="text-label-sm text-on-surface-variant">Cổng hỗ trợ tâm lý</p>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex flex-col gap-1 flex-1">
          <Link
            className="flex items-center gap-2 px-4 py-3 bg-primary-container text-on-primary-container font-bold rounded-xl transition-transform scale-100 active:scale-98"
            to="/dashboard/student"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              dashboard
            </span>
            <span className="font-label-md text-label-md">Tổng quan</span>
          </Link>
          <a
            className="flex items-center gap-2 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors scale-100 active:scale-98"
            href="#"
          >
            <span className="material-symbols-outlined">diversity_1</span>
            <span className="font-label-md text-label-md">Chuyên gia</span>
          </a>
          <a
            className="flex items-center gap-2 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors scale-100 active:scale-98"
            href="#"
          >
            <span className="material-symbols-outlined">event_available</span>
            <span className="font-label-md text-label-md">Lịch hẹn</span>
          </a>
          <a
            className="flex items-center gap-2 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors scale-100 active:scale-98"
            href="#"
          >
            <span className="material-symbols-outlined">contact_support</span>
            <span className="font-label-md text-label-md">Hỏi đáp</span>
          </a>
          <a
            className="flex items-center gap-2 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors scale-100 active:scale-98"
            href="#"
          >
            <span className="material-symbols-outlined">psychology</span>
            <span className="font-label-md text-label-md">Kiểm tra</span>
          </a>
          <a
            className="flex items-center gap-2 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors scale-100 active:scale-98"
            href="#"
          >
            <span className="material-symbols-outlined">forum</span>
            <span className="font-label-md text-label-md">Trò chuyện</span>
          </a>
        </div>

        {/* CTA */}
        <button className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-md text-label-md shadow-sm hover:shadow-md transition-all active:scale-95 mb-4">
          Đặt lịch ngay
        </button>

        {/* Footer Tabs */}
        <div className="flex flex-col gap-1 mt-auto pt-4 border-t border-surface-variant">
          <a className="flex items-center gap-2 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-md text-label-md">Cài đặt</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64 pb-20 md:pb-0">
        {/* TopAppBar (Sticky Header) */}
        <header className="sticky top-0 z-30 flex justify-between items-center px-4 md:px-6 py-4 w-full bg-surface/90 backdrop-blur-md dark:bg-surface-container-high/90 transition-all duration-200">
          {/* Mobile Brand */}
          <div className="md:hidden flex items-center gap-2">
            <span className="font-bold text-primary dark:text-inverse-primary" style={{ fontSize: "24px" }}>
              SafeSchool Hub
            </span>
          </div>
          {/* Desktop Context Title */}
          <div className="hidden md:block">
            <h2 className="font-bold text-on-surface" style={{ fontSize: "32px" }}>
              Chào buổi sáng, {displayName} 👋
            </h2>
            <p className="text-body-md text-on-surface-variant">Hôm nay bạn cảm thấy thế nào?</p>
          </div>
          {/* Trailing Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-low dark:hover:bg-inverse-surface transition-all duration-200 active:scale-95">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 rounded-full text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-low dark:hover:bg-inverse-surface transition-all duration-200 active:scale-95">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <button className="ml-2 w-10 h-10 rounded-full bg-surface-variant overflow-hidden border border-outline-variant">
              <img
                alt="Ảnh đại diện người dùng"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAggxDCaNXLDmRQvsWuKs0WwPZx_LNSGWeBn6IDL1lXd3IF7gkX9dg95CjRL9xMZlNTf4ySQdjZ8VmlJb4iJ3fREr35wlBL9jjmnOIC8vOnWvlt5xVkpUdNQBg-HH7WwlTeoH5TC1q-o8erp6IU0iG2weC-IhebXN5bjPZ1vpSvd07L5yGkG0LiiSEl_4d1eNA9gZbKTgQCjOoiI_gQNOR0TaHwzVW2JNBhPPsAEJiWNaaNdz_DtjFy_w"
              />
            </button>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 p-4 md:p-6 max-w-[1200px] mx-auto w-full space-y-10">
          {/* Empathy Banner */}
          <section className="relative bg-primary-fixed rounded-2xl p-6 md:p-10 overflow-hidden shadow-sm flex flex-col md:flex-row items-center gap-6 md:gap-8 justify-between">
            <div className="relative z-10 flex-1 min-w-0 space-y-4 w-full">
              <span className="inline-block px-3 py-1 bg-white/50 backdrop-blur-sm text-primary font-label-sm text-label-sm rounded-full">
                Trạm dừng tĩnh lặng
              </span>
              <h2 className="font-bold text-on-primary-fixed max-w-[576px]" style={{ fontSize: "32px", lineHeight: "40px" }}>
                Bạn không cần phải đối mặt một mình
              </h2>
              <p className="text-body-lg text-on-primary-fixed-variant max-w-[672px]">
                Chúng tôi ở đây để lắng nghe, thấu hiểu và đồng hành cùng bạn vượt qua những khúc mắc trong cuộc sống học đường.
              </p>
              <div className="pt-2">
                <button className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm active:scale-95">
                  Bắt đầu chia sẻ
                </button>
              </div>
            </div>
            {/* Banner Illustration Area */}
            <div className="w-full md:w-1/3 h-48 md:h-64 relative z-10 shrink-0">
              <div
                className="bg-cover bg-center w-full h-full rounded-xl mix-blend-multiply opacity-90"
                style={{
                  backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD-gtUi_2OfY91mC_t3SQslzMqV_jAxp-8jcbg2pp8bZ6c4IRVYWo4wOqw5ZJwTLgoBVgylw0oL1XFKHaNIa0kifwRuV6MBKl3lQnrbJaMyZHn53Cf324QTwpvyRDHUOabQvOzFUkPPtykAJKOEdXdsexYYrlUum5Z4o7iOv8ybjhrblAlZXxgZget-AW2DRRHDYow31nkv6QlMm-i5ZOxwg2WP4z9bIUyO7TPIRj4T_Dn3wDNRrVdBBA')",
                }}
              ></div>
            </div>
            {/* Decorative background shapes */}
            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-50px] left-[-20px] w-40 h-40 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>
          </section>

          {/* Functional Bento Grid */}
          <section>
            <h3 className="font-bold text-on-surface mb-4" style={{ fontSize: "24px" }}>Hỗ trợ nhanh</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {/* Card 1: Large */}
              <a className="col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group border border-outline-variant/30 flex flex-col justify-between h-48" href="#">
                <div className="w-12 h-12 bg-primary-container text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    psychology
                  </span>
                </div>
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface md:text-lg">Đặt lịch tư vấn</h4>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Kết nối với chuyên gia tâm lý 1:1</p>
                </div>
              </a>
              {/* Card 2 */}
              <a className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 group border border-outline-variant/30 flex flex-col justify-between h-48" href="#">
                <div className="w-10 h-10 bg-tertiary-fixed text-tertiary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    contact_support
                  </span>
                </div>
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface">Hỏi ẩn danh</h4>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 line-clamp-2">Gửi câu hỏi an toàn không tiết lộ danh tính</p>
                </div>
              </a>
              {/* Card 3 */}
              <a className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 group border border-outline-variant/30 flex flex-col justify-between h-48" href="#">
                <div className="w-10 h-10 bg-secondary-container text-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    forum
                  </span>
                </div>
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface">Trò chuyện</h4>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 line-clamp-2">Nhắn tin trực tiếp nhận hỗ trợ tức thì</p>
                </div>
              </a>
              {/* Card 4 */}
              <a className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 group border border-outline-variant/30 flex flex-col justify-between h-40 md:h-48" href="#">
                <div className="w-10 h-10 bg-error-container text-on-error-container rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    mood
                  </span>
                </div>
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface">Đánh giá cảm xúc</h4>
                </div>
              </a>
              {/* Card 5 */}
              <a className="col-span-1 md:col-span-3 bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 group border border-outline-variant/30 flex flex-row items-center gap-4 h-40 md:h-48" href="#">
                <div className="w-12 h-12 bg-surface-variant text-on-surface rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    menu_book
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-label-md text-label-md text-on-surface md:text-lg">Tài nguyên tinh thần</h4>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Bài viết, podcast và bài tập thư giãn giúp bạn tự cân bằng.</p>
                </div>
                <span className="material-symbols-outlined text-outline hidden md:block">arrow_forward</span>
              </a>
            </div>
          </section>

          {/* Featured Counselors (Horizontal Scroll) */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <h3 className="font-bold text-on-surface" style={{ fontSize: "24px" }}>Chuyên viên tiêu biểu</h3>
              <a className="font-label-md text-label-md text-primary hover:underline" href="#">Xem tất cả</a>
            </div>
            <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 snap-x no-scrollbar">
              {/* Counselor Card 1 */}
              <div className="shrink-0 w-64 bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 snap-start flex flex-col items-center text-center">
                <img
                  alt="Avatar chuyên gia"
                  className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-surface-container-high"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOa2bLoiu8HFygxe6ZNpsoxrfKVhUSkHvsDShM-Vmn9JJV3Fv-BNCK-Va6KY5k2THCCrDy7qolwfH0WxaKiTYPOWIq1dz9iOlWC15yd1FW8GibVKRqs9BHaGdeuJXVGSm_pF-hWCJq_QdVQqjLYHUT5osqMGQdBKy2ii--izuzY8IkVwkxNNSp9QNyz-Mk1_utpj6f2gvx6wh1-Wo0cOhrnnlkfh7g6Gc8HJOedB4naJyP9rWM7wwk3Q"
                />
                <h4 className="font-label-md text-label-md text-on-surface">ThS. Nguyễn Thu Hà</h4>
                <div className="flex flex-wrap justify-center gap-1 mt-2 mb-4">
                  <span className="px-2 py-1 bg-surface-container-low text-on-surface-variant rounded-md font-label-sm text-[10px]">Stress</span>
                  <span className="px-2 py-1 bg-surface-container-low text-on-surface-variant rounded-md font-label-sm text-[10px]">Áp lực học tập</span>
                </div>
                <button className="w-full mt-auto py-2 border border-outline-variant rounded-lg font-label-sm text-label-sm text-on-surface hover:bg-surface-container-low transition-colors">
                  Xem hồ sơ
                </button>
              </div>

              {/* Counselor Card 2 */}
              <div className="shrink-0 w-64 bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 snap-start flex flex-col items-center text-center">
                <img
                  alt="Avatar chuyên gia"
                  className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-surface-container-high"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGINSRkzKc8htRYwe5JVVvLEwUqSzEEd29tUhu2QIZrtoiL_fnrRB3N__BnWUeFAKA-A8lB1LaMuoOU_Wvj8B6oy5KCrcbJRRLI0o-fZWpTbMvQ9VFPuwG6e0Olu0DLR-4XGhIHSEoXTgVzD2KBtKkRBTeLd7e9zYbcr5gBLqpeU3A9qr3nn9srhDSXV6hCAmo6bKA1GFwZn4ezhAYebH6DFbSDWKvRSFZV_R-12Gr48Ux04mRWPbOEw"
                />
                <h4 className="font-label-md text-label-md text-on-surface">BS. Trần Văn Dũng</h4>
                <div className="flex flex-wrap justify-center gap-1 mt-2 mb-4">
                  <span className="px-2 py-1 bg-surface-container-low text-on-surface-variant rounded-md font-label-sm text-[10px]">Định hướng</span>
                  <span className="px-2 py-1 bg-surface-container-low text-on-surface-variant rounded-md font-label-sm text-[10px]">Gia đình</span>
                </div>
                <button className="w-full mt-auto py-2 border border-outline-variant rounded-lg font-label-sm text-label-sm text-on-surface hover:bg-surface-container-low transition-colors">
                  Xem hồ sơ
                </button>
              </div>

              {/* Counselor Card 3 */}
              <div className="shrink-0 w-64 bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 snap-start flex flex-col items-center text-center">
                <img
                  alt="Avatar chuyên gia"
                  className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-surface-container-high"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwVhx_cRlYmermCNnSNZHBuJGI1YA8ii4MTrDPMel2qDdIgZC8RbErqIxzNYv3WI3tm37C_DMdHysZprQn65qto7adICTYq1ncxXTcFiSXryjvRghT3jNc8i2evG8NJ3YlqVLqEsGX0rVKXZT60gOf8SuHJGUfj6sP9OaUKJ50fszV-ocSvPsM3aqKYqg2hoZ9DFnFGMLChu0RMrg1e5cdjgp8TGow8c9BDb1o0UboAe882nBLZ5Trjg"
                />
                <h4 className="font-label-md text-label-md text-on-surface">Chuyên viên Lê Mai</h4>
                <div className="flex flex-wrap justify-center gap-1 mt-2 mb-4">
                  <span className="px-2 py-1 bg-surface-container-low text-on-surface-variant rounded-md font-label-sm text-[10px]">Tự ti</span>
                  <span className="px-2 py-1 bg-surface-container-low text-on-surface-variant rounded-md font-label-sm text-[10px]">Mối quan hệ</span>
                </div>
                <button className="w-full mt-auto py-2 border border-outline-variant rounded-lg font-label-sm text-label-sm text-on-surface hover:bg-surface-container-low transition-colors">
                  Xem hồ sơ
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Mobile BottomNavBar */}
      <nav className="bg-surface dark:bg-surface-container-highest fixed bottom-0 w-full md:hidden rounded-t-xl shadow-lg border-t border-outline-variant z-40 pb-safe">
        <div className="flex justify-around items-center px-2 py-3 w-full">
          <Link
            className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 active:scale-90 transition-transform duration-150"
            to="/dashboard/student"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              home
            </span>
            <span className="font-label-sm text-label-sm mt-1">Trang chủ</span>
          </Link>
          <a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-90 transition-transform duration-150 px-2 py-1" href="#">
            <span className="material-symbols-outlined">group</span>
            <span className="font-label-sm text-label-sm mt-1">Chuyên gia</span>
          </a>
          <a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-90 transition-transform duration-150 px-2 py-1" href="#">
            <span className="material-symbols-outlined">help_center</span>
            <span className="font-label-sm text-label-sm mt-1">Hỏi đáp</span>
          </a>
          <a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-90 transition-transform duration-150 px-2 py-1" href="#">
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="font-label-sm text-label-sm mt-1">Lịch</span>
          </a>
          <a className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-90 transition-transform duration-150 px-2 py-1" href="#">
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-sm text-label-sm mt-1">Cá nhân</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
