import { HeroSection } from "../components/home/HeroSection";
import { FeatureGrid } from "../components/home/FeatureGrid";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Icon } from "../components/ui/Icon";
import { Button } from "../components/ui/Button";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SafeSchool Hub – Không gian an toàn cho học sinh" },
    {
      name: "description",
      content:
        "SafeSchool Hub là nền tảng hỗ trợ học sinh với kiến thức an toàn, tư vấn tâm lý và báo cáo bạo lực học đường một cách ẩn danh.",
    },
    { name: "keywords", content: "an toàn học đường, hỗ trợ học sinh, tâm lý học đường, báo cáo bạo lực" },
  ];
}

export default function Home() {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* ─── Navigation ─── */}
      <Navbar />

      {/* ─── Main Content ─── */}
      <main className="flex-grow flex flex-col items-center">
        {/* Hero Section */}
        <section
          className="w-full flex flex-col items-center px-6 pt-16 pb-10 text-center"
          style={{ maxWidth: "1200px", marginLeft: "auto", marginRight: "auto" }}
        >
          <HeroSection />
        </section>

        {/* Feature Grid Section */}
        <section
          className="w-full px-6 pb-16"
          style={{ maxWidth: "1200px", marginLeft: "auto", marginRight: "auto" }}
        >
          <div className="text-center mb-10 animate-fade-in-up animation-delay-200">
            <p
              className="font-semibold uppercase tracking-widest mb-2"
              style={{ fontSize: "12px", color: "var(--color-primary)" }}
            >
              Dịch vụ của chúng tôi
            </p>
            <h2
              className="font-bold text-[var(--color-on-surface)] mb-3"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
            >
              Ba bước bảo vệ bạn toàn diện
            </h2>
            <p
              className="mx-auto"
              style={{
                fontSize: "16px",
                color: "var(--color-on-surface-variant)",
                maxWidth: "520px",
                lineHeight: "24px",
              }}
            >
              Chúng tôi cung cấp đầy đủ công cụ để bạn luôn được an toàn và
              phát triển trong môi trường học đường.
            </p>
          </div>
          <FeatureGrid />
        </section>

        {/* Trust Banner */}
        <section
          className="w-full px-6 pb-16"
          style={{ maxWidth: "1200px", marginLeft: "auto", marginRight: "auto" }}
        >
          <div
            className="rounded-[var(--radius-xl)] p-10 flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in-up animation-delay-400"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)",
            }}
          >
            <div className="text-left">
              <h2
                className="font-bold mb-2"
                style={{
                  fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
                  color: "var(--color-on-primary)",
                }}
              >
                Sẵn sàng tạo ra sự thay đổi?
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.82)",
                  maxWidth: "420px",
                  lineHeight: "22px",
                }}
              >
                Hàng nghìn học sinh đã tin tưởng SafeSchool Hub. Hãy tham gia
                cộng đồng an toàn ngay hôm nay.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Button
                id="cta-banner-start"
                size="lg"
                style={{
                  backgroundColor: "var(--color-on-primary)",
                  color: "var(--color-primary)",
                }}
                icon="arrow_forward"
              >
                Bắt đầu miễn phí
              </Button>
              <Button
                id="cta-banner-learn"
                size="lg"
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "var(--color-on-primary)",
                  border: "1px solid rgba(255,255,255,0.4)",
                }}
                icon="info"
                iconPosition="left"
              >
                Tìm hiểu thêm
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Highlights Row */}
        <section
          className="w-full px-6 pb-20"
          style={{ maxWidth: "1200px", marginLeft: "auto", marginRight: "auto" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: "lock",
                label: "Bảo mật tuyệt đối",
                desc: "Dữ liệu của bạn được mã hóa và bảo vệ.",
                color: "var(--color-primary)",
              },
              {
                icon: "support_agent",
                label: "Hỗ trợ 24/7",
                desc: "Đội ngũ chuyên gia luôn sẵn sàng giúp đỡ.",
                color: "var(--color-secondary)",
              },
              {
                icon: "visibility_off",
                label: "Ẩn danh hoàn toàn",
                desc: "Báo cáo mà không cần tiết lộ danh tính.",
                color: "var(--color-tertiary-container)",
              },
              {
                icon: "school",
                label: "Phê duyệt trường học",
                desc: "Được hàng trăm trường học kiểm duyệt và tin dùng.",
                color: "var(--color-primary-container)",
              },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`flex flex-col gap-3 p-5 rounded-[var(--radius-xl)] animate-fade-in-up animation-delay-${(i + 1) * 100}`}
                style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)` }}
                >
                  <Icon name={item.icon} size={20} filled style={{ color: item.color }} />
                </div>
                <h3
                  className="font-semibold"
                  style={{ fontSize: "15px", color: "var(--color-on-surface)" }}
                >
                  {item.label}
                </h3>
                <p
                  style={{ fontSize: "13px", color: "var(--color-on-surface-variant)", lineHeight: "20px" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <Footer />
    </div>
  );
}
