import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import "./Header.css";

const Header = () => {
  const [postNotifications, setPostNotifications] = useState([]);
  const [transitNotifications, setTransitNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("id");
  const [acceptedTransitIds, setAcceptedTransitIds] = useState(new Set());

  // Fetch post notifications
  const fetchPostNotifications = async () => {
    try {
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

      if (error) throw error;
      console.log("Post notifications:", data);
      setPostNotifications(data || []);
    } catch (err) {
      console.error("Error fetching post notifications:", err.message);
      setError(`Post notifications: ${err.message}`);
    }
  };

  // Fetch transit notifications where userId is the sender_id
  const fetchTransitNotifications = async () => {
    try {
      // Step 1: Fetch accepted transit_ids from transit_proposals
      const { data: acceptedProposals, error: proposalError } = await supabase
        .from("transit_proposals")
        .select("transit_id")
        .eq("sender_id", userId)
        .eq("status", "accepted");
  
      if (proposalError) throw proposalError;
  
      const acceptedTransitIds = new Set(acceptedProposals.map(p => p.transit_id));
  
      // Step 2: Fetch transit_notifications and filter by accepted transit_ids
      const { data: notifications, error: notificationError } = await supabase
        .from("transit_notifications")
        .select(`
          id,
          created_at,
          seen,
          transit_id,
          sender_id,
          transits(id, title, price, to, from)
        `)
        .eq("sender_id", userId)
        .order("created_at", { ascending: false });
  
      if (notificationError) throw notificationError;
  
      // Filter notifications to only include those with accepted transit_ids
      const filteredNotifications = notifications.filter(notification =>
        acceptedTransitIds.has(notification.transit_id)
      );
  
      console.log("Filtered transit notifications (accepted only):", filteredNotifications);
      setTransitNotifications(filteredNotifications || []);
    } catch (err) {
      console.error("Error fetching transit notifications:", err.message);
      setError(prev => (prev ? `${prev}; Transit notifications: ${err.message}` : `Transit notifications: ${err.message}`));
    }
  };

  // Update unread count
  const updateUnreadCount = () => {
    const totalUnread = [
      ...postNotifications.filter(n => !n.seen),
      ...transitNotifications.filter(n => !n.seen),
    ].length;
    setUnreadCount(totalUnread);
  };

  useEffect(() => {
    if (!userId) {
      setError("No user ID found in localStorage");
      return;
    }
  
    // Initial fetch
    fetchPostNotifications();
    fetchTransitNotifications();
    fetchAcceptedProposals();
  
    // Real-time subscription for transit_proposals
    const proposalSubscription = supabase
      .channel("transit_proposals")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transit_proposals",
          filter: `status=eq.accepted`, // Only listen for 'accepted' updates
        },
        async (payload) => {
          const { new: updatedProposal } = payload;
          const { transit_id, sender_id, owner_id } = updatedProposal;
  
          if (sender_id === userId) {
            setAcceptedTransitIds(prev => new Set(prev).add(transit_id));
            fetchTransitNotifications(); // Re-fetch with 'accepted' filter
          }
  
          // Insert notification for the owner
          const { error } = await supabase
            .from("transit_notifications")
            .insert({
              receiver_id: owner_id,
              transit_id: transit_id,
              sender_id: sender_id,
              seen: false,
              created_at: new Date().toISOString(),
            });
  
          if (error) {
            console.error("Insert error:", error.message);
          }
        }
      )
      .subscribe();
  
    // Real-time subscription for post notifications
    const postSubscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          console.log("Post notification update");
          fetchPostNotifications();
        }
      )
      .subscribe();
  
    // Real-time subscription for transit_notifications
    const transitSubscription = supabase
      .channel("transit_notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transit_notifications",
          filter: `sender_id=eq.${userId}`,
        },
        () => {
          console.log("Transit notification update");
          fetchTransitNotifications(); // Re-fetch with 'accepted' filter
        }
      )
      .subscribe();
  
    return () => {
      proposalSubscription.unsubscribe();
      postSubscription.unsubscribe();
      transitSubscription.unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    updateUnreadCount();
  }, [postNotifications, transitNotifications]);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleNotificationClick = async (notification) => {
    const { type, post_id, transit_id, id } = notification;
  
    try {
      if (type === "post" && post_id) {
        const { data: proposalData, error: proposalError } = await supabase
          .from("proposals")
          .select("id")
          .eq("post_id", post_id)
          .limit(1); // Get the first proposal (or adjust logic as needed)
        if (proposalError) throw proposalError;
  
        const proposalId = proposalData[0]?.id;
        const { error } = await supabase
          .from("notifications")
          .update({ seen: true })
          .eq("post_id", post_id);
        if (error) throw error;
        setPostNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, seen: true } : n))
        );
        navigate(`/main/notification/${post_id}/${proposalId}`);
      } else if (type === "transit" && transit_id) {
        const { data: proposalData, error: proposalError } = await supabase
          .from("transit_proposals")
          .select("id")
          .eq("transit_id", transit_id)
          .limit(1); // Get the first proposal (or adjust logic)
        if (proposalError) throw proposalError;
  
        const proposalId = proposalData[0]?.id;
        const { error } = await supabase
          .from("transit_notifications")
          .update({ seen: true })
          .eq("transit_id", transit_id)
          .eq("sender_id", userId);
        if (error) throw error;
        setTransitNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, seen: true } : n))
        );
        navigate(`/main/notifications/${transit_id}/${proposalId}`);
      }
      setIsPanelOpen(false);
    } catch (error) {
      console.error("Update error:", error.message);
    }
  };

  // Fetch initially accepted transit proposals
  const fetchAcceptedProposals = async () => {
    try {
      const { data, error } = await supabase
        .from("transit_proposals")
        .select("transit_id")
        .eq("status", "accepted")
        .eq("sender_id", userId);

      if (error) throw error;
      console.log("Initially accepted transit IDs:", data);
      setAcceptedTransitIds(new Set(data.map(item => item.transit_id)));
    } catch (err) {
      console.error("Error fetching accepted proposals:", err.message);
      setError(prev => (prev ? `${prev}; Accepted proposals: ${err.message}` : `Accepted proposals: ${err.message}`));
    }
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
          {error && <p className="error">{error}</p>}

          {/* Post Notifications Section */}
          <div className="notification-section">
            <h4>Notifications des Posts</h4>
            {postNotifications.length > 0 ? (
              postNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.seen ? "seen" : ""}`}
                  onClick={() => handleNotificationClick({ ...notification, type: "post" })}
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
              <p className="no-notifications">Aucune notification de posts</p>
            )}
          </div>

          {/* Transit Notifications Section */}
          <div className="notification-section">
            <h4>Notifications des Transits</h4>
            {transitNotifications.length > 0 ? (
              transitNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.seen ? "seen" : ""}`}
                  onClick={() => handleNotificationClick({ ...notification, type: "transit" })}
                >
                  <div className="notification-row">
                    <p>
                      Proposition pour transit{" "}
                      <strong>{notification.transits?.title || "un transit inconnu"}</strong>
                      <p> a été accepté!</p>
                    </p>
                  </div>
                  <span>{calculateTimeElapsed(notification.created_at)}</span>
                </div>
              ))
            ) : (
              <p className="no-notifications">Aucune notification de transits</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;