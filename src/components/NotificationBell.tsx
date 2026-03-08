import { Bell, CheckCheck, Package, ShieldCheck, ShieldX, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

const getNotificationIcon = (title: string) => {
  if (title.includes("Approved")) return <ShieldCheck size={16} className="text-green-400" />;
  if (title.includes("Rejected")) return <ShieldX size={16} className="text-red-400" />;
  return <Package size={16} className="text-primary" />;
};

const NotificationItem = ({ n, onRead }: { n: Notification; onRead: (id: string) => void }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ type: "spring", stiffness: 400, damping: 30 }}
    className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors duration-150 ${
      !n.is_read 
        ? "bg-primary/[0.06] hover:bg-primary/[0.12]" 
        : "hover:bg-accent/20"
    }`}
    onClick={() => {
      if (!n.is_read) onRead(n.id);
    }}
  >
    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
      !n.is_read ? "bg-primary/15" : "bg-muted"
    }`}>
      {getNotificationIcon(n.title)}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[13px] leading-snug truncate ${
          !n.is_read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
        }`}>
          {n.title}
        </p>
        {!n.is_read && (
          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
        )}
      </div>
      <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
      <p className="text-[10px] text-muted-foreground/40 mt-1">
        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
      </p>
    </div>
  </motion.div>
);

const NotificationBell = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.9 }}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <AnimatePresence mode="wait">
          {unreadCount > 0 ? (
            <motion.div
              key="bell-ring"
              animate={{ 
                rotate: [0, 15, -15, 10, -10, 5, -5, 0],
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <Bell size={22} className="text-primary" fill="currentColor" fillOpacity={0.15} />
            </motion.div>
          ) : (
            <Bell size={22} />
          )}
        </AnimatePresence>

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, y: 5 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 5 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute right-0 top-full mt-2 w-[340px] max-h-[28rem] flex flex-col bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-primary" />
                <h3 className="font-gothic text-sm text-foreground tracking-wide">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => markAllAsRead.mutate()}
                  className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors"
                >
                  <CheckCheck size={13} />
                  Read all
                </motion.button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellOff size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground/60 font-medium">No notifications yet</p>
                  <p className="text-xs text-muted-foreground/40 mt-1">We'll notify you when something happens</p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      n={n}
                      onRead={(id) => markAsRead.mutate(id)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border/50 bg-card">
                <p className="text-[10px] text-muted-foreground/40 text-center uppercase tracking-widest">
                  Showing latest {notifications.length} notifications
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
