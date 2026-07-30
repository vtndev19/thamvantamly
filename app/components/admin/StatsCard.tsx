import { Icon } from "../ui/Icon";

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
  subtitle?: string;
}

export function StatCard({ label, value, icon, iconBgColor, iconColor, badge, badgeColor, subtitle }: StatCardProps) {
  return (
    <div className="flex flex-col justify-between bg-white border border-outline-variant/20 rounded-2xl p-5 min-h-[140px] hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <p className="text-sm text-on-surface-variant font-medium leading-snug max-w-[100px]">{label}</p>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon name={icon} size={20} filled style={{ color: iconColor }} />
        </div>
      </div>
      <div className="mt-auto">
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-on-surface tracking-tight">{value}</p>
          {badge && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md mb-1"
              style={{ color: badgeColor, backgroundColor: `${badgeColor}15` }}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-on-surface-variant mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function StatsGrid() {
  const stats: StatCardProps[] = [
    {
      label: "Tổng số học sinh",
      value: "2,500",
      icon: "groups",
      iconBgColor: "#d8e2ff",
      iconColor: "#0058bd",
    },
    {
      label: "Chuyên viên hỗ trợ",
      value: "12",
      icon: "support_agent",
      iconBgColor: "#d4f7e0",
      iconColor: "#006d36",
    },
    {
      label: "Phản ánh mới",
      value: "8",
      icon: "error",
      iconBgColor: "#ffdad6",
      iconColor: "#ba1a1a",
      badge: "+3 hnay",
      badgeColor: "#006d36",
    },
    {
      label: "Ca khẩn cấp",
      value: "0",
      icon: "emergency",
      iconBgColor: "#d4f7e0",
      iconColor: "#006d36",
      subtitle: "An toàn hiện tại",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
