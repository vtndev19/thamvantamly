import { useEffect, useState, useRef } from "react";
import { Icon } from "../ui/Icon";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  listenStudentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type StudentNotification,
} from "../../src/services/newsService";

/**
 * StudentNotificationBell – Component chuông thông báo realtime cho học sinh.
 * Hiển thị badge đếm số thông báo chưa đọc + dropdown danh sách thông báo.
 */
export function StudentNotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Realtime listener ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = listenStudentNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // ── Click outside to close ─────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleMarkAsRead(notifId?: string) {
    if (!notifId) return;
    try {
      await markNotificationAsRead(notifId);
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  }

  async function handleMarkAllRead() {
    if (!user?.uid) return;
    try {
      await markAllNotificationsAsRead(user.uid);
    } catch (err) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", err);
    }
  }

  function formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return new Date(timestamp).toLocaleDateString("vi-VN");
  }

  const CATEGORY_ICON: Record<string, { icon: string; color: string }> = {
    news: { icon: "newspaper", color: "#0058bd" },
    event: { icon: "event", color: "#7c3aed" },
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
        aria-label="Thông báo"
      >
        <Icon name="notifications" size={22} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[360px] max-h-[440px] bg-white rounded-2xl border border-[#e8eaf0] shadow-2xl z-50 overflow-hidden animate-fade-in"
          style={{ animationDuration: "150ms" }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#e8eaf0] flex items-center justify-between bg-surface-container-low">
            <div className="flex items-center gap-2">
              <Icon name="notifications" size={18} filled style={{ color: "#059669" }} />
              <h3 className="text-sm font-bold text-on-surface">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-primary hover:text-primary/80 cursor-pointer bg-transparent border-none transition-colors"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[360px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-on-surface-variant space-y-2">
                <Icon name="notifications_none" size={32} style={{ color: "#a1a1aa", margin: "0 auto" }} />
                <p className="font-semibold text-sm text-on-surface">Chưa có thông báo</p>
                <p className="text-on-surface-variant">
                  Bạn sẽ nhận được thông báo khi giáo viên đăng tin tức mới.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/15">
                {notifications.map((notif) => {
                  const catInfo = CATEGORY_ICON[notif.category] || CATEGORY_ICON.news;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif.id)}
                      className={`flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer ${
                        notif.isRead
                          ? "bg-white hover:bg-surface-container-low"
                          : "bg-emerald-50/50 hover:bg-emerald-50"
                      }`}
                    >
                      {/* Category Icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: catInfo.color + "14" }}
                      >
                        <Icon
                          name={catInfo.icon}
                          size={18}
                          filled
                          style={{ color: catInfo.color }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-xs leading-snug ${
                              notif.isRead
                                ? "font-semibold text-on-surface"
                                : "font-bold text-on-surface"
                            }`}
                          >
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-on-surface-variant/70">
                          <span className="flex items-center gap-0.5">
                            <Icon name="person" size={11} />
                            {notif.senderName}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Icon name="schedule" size={11} />
                            {formatTime(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
