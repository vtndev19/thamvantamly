import { RegisterForm } from "../../components/auth/RegisterForm";

// Import CSS external – chỉ load khi route này active
import "../../styles/register.css";

export function meta() {
  return [
    { title: "Đăng ký – SafeSchool Hub" },
    {
      name: "description",
      content:
        "Tạo tài khoản SafeSchool Hub miễn phí để tiếp cận không gian an toàn, hỗ trợ tâm lý và báo cáo bạo lực học đường.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export default function RegisterPage() {
  return <RegisterForm />;
}
