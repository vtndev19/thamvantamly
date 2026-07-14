import { FeatureCard, type FeatureCardProps } from "./FeatureCard";

const FEATURES: FeatureCardProps[] = [
  {
    icon: "local_library",
    iconColor: "var(--color-primary)",
    title: "Kiến thức & An toàn",
    description:
      "Khám phá thư viện tài nguyên giúp bạn tự bảo vệ bản thân và xây dựng môi trường học đường tích cực.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida/AP1WRLs3x3l_RqJFWy0jrT5cUHcn2kypuMycQNW1D-zKyr53LnV2BU2cmnDzZo0wExq_LyxNTQygFfYg2J2cRCG4tGlPmXaqCu-7dm1qDORThM0-oT88zZS2oJFHI7n4veZvIbc1xnFugHkJk68SW4c4jxueA-Fp0lXRuRVNBdoLVZpxOGkKNmNF8KpmvnkBjq7iNdaUbARYMDUjOg9PdL0SxV6v6EKi4LN3CoKVcqDhkl0gEfmIfqOiRa5_2J_M",
    imageAlt: "Thư viện kiến thức an toàn học đường",
    animationDelay: "animation-delay-100",
  },
  {
    icon: "psychology",
    iconColor: "var(--color-secondary)",
    title: "Hỗ trợ & Phát triển",
    description:
      "Kết nối riêng tư với các chuyên viên tâm lý luôn sẵn sàng lắng nghe và đồng hành cùng bạn.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida/AP1WRLvFxXRaZ4fnfrFon1YuhkHP99rAYjbPopsMy4L9zqQDrmR-bKOH8xePrgSrRTX_gI2YRiVDGf6kqteSNbTANYGx5U7ah8IQsrDwIMx09I3Mce9xei0xs7cnx59NKD3mnuCYCX3v-n2RnFR2maw_8XuX4mtkw0Cv11VgJ1j0K0sLhm_LHhkVGJ3HQw6IHtXUfivBBP2by2opht0CKlWnWhrertLDm4euYy1EGhkIMz0APT4MhpwZrhk-Pkmx",
    imageAlt: "Hỗ trợ tâm lý học đường",
    animationDelay: "animation-delay-200",
  },
  {
    icon: "security",
    iconColor: "var(--color-tertiary-container)",
    title: "Báo cáo An toàn",
    description:
      "Gửi báo cáo ẩn danh hoặc công khai về các hành vi vi phạm, bạo lực học đường để được hỗ trợ kịp thời.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida/AP1WRLtGE1JPK-fUxnd8Yxu2JGU8wUITvaN4bfGQuEdUoboPgB6da6laStUxYAnGHTQQAE8VU8L9rUjDqQrl9GX_fdKBe6ApoqydcwKqKI9NfeAkAYf-5DsQJ3aPdIIcyv8Dj3MICGIOkq5ApK3u7-M_U3HbVxXYQV4qGK0Onbs3P5P23lxRC_tYhuQk6SkFvVeoymNOh2O-xE4dmHvo5zimYZE2SdGiEUVJm-5Cbum8AocXFyNx19awHf9_zYCA",
    imageAlt: "Báo cáo an toàn học đường",
    animationDelay: "animation-delay-300",
  },
];

/**
 * FeatureGrid – Renders the three main feature cards in a responsive bento grid.
 */
export function FeatureGrid() {
  return (
    <section aria-labelledby="features-heading" className="w-full">
      <h2 id="features-heading" className="sr-only">
        Các tính năng chính
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
