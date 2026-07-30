import { DoctorRegisterForm } from "../../components/auth/DoctorRegisterForm";
import "../../styles/login.css";

export function meta() {
  return [
    { title: "Đăng Ký Hồ Sơ Bác Sĩ Tâm Lý – SafeSchool Hub" },
    {
      name: "description",
      content:
        "Trang đăng ký & xác minh dành riêng cho Bác sĩ tư vấn tâm lý, Chuyên gia tâm thần học và Tổ tư vấn học đường SafeSchool Hub.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export default function DoctorRegisterPage() {
  return <DoctorRegisterForm />;
}
