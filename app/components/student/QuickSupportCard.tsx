import { Icon } from "../ui/Icon";

interface CardProps {
  title: string;
  description?: string;
  icon: string;
  themeColor: "blue" | "orange" | "green" | "red" | "gray";
  layout?: "vertical" | "horizontal" | "square";
  onClick?: () => void;
}

export function QuickSupportCard({
  title,
  description,
  icon,
  themeColor,
  layout = "vertical",
  onClick,
}: CardProps) {
  // Theme color styling mapper
  const colorStyles = {
    blue: {
      bg: "bg-[#e8f1fc]",
      text: "text-[#0058bd]",
    },
    orange: {
      bg: "bg-[#fff2e8]",
      text: "text-[#994100]",
    },
    green: {
      bg: "bg-[#e6f7ed]",
      text: "text-[#006d36]",
    },
    red: {
      bg: "bg-[#ffeef0]",
      text: "text-[#ba1a1a]",
    },
    gray: {
      bg: "bg-[#f2f4f6]",
      text: "text-[#414754]",
    },
  }[themeColor];

  if (layout === "square") {
    return (
      <button
        onClick={onClick}
        className="flex flex-col justify-between items-start p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-left hover:shadow-md transition-all duration-300 w-full min-h-[170px]"
      >
        <div className={`w-10 h-10 rounded-xl ${colorStyles.bg} flex items-center justify-center`}>
          <Icon name={icon} className={colorStyles.text} filled size={22} />
        </div>
        <span className="font-serif font-bold text-on-surface text-base leading-tight mt-auto">
          {title}
        </span>
      </button>
    );
  }

  if (layout === "horizontal") {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-5 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-left hover:shadow-md transition-all duration-300 w-full h-full min-h-[120px]"
      >
        <div className={`w-12 h-12 rounded-xl ${colorStyles.bg} flex-shrink-0 flex items-center justify-center`}>
          <Icon name={icon} className={colorStyles.text} filled size={24} />
        </div>
        <div className="flex-grow min-w-0">
          <h4 className="font-serif font-bold text-on-surface text-base mb-1 truncate">
            {title}
          </h4>
          {description && (
            <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-outline-variant hover:text-on-surface ml-2 transition-colors">
          <Icon name="arrow_forward" size={20} />
        </div>
      </button>
    );
  }

  // Default Vertical
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-left hover:shadow-md transition-all duration-300 w-full h-full min-h-[170px]"
    >
      <div className={`w-12 h-12 rounded-xl ${colorStyles.bg} flex items-center justify-center mb-6`}>
        <Icon name={icon} className={colorStyles.text} filled size={24} />
      </div>
      <div>
        <h4 className="font-serif font-bold text-on-surface text-base mb-1.5 leading-tight">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-on-surface-variant leading-normal">
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
      {/* Title */}
      <h3 className="text-xl md:text-2xl font-serif font-bold text-on-surface tracking-wide">
        Hỗ trợ nhanh
      </h3>

      {/* Grid of Cards */}
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

      {/* Bottom Row */}
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
