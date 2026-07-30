import { useEffect, useState } from "react";
import { redirect } from "react-router";
import { TeacherSidebar } from "../../components/teacher/TeacherSidebar";
import { Icon } from "../../components/ui/Icon";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  createNewsPost,
  getNewsBySchoolCode,
  type NewsPost,
  type NewsCategory,
} from "../../src/services/newsService";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import "../../src/config/firebase";

export async function clientLoader() {
  const authInstance = getAuth(getApp());
  const user = await new Promise<import("firebase/auth").User | null>(
    (resolve) => {
      const unsubscribe = authInstance.onAuthStateChanged((u) => {
        unsubscribe();
        resolve(u);
      });
    }
  );

  if (!user) {
    throw redirect("/auth/login?redirect=/teacher/news");
  }

  const role = localStorage.getItem("userRole");
  if (role && role !== "teacher" && role !== "admin") {
    throw redirect("/auth/login?error=access_denied");
  }

  return null;
}

export function meta() {
  return [
    { title: "Tin tức & Sự kiện – SafeSchool Hub" },
    {
      name: "description",
      content:
        "Đăng bài tin tức, sự kiện và gửi thông báo chung đến học sinh cùng trường THPT trên SafeSchool Hub.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

const CATEGORY_CONFIG: Record<
  NewsCategory,
  { label: string; color: string; bg: string; icon: string }
> = {
  news: {
    label: "Tin tức",
    color: "#0058bd",
    bg: "#e8f0fe",
    icon: "newspaper",
  },
  event: {
    label: "Sự kiện",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: "event",
  },
};

export default function TeacherNewsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NewsCategory>("news");
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const teacherSchoolCode = user?.schoolCode || "THPT001";

  // Load bài viết
  async function loadPosts() {
    if (!user) return;
    try {
      setLoadingPosts(true);
      const data = await getNewsBySchoolCode(teacherSchoolCode);
      setPosts(data);
    } catch (err) {
      console.error("Error loading news posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [user]);

  // Xử lý đăng bài
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) return;

    try {
      setSubmitting(true);
      await createNewsPost({
        teacherUid: user.uid,
        teacherName: user.displayName || "Giáo viên",
        schoolCode: teacherSchoolCode,
        title: title.trim(),
        content: content.trim(),
        category,
        isBroadcast,
      });

      setToast({
        message: isBroadcast
          ? `✅ Đã đăng bài và gửi thông báo chung đến tất cả học sinh trường ${teacherSchoolCode}!`
          : "✅ Đã đăng bài viết thành công!",
        type: "success",
      });

      // Reset form
      setTitle("");
      setContent("");
      setCategory("news");
      setIsBroadcast(false);
      setShowForm(false);

      // Reload posts
      await loadPosts();
    } catch (err: any) {
      console.error("Error creating news post:", err);
      setToast({
        message: `❌ Lỗi đăng bài: ${err?.message || "Không xác định"}`,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <TeacherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
              aria-label="Mở menu"
            >
              <Icon name="menu" size={24} />
            </button>
            <h2 className="text-lg font-serif font-bold text-[#059669] tracking-tight">
              SafeSchool Hub
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Thông báo"
            >
              <Icon name="notifications" size={22} />
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-[900px] w-full mx-auto animate-fade-in">
          {/* Page Title + CTA */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-serif font-bold text-on-surface flex items-center gap-2">
                <Icon name="newspaper" size={24} filled style={{ color: "#0058bd" }} />
                Tin tức & Sự kiện
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Đăng bài viết và gửi thông báo chung đến học sinh trường{" "}
                <span className="font-bold text-primary">{teacherSchoolCode}</span>
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer border-none flex items-center gap-2"
            >
              <Icon name={showForm ? "close" : "add"} size={18} />
              {showForm ? "Đóng" : "Đăng bài mới"}
            </button>
          </div>

          {/* ── Form Đăng bài ────────────────────────────────────────────── */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-[#e8eaf0] rounded-3xl p-6 md:p-8 shadow-xs space-y-5 animate-fade-in"
            >
              <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Icon name="edit_note" size={22} filled />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Tạo bài viết mới</h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Bài viết sẽ hiển thị cho học sinh cùng trường THPT
                  </p>
                </div>
              </div>

              {/* Tiêu đề */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Tiêu đề bài viết <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Tuần lễ Sức khỏe Tâm lý 2026..."
                  required
                  className="w-full px-4 py-3 text-sm border border-outline-variant/30 rounded-xl bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Nội dung */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung chi tiết bài viết..."
                  required
                  rows={5}
                  className="w-full px-4 py-3 text-sm border border-outline-variant/30 rounded-xl bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Danh mục */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2">
                  Danh mục
                </label>
                <div className="flex items-center gap-3">
                  {(["news", "event"] as NewsCategory[]).map((cat) => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const selected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selected
                            ? "shadow-sm"
                            : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container"
                        }`}
                        style={
                          selected
                            ? {
                                backgroundColor: cfg.bg,
                                color: cfg.color,
                                borderColor: cfg.color + "40",
                              }
                            : undefined
                        }
                      >
                        <Icon name={cfg.icon} size={16} filled={selected} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ☑ Thông báo chung */}
              <div
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  isBroadcast
                    ? "bg-amber-50 border-amber-400"
                    : "bg-surface-container-low border-outline-variant/20 hover:border-outline-variant/40"
                }`}
                onClick={() => setIsBroadcast(!isBroadcast)}
              >
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
                    isBroadcast
                      ? "bg-amber-500 border-amber-500"
                      : "border-outline-variant/50 bg-white"
                  }`}
                >
                  {isBroadcast && (
                    <Icon name="check" size={16} style={{ color: "white" }} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Icon
                      name="campaign"
                      size={18}
                      filled
                      style={{ color: isBroadcast ? "#d97706" : "#727785" }}
                    />
                    Thông báo chung
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Khi bật, bài viết sẽ được <strong>gửi thông báo đẩy</strong> đến{" "}
                    <strong>tất cả học sinh</strong> thuộc trường{" "}
                    <span className="font-bold text-primary">{teacherSchoolCode}</span>.
                    Học sinh sẽ nhận được thông báo ngay trên Dashboard.
                  </p>
                  {isBroadcast && (
                    <div className="mt-2 flex items-center gap-1.5 text-amber-700 text-[11px] font-bold">
                      <Icon name="warning" size={14} filled />
                      Thông báo sẽ được gửi ngay sau khi đăng bài
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer border-none"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !content.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer border-none flex items-center gap-2 shadow-xs"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang đăng...
                    </>
                  ) : (
                    <>
                      <Icon name="send" size={16} />
                      {isBroadcast ? "Đăng bài & Gửi thông báo" : "Đăng bài"}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── Danh sách bài viết ───────────────────────────────────────── */}
          <div className="bg-white border border-[#e8eaf0] rounded-3xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-[#e8eaf0] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Icon name="feed" size={20} filled />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">
                    Bài viết đã đăng
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Danh sách tin tức & sự kiện của trường {teacherSchoolCode}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-on-surface-variant bg-surface-container px-3 py-1 rounded-lg">
                Tổng cộng: {posts.length} bài viết
              </span>
            </div>

            {loadingPosts ? (
              <div className="p-10 text-center text-xs text-on-surface-variant">
                <span className="inline-block w-5 h-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mr-2" />
                Đang tải bài viết từ Firebase…
              </div>
            ) : posts.length === 0 ? (
              <div className="p-10 text-center text-xs text-on-surface-variant space-y-2">
                <Icon name="article" size={36} style={{ color: "#a1a1aa", margin: "0 auto" }} />
                <p className="font-bold text-sm text-on-surface">Chưa có bài viết nào</p>
                <p className="text-xs text-on-surface-variant max-w-[400px] w-full mx-auto">
                  Bấm "Đăng bài mới" để tạo tin tức hoặc sự kiện cho học sinh trong trường.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/20">
                {posts.map((post) => {
                  const catCfg = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.news;
                  return (
                    <div
                      key={post.id}
                      className="p-5 md:p-6 hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1"
                              style={{
                                backgroundColor: catCfg.bg,
                                color: catCfg.color,
                              }}
                            >
                              <Icon name={catCfg.icon} size={12} filled />
                              {catCfg.label}
                            </span>

                            {post.isBroadcast && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                <Icon name="campaign" size={12} filled />
                                Đã thông báo chung
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-base font-bold text-on-surface">
                            {post.title}
                          </h3>

                          {/* Excerpt */}
                          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                            {post.content}
                          </p>

                          {/* Meta */}
                          <div className="flex items-center gap-4 text-[11px] text-on-surface-variant/80 pt-1">
                            <span className="flex items-center gap-1">
                              <Icon name="person" size={13} />
                              {post.teacherName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="schedule" size={13} />
                              {new Date(post.createdAt).toLocaleString("vi-VN")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="school" size={13} />
                              {post.schoolCode}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-[420px] px-5 py-4 rounded-2xl shadow-2xl border text-sm font-semibold animate-fade-in flex items-start gap-3 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <Icon
            name={toast.type === "success" ? "check_circle" : "error"}
            size={20}
            filled
            style={{ color: toast.type === "success" ? "#059669" : "#dc2626", flexShrink: 0, marginTop: 1 }}
          />
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-0.5 text-current opacity-50 hover:opacity-100 cursor-pointer bg-transparent border-none"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
