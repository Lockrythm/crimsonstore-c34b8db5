import { Bell, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

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
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell size={22} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-gothic text-sm text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 flex gap-3 cursor-pointer hover:bg-accent/50 transition-colors ${
                      !n.is_read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (!n.is_read) markAsRead.mutate(n.id);
                    }}
                  >
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      !n.is_read ? "bg-primary" : "bg-transparent"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <Check size={14} className="text-muted-foreground shrink-0 mt-1" />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
