import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";

const Header = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = localStorage.getItem("id");

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setError("No user ID found in localStorage");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log("Fetching notifications for user:", userId);
      
      const { data, error } = await supabase
        .from("transit_notifications")
        .select(`
          id,
          created_at,
          seen,
          transit_id,
          sender_id,
          transits (
            id,
            title,
            price,
            "to",
            "from"
          ),
          users:sender_id (
            id,
            username
          )
        `)
        .eq("receiver_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Raw data from Supabase:", data);

      if (!data || data.length === 0) {
        console.log("No notifications found for this user");
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.seen).length || 0);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Failed to fetch notifications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    const subscription = supabase
      .channel('transit_notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transit_notifications', 
          filter: `receiver_id=eq.${userId}` 
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchNotifications, userId]);

  const togglePanel = () => setIsPanelOpen(prev => !prev);

  const handleNotificationClick = async (transitId) => {
    if (!transitId) return;

    try {
      const { error } = await supabase
        .from("transit_notifications")
        .update({ seen: true })
        .eq("transit_id", transitId)
        .eq("receiver_id", userId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.transit_id === transitId ? { ...n, seen: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      setIsPanelOpen(false);

      setTimeout(() => {
        navigate(`/transit/notification/${transitId}`);
      }, 300);
    } catch (error) {
      console.error("Update error:", error.message);
    }
  };

  const calculateTimeElapsed = (timestamp) => {
    if (!timestamp) return "Date inconnue";
    const now = new Date();
    const postDate = new Date(timestamp);
    const timeDiff = now - postDate;
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const months = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 365));
    if (minutes < 60) return `il y a ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    if (hours < 24) return `il y a ${hours} heure${hours !== 1 ? "s" : ""}`;
    if (days < 30) return `il y a ${days} jour${days !== 1 ? "s" : ""}`;
    if (months < 12) return `il y a ${months} mois`;
    return `il y a ${years} an${years !== 1 ? "s" : ""}`;
  };

  return (
    <header className="header">
      <div className="logo-container">
        <img src="/DzXport.png" alt="Logo" className="logo" />
      </div>
      <div className="notification-container" onClick={togglePanel}>
        <i className={`bi ${unreadCount > 0 ? "bi-bell-fill" : "bi-bell"}`}></i>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </div>

      <div className={`notification-panel ${isPanelOpen ? "open" : ""}`}>
        <div className="panel-header">
          <h3>Notifications</h3>
          <button className="close-btn" onClick={togglePanel}>×</button>
        </div>
        <div className="notification-list">
          {loading ? (
            <p>Chargement...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.seen ? "seen" : ""}`}
                onClick={() => handleNotificationClick(notification.transit_id)}
              >
                <div className="notification-rows">
                  <div className="icon-bg">
                    <i className="bi bi-megaphone-fill"></i>
                  </div>
                  <div className="nt-container">
                    <div className="nt-row">
                      Proposition de{" "}
                      <p>{notification.users?.username || "inconnu"}</p>
                    </div>
                    <p>
                      pour <strong>{notification.transits?.title || "inconnu"}</strong>                    </p>
                  </div>
                </div>
                <span>{calculateTimeElapsed(notification.created_at)}</span>
              </div>
            ))
          ) : (
            <p className="no-notifications">Aucune notification</p>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;