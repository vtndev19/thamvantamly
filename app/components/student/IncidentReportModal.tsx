import { useState } from "react";
import { Icon } from "../ui/Icon";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  createIncidentReport,
  type UrgencyLevel,
} from "../../src/services/reportService";

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const URGENCY_OPTIONS: {
  value: UrgencyLevel;
  label: string;
  color: string;
  bg: string;
}[] = [
  { value: "low", label: "Bình thường", color: "#059669", bg: "#d1fae5" },
  { value: "medium", label: "Trung bình", color: "#d97706", bg: "#fef3c7" },
  { value: "high", label: "Khẩn cấp", color: "#dc2626", bg: "#fee2e2" },
  { value: "critical", label: "🚨 Rất nguy hiểm", color: "#7f1d1d", bg: "#fca5a5" },
];

export function IncidentReportModal({
  isOpen,
  onClose,
  onSuccess,
}: IncidentReportModalProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("medium");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userSchoolCode = user?.schoolCode || "THPT001";

  if (!isOpen) return null;

  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Vui lòng nhập tiêu đề vụ việc.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Vui lòng nhập mô tả chi tiết vụ việc.");
      return;
    }

    setSubmitting(true);

    try {
      await createIncidentReport({
        studentId: user?.uid || "anonymous-uid",
        studentName: user?.displayName || "Học sinh",
        schoolCode: userSchoolCode,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        urgency,
        isAnonymous,
      });

      // Reset form
      setTitle("");
      setLocation("");
      setDescription("");
      setIsAnonymous(false);
      setUrgency("medium");

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err?.message || "Không thể gửi báo cáo. Vui lòng kiểm tra kết nối mạng và phân quyền Firebase."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-[620px] w-full p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] border border-[#e8eaf0] relative no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <Icon name="close" size={22} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Icon name="report_problem" size={24} filled />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-on-surface">
              Tạo phản ánh bạo lực học đường
            </h2>
            <p className="text-xs text-on-surface-variant">
              Báo cáo sẽ tự động gửi tới Giáo viên phụ trách thuộc trường bạn.
            </p>
          </div>
        </div>

        {/* Auto-filled School Code Info Banner */}
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-xs text-blue-900 mb-5">
          <Icon name="school" size={20} filled style={{ color: "#0058bd" }} />
          <div>
            <span className="font-bold">Mã trường THPT của bạn: </span>
            <span className="bg-blue-600 text-white font-mono px-2 py-0.5 rounded-md text-[11px] font-bold">
              {userSchoolCode}
            </span>
            <p className="text-[11px] text-blue-700 mt-0.5">
              *(Hệ thống tự động sử dụng Mã THPT từ tài khoản của bạn, không cần nhập lại)*
            </p>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold p-4 rounded-2xl mb-5">
            <Icon name="error" size={20} filled style={{ color: "#dc2626" }} />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmitReport} className="space-y-4">
          {/* Tiêu đề vụ việc */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Tiêu đề / Loại hình vụ việc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Bị bắt nạt tại hành lang tầng 2, Đe dọa trực tuyến..."
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:outline-none focus:border-primary transition-colors"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Mức độ khẩn cấp & Địa điểm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                Mức độ khẩn cấp
              </label>
              <div className="grid grid-cols-2 gap-2">
                {URGENCY_OPTIONS.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setUrgency(u.value)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                      urgency === u.value
                        ? "border-primary ring-2 ring-primary/20 shadow-sm"
                        : "border-outline-variant/30 opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: u.bg, color: u.color }}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                Địa điểm xảy ra (nếu có)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Sân trường, Cổng sau, Trên mạng XH..."
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:outline-none focus:border-primary transition-colors"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Nội dung mô tả chi tiết */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Mô tả chi tiết vụ việc <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Hãy mô tả những gì đã xảy ra, thời gian, đối tượng liên quan (nếu biết)..."
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/40 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Ẩn danh checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-container/50 border border-outline-variant/20 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
            />
            <div>
              <span className="text-xs font-bold text-on-surface">Gửi báo cáo dưới dạng Ẩn danh</span>
              <p className="text-[11px] text-on-surface-variant">
                Tên và thông tin cá nhân của bạn sẽ được giấu kín khỏi giáo viên.
              </p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold text-sm py-2.5 px-6 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang gửi…
                </>
              ) : (
                <>
                  <Icon name="send" size={18} filled />
                  GỬI PHẢN ÁNH KHẨN CẤP
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
