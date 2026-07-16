import { Unauthorized } from "../components/auth/Unauthorized";

export function meta() {
  return [
    { title: "Không có quyền truy cập – SafeSchool Hub" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export default function UnauthorizedPage() {
  return <Unauthorized />;
}
