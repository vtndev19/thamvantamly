import { Link } from "react-router";

interface ExpertProps {
  id: string;
  name: string;
  title: string;
  avatar: string;
  tags: string[];
}

export function ExpertCard({ id, name, title, avatar, tags }: ExpertProps) {
  const displayName = title === "Chuyên viên" ? `Chuyên viên ${name}` : `${title}. ${name}`;

  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-white border border-[#e8eaf0] text-center hover:shadow-md transition-all duration-300 w-full">
      {/* Avatar Container */}
      <div className="w-[90px] h-[90px] rounded-full overflow-hidden mb-4 border border-[#e8eaf0] shadow-xs">
        <img
          src={avatar}
          alt={`Chuyên gia ${name}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Name and Title */}
      <h4 className="font-serif font-bold text-[#191c1e] text-base mb-1 truncate max-w-full">
        {displayName}
      </h4>

      {/* Tags / Specializations */}
      <div className="flex flex-wrap gap-2 justify-center my-3 min-h-[26px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-[#f8f9fa] border border-[#e8eaf0] text-[#727785]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* View Profile Button */}
      <Link
        to={`/student/experts/${id}`}
        className="mt-2 w-full max-w-[180px] border border-[#c1c6d6] hover:border-[#0058bd] hover:text-[#0058bd] text-[#414754] text-xs font-semibold py-2 px-4 rounded-lg bg-white transition-all duration-200 block text-center"
      >
        Xem hồ sơ
      </Link>
    </div>
  );
}

export function FeaturedExperts() {
  const experts = [
    {
      id: "nguyen-thu-ha",
      name: "Nguyễn Thu Hà",
      title: "ThS",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
      tags: ["Stress", "Áp lực học tập"],
    },
    {
      id: "tran-van-dung",
      name: "Trần Văn Dũng",
      title: "BS",
      avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=200&auto=format&fit=crop",
      tags: ["Định hướng", "Gia đình"],
    },
    {
      id: "le-mai",
      name: "Lê Mai",
      title: "Chuyên viên",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
      tags: ["Tự tin", "Mối quan hệ"],
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#191c1e]">
          Chuyên viên tiêu biểu
        </h3>
        <Link
          to="/student/experts"
          className="text-sm font-semibold text-[#0058bd] hover:text-[#004494] transition-colors"
        >
          Xem tất cả
        </Link>
      </div>

      {/* Experts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {experts.map((exp) => (
          <ExpertCard key={exp.id} {...exp} />
        ))}
      </div>
    </div>
  );
}
