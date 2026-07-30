import React from "react";

interface IconProps {
  name: string;
  size?: number | string;
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Icon – wraps a Material Symbols Outlined glyph.
 *
 * @example
 * <Icon name="local_library" filled size={32} />
 * <Icon name="security" size={24} style={{ color: "var(--color-primary)" }} />
 */
export function Icon({
  name,
  size = 24,
  filled = false,
  className = "",
  style,
}: IconProps) {
  return (
    <span
      className={["material-symbols-outlined", className].join(" ").trim()}
      style={{
        fontSize: typeof size === "number" ? `${size}px` : size,
        lineHeight: 1,
        fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
