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
    { title: "Hỏi đáp & Tư vấn tâm lý – SafeSchool Hub" },
    {
      name: "description",
      content: "Hỏi đáp, tư vấn trực tuyến và giải đáp thắc mắc về tâm lý học đường, học tập và sức khỏe cho học sinh.",
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
    throw redirect("/auth/login?redirect=/student/qna");
  }

  const role = localStorage.getItem("userRole");
  if (role && role !== "student") {
    throw redirect("/auth/login?error=access_denied");
  }

  return null;
}

const CATEGORIES = ["Tất cả", "Tâm lý", "Bạo lực học đường", "Học tập", "Sức khỏe"];

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",
    category: "Tâm lý",
    question: "Làm thế nào để vượt qua áp lực học tập và thi cử căng thẳng?",
    answer: "Để giảm áp lực thi cử, bạn nên lập kế hoạch ôn tập sớm, phân bổ thời gian hợp lý (học 45 phút, nghỉ 5-10 phút). Đừng quên ngủ đủ 7-8 tiếng mỗi ngày và tham gia các hoạt động thể chất nhẹ nhàng. Nếu cảm thấy quá tải, hãy chia sẻ ngay với giáo viên chủ nhiệm hoặc chuyên gia tâm lý tại phòng tư vấn học đường.",
  },
  {
    id: "faq-2",
    category: "Bạo lực học đường",
    question: "Tôi phải làm gì khi chứng kiến bạn cùng lớp bị bắt nạt?",
    answer: "Đầu tiên, hãy đảm bảo sự an toàn của bản thân. Bạn không nên tham gia vào cuộc tranh chấp mà hãy tìm kiếm sự giúp đỡ từ giáo viên, giám thị hoặc báo cáo ẩn danh qua hệ thống SafeSchool Hub. Hành động nhanh chóng của bạn có thể bảo vệ bạn học khỏi các tổn thương nghiêm trọng.",
  },
  {
    id: "faq-3",
    category: "Học tập",
    question: "Phương pháp ghi nhớ thông tin hiệu quả khi tự học tại nhà là gì?",
    answer: "Bạn có thể áp dụng phương pháp Active Recall (chủ động gợi nhớ lại kiến thức) kết hợp Spaced Repetition (ôn tập ngắt quãng). Việc vẽ bản đồ tư duy (Mindmap) hoặc giảng giải lại bài học cho bạn bè cũng giúp ghi nhớ sâu sắc hơn thay vì chỉ đọc đi đọc lại tài liệu.",
  },
  {
    id: "faq-4",
    category: "Sức khỏe",
    question: "Làm sao để thiết lập chế độ sinh hoạt lành mạnh chống mệt mỏi?",
    answer: "Hãy duy trì thói quen uống đủ nước (1.5 - 2 lít/ngày), hạn chế thức khuya sau 11h đêm, hạn chế sử dụng thiết bị điện tử ít nhất 30 phút trước khi ngủ. Ăn sáng đầy đủ dưỡng chất và tránh xa các đồ ăn nhanh nhiều dầu mỡ vào buổi tối.",
  },
  {
    id: "faq-5",
    category: "Tâm lý",
    question: "Làm sao để cải thiện kỹ năng giao tiếp và tự tin hơn trước đám đông?",
    answer: "Sự tự tin đến từ sự chuẩn bị chu đáo và luyện tập đều đặn. Hãy bắt đầu bằng cách phát biểu ý kiến trong các nhóm nhỏ, luyện nói trước gương, duy trì giao tiếp bằng mắt khi trò chuyện và tập trung vào thông điệp bạn muốn truyền tải thay vì lo lắng người khác nghĩ gì về mình.",
  },
];

/** Alias của QuestionRecord từ qnaService – dùng trong component này */
type UserQuestion = QuestionRecord;

export default function StudentQnAPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);

  // Form states
  const [newQuestion, setNewQuestion] = useState("");
  const [newCategory, setNewCategory] = useState("Tâm lý");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Câu hỏi realtime từ Firebase
  const [userQuestions, setUserQuestions] = useState<UserQuestion[]>([]);

  const { user } = useAuth();
  const userName = user?.displayName || "Học sinh";

  // Lắng nghe realtime câu hỏi của user hiện tại
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToUserQuestions(user.uid, (questions) => {
      setUserQuestions(questions);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter FAQs
  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tất cả" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (id: string) => {
    setActiveFaqId(activeFaqId === id ? null : id);
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitQuestion({
        question: newQuestion,
        category: newCategory,
        isAnonymous,
        sender: isAnonymous
          ? null
          : {
              uid: user?.uid ?? null,
              displayName: user?.displayName ?? "Học sinh",
              email: user?.email ?? null,
            },
      });

      setNewQuestion("");
      setIsAnonymous(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    } catch (err) {
      console.error("[QnA] Lỗi gửi câu hỏi:", err);
      setSubmitError("Gửi câu hỏi thất bại. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant/20 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-on-surface hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
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

            <nav className="hidden md:flex items-center gap-1 ml-6" aria-label="QnA navigation">
              <Link
                to="/student/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="home" size={18} />
                Trang chủ
              </Link>
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary shadow-sm">
                <Icon name="help" size={18} filled />
                Hỏi đáp & Tư vấn
              </span>
              <Link
                to="/student/support"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Icon name="emergency" size={18} />
                Hỗ trợ khẩn cấp
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/30 hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&auto=format&fit=crop"
                alt="Ảnh đại diện"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8 animate-fade-in">
          <div className="max-w-[760px] mx-auto flex flex-col gap-8">
            
            {/* LEFT COLUMN: FAQ Search & Accordion */}
            <div className="flex flex-col gap-6">
              
              {/* Success Toast */}
              {showSuccessToast && (
                <div className="flex items-start justify-between gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-4 rounded-2xl animate-fade-in shadow-sm">
                  <div className="flex items-center gap-3">
                    <Icon name="check_circle" size={22} filled style={{ color: "#059669" }} />
                    <div>
                      <p className="font-bold text-sm">Gửi câu hỏi thành công!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Câu hỏi của bạn đã được chuyển tới ban biên tập và chuyên gia tâm lý học đường để kiểm duyệt & trả lời.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSuccessToast(false)}
                    className="p-1 hover:bg-emerald-100 rounded-full cursor-pointer"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              )}

              {/* Title & Introduction */}
              <div>
                <h1 className="text-2xl font-serif font-extrabold text-on-surface">Hỏi đáp & Giải đáp tâm lý</h1>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  Tìm kiếm câu trả lời nhanh chóng từ thư viện câu hỏi thường gặp của SafeSchool Hub hoặc chủ động gửi câu hỏi riêng cho chuyên gia.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative bg-white border border-[#e8eaf0] rounded-2xl p-2 flex items-center shadow-xs">
                <div className="pl-3 text-on-surface-variant flex items-center justify-center">
                  <Icon name="search" size={22} />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm câu hỏi hoặc câu trả lời..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm pl-3 pr-4 py-2 border-0 bg-transparent text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer mr-1"
                    aria-label="Xóa tìm kiếm"
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-white border border-[#e8eaf0] text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* FAQs Accordion Grid */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-on-surface-variant tracking-wide mb-1 uppercase">
                  Câu hỏi thường gặp ({filteredFAQs.length})
                </h3>

                {filteredFAQs.length > 0 ? (
                  filteredFAQs.map((faq) => {
                    const isOpen = activeFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className={`bg-white border rounded-2xl transition-all duration-200 overflow-hidden shadow-xs ${
                          isOpen ? "border-primary bg-primary/2" : "border-[#e8eaf0] hover:border-outline-variant/60"
                        }`}
                      >
                        {/* Question Header */}
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-surface-container-highest text-on-surface-variant mt-0.5 uppercase whitespace-nowrap">
                              {faq.category}
                            </span>
                            <span className="text-sm font-bold text-on-surface leading-snug">{faq.question}</span>
                          </div>
                          <span
                            className={`transform transition-transform duration-200 text-on-surface-variant flex-shrink-0 ${
                              isOpen ? "rotate-180 text-primary" : ""
                            }`}
                          >
                            <Icon name="expand_more" size={20} />
                          </span>
                        </button>

                        {/* Answer content */}
                        <div
                          className={`transition-all duration-300 ease-in-out ${
                            isOpen ? "max-h-[500px] border-t border-[#e8eaf0]/40" : "max-h-0 pointer-events-none"
                          }`}
                        >
                          <div className="px-5 py-4 text-xs md:text-sm text-on-surface-variant leading-relaxed bg-[#fafbfc]">
                            {faq.answer}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-white border border-dashed border-outline-variant/60 rounded-3xl p-6">
                    <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-3 text-on-surface-variant/40">
                      <Icon name="search_off" size={24} />
                    </div>
                    <p className="text-sm font-bold text-on-surface">Không tìm thấy kết quả phù hợp</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Thử nhập từ khóa khác hoặc gửi câu hỏi trực tiếp cho chúng tôi ở cột bên cạnh.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* MIDDLE COLUMN: Submit Question Form */}
            
            {/* Question Submission Card */}
              <div className="bg-white border border-[#e8eaf0] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-serif font-bold text-on-surface flex items-center gap-2">
                    <Icon name="chat" size={20} filled style={{ color: "#0058bd" }} />
                    Đặt câu hỏi của bạn
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Bạn có câu hỏi thầm kín hoặc cần lời khuyên từ chuyên gia tâm lý học đường? Hãy gửi ngay cho chúng tôi.
                  </p>
                </div>

                <form onSubmit={handleSubmitQuestion} className="flex flex-col gap-3.5">
                  {/* Category select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant">CHỦ ĐỀ</label>
                    <div className="relative">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full text-xs font-semibold text-on-surface border border-outline-variant/40 rounded-xl px-3 py-3 bg-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
                      >
                        {CATEGORIES.slice(1).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                        <Icon name="unfold_more" size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Content input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant">NỘI DUNG CÂU HỎI</label>
                    <textarea
                      placeholder="Nhập chi tiết câu hỏi hoặc tâm sự của bạn tại đây..."
                      rows={4}
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="w-full text-xs font-medium text-on-surface border border-outline-variant/40 rounded-xl p-3 focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50 resize-none leading-relaxed"
                      required
                    />
                  </div>

                  {/* Anonymous check */}
                  <div className="flex items-center gap-2.5 py-1">
                    <input
                      type="checkbox"
                      id="anonymous-toggle"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 text-primary border-outline-variant/50 rounded-sm focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="anonymous-toggle" className="text-xs font-bold text-on-surface select-none cursor-pointer flex items-center gap-1.5">
                      <Icon name="visibility_off" size={16} />
                      Hỏi ẩn danh (Chuyên gia vẫn phản hồi riêng)
                    </label>
                  </div>

                  {submitError && (
                    <p className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                      {submitError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary-container text-on-primary text-xs font-bold py-3 rounded-xl transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Icon name="hourglass_empty" size={16} />
                        ĐANG GỬI...
                      </>
                    ) : (
                      <>
                        <Icon name="send" size={16} />
                        GỬI CÂU HỎI CHO CHUYÊN GIA
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* My Questions History */}
              <div className="bg-white border border-[#e8eaf0] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-serif font-bold text-on-surface flex items-center gap-2">
                    <Icon name="history" size={20} filled style={{ color: "#0058bd" }} />
                    Câu hỏi của tôi ({userQuestions.length})
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Theo dõi trạng thái xử lý và phản hồi riêng tư từ tổ tư vấn nhà trường.
                  </p>
                </div>

                <div className="flex flex-col gap-4 divide-y divide-outline-variant/20">
                  {userQuestions.map((uq, idx) => {
                    const statusColor =
                      uq.status === "Đã trả lời"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200";

                    return (
                      <div key={uq.id} className={`flex flex-col gap-3 ${idx > 0 ? "pt-4" : ""}`}>
                        {/* Status + Metadata */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusColor}`}>
                            {uq.status}
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-medium">
                            {typeof uq.createdAt === "number"
                              ? formatQuestionDate(uq.createdAt)
                              : uq.createdAt}
                          </span>
                        </div>

                        {/* Question Text */}
                        <p className="text-xs font-bold text-on-surface leading-relaxed">
                          {uq.isAnonymous && <span className="text-purple-600 font-semibold mr-1">[Ẩn danh]</span>}
                          {uq.question}
                        </p>

                        {/* Answer block */}
                        {uq.answer ? (
                          <div className="bg-surface-container-low border border-[#e8eaf0]/50 rounded-xl p-3 flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Icon name="support_agent" size={14} filled />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-extrabold text-primary mb-0.5">BAN TƯ VẤN HỌC ĐƯỜNG</p>
                              <p className="text-xs text-on-surface-variant leading-relaxed">{uq.answer}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant italic">
                            <Icon name="hourglass_empty" size={14} />
                            Đang được chuyên gia tiếp nhận...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            {/* RIGHT COLUMN: My Questions History */}
            {/* The history card is already direct child now */}

          </div>
        </main>
      </div>
    </div>
  );
}
