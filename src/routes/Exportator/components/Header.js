import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import "./Header.css";

const Header = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const navigate = useNavigate();
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
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.seen).length);
      }
    };

    fetchNotifications();
  }, [userId]);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleNotificationClick = async (postId) => {
    const { error } = await supabase
      .from("notifications")
      .update({ seen: true })
      .eq("post_id", postId);
  
    if (error) {
      console.error("Erreur lors de la mise à jour de la notification :", error.message);
      return;
    }
  
    // Ferme le panneau
    setIsPanelOpen(false);
  
    // Ajoute un petit délai pour éviter un conflit avec le re-render de React
    setTimeout(() => {
      navigate(`/exportator/notification/${postId}`);
    }, 300); // 300ms pour laisser le panneau se fermer proprement
  };  

  const calculateTimeElapsed = (timestamp) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const timeDiff = now - postDate;

    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const months = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 365));

    if (minutes < 60) {
      return `il y a ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    } else if (hours < 24) {
      return `il y a ${hours} heure${hours !== 1 ? "s" : ""}`;
    } else if (days < 30) {
      return `il y a ${days} jour${days !== 1 ? "s" : ""}`;
    } else if (months < 12) {
      return `il y a ${months} mois`;
    } else {
      return `il y a ${years} an${years !== 1 ? "s" : ""}`;
    }
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

      {/* Notification Panel */}
      <div className={`notification-panel ${isPanelOpen ? "open" : ""}`}>
        <div className="panel-header">
          <h3>Notifications</h3>
          <button className="close-btn" onClick={togglePanel}>×</button>
        </div>
        <div className="notification-list">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.seen ? "seen" : ""}`}
                onClick={() => handleNotificationClick(notification.post_id)}
              >
                <div className="notification-row">
                  {notification.posts?.image && (
                    <img
                      src={notification.posts.image}
                      alt={notification.posts.product}
                      className="post-image"
                    />
                  )}
                  <p>
                    Nouvelle proposition pour{" "}
                    <strong>{notification.posts?.product || "un post inconnu"}</strong>
                  </p>
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
