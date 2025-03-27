import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import "./Notifications.css";

const Notifications = () => {
  const { postId, transitId, proposalId } = useParams();
  const [post, setPost] = useState(null);
  const [transit, setTransit] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [proposalStatus, setProposalStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!postId && !transitId) return;

      try {
        let userData = null;

        if (postId && proposalId) {
          const { data: postData, error: postError } = await supabase
            .from("posts")
            .select("id, created_at, user_id, product, image, from, quantity, unity")
            .eq("id", postId)
            .single();

          if (postError) {
            console.error("Post fetch error:", postError.message);
            throw postError;
          }
          setPost(postData);

          const { data: proposalData, error: proposalError } = await supabase
            .from("proposals")
            .select("sender_id, status")
            .eq("id", proposalId)
            .single();

          if (proposalError) {
            console.error("Proposal fetch error for post:", proposalError.message);
          } else if (proposalData?.sender_id) {
            const { data, error } = await supabase
              .from("users")
              .select("username, phone, email, role, country")
              .eq("id", proposalData.sender_id)
              .single();

            if (error) {
              console.error("User fetch error for post sender:", error.message);
            } else {
              userData = data;
            }
            console.log("Post Proposal Data (ID:", proposalId, "):", proposalData);
            setProposalStatus(proposalData.status);
          }
        }

        if (transitId && proposalId) {
          const { data: transitData, error: transitError } = await supabase
            .from("transits")
            .select("id, created_at, user_id, title, price, to, from")
            .eq("id", transitId)
            .single();

          if (transitError) {
            console.error("Transit fetch error:", transitError.message);
            throw transitError;
          }
          setTransit(transitData);
          console.log("Transit Data:", transitData);

          const { data: proposalData, error: proposalError } = await supabase
            .from("transit_proposals")
            .select("sender_id, status")
            .eq("id", proposalId)
            .single();

          if (proposalError) {
            console.error("Proposal fetch error for transit:", proposalError.message);
          } else if (proposalData?.sender_id) {
            const { data, error } = await supabase
              .from("users")
              .select("username, phone, email, role, country")
              .eq("id", proposalData.sender_id)
              .single();

            if (error) {
              console.error("User fetch error for transit sender:", error.message);
            } else {
              userData = data;
            }
            console.log("Transit Proposal Data (ID:", proposalId, "):", proposalData);
            setProposalStatus(proposalData.status);
          }
        }

        setUser(userData);
      } catch (err) {
        console.error("General fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId, transitId, proposalId]);

  if (loading) {
    return <p className="loading">Chargement...</p>;
  }

  if (!post && !transit) {
    return <p className="error">Aucune donnée trouvée</p>;
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
    try {
      if (postId && proposalId) {
        const { error } = await supabase
          .from("proposals")
          .update({ status: newStatus })
          .eq("id", proposalId);

        if (error) throw error;

        // Re-fetch the specific proposal status
        const { data: updatedProposal, error: fetchError } = await supabase
          .from("proposals")
          .select("status")
          .eq("id", proposalId)
          .single();

        if (fetchError) throw fetchError;
        setProposalStatus(updatedProposal.status);
      } else if (transitId && proposalId) {
        const { error } = await supabase
          .from("transit_proposals")
          .update({ status: newStatus })
          .eq("id", proposalId);

        if (error) throw error;

        // Re-fetch the specific proposal status
        const { data: updatedProposal, error: fetchError } = await supabase
          .from("transit_proposals")
          .select("status")
          .eq("id", proposalId)
          .single();

        if (fetchError) throw fetchError;
        setProposalStatus(updatedProposal.status);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut :", error.message);
    }
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div className="alert-container">
      <button onClick={handleBack} className="backButton">
        <i className="bi bi-chevron-left"></i> {post?.product || transit?.title || "Inconnu"}
      </button>
      <div className="alert-card">
        {post ? (
          <>
            {post.image && (
              <img
                src={post.image}
                alt={post.product}
                className="alert-image"
                onClick={handleImageClick}
              />
            )}
            <div className="alert-info">
              <h3 className="alert-title">Produit : {post.product || "Inconnu"}</h3>
              <p className="alert-detail">Quantité : <span>{post.quantity || "Non spécifié"} {post.unity}</span></p>
              <p className="alert-detail">De : <span>{post.from || "Anonyme"}</span></p>
              <p className="alert-detail">Posté le : <span>{new Date(post.created_at).toLocaleString()}</span></p>
            </div>
          </>
        ) : transit ? (
          <div className="transit-info">
            <h3 className="transit-title">Transit : {transit.title || "Inconnu"}</h3>
            <div className="transit-details">
              <p><strong>Départ :</strong> {transit.from || "Inconnu"}</p>
              <p><strong>Arrivée :</strong> {transit.to || "Inconnu"}</p>
              <p><strong>Prix :</strong> {transit.price ? `${transit.price} DZD / KG` : "Non spécifié"}</p>
              <p><strong>Date de création :</strong> {new Date(transit.created_at).toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <p className="error">Erreur : Données non chargées</p>
        )}
      </div>

      {user ? (
        <div className="user-info">
          <h3>{post ? "Expéditeur de la Proposition" : "Expéditeur de la Proposition de Transit"}</h3>
          <p><strong>Nom d'utilisateur :</strong> {user.username || "Inconnu"}</p>
          <p><strong>Téléphone :</strong> {user.phone || "Non spécifié"}</p>
          <p><strong>Email :</strong> {user.email || "Non spécifié"}</p>
          <p><strong>Pays :</strong> {user.country || "Non spécifié"}</p>
        </div>
      ) : (
        <p>Utilisateur non trouvé</p>
      )}

      {proposalStatus === "pending" ? (
        <div className="btns">
          <button className="refuse-button" onClick={() => handleStatusUpdate("refused")}>
            <i className="bi bi-x"></i> Refuser
          </button>
          <button className="accept-button" onClick={() => handleStatusUpdate("accepted")}>
            <i className="bi bi-check"></i> Accorder
          </button>
        </div>
      ) : (
        <p className="status-message">{capitalizeFirstLetter(proposalStatus || "Inconnu")}</p>
      )}

      {isImageOpen && post?.image && (
        <div className="image-popup" onClick={handleCloseImage}>
          <img src={post.image} alt="Agrandie" className="popup-image" />
        </div>
      )}
    </div>
  );
};

export default Notifications;