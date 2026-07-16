import { RegisterForm } from "../../components/auth/RegisterForm";

// Khởi tạo Firebase app trước khi RegisterForm dùng getApp()
import "../../src/config/firebase";

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
