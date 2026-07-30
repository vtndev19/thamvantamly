import React from "react";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--color-primary)] text-[var(--color-on-primary)]",
    "shadow-[0_8px_24px_rgba(45,127,249,0.2)]",
    "hover:opacity-90 active:opacity-80",
  ].join(" "),
  outline: [
    "bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)]",
    "hover:bg-[var(--color-primary-fixed)] hover:text-[var(--color-on-primary-fixed)]",
    "active:opacity-80",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--color-primary)]",
    "hover:bg-[var(--color-surface-container)]",
    "active:opacity-80",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-12 px-6 text-sm font-semibold tracking-[0.01em]",
  lg: "h-14 px-8 text-base font-semibold",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2",
        "rounded-full transition-all duration-200 cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(" ")}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className="material-symbols-outlined text-[20px] icon-filled">
          {icon}
        </span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className="material-symbols-outlined text-[20px] icon-outlined">
          {icon}
        </span>
      )}
    </button>
  );
}
