import { Home } from "../components/home/Home";

export function meta() {
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

export default function HomePage() {
  return <Home />;
}
