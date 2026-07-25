import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Icon } from "../ui/Icon";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  submitQuestion,
  subscribeToAllQuestions,
  subscribeToUserQuestions,
  subscribeToQnaComments,
  addQnaComment,
  formatQuestionDate,
  type QuestionRecord,
  type QnaComment,
} from "../../src/services/qnaService";

const CATEGORIES = ["Tất cả", "Tâm lý", "Bạo lực học đường", "Học tập", "Sức khỏe"];

const FAQ_DATA = [
  {
    id: "faq-1",
    category: "Tâm lý",
    question: "Làm thế nào để vượt qua áp lực học tập và thi cử căng thẳng?",
    answer: "Để giảm áp lực thi cử, bạn nên lập kế hoạch ôn tập sớm, phân bổ thời gian hợp lý (học 45 phút, nghỉ 5-10 phút). Đừng quên ngủ đủ 7-8 tiếng mỗi ngày. Nếu cảm thấy quá tải, hãy chia sẻ ngay với giáo viên chủ nhiệm hoặc bác sĩ tâm lý.",
  },
  {
    id: "faq-2",
    category: "Bạo lực học đường",
    question: "Tôi phải làm gì khi chứng kiến bạn cùng lớp bị bắt nạt?",
    answer: "Hãy báo cáo ẩn danh qua hệ thống SafeSchool Hub hoặc tìm kiếm sự giúp đỡ từ giáo viên chủ nhiệm, giám thị. Không tham gia tranh chấp trực tiếp để bảo vệ an toàn cho bản thân.",
  },
];

export function QnaCommunityBody() {
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

  // Feed & Comments state
  const [allPosts, setAllPosts] = useState<QuestionRecord[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, QnaComment[]>>({});
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});

  const { user } = useAuth();
  const role = localStorage.getItem("userRole") || "student";

  // Realtime subscription to ALL questions (for the community feed)
  useEffect(() => {
    const unsubscribe = subscribeToAllQuestions(selectedCategory, (posts) => {
      setAllPosts(posts);
    });
    return () => unsubscribe();
  }, [selectedCategory]);

  // Realtime subscription to COMMENTS of the expanded post
  useEffect(() => {
    if (!expandedPostId) return;
    const unsubscribe = subscribeToQnaComments(expandedPostId, (comments) => {
      setCommentsMap((prev) => ({ ...prev, [expandedPostId]: comments }));
    });
    return () => unsubscribe();
  }, [expandedPostId]);

  const toggleFaq = (id: string) => {
    setActiveFaqId(activeFaqId === id ? null : id);
  };

  const handlePostExpand = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
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
        sender: {
          uid: user?.uid ?? "",
          displayName: user?.displayName || "Người dùng",
          role,
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

  const handleSubmitComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentContent = commentInputs[postId] || "";
    if (!commentContent.trim() || isSubmittingComment[postId]) return;

    setIsSubmittingComment((prev) => ({ ...prev, [postId]: true }));

    try {
      let displayName = user?.displayName || "Người dùng";
      if (role === "doctor" && !displayName.startsWith("BS.") && !displayName.startsWith("TS.") && !displayName.startsWith("ThS.")) {
        displayName = `BS. ${displayName}`;
      }

      await addQnaComment(postId, {
        content: commentContent,
        senderUid: user?.uid ?? "",
        senderName: displayName,
        senderRole: role,
        senderPhotoURL: user?.photoURL || "",
      });

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Lỗi gửi bình luận:", err);
    } finally {
      setIsSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const filteredPosts = allPosts.filter((post) => {
    return post.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <main className="flex-1 overflow-y-auto p-5 md:p-8 animate-fade-in">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── LEFT & MIDDLE: Q&A Community Feed ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Success Toast */}
          {showSuccessToast && (
            <div className="flex items-start justify-between gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-4 rounded-2xl animate-fade-in shadow-sm">
              <div className="flex items-center gap-3">
                <Icon name="check_circle" size={22} filled style={{ color: "#059669" }} />
                <div>
                  <p className="font-bold text-sm">Gửi câu hỏi thành công!</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Câu hỏi của bạn đã được xuất bản lên diễn đàn hỏi đáp cộng đồng. Bác sĩ và mọi người có thể phản hồi cho bạn.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowSuccessToast(false)} className="p-1 hover:bg-emerald-100 rounded-full cursor-pointer border-none bg-transparent">
                <Icon name="close" size={16} />
              </button>
            </div>
          )}

          {/* Title & Introduction */}
          <div>
            <h1 className="text-2xl font-serif font-extrabold text-on-surface">Cộng đồng Hỏi đáp & Tư vấn tâm lý</h1>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Đặt câu hỏi ẩn danh, trao đổi ý kiến lành mạnh và nhận lời giải đáp chất lượng từ chuyên gia y tế học đường.
            </p>
          </div>

          {/* Submit Question Card */}
          <div className="bg-white border border-[#e8eaf0] rounded-3xl p-5 shadow-2xs flex flex-col gap-4">
            <h2 className="text-sm font-serif font-bold text-on-surface flex items-center gap-2">
              <Icon name="chat" size={18} filled style={{ color: "#0058bd" }} />
              Đặt câu hỏi mới
            </h2>

            <form onSubmit={handleSubmitQuestion} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface-variant">CHỦ ĐỀ</label>
                  <div className="relative">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full text-xs font-semibold text-on-surface border border-outline-variant/40 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      {CATEGORIES.slice(1).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">arrow_drop_down</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:pt-4">
                  <input
                    type="checkbox"
                    id="anonymous-toggle"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-primary border-outline-variant/50 rounded-sm focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="anonymous-toggle" className="text-xs font-bold text-on-surface select-none cursor-pointer flex items-center gap-1.5">
                    <Icon name="visibility_off" size={16} />
                    Hỏi ẩn danh (bảo mật danh tính)
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <textarea
                  placeholder="Nhập chi tiết câu hỏi hoặc thắc mắc của bạn tại đây..."
                  rows={3}
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full text-xs font-medium text-on-surface border border-outline-variant/40 rounded-xl p-3 focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50 resize-none leading-relaxed"
                  required
                />
              </div>

              {submitError && (
                <p className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded-xl px-3 py-2">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="self-end bg-primary hover:bg-primary-container text-on-primary text-xs font-bold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 border-none"
              >
                {isSubmitting ? "Đang gửi..." : "Đăng câu hỏi"}
              </button>
            </form>
          </div>

          {/* Search Bar */}
          <div className="relative bg-white border border-[#e8eaf0] rounded-2xl p-2 flex items-center shadow-3xs">
            <div className="pl-3 text-on-surface-variant flex items-center justify-center">
              <Icon name="search" size={20} />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm nội dung câu hỏi trong cộng đồng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-3 pr-4 py-2 border-0 bg-transparent text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full cursor-pointer mr-1 border-none bg-transparent">
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap border-none ${
                  selectedCategory === cat
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-white border border-[#e8eaf0] text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Q&A Post Feed List */}
          <div className="flex flex-col gap-4">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => {
                const isExpanded = expandedPostId === post.id;
                const comments = commentsMap[post.id] || [];

                const getRoleBadgeClass = (senderRole: string) => {
                  if (senderRole === "doctor") return "bg-blue-50 text-blue-800 border-blue-200";
                  if (senderRole === "teacher") return "bg-emerald-50 text-emerald-800 border-emerald-200";
                  return "bg-slate-50 text-slate-800 border-slate-200";
                };

                const getRoleLabel = (senderRole: string) => {
                  if (senderRole === "doctor") return "Bác sĩ Chuyên gia";
                  if (senderRole === "teacher") return "Giáo viên";
                  return "Học sinh";
                };

                return (
                  <div key={post.id} className="bg-white border border-[#e8eaf0] rounded-3xl p-5 shadow-3xs flex flex-col gap-4 transition-all hover:border-outline-variant/50">
                    {/* Post Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-md text-[9px] font-extrabold bg-[#0058bd]/8 text-[#0058bd] uppercase">
                          {post.category}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          {formatQuestionDate(post.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-on-surface">
                          {post.senderName}
                        </span>
                        {!post.isAnonymous && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${getRoleBadgeClass(post.senderRole)}`}>
                            {getRoleLabel(post.senderRole)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-line font-medium">
                      {post.content}
                    </p>

                    {/* Feed Card Actions */}
                    <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3">
                      <button
                        onClick={() => handlePostExpand(post.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-[#00479b] cursor-pointer border-none bg-transparent"
                      >
                        <Icon name="chat" size={16} filled={isExpanded} />
                        {post.commentCount || 0} phản hồi
                      </button>
                    </div>

                    {/* Expanded Comments Panel */}
                    {isExpanded && (
                      <div className="border-t border-outline-variant/20 pt-4 flex flex-col gap-4 bg-slate-50/50 p-4 rounded-2xl animate-fade-in">
                        
                        {/* Comment List */}
                        <div className="flex flex-col gap-3">
                          {comments.length > 0 ? (
                            comments.map((cmt) => {
                              const isCmtDoc = cmt.senderRole === "doctor";
                              return (
                                <div
                                  key={cmt.id}
                                  className={`flex gap-3 p-3.5 rounded-2xl bg-white border ${
                                    isCmtDoc
                                      ? "border-amber-300 shadow-2xs bg-amber-50/10"
                                      : "border-outline-variant/10"
                                  }`}
                                >
                                  {/* Commenter Avatar */}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${
                                    isCmtDoc ? "bg-amber-100 border border-amber-200" : "bg-surface-container"
                                  }`}>
                                    <img
                                      src={cmt.senderPhotoURL || (isCmtDoc ? "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=150&auto=format&fit=crop" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop")}
                                      alt="User Avatar"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  {/* Comment Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-bold text-on-surface">
                                        {cmt.senderName}
                                      </span>
                                      
                                      {/* Doctor verified badge */}
                                      {isCmtDoc ? (
                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-[8px] font-extrabold uppercase">
                                          <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>health_and_safety</span>
                                          Bác sĩ chuyên khoa 🩺
                                        </span>
                                      ) : (
                                        <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-extrabold border ${getRoleBadgeClass(cmt.senderRole)}`}>
                                          {getRoleLabel(cmt.senderRole)}
                                        </span>
                                      )}

                                      <span className="text-[9px] text-on-surface-variant ml-auto">
                                        {formatQuestionDate(cmt.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant leading-relaxed mt-1 whitespace-pre-line">
                                      {cmt.content}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-on-surface-variant italic text-center py-2">
                              Chưa có phản hồi nào. Hãy là người đầu tiên giải đáp!
                            </p>
                          )}
                        </div>

                        {/* Comment Input Form */}
                        <form onSubmit={(e) => handleSubmitComment(post.id, e)} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Viết phản hồi giải đáp của bạn..."
                            value={commentInputs[post.id] || ""}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            className="flex-1 text-xs border border-outline-variant/50 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary dark:bg-white text-on-surface"
                            required
                            disabled={isSubmittingComment[post.id]}
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingComment[post.id] || !(commentInputs[post.id] || "").trim()}
                            className="bg-[#0058bd] hover:bg-[#00479b] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer border-none flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>send</span>
                          </button>
                        </form>

                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-white border border-dashed border-outline-variant/60 rounded-3xl p-6">
                <Icon name="search_off" size={32} style={{ color: "#727785" }} />
                <p className="text-sm font-bold text-on-surface mt-2">Không tìm thấy bài đăng nào</p>
                <p className="text-xs text-on-surface-variant mt-1">Hãy bắt đầu đặt câu hỏi đầu tiên cho cộng đồng.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: FAQ Accordions ── */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-[90px] lg:h-fit">
          <div className="bg-white border border-[#e8eaf0] rounded-3xl p-5 shadow-2xs flex flex-col gap-4">
            <h3 className="font-serif font-bold text-sm text-on-surface flex items-center gap-1.5 border-b border-outline-variant/20 pb-2">
              <Icon name="help" size={18} />
              Câu hỏi thường gặp (FAQs)
            </h3>

            <div className="flex flex-col gap-2.5">
              {FAQ_DATA.map((faq) => {
                const isOpen = activeFaqId === faq.id;
                return (
                  <div key={faq.id} className="border border-outline-variant/10 rounded-2xl overflow-hidden transition-all duration-200">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 bg-slate-50/50 cursor-pointer border-none"
                    >
                      <span className="text-xs font-bold text-on-surface leading-snug">{faq.question}</span>
                      <span className={`transform transition-transform text-on-surface-variant ${isOpen ? "rotate-180" : ""}`}>
                        <Icon name="expand_more" size={16} />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 py-3 text-[11px] text-on-surface-variant leading-relaxed border-t border-outline-variant/10 bg-white">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
