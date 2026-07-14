import { Link } from "react-router";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";

/**
 * HeroSection – The top "welcome" block of the homepage.
 * Displays the app title, tagline, and primary CTA buttons.
 */
export function HeroSection() {
  return (
    <header className="text-center w-full animate-fade-in-up">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)] text-xs font-semibold tracking-wider uppercase">
        <Icon name="verified_user" size={14} filled />
        Nền tảng an toàn học đường
      </div>

      {/* Heading */}
      <h1
        className="font-bold text-[var(--color-primary)] mb-4 leading-tight tracking-tight"
        style={{
          fontSize: "clamp(2rem, 5vw, 2.75rem)",
          lineHeight: 1.2,
        }}
      >
        Chào mừng đến với{" "}
        <span
          className="relative inline-block"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          SafeSchool Hub
        </span>
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontSize: "18px",
          lineHeight: "28px",
          color: "var(--color-on-surface-variant)",
          maxWidth: "36rem",
          margin: "0 auto 2rem auto",
        }}
      >
        Không gian an toàn để bạn được lắng nghe, hỗ trợ và bảo vệ. Cùng xây
        dựng môi trường học đường tích cực và lành mạnh.
      </p>

      {/* Stats Strip */}
      <div className="flex flex-wrap justify-center gap-6 mb-10">
        {[
          { value: "5,000+", label: "Học sinh được hỗ trợ" },
          { value: "98%", label: "Phản hồi trong 24h" },
          { value: "100%", label: "Bảo mật ẩn danh" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p
              className="font-bold"
              style={{ fontSize: "22px", color: "var(--color-primary)" }}
            >
              {stat.value}
            </p>
            <p
              style={{ fontSize: "12px", color: "var(--color-on-surface-variant)" }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          id="cta-get-started"
          variant="primary"
          size="lg"
          icon="arrow_forward"
        >
          Bắt đầu ngay
        </Button>
        <Link
          to="/auth/login"
          id="cta-login"
          className="inline-flex items-center justify-center gap-2 h-14 px-8 text-base font-semibold rounded-full no-underline transition-all duration-200 border"
          style={{
            borderColor: "var(--color-primary)",
            color: "var(--color-primary)",
            backgroundColor: "transparent",
          }}
        >
          <Icon name="login" size={20} />
          Đăng nhập tài khoản
        </Link>
      </div>
    </header>
  );
}
