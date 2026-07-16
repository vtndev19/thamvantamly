import { LoginForm } from "../../components/auth/LoginForm";

// Import CSS external – chỉ load khi route này active
import "../../styles/login.css";

export function meta() {
  return [
    { title: "Đăng nhập – SafeSchool Hub" },
    {
      name: "description",
      content:
        "Đăng nhập vào SafeSchool Hub để truy cập không gian an toàn, hỗ trợ tâm lý và báo cáo bạo lực học đường.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export default function LoginPage() {
  return <LoginForm />;
}
