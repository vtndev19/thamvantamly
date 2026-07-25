import { useState } from "react";
import { Link, redirect } from "react-router";
import { TeacherSidebar } from "../../components/teacher/TeacherSidebar";
import { Icon } from "../../components/ui/Icon";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import "../../src/config/firebase";
import { useAuth } from "../../src/contexts/AuthContext";
import { QnaCommunityBody } from "../../components/qna/QnaCommunityBody";

export function meta() {
  return [
    { title: "Hỏi đáp Q&A - Giáo viên – SafeSchool Hub" },
    {
      name: "description",
      content: "Giải đáp thắc mắc tâm lý học đường, bạo lực học đường dành riêng cho giáo viên trên SafeSchool Hub.",
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
    throw redirect("/auth/login?redirect=/teacher/qna");
  }

  const role = localStorage.getItem("userRole");
  if (role && role !== "teacher" && role !== "admin") {
    throw redirect("/auth/login?error=access_denied");
  }

  return null;
}

export default function TeacherQnAPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Teacher Sidebar */}
      <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer border-none bg-transparent"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>

            <Link
              to="/teacher/dashboard"
              className="flex items-center gap-2 text-[#059669] font-serif font-extrabold text-[17px] tracking-tight select-none"
            >
              <Icon name="shield" filled size={22} style={{ color: "#059669" }} />
              SafeSchool Hub
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="QnA navigation">
              <Link
                to="/teacher/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="home" size={18} />
                Trang chủ
              </Link>
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-[#059669] text-white shadow-sm">
                <Icon name="help" size={18} filled />
                Hỏi đáp Q&A
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/30 flex-shrink-0">
              <img
                src={user?.photoURL || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop"}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Q&A Content Body */}
        <QnaCommunityBody />
      </div>

    </div>
  );
}
