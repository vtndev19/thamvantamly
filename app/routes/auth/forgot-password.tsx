import { ForgotPasswordForm } from "../../components/auth/ForgotPasswordForm";
import "../../styles/login.css";

export function meta() {
  return [
    { title: "Quên mật khẩu – SafeSchool Hub" },
    {
      name: "description",
      content:
        "Lấy lại mật khẩu tài khoản SafeSchool Hub qua OTP xác minh email an toàn.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
