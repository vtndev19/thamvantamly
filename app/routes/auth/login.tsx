import { LoginForm } from "../../components/auth/LoginForm";

<<<<<<< HEAD
=======
// Khởi tạo Firebase app trước khi LoginForm dùng getApp()
import "../../src/config/firebase";

>>>>>>> f3190dc59cad31921c43168efb47de439199bf06
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
