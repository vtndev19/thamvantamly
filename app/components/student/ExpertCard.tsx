import { Link } from "react-router";

interface ExpertProps {
  id: string;
  name: string;
  title: string;
  avatar: string;
  tags: string[];
}

export function ExpertCard({ id, name, title, avatar, tags }: ExpertProps) {
  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-center hover:shadow-md transition-all duration-300 w-full">
      {/* Avatar Container */}
      <div className="w-[100px] h-[100px] rounded-full overflow-hidden mb-4 border-2 border-outline-variant/20 shadow-xs">
        <img
          src={avatar}
          alt={`Chuyên gia ${name}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Name and Title */}
      <h4 className="font-serif font-bold text-on-surface text-base mb-1 truncate max-w-full">
        {title}. {name}
      </h4>

      {/* Tags / Specializations */}
      <div className="flex flex-wrap gap-1.5 justify-center my-3.5 min-h-[26px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-surface-container text-on-surface-variant"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* View Profile Button */}
      <Link
        to={`/student/experts/${id}`}
        className="mt-2 w-full max-w-[180px] border border-outline-variant/50 hover:bg-primary hover:text-on-primary hover:border-primary text-on-surface text-xs font-semibold py-2 px-4 rounded-xl transition-all duration-250 block text-center"
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
        <h3 className="text-xl md:text-2xl font-serif font-bold text-on-surface tracking-wide">
          Chuyên viên tiêu biểu
        </h3>
        <Link
          to="/student/experts"
          className="text-sm font-semibold text-primary hover:text-primary-container transition-colors"
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
