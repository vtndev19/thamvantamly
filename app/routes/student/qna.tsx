import { useState, useEffect } from "react";
import { Link, redirect } from "react-router";
import { Sidebar } from "../../components/student/Sidebar";
import { Icon } from "../../components/ui/Icon";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import "../../src/config/firebase";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  submitQuestion,
  subscribeToUserQuestions,
  formatQuestionDate,
  type QuestionRecord,
} from "../../src/services/qnaService";

export function meta() {
  return [
    { title: "Diễn đàn Hỏi đáp – SafeSchool Hub" },
    {
      name: "description",
      content: "Diễn đàn thảo luận, hỏi đáp và tư vấn tâm lý học đường dành cho học sinh.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function clientLoader() {
  const auth = getAuth(getApp());
  const user = await new Promise<import("firebase/auth").User | null>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((u) => { unsubscribe(); resolve(u); });
  });
  if (!user) throw redirect("/auth/login?redirect=/student/qna");
  const role = localStorage.getItem("userRole");
  if (role && role !== "student") throw redirect("/auth/login?error=access_denied");
  return null;
}

// ─── Types & Constants ────────────────────────────────────────────────────────

type UserQuestion = QuestionRecord;

const CATEGORIES = ["Tất cả", "Tâm lý", "Bạo lực học đường", "Học tập", "Sức khỏe"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Tâm lý":            { bg: "#ede9fe", text: "#6d28d9" },
  "Bạo lực học đường": { bg: "#fee2e2", text: "#b91c1c" },
  "Học tập":           { bg: "#dbeafe", text: "#1d4ed8" },
  "Sức khỏe":          { bg: "#dcfce7", text: "#15803d" },
};

// Seed FAQ posts — shown as "forum threads answered by experts"
const FORUM_POSTS = [
  {
    id: "p1",
    author: "Học sinh lớp 10A",
    avatar: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=100",
    isAnonymous: false,
    category: "Tâm lý",
    title: "Làm thế nào để vượt qua áp lực học tập và thi cử căng thẳng?",
    body: "Gần đến kỳ thi mình rất hay bị mất ngủ, lo lắng quá mức. Các bạn có cách nào để vừa ôn tập tốt mà vẫn giữ được sức khỏe tinh thần không?",
    time: "2 giờ trước",
    views: 84,
    replies: 3,
    upvotes: 12,
    answer: "Để giảm áp lực thi cử, bạn nên lập kế hoạch ôn tập sớm, phân bổ thời gian hợp lý (học 45 phút, nghỉ 5–10 phút). Đừng quên ngủ đủ 7–8 tiếng mỗi ngày và tập thể dục nhẹ nhàng. Nếu cảm thấy quá tải, hãy chia sẻ với giáo viên chủ nhiệm hoặc chuyên gia tâm lý học đường.",
    answerBy: "ThS. Trần Thị Lan – Chuyên gia tâm lý",
  },
  {
    id: "p2",
    author: "Ẩn danh",
    avatar: "",
    isAnonymous: true,
    category: "Bạo lực học đường",
    title: "Tôi phải làm gì khi chứng kiến bạn cùng lớp bị bắt nạt?",
    body: "Có một nhóm bạn hay bắt nạt một bạn trong lớp mình, mình rất muốn giúp nhưng sợ bị liên lụy. Mình nên làm gì?",
    time: "5 giờ trước",
    views: 127,
    replies: 5,
    upvotes: 21,
    answer: "Đầu tiên, hãy đảm bảo sự an toàn của bản thân. Không nên tham gia vào cuộc tranh chấp. Thay vào đó, hãy báo cáo với giáo viên, giám thị hoặc dùng tính năng báo cáo ẩn danh trên SafeSchool Hub. Hành động nhanh của bạn có thể bảo vệ bạn học khỏi tổn thương nghiêm trọng.",
    answerBy: "Ban Tư vấn Học đường",
  },
  {
    id: "p3",
    author: "Minh Khoa",
    avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=100",
    isAnonymous: false,
    category: "Học tập",
    title: "Phương pháp ghi nhớ thông tin hiệu quả khi tự học tại nhà?",
    body: "Mình hay học bài nhưng đến hôm sau lại quên hết. Có phương pháp học nào giúp nhớ lâu hơn không?",
    time: "1 ngày trước",
    views: 203,
    replies: 7,
    upvotes: 35,
    answer: "Bạn có thể áp dụng Active Recall (gợi nhớ chủ động) kết hợp Spaced Repetition (ôn tập ngắt quãng). Vẽ Mindmap hoặc giảng lại bài cho bạn bè cũng giúp ghi nhớ sâu hơn nhiều so với chỉ đọc tài liệu.",
    answerBy: "TS. Nguyễn Văn Nam – Tư vấn học đường",
  },
  {
    id: "p4",
    author: "Thảo Nguyên",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=100",
    isAnonymous: false,
    category: "Sức khỏe",
    title: "Làm sao để thiết lập chế độ sinh hoạt lành mạnh chống mệt mỏi?",
    body: "Mình hay cảm thấy mệt mỏi dù không làm gì nhiều, đặc biệt là buổi chiều sau giờ học. Mọi người có bí quyết gì không?",
    time: "2 ngày trước",
    views: 156,
    replies: 4,
    upvotes: 18,
    answer: "Hãy uống đủ nước (1.5–2 lít/ngày), hạn chế thức khuya sau 11h, tránh điện thoại 30 phút trước khi ngủ. Ăn sáng đầy đủ và tránh đồ ăn nhanh nhiều dầu mỡ vào buổi tối.",
    answerBy: "Chuyên viên Lê Hoàng – Sức khỏe học đường",
  },
  {
    id: "p5",
    author: "Ẩn danh",
    avatar: "",
    isAnonymous: true,
    category: "Tâm lý",
    title: "Làm sao để tự tin hơn khi phát biểu trước đám đông?",
    body: "Mỗi khi phải phát biểu trước lớp mình lại run và quên hết nội dung, dù đã chuẩn bị kỹ. Mình cần làm gì?",
    time: "3 ngày trước",
    views: 98,
    replies: 6,
    upvotes: 27,
    answer: "Sự tự tin đến từ sự luyện tập. Hãy bắt đầu bằng cách phát biểu trong các nhóm nhỏ, luyện nói trước gương, và tập trung vào thông điệp bạn muốn truyền tải thay vì lo lắng người khác nghĩ gì về mình.",
    answerBy: "ThS. Trần Thị Lan – Chuyên gia tâm lý",
  },
];

// ─── Thread Card Component ────────────────────────────────────────────────────

function ThreadCard({
  post,
  onClick,
}: {
  post: typeof FORUM_POSTS[0];
  onClick: () => void;
}) {
  const [upvoted, setUpvoted] = useState(false);
  const catColor = CATEGORY_COLORS[post.category] ?? { bg: "#f3f4f6", text: "#374151" };

  return (
    <article
      className="bg-white border border-[#e8eaf0] rounded-2xl hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
      onClick={onClick}
    >
      <div className="p-5">
        {/* Top row: author + time */}
        <div className="flex items-center gap-2.5 mb-3">
          {post.isAnonymous ? (
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
              <Icon name="person" size={18} style={{ color: "#9ca3af" }} />
            </div>
          ) : (
            <img src={post.avatar} alt={post.author} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-on-surface">{post.author}</span>
            <span className="text-[11px] text-on-surface-variant ml-2">· {post.time}</span>
          </div>
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-extrabold flex-shrink-0"
            style={{ backgroundColor: catColor.bg, color: catColor.text }}
          >
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-on-surface leading-snug mb-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        {/* Body preview */}
        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
          {post.body}
        </p>

        {/* Expert answered badge */}
        {post.answer && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 w-fit">
            <Icon name="check_circle" size={13} filled style={{ color: "#059669" }} />
            Đã được chuyên gia trả lời
          </div>
        )}
      </div>

      {/* Bottom stats bar */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-outline-variant/20 bg-surface-container/20">
        <button
          className={`flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${upvoted ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
          onClick={(e) => { e.stopPropagation(); setUpvoted(!upvoted); }}
        >
          <Icon name={upvoted ? "thumb_up" : "thumb_up"} size={14} filled={upvoted} />
          {post.upvotes + (upvoted ? 1 : 0)}
        </button>
        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
          <Icon name="chat_bubble_outline" size={14} />
          {post.replies} trả lời
        </span>
        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
          <Icon name="visibility" size={14} />
          {post.views} lượt xem
        </span>
      </div>
    </article>
  );
}

// ─── Thread Detail Modal ──────────────────────────────────────────────────────

function ThreadModal({
  post,
  onClose,
}: {
  post: typeof FORUM_POSTS[0];
  onClose: () => void;
}) {
  const catColor = CATEGORY_COLORS[post.category] ?? { bg: "#f3f4f6", text: "#374151" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      style={{ animation: "fadeIn 0.2s ease" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
        style={{ width: "min(680px, calc(100vw - 2rem))", maxHeight: "90vh", animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0" style={{ background: "linear-gradient(135deg,#eff6ff,#f5f3ff)" }}>
          <div className="flex items-center gap-3">
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-extrabold"
              style={{ backgroundColor: catColor.bg, color: catColor.text }}
            >
              {post.category}
            </span>
            <span className="text-xs text-on-surface-variant">Chi tiết bài viết</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/80 text-on-surface-variant cursor-pointer transition-colors">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
          {/* Original post */}
          <div>
            <h2 className="text-xl font-bold text-on-surface mb-4 leading-snug">{post.title}</h2>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-outline-variant/20">
              {post.isAnonymous ? (
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                  <Icon name="person" size={22} style={{ color: "#9ca3af" }} />
                </div>
              ) : (
                <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-bold text-on-surface">{post.author}</p>
                <p className="text-xs text-on-surface-variant">{post.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-on-surface-variant"><Icon name="thumb_up" size={13} /> {post.upvotes}</span>
                <span className="flex items-center gap-1 text-xs text-on-surface-variant"><Icon name="visibility" size={13} /> {post.views}</span>
              </div>
            </div>
            <p className="text-sm text-on-surface leading-7 bg-surface-container/30 rounded-2xl p-5 border border-outline-variant/20">
              {post.body}
            </p>
          </div>

          {/* Expert answer */}
          {post.answer && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-outline-variant/30" />
                <span className="text-[11px] font-bold text-on-surface-variant px-2">PHẢN HỒI TỪ CHUYÊN GIA</span>
                <div className="flex-1 h-px bg-outline-variant/30" />
              </div>
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="support_agent" size={18} style={{ color: "white" }} filled />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-extrabold text-primary mb-2 uppercase tracking-wide">{post.answerBy}</p>
                  <p className="text-sm text-on-surface leading-relaxed">{post.answer}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentQnAPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeThread, setActiveThread] = useState<typeof FORUM_POSTS[0] | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("Tâm lý");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // My questions from Firebase
  const [userQuestions, setUserQuestions] = useState<UserQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<"forum" | "mine">("forum");

  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToUserQuestions(user.uid, (qs) => setUserQuestions(qs));
    return () => unsub();
  }, [user?.uid]);

  const filteredPosts = FORUM_POSTS.filter((p) => {
    const matchCat = selectedCategory === "Tất cả" || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitQuestion({
        question: `${newTitle}\n\n${newBody}`,
        category: newCategory,
        isAnonymous,
        sender: isAnonymous ? null : { uid: user?.uid ?? null, displayName: user?.displayName ?? "Học sinh", email: user?.email ?? null },
      });
      setNewTitle(""); setNewBody(""); setIsAnonymous(false);
      setShowPostForm(false);
      setShowSuccessToast(true);
      setActiveTab("mine");
      setTimeout(() => setShowSuccessToast(false), 5000);
    } catch {
      setSubmitError("Gửi thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* ── Header ── */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer" aria-label="Mở menu">
              <Icon name="menu" size={24} />
            </button>
            <Link to="/student/dashboard" className="flex items-center gap-2 text-primary font-serif font-extrabold text-[17px] tracking-tight select-none">
              <Icon name="shield" filled size={22} />
              An Toàn Trường Học
            </Link>
            <nav className="hidden md:flex items-center gap-1 ml-6">
              <Link to="/student/dashboard" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
                <Icon name="home" size={18} /> Trang chủ
              </Link>
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm">
                <Icon name="forum" size={18} filled /> Diễn đàn
              </span>
              <Link to="/student/experts" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
                <Icon name="psychology" size={18} /> Chuyên gia
              </Link>
              <Link to="/student/support" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
                <Icon name="emergency" size={18} /> Hỗ trợ khẩn cấp
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPostForm(true)}
              className="hidden sm:flex items-center gap-2 bg-primary text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              <Icon name="add" size={16} />
              Đăng bài mới
            </button>
            <button className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/30 hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0">
              <img src={user?.photoURL || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&auto=format&fit=crop"} alt="Ảnh đại diện" className="w-full h-full object-cover" />
            </button>
          </div>
        </header>

        {/* ── Body ── */}
        <main className="flex-1 overflow-y-auto animate-fade-in">
          {/* Forum Banner */}
          <div className="px-5 md:px-8 py-6" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)", borderBottom: "1px solid #e8eaf0" }}>
            <div className="max-w-[1050px] mx-auto">
              <div className="flex flex-col lg:flex-row gap-6 items-start md:items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-on-surface flex items-center gap-2">
                    <Icon name="forum" size={30} filled style={{ color: "#0058bd" }} />
                    Diễn đàn Hỏi đáp
                  </h1>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Thảo luận, chia sẻ và nhận tư vấn từ chuyên gia tâm lý học đường.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-center">
                  {[{ label: "Bài viết", value: FORUM_POSTS.length + userQuestions.length }, { label: "Đã trả lời", value: FORUM_POSTS.filter(p => p.answer).length }, { label: "Thành viên", value: "1.2K" }].map(s => (
                    <div key={s.label}>
                      <p className="text-xl font-extrabold text-primary">{s.value}</p>
                      <p className="text-[11px] text-on-surface-variant">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[1100px] mx-auto px-5 md:px-8 py-6 flex flex-col lg:flex-row gap-6 items-start">

            {/* ── LEFT: Thread list ── */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              {/* Toast */}
              {showSuccessToast && (
                <div className="flex items-start justify-between gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <Icon name="check_circle" size={22} filled style={{ color: "#059669" }} />
                    <div>
                      <p className="font-bold text-sm">Đăng bài thành công!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">Câu hỏi đã được gửi tới ban tư vấn và sẽ được trả lời sớm nhất.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSuccessToast(false)} className="p-1 hover:bg-emerald-100 rounded-full cursor-pointer"><Icon name="close" size={16} /></button>
                </div>
              )}

              {/* Tab: Forum / My Questions */}
              <div className="flex items-center gap-1 bg-surface-container/40 rounded-xl p-1 w-fit border border-outline-variant/20">
                {([["forum", "forum", "Diễn đàn"], ["mine", "history", `Bài của tôi (${userQuestions.length})`]] as const).map(([key, icon, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === key ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
                  >
                    <Icon name={icon} size={16} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Search + Filter (forum tab only) */}
              {activeTab === "forum" && (
                <>
                  <div className="flex items-center gap-2 bg-white border border-[#e8eaf0] rounded-2xl px-4 py-2.5 shadow-xs">
                    <Icon name="search" size={20} style={{ color: "#9ca3af" }} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm bài viết..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 text-sm bg-transparent outline-none text-on-surface placeholder:text-on-surface-variant/50"
                    />
                    {searchQuery && <button onClick={() => setSearchQuery("")} className="cursor-pointer text-on-surface-variant hover:text-on-surface"><Icon name="close" size={16} /></button>}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map((cat) => {
                      const active = selectedCategory === cat;
                      const cc = cat === "Tất cả" ? null : CATEGORY_COLORS[cat];
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${active ? (cc ? "" : "bg-primary text-on-primary border-primary shadow-sm") : "bg-white border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary"}`}
                          style={active && cc ? { backgroundColor: cc.bg, color: cc.text, borderColor: cc.text + "40" } : undefined}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Threads */}
                  {filteredPosts.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {filteredPosts.map((post) => (
                        <ThreadCard key={post.id} post={post} onClick={() => setActiveThread(post)} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white border border-dashed border-outline-variant/40 rounded-2xl">
                      <Icon name="search_off" size={36} style={{ color: "#d1d5db" }} />
                      <p className="text-sm font-bold text-on-surface mt-3">Không tìm thấy bài viết</p>
                      <p className="text-xs text-on-surface-variant mt-1">Thử từ khóa khác hoặc thay đổi bộ lọc.</p>
                    </div>
                  )}
                </>
              )}

              {/* My Questions Tab */}
              {activeTab === "mine" && (
                <div className="flex flex-col gap-3">
                  {userQuestions.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-dashed border-outline-variant/40 rounded-2xl">
                      <Icon name="forum" size={36} style={{ color: "#d1d5db" }} />
                      <p className="text-sm font-bold text-on-surface mt-3">Bạn chưa đăng bài nào</p>
                      <p className="text-xs text-on-surface-variant mt-1">Nhấn "Đăng bài mới" để đặt câu hỏi đầu tiên!</p>
                      <button onClick={() => setShowPostForm(true)} className="mt-4 flex items-center gap-2 bg-primary text-on-primary text-xs font-bold px-5 py-2.5 rounded-full mx-auto hover:bg-primary/90 transition-colors cursor-pointer">
                        <Icon name="add" size={16} /> Đăng bài ngay
                      </button>
                    </div>
                  ) : (
                    userQuestions.map((uq, idx) => {
                      const isAnswered = uq.status === "Đã trả lời";
                      return (
                        <article key={uq.id} className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden shadow-xs">
                          <div className="p-5">
                            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${isAnswered ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                <Icon name={isAnswered ? "check_circle" : "hourglass_empty"} size={11} filled={isAnswered} />
                                {uq.status}
                              </span>
                              <span className="text-[11px] text-on-surface-variant">
                                {typeof uq.createdAt === "number" ? formatQuestionDate(uq.createdAt) : uq.createdAt}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-on-surface leading-snug mb-1">
                              {uq.isAnonymous && <span className="text-purple-600 font-semibold mr-1.5">[Ẩn danh]</span>}
                              {uq.question}
                            </p>
                            {uq.answer && (
                              <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-3 flex gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Icon name="support_agent" size={14} style={{ color: "white" }} filled />
                                </div>
                                <div>
                                  <p className="text-[10px] font-extrabold text-primary uppercase mb-1">Ban Tư vấn Học đường</p>
                                  <p className="text-xs text-on-surface-variant leading-relaxed">{uq.answer}</p>
                                </div>
                              </div>
                            )}
                            {!uq.answer && (
                              <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant italic mt-2">
                                <Icon name="hourglass_empty" size={13} /> Đang được chuyên gia tiếp nhận...
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT Sidebar ── */}
            <aside className="w-full lg:w-[300px] flex flex-col gap-4 flex-shrink-0 lg:sticky lg:top-[73px] self-start">
              {/* Quick post button */}
              <button
                onClick={() => setShowPostForm(true)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-bold text-sm py-3.5 rounded-2xl hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
              >
                <Icon name="edit" size={18} />
                Đăng câu hỏi mới
              </button>

              {/* Hot topics */}
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <Icon name="local_fire_department" size={18} style={{ color: "#ef4444" }} filled />
                  Chủ đề nổi bật
                </h3>
                <div className="flex flex-col gap-2.5">
                  {[...FORUM_POSTS].sort((a, b) => b.upvotes - a.upvotes).slice(0, 4).map((p, i) => {
                    const cc = CATEGORY_COLORS[p.category];
                    return (
                      <button key={p.id} onClick={() => setActiveThread(p)} className="flex items-start gap-2 text-left w-full group cursor-pointer py-1">
                        <span className="text-sm font-extrabold text-on-surface-variant/30 w-5 flex-shrink-0 pt-0.5">{i + 1}</span>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-xs font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors" style={{ display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{p.title}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold mt-1 inline-block" style={{ backgroundColor: cc?.bg, color: cc?.text }}>{p.category}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Forum rules */}
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <Icon name="gavel" size={17} style={{ color: "#0058bd" }} />
                  Nội quy diễn đàn
                </h3>
                <ul className="flex flex-col gap-2">
                  {["Tôn trọng mọi người", "Không chia sẻ thông tin cá nhân", "Nội dung xây dựng và tích cực", "Báo cáo nội dung vi phạm"].map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
                      <Icon name="check" size={13} style={{ color: "#10b981" }} />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Link to experts */}
              <Link to="/student/experts" className="bg-white border border-[#e8eaf0] rounded-2xl p-5 flex flex-col gap-3 shadow-xs hover:border-primary/40 transition-all duration-200 group">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="psychology" size={20} style={{ color: "#0058bd" }} filled />
                  <p className="text-sm font-bold text-on-surface">Cần tư vấn riêng?</p>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">Trò chuyện 1-1 hoặc đặt lịch hẹn với chuyên gia tâm lý học đường.</p>
                <div className="mt-1 bg-primary/10 group-hover:bg-primary text-primary group-hover:text-on-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer">
                  Xem chuyên gia <Icon name="arrow_forward" size={16} />
                </div>
              </Link>
            </aside>
          </div>
        </main>
      </div>

      {/* ── Thread Detail Modal ── */}
      {activeThread && <ThreadModal post={activeThread} onClose={() => setActiveThread(null)} />}

      {/* ── New Post Modal (Facebook Style) ── */}
      {showPostForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm" style={{ animation: "fadeIn 0.2s ease" }} onClick={() => setShowPostForm(false)}>
          <div
            className="bg-white w-full max-w-[500px] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-outline-variant/30"
            style={{ maxHeight: "90vh", animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative flex items-center justify-center px-4 py-4 border-b border-outline-variant/20">
              <h2 className="text-xl font-bold text-on-surface">Tạo bài viết</h2>
              <button
                onClick={() => setShowPostForm(false)}
                className="absolute right-4 w-9 h-9 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant cursor-pointer transition-colors"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
              {/* Author Info */}
              <div className="px-4 pt-4 pb-2 flex items-center gap-3">
                <img
                  src={isAnonymous ? "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100" : (user?.photoURL || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100")}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover border border-outline-variant/20"
                />
                <div>
                  <p className="text-[15px] font-bold text-on-surface">{isAnonymous ? "Học sinh ẩn danh" : (user?.displayName || "Học sinh")}</p>
                  <label className="inline-flex items-center gap-1 bg-surface-container px-2 py-1 rounded-md mt-0.5 cursor-pointer hover:bg-surface-container-high transition-colors">
                    <Icon name={isAnonymous ? "visibility_off" : "public"} size={12} />
                    <select
                      value={isAnonymous ? "anon" : "public"}
                      onChange={(e) => setIsAnonymous(e.target.value === "anon")}
                      className="text-[11px] font-bold text-on-surface-variant bg-transparent outline-none cursor-pointer appearance-none"
                    >
                      <option value="public">Công khai</option>
                      <option value="anon">Ẩn danh</option>
                    </select>
                    <Icon name="arrow_drop_down" size={14} />
                  </label>
                </div>
              </div>

              {/* Inputs */}
              <div className="px-4 flex flex-col gap-2 flex-1">
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Tiêu đề câu hỏi..."
                  className="w-full text-lg font-bold text-on-surface outline-none placeholder:text-on-surface-variant/50 pt-2"
                />
                <textarea
                  required
                  value={newBody}
                  onChange={(e) => {
                    setNewBody(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  placeholder="Bạn đang gặp khó khăn gì? Hãy chia sẻ nhé..."
                  rows={4}
                  className="w-full text-[15px] text-on-surface outline-none placeholder:text-on-surface-variant/50 resize-none leading-relaxed min-h-[120px]"
                />
              </div>

              {submitError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mx-4 mt-2">{submitError}</p>}

              {/* Add to your post */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between border border-outline-variant/40 rounded-xl px-4 py-3 shadow-sm">
                  <span className="text-[15px] font-semibold text-on-surface">Chủ đề bài viết</span>
                  <div className="relative">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="text-sm font-bold text-primary bg-primary/10 rounded-lg px-3 py-1.5 outline-none cursor-pointer appearance-none pr-7"
                    >
                      {CATEGORIES.slice(1).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                      <Icon name="arrow_drop_down" size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="px-4 pb-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim() || !newBody.trim()}
                  className="w-full bg-[#0866ff] text-white py-2.5 rounded-lg text-[15px] font-bold hover:bg-[#0054d1] disabled:bg-[#e4e6eb] disabled:text-[#bcc0c4] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><Icon name="sync" size={18} /> Đang đăng...</> : "Đăng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
      `}</style>
    </div>
  );
}
