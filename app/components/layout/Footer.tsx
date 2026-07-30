import { Link } from "react-router";
import { Icon } from "../ui/Icon";

/**
 * Footer – Site-wide footer with logo, links and copyright.
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="w-full mt-auto"
      style={{
        borderTop: "1px solid var(--color-outline-variant)",
        backgroundColor: "var(--color-surface-container-lowest)",
      }}
    >
      <div
        className="mx-auto px-6 py-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8"
        style={{ maxWidth: "1200px" }}
      >
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Icon name="shield" size={16} filled style={{ color: "var(--color-on-primary)" }} />
            </div>
            <span
              className="font-bold"
              style={{ color: "var(--color-primary)", fontSize: "15px" }}
            >
              SafeSchool Hub
            </span>
          </div>
          <p
            style={{ fontSize: "13px", color: "var(--color-on-surface-variant)", maxWidth: "240px", textAlign: "center" }}
            className="md:text-left"
          >
            Xây dựng môi trường học đường an toàn và tích cực cho mọi học sinh.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex gap-8">
          <div>
            <h3
              className="font-semibold mb-3"
              style={{ fontSize: "13px", color: "var(--color-on-surface)", letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
              Tính năng
            </h3>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {["Kiến thức & An toàn", "Hỗ trợ tâm lý", "Báo cáo ẩn danh"].map(
                (item) => (
                  <li key={item}>
                    <Link
                      to="/"
                      className="no-underline transition-colors duration-150"
                      style={{ fontSize: "14px", color: "var(--color-on-surface-variant)" }}
                    >
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>
          <div>
            <h3
              className="font-semibold mb-3"
              style={{ fontSize: "13px", color: "var(--color-on-surface)", letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
              Hỗ trợ
            </h3>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {["Về chúng tôi", "Liên hệ", "Chính sách bảo mật"].map((item) => (
                <li key={item}>
                  <Link
                    to="/"
                    className="no-underline transition-colors duration-150"
                    style={{ fontSize: "14px", color: "var(--color-on-surface-variant)" }}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div
        className="text-center py-4"
        style={{
          borderTop: "1px solid var(--color-outline-variant)",
          fontSize: "12px",
          color: "var(--color-outline)",
        }}
      >
        © {year} SafeSchool Hub. Được xây dựng với{" "}
        <Icon name="favorite" size={12} filled style={{ color: "var(--color-error)", display: "inline", verticalAlign: "middle" }} />{" "}
        vì một học đường an toàn.
      </div>
    </footer>
  );
}
