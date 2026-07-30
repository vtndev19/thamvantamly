/**
 * TrendChart – A simple bar chart showing report trends over 6 months.
 * Rendered with pure CSS, no chart library needed.
 */
export function TrendChart() {
  const months = [
    { label: "T1", value: 30 },
    { label: "T2", value: 55 },
    { label: "T3", value: 25 },
    { label: "T4", value: 70 },
    { label: "T5", value: 50 },
    { label: "T6", value: 60 },
  ];

  const maxVal = Math.max(...months.map((m) => m.value));

  return (
    <div className="flex-1 bg-white border border-outline-variant/20 rounded-2xl p-6 min-w-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-serif font-bold text-on-surface tracking-tight">
          Xu hướng phản ánh (6 tháng)
        </h3>
        <button className="text-xs font-semibold text-primary hover:underline cursor-pointer">
          Chi tiết
        </button>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-3 h-[200px] border border-outline-variant/15 rounded-xl px-4 pt-4 pb-2">
        {months.map((month) => {
          const heightPercent = (month.value / maxVal) * 100;
          return (
            <div key={month.label} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full flex items-end justify-center" style={{ height: "170px" }}>
                <div
                  className="w-2.5 rounded-full bg-primary transition-all duration-500"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-on-surface-variant font-medium">{month.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * GradeDistribution – A donut chart showing report distribution by grade/khối.
 * Rendered with pure CSS conic-gradient.
 */
export function GradeDistribution() {
  const grades = [
    { label: "Khối 10", percent: 45, color: "#0058bd" },
    { label: "Khối 11", percent: 35, color: "#006d36" },
    { label: "Khối 12", percent: 20, color: "#c05400" },
  ];

  // Build conic-gradient stops
  let cumulativePercent = 0;
  const gradientStops = grades
    .map((g) => {
      const start = cumulativePercent;
      cumulativePercent += g.percent;
      return `${g.color} ${start}% ${cumulativePercent}%`;
    })
    .join(", ");

  return (
    <div className="w-full lg:w-[280px] bg-white border border-outline-variant/20 rounded-2xl p-6 flex-shrink-0">
      <h3 className="text-lg font-serif font-bold text-on-surface tracking-tight mb-6">
        Phân bổ theo khối
      </h3>

      {/* Donut Chart */}
      <div className="flex justify-center mb-5">
        <div
          className="relative w-[140px] h-[140px] rounded-full"
          style={{ background: `conic-gradient(${gradientStops})` }}
        >
          {/* Center hole */}
          <div className="absolute inset-[22px] rounded-full bg-white flex items-center justify-center">
            <span className="text-lg font-bold text-primary">100%</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {grades.map((g) => (
          <div key={g.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
            <div className="text-center">
              <p className="text-[11px] font-semibold text-on-surface">{g.label}</p>
              <p className="text-[10px] text-on-surface-variant">({g.percent}%)</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
