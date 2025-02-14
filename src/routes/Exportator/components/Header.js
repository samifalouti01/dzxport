import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";
import "./Header.css";

const Header = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const userId = localStorage.getItem("id");

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          created_at,
          seen,
          post_id,
          posts!notifications_post_id_fkey(id, product, image, from, quantity)
        `)
        .eq("receiver_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur lors de la récupération des notifications :", error.message);
      } else {
        console.log("Notifications Data:", data); // Debugging
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.seen).length);
      }
    };

    fetchNotifications();
  }, [userId]);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <header className="header">
      <div className="logo-container">
        <img src="/DzXport.png" alt="Logo" className="logo" />
      </div>
      <div className="notification-container" onClick={togglePanel}>
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </div>

      {/* Notification Panel */}
      <div className={`notification-panel ${isPanelOpen ? "open" : ""}`}>
        <div className="panel-header">
          <h3>Notifications</h3>
          <button className="close-btn" onClick={togglePanel}>×</button>
        </div>
        <div className="notification-list">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div key={notification.id} className="notification-item">
                <p>
                  Nouvelle proposition pour{" "}
                  <strong>{notification.posts?.product || "un post inconnu"}</strong>
                </p>
                <p>Quantité: {notification.posts?.quantity}</p>
                <p>De: {notification.posts?.from}</p>
                {notification.posts?.image && (
                  <img
                    src={notification.posts.image}
                    alt={notification.posts.product}
                    className="post-image"
                  />
                )}
                <span className="time">{new Date(notification.created_at).toLocaleString()}</span>
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
