import { ResetPasswordForm } from "../../components/auth/ResetPasswordForm";
import "../../styles/login.css";

export function meta() {
  return [
    { title: "Đặt lại mật khẩu – SafeSchool Hub" },
    {
      name: "description",
      content: "Tạo mật khẩu mới cho tài khoản SafeSchool Hub của bạn.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
