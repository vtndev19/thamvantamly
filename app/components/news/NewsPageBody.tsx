import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Icon } from "../ui/Icon";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  NewsService,
  type Article,
} from "../../src/services/newsService";
import { compressImageToBase64 } from "../../src/utils/imageCompress";

interface NewsPageBodyProps {
  role: "student" | "teacher" | "doctor" | "admin";
}

const CATEGORIES = [
  { id: "all", label: "Tất cả", icon: "grid_view" },
  { id: "general", label: "Chung", icon: "notifications" },
  { id: "psychology", label: "Tâm lý học", icon: "psychology" },
  { id: "announcement", label: "Thông báo", icon: "campaign" },
  { id: "guide", label: "Cẩm nang", icon: "menu_book" },
];

const PRESET_IMAGES = [
  { label: "Sức khỏe tâm thần", url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop" },
  { label: "Trường học", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop" },
  { label: "Cẩm nang kỹ năng", url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop" },
  { label: "Thảo luận nhóm", url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=600&auto=format&fit=crop" },
  { label: "Không gian yên tĩnh", url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop" },
];

export function NewsPageBody({ role }: NewsPageBodyProps) {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // URL state management
  const [searchParams, setSearchParams] = useSearchParams();
  const activeArticleId = searchParams.get("id");
  const action = searchParams.get("action"); // "create" or "edit"

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Form states
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Article["category"]>("general");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gallery active index state for details view
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const canPublish = role === "teacher" || role === "admin";
  const userId = user?.uid || "";
  const userName = user?.displayName || "Tác giả";

  // Reset active image gallery index when detail page changes
  useEffect(() => {
    setActiveImageIdx(0);
  }, [activeArticleId]);

  // Lắng nghe danh sách tin tức thời gian thực
  useEffect(() => {
    setLoading(true);
    const unsub = NewsService.subscribeToArticles((list) => {
      setArticles(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Lọc danh sách bài viết của riêng user hiện tại
  const myArticles = useMemo(() => {
    return articles.filter((a) => a.authorId === userId);
  }, [articles, userId]);

  // Lấy chi tiết bài viết đang mở dựa trên URL parameter 'id'
  const activeArticle = useMemo(() => {
    if (!activeArticleId) return null;
    return articles.find((a) => a.id === activeArticleId) || null;
  }, [articles, activeArticleId]);

  // Tăng số lượt xem khi vào trang chi tiết tin tức
  useEffect(() => {
    if (activeArticleId && !action) {
      NewsService.incrementViews(activeArticleId);
    }
  }, [activeArticleId, action]);

  // Nạp dữ liệu vào form khi sửa bài viết
  useEffect(() => {
    if (action === "edit" && activeArticle) {
      setTitle(activeArticle.title);
      setSummary(activeArticle.summary);
      setContent(activeArticle.content);
      setCategory(activeArticle.category);
      setImageUrl(activeArticle.imageUrl || "");
      setImagePreviews(activeArticle.imageUrls || []);
      setImageFiles([]);
    }
  }, [action, activeArticle]);

  // Lọc bài viết
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchCat = selectedCategory === "all" || art.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === "" ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  // Bài viết nổi bật nhất (lấy bài viết đầu tiên)
  const featuredArticle = useMemo(() => {
    if (articles.length === 0) return null;
    return articles[0];
  }, [articles]);

  // Các bài viết khác
  const regularArticles = useMemo(() => {
    if (filteredArticles.length === 0) return [];
    if (selectedCategory === "all" && searchQuery === "" && featuredArticle) {
      return filteredArticles.filter((a) => a.id !== featuredArticle.id);
    }
    return filteredArticles;
  }, [filteredArticles, selectedCategory, searchQuery, featuredArticle]);

  // Gợi ý bài viết liên quan (ở trang chi tiết)
  const relatedArticles = useMemo(() => {
    if (!activeArticle) return [];
    return articles
      .filter((a) => a.id !== activeArticle.id && a.category === activeArticle.category)
      .slice(0, 3);
  }, [articles, activeArticle]);

  // Thích / Bỏ thích bài viết
  const handleLike = async (e: React.MouseEvent, art: Article) => {
    e.stopPropagation();
    if (!art.id || !userId) return;
    const isLiked = art.likedBy?.includes(userId) || false;
    try {
      await NewsService.toggleLikeArticle(art.id, userId, isLiked);
      setArticles((prev) =>
        prev.map((a) => {
          if (a.id === art.id) {
            const likedBy = isLiked
              ? (a.likedBy || []).filter((id) => id !== userId)
              : [...(a.likedBy || []), userId];
            return {
              ...a,
              likes: isLiked ? a.likes - 1 : a.likes + 1,
              likedBy,
            };
          }
          return a;
        })
      );
    } catch (err) {
      console.error("Lỗi thích bài viết:", err);
    }
  };

  // Điều hướng tới trang Chỉnh sửa bài viết
  const navigateToEditPage = (e: React.MouseEvent, art: Article) => {
    e.stopPropagation();
    if (!art.id) return;
    setImageFiles([]);
    setImagePreviews(art.imageUrls || []);
    setSearchParams({ action: "edit", id: art.id });
  };

  // Xóa bài viết
  const handleDeleteArticle = async (e: React.MouseEvent, art: Article) => {
    e.stopPropagation();
    if (!art.id) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${art.title}"?`)) return;
    try {
      await NewsService.deleteArticle(art.id);
      if (activeArticleId === art.id) {
        setSearchParams({});
      }
      alert("Đã xóa bài viết thành công.");
    } catch (err) {
      console.error("Lỗi xóa bài viết:", err);
      alert("Không thể xóa bài viết.");
    }
  };

  // Xử lý chọn nhiều tệp ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...files]);
      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);
      setImageUrl(""); // Clear preset if uploading files
    }
  };

  // Xóa ảnh khỏi danh sách chọn
  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit tạo mới bài viết
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim() || !userId) return;
    setIsSubmitting(true);
    try {
      const urls: string[] = [];
      // Compress and convert selected files to base64
      for (const file of imageFiles) {
        try {
          const b64 = await compressImageToBase64(file, 600, 400);
          urls.push(b64);
        } catch (err) {
          console.warn("Lỗi nén ảnh:", err);
        }
      }

      const finalUrls = urls.length > 0 ? urls : [imageUrl || PRESET_IMAGES[0].url];

      await NewsService.createArticle({
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        category,
        imageUrl: finalUrls[0],
        imageUrls: finalUrls,
        authorId: userId,
        authorName: userName,
        authorRole: role,
        schoolCode: role === "teacher" ? user?.schoolCode || "" : "",
        thptId: role === "teacher" ? user?.schoolCode || "" : "",
        isBroadcast: role === "teacher" ? isBroadcast : false,
      });

      // Reset form fields
      setTitle("");
      setSummary("");
      setContent("");
      setCategory("general");
      setImageUrl("");
      setImageFiles([]);
      setImagePreviews([]);
      setIsBroadcast(false);
      alert("Đăng tin tức thành công! 🎉");
    } catch (err) {
      console.error("Lỗi đăng tin tức:", err);
      alert("Đã xảy ra lỗi khi tạo bài viết.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit cập nhật bài viết
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeArticleId || !title.trim() || !summary.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      const urls: string[] = [];
      // Compress new files
      for (const file of imageFiles) {
        try {
          const b64 = await compressImageToBase64(file, 600, 400);
          urls.push(b64);
        } catch (err) {
          console.warn("Lỗi nén ảnh:", err);
        }
      }

      const finalUrls = urls.length > 0 
        ? urls 
        : imagePreviews.length > 0 
          ? imagePreviews 
          : [imageUrl || PRESET_IMAGES[0].url];

      await NewsService.updateArticle(activeArticleId, {
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        category,
        imageUrl: finalUrls[0],
        imageUrls: finalUrls,
      });
      
      setImageFiles([]);
      setImagePreviews([]);
      setSearchParams({});
      alert("Cập nhật bài viết thành công! ✨");
    } catch (err) {
      console.error("Lỗi cập nhật bài viết:", err);
      alert("Đã xảy ra lỗi khi chỉnh sửa bài viết.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Định dạng ngày hiển thị
  const formatDate = (val: any) => {
    if (!val) return "";
    const d = val instanceof Date ? val : typeof val.toDate === "function" ? val.toDate() : new Date(val);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Thời gian đọc ước tính
  const getReadTime = (text: string) => {
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} phút đọc`;
  };

  // Nhãn chuyên mục (category badge)
  const renderCategoryBadge = (cat: Article["category"]) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    if (!found) return null;
    let bg = "bg-slate-100 text-slate-700";
    if (cat === "general") bg = "bg-blue-50 text-blue-700 border border-blue-100";
    if (cat === "psychology") bg = "bg-purple-50 text-purple-700 border border-purple-100";
    if (cat === "announcement") bg = "bg-rose-50 text-rose-700 border border-rose-100";
    if (cat === "guide") bg = "bg-sky-50 text-sky-700 border border-sky-100";

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${bg}`}>
        <Icon name={found.icon} size={13} />
        {found.label}
      </span>
    );
  };

  // ─── VIEW 1: TRANG TẠO BÀI VIẾT MỚI (PAGE) ───
  if (action === "create" && canPublish) {
    return (
      <div className="flex-1 h-0 bg-[#f8fafc] overflow-y-auto px-6 py-8">
        {/* Back navigation */}
        <div className="mb-6 flex items-center justify-between max-w-6xl w-full mx-auto">
          <button
            onClick={() => setSearchParams({})}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-sky-500 hover:text-sky-500 text-slate-600 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Icon name="arrow_back" size={16} />
            Quay lại bảng tin chung
          </button>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full mx-auto">
          
          {/* Column 1: Form Đăng bài mới (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Icon name="edit_document" size={20} />
                  Đăng bài viết mới
                </h2>
                <p className="text-[11px] text-white/80 mt-0.5">Tạo tin tức, thông báo hoặc cẩm nang kèm nhiều hình ảnh.</p>
              </div>
              {user?.schoolCode && (
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
                  {user.schoolCode}
                </span>
              )}
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Tiêu đề bài viết</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tiêu đề hấp dẫn..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              {/* Category & Image/Broadcast */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Chuyên mục</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const val = e.target.value as Article["category"];
                      setCategory(val);
                      if (val !== "announcement") {
                        setIsBroadcast(false);
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 bg-white"
                  >
                    <option value="general">Thông báo chung</option>
                    <option value="psychology">Tâm lý học đường</option>
                    <option value="announcement">Sự kiện & Hoạt động</option>
                    <option value="guide">Cẩm nang & Kỹ năng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Chọn ảnh bìa mẫu</label>
                  <select
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 bg-white"
                  >
                    <option value="">-- Hoặc tải nhiều ảnh bên dưới --</option>
                    {PRESET_IMAGES.map((img) => (
                      <option key={img.url} value={img.url}>
                        {img.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Broadcast for teachers - only show when category is announcement */}
              {role === "teacher" && category === "announcement" && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <input
                    type="checkbox"
                    id="isBroadcast-create"
                    checked={isBroadcast}
                    onChange={(e) => setIsBroadcast(e.target.checked)}
                    className="w-4 h-4 text-sky-500 border-slate-300 rounded focus:ring-sky-400 cursor-pointer"
                  />
                  <label htmlFor="isBroadcast-create" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                    📢 Gửi thông báo đến học sinh cùng trường
                  </label>
                </div>
              )}

              {/* Select 1 or Multiple images */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Tải lên hình ảnh bài viết (Chọn nhiều ảnh)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="create-news-images"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="create-news-images"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-sky-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Icon name="add_a_photo" size={16} />
                    Chọn ảnh từ thiết bị
                  </label>
                </div>

                {/* Previews list */}
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {imagePreviews.map((prev, idx) => (
                      <div key={idx} className="w-16 h-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 relative group flex-shrink-0">
                        <img src={prev} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none flex items-center justify-center shadow"
                        >
                          <Icon name="close" size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Tóm tắt ngắn (Summary)</label>
                <textarea
                  required
                  rows={2}
                  maxLength={200}
                  placeholder="Viết một đoạn tóm tắt ngắn giới thiệu nội dung (khoảng 2-3 câu)..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white resize-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Nội dung chi tiết (Hỗ trợ định dạng xuống dòng)</label>
                <textarea
                  required
                  rows={7}
                  placeholder="Viết nội dung bài viết chi tiết tại đây..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTitle("");
                    setSummary("");
                    setContent("");
                    setCategory("general");
                    setImageUrl("");
                    setImageFiles([]);
                    setImagePreviews([]);
                    setIsBroadcast(false);
                  }}
                  className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-bold bg-transparent border-none cursor-pointer"
                >
                  Nhập lại
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold cursor-pointer border-none shadow-sm transition-all"
                >
                  {isSubmitting ? "Đang xử lý..." : "Đăng bài viết mới"}
                </button>
              </div>
            </form>
          </div>

          {/* Column 2: Danh sách bài viết cá nhân đã đăng (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="history" size={16} />
                Bài viết của bạn ({myArticles.length})
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Danh sách các tin tức do chính bạn đăng tải trên hệ thống.</p>
            </div>

            {myArticles.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium space-y-2">
                <Icon name="newspaper" size={28} className="text-slate-200" />
                <p>Bạn chưa đăng tải bài viết nào.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                {myArticles.map((art) => (
                  <div
                    key={art.id}
                    className="group flex gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all items-start relative cursor-pointer"
                    onClick={() => setSearchParams({ id: art.id || "" })}
                  >
                    <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/50">
                      <img src={art.imageUrl || PRESET_IMAGES[0].url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 pr-14">
                      <h4 className="text-xs font-bold text-slate-700 line-clamp-2 leading-snug group-hover:text-sky-500 transition-colors">
                        {art.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        {renderCategoryBadge(art.category)}
                        <span className="text-[9px] text-slate-400 font-semibold">{formatDate(art.createdAt)}</span>
                      </div>
                    </div>
                    {/* Hover actions */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50/90 pl-2 rounded-lg">
                      <button
                        onClick={(e) => navigateToEditPage(e, art)}
                        className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-100 rounded-lg border-none bg-transparent cursor-pointer"
                        title="Sửa bài"
                      >
                        <Icon name="edit" size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteArticle(e, art)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer"
                        title="Xóa bài"
                      >
                        <Icon name="delete" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // ─── VIEW 2: TRANG CHỈNH SỬA BÀI VIẾT (PAGE) ───
  if (action === "edit" && canPublish) {
    return (
      <div className="flex-1 h-0 bg-[#f8fafc] overflow-y-auto px-6 py-8">
        <div className="mb-6">
          <button
            onClick={() => setSearchParams({ action: "create" })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-sky-500 hover:text-sky-500 text-slate-600 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Icon name="arrow_back" size={16} />
            Hủy chỉnh sửa
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm max-w-3xl w-full mx-auto overflow-hidden">
          <div className="px-6 py-4.5 bg-sky-500 text-white">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Icon name="edit" size={20} />
              Chỉnh sửa bài viết
            </h2>
          </div>

          <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Tiêu đề bài viết</label>
              <input
                type="text"
                required
                placeholder="Nhập tiêu đề..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Category & Image Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Chuyên mục</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Article["category"])}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 bg-white"
                >
                  <option value="general">Thông báo chung</option>
                  <option value="psychology">Tâm lý học đường</option>
                  <option value="announcement">Sự kiện & Hoạt động</option>
                  <option value="guide">Cẩm nang & Kỹ năng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Chọn ảnh minh họa có sẵn</label>
                <select
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageFiles([]);
                    setImagePreviews([]);
                  }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 bg-white mb-2"
                >
                  <option value="">-- Hoặc tải nhiều ảnh bên dưới --</option>
                  {PRESET_IMAGES.map((img) => (
                    <option key={img.url} value={img.url}>
                      {img.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multiple Images Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Ảnh bài viết (Chọn nhiều ảnh mới)</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="news-image-upload-edit-multi"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="news-image-upload-edit-multi"
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer transition-colors"
                >
                  <Icon name="upload_file" size={16} />
                  Tải các ảnh mới lên
                </label>
              </div>

              {/* Previews */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {imagePreviews.map((p, idx) => (
                    <div key={idx} className="w-20 h-16 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 relative group flex-shrink-0">
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none flex items-center justify-center"
                      >
                        <Icon name="close" size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Tóm tắt ngắn</label>
              <textarea
                required
                rows={2}
                maxLength={200}
                placeholder="Viết một đoạn tóm tắt ngắn..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white resize-none"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Nội dung chi tiết</label>
              <textarea
                required
                rows={10}
                placeholder="Viết nội dung bài viết chi tiết..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSearchParams({ action: "create" })}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold bg-transparent border-none cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold cursor-pointer border-none shadow-sm transition-all"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── VIEW 3: TRANG CHI TIẾT BÀI VIẾT (PAGE) ───
  if (activeArticleId && activeArticle) {
    const isLiked = activeArticle.likedBy?.includes(userId) || false;
    const currentImages = activeArticle.imageUrls && activeArticle.imageUrls.length > 0 
      ? activeArticle.imageUrls 
      : [activeArticle.imageUrl || PRESET_IMAGES[0].url];

    return (
      <div className="flex-1 h-0 bg-[#f8fafc] overflow-y-auto px-6 py-8">
        {/* Back and Admin actions */}
        <div className="mb-6 flex items-center justify-between font-bold">
          <button
            onClick={() => setSearchParams({})}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-sky-500 hover:text-sky-500 text-slate-600 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Icon name="arrow_back" size={16} />
            Quay lại danh sách
          </button>

          {canPublish && (activeArticle.authorId === userId || role === "admin") && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => navigateToEditPage(e, activeArticle)}
                className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-white hover:bg-sky-50 hover:text-sky-600 text-slate-600 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              >
                <Icon name="edit" size={14} />
                Sửa bài
              </button>
              <button
                onClick={(e) => handleDeleteArticle(e, activeArticle)}
                className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-100 transition-colors cursor-pointer"
              >
                <Icon name="delete" size={14} />
                Xóa bài
              </button>
            </div>
          )}
        </div>

        {/* 2-Column Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl w-full mx-auto">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs">
            {/* Gallery Image Box */}
            <div className="space-y-3">
              <div className="w-full bg-slate-950 flex items-center justify-center overflow-hidden h-64 md:h-96 rounded-2xl relative shadow-inner">
                <img
                  src={currentImages[activeImageIdx]}
                  alt={activeArticle.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Thumbnail Gallery List */}
              {currentImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
                  {currentImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-20 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                        activeImageIdx === idx 
                          ? "border-sky-500 scale-105 shadow-md" 
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-3">
              {renderCategoryBadge(activeArticle.category)}
              <span className="text-xs text-slate-400 font-medium">•</span>
              <span className="text-xs text-slate-400 font-medium">{formatDate(activeArticle.createdAt)}</span>
              <span className="text-xs text-slate-400 font-medium">•</span>
              <span className="text-xs text-slate-400 font-medium">{getReadTime(activeArticle.content)}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">
              {activeArticle.title}
            </h1>

            {/* Summary Block */}
            <blockquote className="border-l-4 border-sky-400 pl-4 py-1 italic text-slate-500 font-medium leading-relaxed bg-slate-50 rounded-r-xl">
              {activeArticle.summary}
            </blockquote>

            {/* Content text */}
            <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap font-sans space-y-4 pt-2">
              {activeArticle.content}
            </div>

            {/* Article Like View Counter */}
            <div className="border-t border-slate-100 pt-6 mt-8 flex items-center justify-between">
              <button
                onClick={(e) => handleLike(e, activeArticle)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-sm font-bold transition-all bg-transparent ${
                  isLiked
                    ? "bg-rose-50 border-rose-100 text-rose-500"
                    : "border-slate-200 text-slate-400 hover:bg-slate-50"
                }`}
              >
                <Icon
                  name={isLiked ? "favorite" : "favorite_border"}
                  size={16}
                  filled={isLiked}
                />
                Thích bài viết ({activeArticle.likes})
              </button>

              <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold">
                <Icon name="visibility" size={16} />
                <span>{activeArticle.views} lượt xem</span>
              </div>
            </div>
          </div>

          {/* Sidebar Author Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col items-center text-center space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin tác giả</h3>
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sky-600 text-lg border overflow-hidden">
                {getInitials(activeArticle.authorName)}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">{activeArticle.authorName}</h4>
                <p className="text-xs text-slate-400 capitalize mt-0.5">{activeArticle.authorRole} hệ thống</p>
                {activeArticle.schoolCode && (
                  <p className="text-[10px] text-sky-600 font-bold mt-1 bg-sky-50 px-2.5 py-0.5 rounded-full inline-block">
                    Trường: {activeArticle.schoolCode}
                  </p>
                )}
              </div>
              <div className="w-full h-px bg-slate-100" />
              <div className="text-xs text-slate-500 leading-relaxed">
                Tác giả đóng góp nội dung tin tức, cẩm nang và thông báo chính thức hỗ trợ cộng đồng SafeSchool Hub.
              </div>
            </div>

            {/* Related Articles list */}
            {relatedArticles.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bài viết liên quan</h3>
                <div className="space-y-4">
                  {relatedArticles.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => setSearchParams({ id: rel.id || "" })}
                      className="group flex gap-3 cursor-pointer items-start"
                    >
                      <div className="w-16 h-12 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100">
                        <img src={rel.imageUrl || PRESET_IMAGES[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-700 line-clamp-2 leading-snug group-hover:text-sky-500 transition-colors">
                          {rel.title}
                        </h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">{formatDate(rel.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── VIEW 4: TRANG DANH SÁCH BÀI VIẾT (DEFAULT LIST PAGE) ───
  return (
    <div className="flex-1 h-0 bg-[#f8fafc] overflow-y-auto px-6 py-8">
      
      {/* ── Top Navigation Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pb-3 border-b border-slate-100/80">
        {/* Left Side: Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin flex-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon name={cat.icon} size={16} filled={isSelected} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Search and Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-sky-500 transition-all shadow-xs"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
              <Icon name="search" size={18} />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none flex items-center p-0"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>

          {/* Go to Posting Page Button */}
          {canPublish && (
            <button
              onClick={() => setSearchParams({ action: "create" })}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-md shadow-sky-500/10 transition-all duration-200 cursor-pointer border-none whitespace-nowrap"
            >
              <Icon name="edit_document" size={18} />
              Đăng tin tức
            </button>
          )}
        </div>
      </div>

      {/* ── Content Grid ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-sky-500 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Đang tải tin tức...</p>
          </div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-4 bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
          <Icon name="newspaper" size={48} className="text-slate-200" />
          <div>
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy tin tức nào</h3>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── FEATURED HERO ARTICLE ── */}
          {selectedCategory === "all" && searchQuery === "" && featuredArticle && (
            <div
              onClick={() => setSearchParams({ id: featuredArticle.id || "" })}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-0"
            >
              <div className="lg:col-span-7 h-60 lg:h-96 relative overflow-hidden bg-slate-100">
                <img
                  src={featuredArticle.imageUrl || PRESET_IMAGES[0].url}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  {renderCategoryBadge(featuredArticle.category)}
                </div>

                {/* Multiple Images Count Badge */}
                {featuredArticle.imageUrls && featuredArticle.imageUrls.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Icon name="photo_library" size={12} />
                    <span>{featuredArticle.imageUrls.length} ảnh</span>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
                    <span>Nổi bật</span>
                    <span>•</span>
                    <span>{formatDate(featuredArticle.createdAt)}</span>
                    <span>•</span>
                    <span>{getReadTime(featuredArticle.content)}</span>
                  </div>

                  <h2 className="text-xl lg:text-2xl font-bold text-slate-800 hover:text-sky-500 transition-colors leading-tight">
                    {featuredArticle.title}
                  </h2>

                  <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                    {featuredArticle.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
                  {/* Author */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-sky-600 border overflow-hidden">
                      {getInitials(featuredArticle.authorName)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                        {featuredArticle.authorName}
                      </p>
                      <p className="text-[9px] text-slate-400 capitalize leading-none mt-0.5 font-medium">
                        {featuredArticle.authorRole === "teacher" ? `G.Viên` : featuredArticle.authorRole}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Likes */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => handleLike(e, featuredArticle)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all bg-transparent ${
                        featuredArticle.likedBy?.includes(userId)
                          ? "bg-rose-50 border-rose-100 text-rose-500"
                          : "border-slate-200 text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <Icon
                        name={featuredArticle.likedBy?.includes(userId) ? "favorite" : "favorite_border"}
                        size={14}
                        filled={featuredArticle.likedBy?.includes(userId)}
                      />
                      {featuredArticle.likes}
                    </button>

                    {/* Admin Actions */}
                    {canPublish && (featuredArticle.authorId === userId || role === "admin") && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => navigateToEditPage(e, featuredArticle)}
                          className="p-2 text-slate-400 hover:text-sky-500 rounded-lg hover:bg-sky-50 transition-colors border-none bg-transparent cursor-pointer"
                          title="Sửa bài"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteArticle(e, featuredArticle)}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer"
                          title="Xóa bài"
                        >
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── REGULAR ARTICLES GRID ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularArticles.map((art) => {
              const isLiked = art.likedBy?.includes(userId) || false;
              return (
                <div
                  key={art.id}
                  onClick={() => setSearchParams({ id: art.id || "" })}
                  className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  <div>
                    {/* Image */}
                    <div className="h-44 relative bg-slate-100 overflow-hidden">
                      <img
                        src={art.imageUrl || PRESET_IMAGES[0].url}
                        alt={art.title}
                        className="w-full h-full object-cover hover:scale-104 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">{renderCategoryBadge(art.category)}</div>

                      {/* Multiple Images Count Badge */}
                      {art.imageUrls && art.imageUrls.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Icon name="photo_library" size={10} />
                          <span>{art.imageUrls.length} ảnh</span>
                        </div>
                      )}
                    </div>

                    {/* Meta & Title */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                        <span>{formatDate(art.createdAt)}</span>
                        <span>•</span>
                        <span>{getReadTime(art.content)}</span>
                      </div>

                      <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2 hover:text-sky-500 transition-colors">
                        {art.title}
                      </h3>

                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {art.summary}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {/* Author */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-sky-600 border overflow-hidden">
                        {getInitials(art.authorName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-700 truncate max-w-[80px]">
                          {art.authorName}
                        </p>
                        <p className="text-[8px] text-slate-400 capitalize leading-none mt-0.5 font-semibold">
                          {art.authorRole === "teacher" ? "G.Viên" : art.authorRole}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={(e) => handleLike(e, art)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all bg-transparent ${
                          isLiked
                            ? "bg-rose-50 border-rose-100 text-rose-500"
                            : "border-slate-200 text-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        <Icon
                          name={isLiked ? "favorite" : "favorite_border"}
                          size={12}
                          filled={isLiked}
                        />
                        {art.likes}
                      </button>

                      {/* Admin Controls */}
                      {canPublish && (art.authorId === userId || role === "admin") && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={(e) => navigateToEditPage(e, art)}
                            className="p-1.5 text-slate-400 hover:text-sky-500 rounded-md hover:bg-sky-50 border-none bg-transparent cursor-pointer"
                            title="Sửa bài"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteArticle(e, art)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 border-none bg-transparent cursor-pointer"
                            title="Xóa bài"
                          >
                            <Icon name="delete" size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

function getInitials(name: string): string {
  if (!name) return "TG";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join("");
}
