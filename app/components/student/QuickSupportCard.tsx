import { Icon } from "../ui/Icon";

interface CardProps {
  title: string;
  description?: string;
  icon: string;
  themeColor: "blue" | "orange" | "green" | "red" | "gray";
  layout?: "vertical" | "square" | "horizontal";
  onClick?: () => void;
}

const COLOR_MAP = {
  blue:   { bg: "bg-[#0058bd]", text: "text-white" },
  orange: { bg: "bg-[#fff2e8]", text: "text-[#994100]" },
  green:  { bg: "bg-[#e6f7ed]", text: "text-[#006d36]" },
  red:    { bg: "bg-[#ffeef0]", text: "text-[#ba1a1a]" },
  gray:   { bg: "bg-[#f2f4f6]", text: "text-[#414754]" },
} as const;

export function QuickSupportCard({
  title,
  description,
  icon,
  themeColor,
  layout = "vertical",
  onClick,
}: CardProps) {
  const color = COLOR_MAP[themeColor];

  /* ── Square layout (Đánh giá cảm xúc) ── */
  if (layout === "square") {
    return (
      <button
        onClick={onClick}
        className="flex flex-col justify-between items-start p-6 rounded-2xl bg-white border border-[#e8eaf0] text-left hover:shadow-md transition-all duration-300 w-full min-h-[160px] cursor-pointer"
      >
        <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center`}>
          <Icon name={icon} className={color.text} filled size={20} />
        </div>
        <span className="font-serif font-bold text-[#191c1e] text-[15px] leading-tight mt-auto">
          {title}
        </span>
      </button>
    );
  }

  /* ── Horizontal layout (Tài nguyên tinh thần) ── */
  if (layout === "horizontal") {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-5 p-6 rounded-2xl bg-white border border-[#e8eaf0] text-left hover:shadow-md transition-all duration-300 w-full h-full min-h-[100px] cursor-pointer"
      >
        <div className={`w-11 h-11 rounded-xl ${color.bg} flex-shrink-0 flex items-center justify-center`}>
          <Icon name={icon} className={color.text} filled size={22} />
        </div>
        <div className="flex-grow min-w-0">
          <h4 className="font-serif font-bold text-[#191c1e] text-[16px] mb-1 leading-tight">
            {title}
          </h4>
          {description && (
            <p className="text-[13px] text-[#727785] leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-[#c1c6d6] ml-2">
          <Icon name="arrow_forward" size={20} />
        </div>
      </button>
    );
  }

  /* ── Vertical layout (Default for Đặt lịch tư vấn, Hỏi ẩn danh, Trò chuyện) ── */
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-6 p-6 rounded-2xl bg-white border border-[#e8eaf0] text-left hover:shadow-md transition-all duration-300 w-full h-full min-h-[170px] cursor-pointer"
    >
      <div className={`w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center`}>
        <Icon name={icon} className={color.text} filled size={24} />
      </div>
      <div>
        <h4 className="font-serif font-bold text-[#191c1e] text-[16px] mb-1.5 leading-tight">
          {title}
        </h4>
        {description && (
          <p className="text-[13px] text-[#727785] leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}

export function QuickSupportGrid() {
  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Section Title */}
      <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#191c1e]">
        Hỗ trợ nhanh
      </h3>

      {/* Row 1: 3 column vertical cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <QuickSupportCard
          title="Đặt lịch tư vấn"
          description="Kết nối với chuyên gia tâm lý 1:1"
          icon="psychology"
          themeColor="blue"
          layout="vertical"
        />
        <QuickSupportCard
          title="Hỏi ẩn danh"
          description="Gửi câu hỏi an toàn không tiết lộ danh tính"
          icon="contact_support"
          themeColor="orange"
          layout="vertical"
        />
        <QuickSupportCard
          title="Trò chuyện"
          description="Nhắn tin trực tiếp nhận hỗ trợ tức thì"
          icon="forum"
          themeColor="green"
          layout="vertical"
        />
      </div>

      {/* Row 2: square + horizontal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="md:col-span-1">
          <QuickSupportCard
            title="Đánh giá cảm xúc"
            icon="sentiment_satisfied"
            themeColor="red"
            layout="square"
          />
        </div>
        <div className="md:col-span-3">
          <QuickSupportCard
            title="Tài nguyên tinh thần"
            description="Bài viết, podcast và bài tập thư giãn giúp bạn tự cân bằng."
            icon="menu_book"
            themeColor="gray"
            layout="horizontal"
          />
        </div>
      </div>
    </div>
  );
}
