import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import "./Notifications.css";

const Notifications = () => {
  const { postId } = useParams(); 
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImageOpen, setIsImageOpen] = useState(false); // État pour afficher l'image
  const navigate = useNavigate();
  const [proposalStatus, setProposalStatus] = useState(null);

  useEffect(() => {
    const fetchPostAndUsers = async () => {
      if (!postId) return;
  
      try {
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("id, created_at, user_id, product, image, from, quantity, unity")
          .eq("id", postId)
          .single();
  
        if (postError) {
          console.error("Erreur lors de la récupération du post :", postError.message);
          setLoading(false);
          return;
        }
  
        setPost(postData);
  
        let senderData = null;
        let ownerData = null;
  
        // Récupérer l'expéditeur (sender_id) depuis la table proposals
        const { data: proposalData, error: proposalError } = await supabase
          .from("proposals")
          .select("sender_id")
          .eq("post_id", postId)
          .single();
  
        if (proposalError) {
          console.error("Erreur lors de la récupération du sender_id :", proposalError.message);
        } else if (proposalData?.sender_id) {
          const { data, error } = await supabase
            .from("users")
            .select("username, phone, email, role, country")
            .eq("id", proposalData.sender_id)
            .single();
  
          if (error) {
            console.error("Erreur lors de la récupération de l'expéditeur :", error.message);
          } else {
            senderData = data;
          }
        }
  
        // Récupérer le propriétaire du post (user_id)
        if (postData?.user_id) {
          const { data, error } = await supabase
            .from("users")
            .select("username, phone, email, role, country")
            .eq("id", postData.user_id)
            .single();
  
          if (error) {
            console.error("Erreur lors de la récupération du propriétaire du post :", error.message);
          } else {
            ownerData = data;
          }
        }
  
        // Afficher uniquement les informations de l'expéditeur
        if (senderData) {
          setUser(senderData);
        } else if (ownerData) {
          setUser(ownerData); // Si pas de sender, afficher le propriétaire du post
        }
      } catch (err) {
        console.error("Erreur générale :", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchPostAndUsers();
  }, [postId]);  

  useEffect(() => {
    const fetchProposalStatus = async () => {
      if (!postId) return;
  
      const { data, error } = await supabase
        .from("proposals")
        .select("status")
        .eq("post_id", postId)
        .single();
  
      if (error) {
        console.error("Erreur lors de la récupération du statut :", error.message);
      } else {
        setProposalStatus(data?.status);
      }
    };
  
    fetchProposalStatus();
  }, [postId]);

  if (loading) {
    return <p className="loading">Chargement...</p>;
  }

  if (!post) {
    return <p className="error">Aucun post trouvé</p>;
  }

  const handleBack = () => {
    navigate(-1); // Retourner à la page précédente
  };

  // Fonction pour afficher l'image en grand
  const handleImageClick = () => {
    setIsImageOpen(true);
  };

  // Fonction pour fermer l'image si on clique en dehors
  const handleCloseImage = (e) => {
    if (e.target.classList.contains("image-popup")) {
      setIsImageOpen(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!postId) return;
  
    const { error } = await supabase
      .from("proposals")
      .update({ status: newStatus })
      .eq("post_id", postId);
  
    if (error) {
      console.error("Erreur lors de la mise à jour du statut :", error.message);
    } else {
      console.log("Status updated to:", newStatus);
      
      // Force React to update the UI immediately
      setProposalStatus(newStatus);
    }
  };
  
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div className="alert-container">
      <button onClick={handleBack} className="backButton">
        <i className="bi bi-chevron-left"></i> {post.product || "Inconnu"}
      </button>
      <div className="alert-card">
        {post.image && (
          <img
            src={post.image}
            alt={post.product}
            className="alert-image"
            onClick={handleImageClick} // Ouvre l'image en grand
          />
        )}
        <div className="alert-info">
          <h3 className="alert-title">Produit : {post.product || "Inconnu"}</h3>
          <p className="alert-detail">Quantité : <span>{post.quantity || "Non spécifié"} {post.unity}</span></p>
          <p className="alert-detail">De : <span>{post.from || "Anonyme"}</span></p>
          <p className="alert-detail">Posté le : <span>{new Date(post.created_at).toLocaleString()}</span></p>
        </div>
      </div>

      {user && (
        <div className="user-info">
          <h3>Informations de l'utilisateur</h3>
          <p><strong>Nom d'utilisateur :</strong> {user.username || "Inconnu"}</p>
          <p><strong>Téléphone :</strong> {user.phone || "Non spécifié"}</p>
          <p><strong>Email :</strong> {user.email || "Non spécifié"}</p>
          <p><strong>Country :</strong> {user.country || "Non spécifié"}</p>
        </div>
      )}

        {console.log("proposalStatus before rendering:", proposalStatus)}
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
        <p className="status-message">{capitalizeFirstLetter(proposalStatus)}</p>
        )}

      {/* Affichage de la pop-up si l'image est ouverte */}
      {isImageOpen && (
        <div className="image-popup" onClick={handleCloseImage}>
          <img src={post.image} alt="Agrandie" className="popup-image" />
        </div>
      )}
    </div>
  );
};

export default Notifications;
