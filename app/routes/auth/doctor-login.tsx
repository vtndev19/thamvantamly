import { DoctorLoginForm } from "../../components/auth/DoctorLoginForm";
import "../../styles/login.css";

export function meta() {
  return [
    { title: "Cổng Đăng Nhập Bác Sĩ & Chuyên Gia – SafeSchool Hub" },
    {
      name: "description",
      content:
        "Trang đăng nhập dành riêng cho Bác sĩ tư vấn tâm lý, Chuyên gia tâm thần học và Tổ tư vấn học đường SafeSchool Hub.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export default function DoctorLoginPage() {
  return <DoctorLoginForm />;
}
