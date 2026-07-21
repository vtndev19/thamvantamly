import { Link } from "react-router";
import { Icon } from "../ui/Icon";

const NAV_LINKS = [
  { label: "Trang chủ", href: "/" },
  { label: "Kiến thức", href: "/knowledge" },
  { label: "Hỗ trợ & Báo cáo", href: "/student/support" },
];

/**
 * Navbar – Sticky top navigation bar.
 * Contains the logo, navigation links, and auth actions.
 */
export function Navbar() {
  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background: "rgba(247, 249, 251, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-outline-variant)",
      }}
    >
      <div
        className="mx-auto flex items-center justify-between px-6 py-3"
        style={{ maxWidth: "1200px" }}
      >
        {/* Logo */}
        <Link
          to="/"
          id="nav-logo"
          className="flex items-center gap-2 no-underline"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Icon name="shield" size={20} filled style={{ color: "var(--color-on-primary)" }} />
          </div>
          <span
            className="font-bold"
            style={{
              fontSize: "16px",
              color: "var(--color-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            SafeSchool Hub
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium no-underline transition-colors duration-150"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Auth Actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/auth/login"
            id="nav-login"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold no-underline transition-colors duration-150"
            style={{ color: "var(--color-primary)" }}
          >
            <Icon name="login" size={18} style={{ color: "var(--color-primary)" }} />
            Đăng nhập
          </Link>
          <Link
            to="/auth/register"
            id="nav-register"
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-semibold no-underline transition-opacity duration-150 hover:opacity-90"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-on-primary)",
            }}
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </nav>
  );
}
