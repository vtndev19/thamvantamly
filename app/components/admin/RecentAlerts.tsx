import { Icon } from "../ui/Icon";

interface AlertItem {
  title: string;
  description: string;
  timeAgo: string;
  severity: "high" | "medium" | "info";
}

const ALERTS: AlertItem[] = [
  {
    title: "Phản ánh mức độ cao tại Khối 10",
    description: "Ghi nhận 3 báo cáo liên tiếp về bạo lực ngôn từ.",
    timeAgo: "10 phút trước",
    severity: "high",
  },
  {
    title: "Yêu cầu hỗ trợ tâm lý mới",
    description: "Học sinh lớp 11A2 yêu cầu gặp chuyên viên.",
    timeAgo: "1 giờ trước",
    severity: "info",
  },
];

function getSeverityStyles(severity: AlertItem["severity"]) {
  switch (severity) {
    case "high":
      return {
        bg: "#ffdad6",
        color: "#ba1a1a",
        icon: "error",
      };
    case "medium":
      return {
        bg: "#ffdbca",
        color: "#994100",
        icon: "warning",
      };
    case "info":
      return {
        bg: "#d8e2ff",
        color: "#0058bd",
        icon: "info",
      };
  }
}

export function RecentAlerts() {
  return (
    <div className="bg-white border border-outline-variant/20 rounded-2xl p-6">
      {/* Section Title */}
      <div className="flex items-center gap-2 mb-5">
        <Icon name="warning" size={22} style={{ color: "#c05400" }} />
        <h3 className="text-lg font-serif font-bold text-on-surface tracking-tight">
          Cảnh báo gần đây
        </h3>
      </div>

      {/* Alerts List */}
      <div className="flex flex-col gap-3">
        {ALERTS.map((alert, i) => {
          const styles = getSeverityStyles(alert.severity);
          return (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant/15 hover:bg-surface-container-low transition-colors"
            >
              {/* Icon badge */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: styles.bg }}
              >
                <Icon name={styles.icon} size={20} filled style={{ color: styles.color }} />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface mb-0.5 truncate">{alert.title}</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">{alert.description}</p>
              </div>

              {/* Timestamp */}
              <span className="text-[11px] text-outline font-medium whitespace-nowrap flex-shrink-0 mt-0.5">
                {alert.timeAgo}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
