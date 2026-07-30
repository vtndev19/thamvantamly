import { useState } from "react";
import { Link, redirect } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";
import { useAuth } from "../../src/contexts/AuthContext";
import { NewsPageBody } from "../../components/news/NewsPageBody";
import { StudentNotificationBell } from "../../components/student/StudentNotificationBell";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import "../../src/config/firebase";

export function meta() {
  return [
    { title: "Tin tức & Cẩm nang học đường – SafeSchool Hub" },
    {
      name: "description",
      content: "Bảng tin tức, cẩm nang tâm lý, thông báo và kỹ năng mềm dành cho học sinh.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function clientLoader() {
  const auth = getAuth(getApp());
  const user = await new Promise<import("firebase/auth").User | null>(
    (resolve) => {
      const unsubscribe = auth.onAuthStateChanged((u) => {
        unsubscribe();
        resolve(u);
      });
    }
  );

  if (!user) {
    throw redirect("/auth/login?redirect=/student/news");
  }

  const role = localStorage.getItem("userRole");
  if (role && role !== "student" && role !== "admin") {
    throw redirect("/auth/login?error=access_denied");
  }

  return null;
}

export default function StudentNewsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Student Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 relative z-30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer border-none bg-transparent"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>

            <Link
              to="/student/dashboard"
              className="flex items-center gap-2 text-primary font-serif font-extrabold text-[17px] tracking-tight select-none"
            >
              <Icon name="shield" filled size={22} />
              An Toàn Trường Học
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="News navigation">
              <Link
                to="/student/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="home" size={18} />
                Trang chủ
              </Link>
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm">
                <Icon name="newspaper" size={18} filled />
                Tin tức & Cẩm nang
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <StudentNotificationBell />
            <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/30 flex-shrink-0">
              <img
                src={user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop"}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* News Body */}
        <NewsPageBody role="student" />
      </div>
    </div>
  );
}
