import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";

const Notifications = () => {
  const { transitId } = useParams();
  const [transit, setTransit] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const navigate = useNavigate();
  const [proposalStatus, setProposalStatus] = useState(null);

  useEffect(() => {
    const fetchTransitAndUsers = async () => {
      if (!transitId) return;

      try {
        // Fetch transit data
        const { data: transitData, error: transitError } = await supabase
          .from("transits")
          .select("id, title, price, to, from, created_at")
          .eq("id", transitId)
          .single();

        if (transitError) {
          console.error("Erreur lors de la récupération du transit :", transitError.message);
          setLoading(false);
          return;
        }

        setTransit(transitData);

        // Fetch sender data from transit_proposals (not transit_notifications)
        const { data: proposalData, error: proposalError } = await supabase
          .from("transit_proposals")
          .select("sender_id, owner_id")
          .eq("transit_id", transitId)
          .single();

        if (proposalError) {
          console.error("Erreur lors de la récupération de la proposition :", proposalError.message);
        } else if (proposalData?.sender_id) {
          const { data, error } = await supabase
            .from("users")
            .select("username, phone, email, role, country")
            .eq("id", proposalData.sender_id)
            .single();

          if (error) {
            console.error("Erreur lors de la récupération de l'expéditeur :", error.message);
          } else {
            setUser(data);
          }
        }
      } catch (err) {
        console.error("Erreur générale :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransitAndUsers();
  }, [transitId]);

  useEffect(() => {
    const fetchProposalStatus = async () => {
      if (!transitId) return;

      const { data, error } = await supabase
        .from("transit_proposals")
        .select("status")
        .eq("transit_id", transitId)
        .single();

      if (error) {
        console.error("Erreur lors de la récupération du statut :", error.message);
      } else {
        setProposalStatus(data?.status || "pending");
      }
    };

    fetchProposalStatus();
  }, [transitId]);

  if (loading) {
    return <p className="loading">Chargement...</p>;
  }

  if (!transit) {
    return <p className="error">Aucun transit trouvé</p>;
  }

  const handleBack = () => {
    navigate(-1);
  };

  const handleImageClick = () => {
    setIsImageOpen(true);
  };

  const handleCloseImage = (e) => {
    if (e.target.classList.contains("image-popup")) {
      setIsImageOpen(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!transitId) return;

    const { error } = await supabase
      .from("transit_proposals")
      .update({ status: newStatus })
      .eq("transit_id", transitId);

    if (error) {
      console.error("Erreur lors de la mise à jour du statut :", error.message);
    } else {
      setProposalStatus(newStatus);
      // Optionally update the notification's seen status
      await supabase
        .from("transit_notifications")
        .update({ seen: true })
        .eq("transit_id", transitId);
    }
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div className="alert-container">
      <button onClick={handleBack} className="backButton">
        <i className="bi bi-chevron-left"></i> {transit.title || "Inconnu"}
      </button>
      <div className="alert-card">
        {transit.image && (
          <img
            src={transit.image}
            alt={transit.title}
            className="alert-image"
            onClick={handleImageClick}
          />
        )}
        <div className="alert-info">
          <h3 className="alert-title">Titre : {transit.title || "Inconnu"}</h3>
          <p className="alert-detail">
            Prix : <span>{transit.price || "Non spécifié"}</span>
          </p>
          <p className="alert-detail">
            De : <span>{transit.from || "Inconnu"}</span>
          </p>
          <p className="alert-detail">
            À : <span>{transit.to || "Inconnu"}</span>
          </p>
          <p className="alert-detail">
            Créé le : <span>{new Date(transit.created_at).toLocaleString()}</span>
          </p>
        </div>
      </div>

      {user && (
        <div className="user-info">
          <h3>Informations de l'utilisateur</h3>
          <p>
            <strong>Nom d'utilisateur :</strong> {user.username || "Inconnu"}
          </p>
          <p>
            <strong>Téléphone :</strong> {user.phone || "Non spécifié"}
          </p>
          <p>
            <strong>Email :</strong> {user.email || "Non spécifié"}
          </p>
          <p>
            <strong>Pays :</strong> {user.country || "Non spécifié"}
          </p>
        </div>
      )}

      {console.log("proposalStatus before rendering:", proposalStatus)}
      {proposalStatus === "pending" ? (
        <div className="btns">
          <button
            className="refuse-button"
            onClick={() => handleStatusUpdate("refused")}
          >
            <i className="bi bi-x"></i> Refuser
          </button>
          <button
            className="accept-button"
            onClick={() => handleStatusUpdate("accepted")}
          >
            <i className="bi bi-check"></i> Accorder
          </button>
        </div>
      ) : (
        <p className="status-message">{capitalizeFirstLetter(proposalStatus)}</p>
      )}

      {isImageOpen && transit.image && (
        <div className="image-popup" onClick={handleCloseImage}>
          <img src={transit.image} alt="Agrandie" className="popup-image" />
        </div>
      )}
    </div>
  );
};

export default Notifications;