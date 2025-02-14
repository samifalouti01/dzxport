import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const userId = localStorage.getItem("id");

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, post_id, seen, created_at, posts(product)")
        .eq("receiver_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur lors de la récupération des notifications :", error.message);
      } else {
        setNotifications(data);
      }
    };

    fetchNotifications();
  }, [userId]);

  const markAsRead = async (notificationId) => {
    await supabase
      .from("notifications")
      .update({ seen: true })
      .eq("id", notificationId);

    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, seen: true } : n
    ));
  };

  return (
    <div className="notifications-page">
      <h1>Notifications</h1>
      {notifications.length === 0 ? (
        <p>Aucune notification.</p>
      ) : (
        notifications.map((notif) => (
          <div key={notif.id} className={`notification ${notif.seen ? "read" : "unread"}`} onClick={() => markAsRead(notif.id)}>
            <p>Nouvelle proposition pour {notif.posts?.product}</p>
            <span>{new Date(notif.created_at).toLocaleString()}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default Notifications;
