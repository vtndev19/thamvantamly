import { useState } from "react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { Icon } from "../../components/ui/Icon";

export function meta() {
  return [
    { title: "Quản lý người dùng – SafeSchool Hub Admin" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

type UserRole = "student" | "teacher" | "admin";
type UserStatus = "active" | "inactive" | "pending";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinDate: string;
  avatar: string;
}

const USERS: User[] = [
  { id: "1", name: "Nguyễn Văn Nam", email: "nam@school.vn", role: "student", status: "active", joinDate: "10/01/2026", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=60&auto=format&fit=crop" },
  { id: "2", name: "Trần Thị Lan", email: "lan@school.vn", role: "teacher", status: "active", joinDate: "05/08/2025", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=60&auto=format&fit=crop" },
  { id: "3", name: "Lê Văn An", email: "an@school.vn", role: "student", status: "pending", joinDate: "17/07/2026", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=60&auto=format&fit=crop" },
  { id: "4", name: "Phạm Thị Mai", email: "mai@school.vn", role: "teacher", status: "inactive", joinDate: "15/03/2025", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=60&auto=format&fit=crop" },
  { id: "5", name: "Hoàng Admin", email: "admin@school.vn", role: "admin", status: "active", joinDate: "01/01/2025", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=60&auto=format&fit=crop" },
];

const ROLE_BADGE: Record<UserRole, { label: string; color: string; bg: string }> = {
  student: { label: "Học sinh", color: "#0058bd", bg: "#e8f0fe" },
  teacher: { label: "Giáo viên", color: "#059669", bg: "#d1fae5" },
  admin: { label: "Admin", color: "#dc2626", bg: "#fee2e2" },
};

const STATUS_BADGE: Record<UserStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Hoạt động", color: "#059669", bg: "#d1fae5" },
  inactive: { label: "Không hoạt động", color: "#727785", bg: "#f3f4f6" },
  pending: { label: "Chờ duyệt", color: "#994100", bg: "#fff2e8" },
};

export default function AdminUsersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  const filtered = USERS.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="flex min-h-screen bg-surface-container-low">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer" aria-label="Mở menu">
              <Icon name="menu" size={24} />
            </button>
            <h2 className="text-lg font-serif font-bold text-primary tracking-tight">SafeSchool Hub</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer" aria-label="Thông báo">
              <Icon name="notifications" size={22} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1200px] w-full mx-auto animate-fade-in space-y-6">
          {/* Title Row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-base font-semibold text-on-surface">Quản lý người dùng</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">{USERS.length} người dùng trong hệ thống</p>
            </div>
            <button
              id="btn-add-user"
              className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
            >
              <Icon name="person_add" size={18} style={{ color: "white" }} />
              Thêm người dùng
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[220px] relative">
              <Icon name="search" size={18} style={{ color: "#727785", position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                id="search-users"
                type="search"
                placeholder="Tìm theo tên hoặc email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e8eaf0] rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            {(["all", "student", "teacher", "admin"] as const).map((r) => (
              <button
                key={r}
                id={`filter-role-${r}`}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  roleFilter === r ? "bg-primary text-on-primary" : "bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {r === "all" ? "Tất cả" : ROLE_BADGE[r].label}
              </button>
            ))}
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-[#e8eaf0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e8eaf0] bg-surface-container-low">
                    <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Người dùng</th>
                    <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Vai trò</th>
                    <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Trạng thái</th>
                    <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Ngày tham gia</th>
                    <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filtered.map((user) => {
                    const role = ROLE_BADGE[user.role];
                    const status = STATUS_BADGE[user.status];
                    return (
                      <tr key={user.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-on-surface">{user.name}</p>
                              <p className="text-[11px] text-on-surface-variant">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ backgroundColor: role.bg, color: role.color }}>{role.label}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-on-surface-variant">{user.joinDate}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-1">
                            <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer" aria-label="Chỉnh sửa">
                              <Icon name="edit" size={16} />
                            </button>
                            <button className="p-1.5 text-on-surface-variant hover:text-error hover:bg-[#fff0f0] rounded-lg transition-colors cursor-pointer" aria-label="Xóa">
                              <Icon name="delete" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
