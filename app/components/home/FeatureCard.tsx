import { Icon } from "../ui/Icon";

export interface FeatureCardProps {
  /** Material Symbols icon name */
  icon: string;
  /** Icon color as CSS string (e.g. "var(--color-primary)") */
  iconColor: string;
  title: string;
  description: string;
  /** Image URL shown at the top of the card */
  imageUrl: string;
  imageAlt?: string;
  /** Delay class for staggered entrance animation */
  animationDelay?: string;
}

/**
 * FeatureCard – A bento-grid card used to showcase one main feature.
 * Reusable across any section that lists features in a grid.
 */
export function FeatureCard({
  icon,
  iconColor,
  title,
  description,
  imageUrl,
  imageAlt = "",
  animationDelay = "",
}: FeatureCardProps) {
  return (
    <article
      className={[
        "group relative flex flex-col items-center text-center",
        "bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)]",
        "shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden",
        "transition-all duration-300 ease-out",
        "hover:shadow-[0_8px_32px_rgba(0,88,189,0.15)] hover:-translate-y-1",
        "animate-fade-in-up",
        animationDelay,
      ].join(" ")}
    >
      {/* Card Image */}
      <div className="w-full h-48 overflow-hidden bg-[var(--color-surface-container)] flex-shrink-0">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Card Body */}
      <div className="flex flex-col items-center p-6 gap-3 flex-grow">
        {/* Icon Badge */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 15%, transparent)` }}
        >
          <Icon
            name={icon}
            size={28}
            filled
            className=""
            style={{ color: iconColor }}
          />
        </div>

        <h2
          className="font-semibold text-[var(--color-on-surface)]"
          style={{ fontSize: "20px", lineHeight: "28px" }}
        >
          {title}
        </h2>
        <p
          className="text-[var(--color-on-surface-variant)]"
          style={{ fontSize: "15px", lineHeight: "22px" }}
        >
          {description}
        </p>
      </div>
    </article>
  );
}
