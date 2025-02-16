import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import "./Notifications.css";

const AcceptedPreview = () => {
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
        // Fetch post data
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
  
        // Fetch proposal data (if exists)
        const { data: proposalData, error: proposalError } = await supabase
          .from("proposals")
          .select("owner_id")
          .eq("post_id", postId)
          .maybeSingle();
  
        console.log("Proposal Data:", proposalData);
        console.log("Proposal Error:", proposalError);
  
        if (proposalError) {
          console.error("Erreur lors de la récupération du owner_id :", proposalError.message);
        } else if (proposalData && proposalData.owner_id) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("username, phone, email, role, country")
            .eq("id", proposalData.owner_id)
            .single();
  
          console.log("User Data:", userData);
          console.log("User Error:", userError);
  
          if (userError) {
            console.error("Erreur lors de la récupération de l'expéditeur :", userError.message);
          } else {
            senderData = userData;
          }
        }
  
        // Fetch owner data (if post has a user_id)
        if (postData?.user_id) {
          const { data: ownerUserData, error: ownerError } = await supabase
            .from("users")
            .select("username, phone, email, role, country")
            .eq("id", postData.user_id)
            .single();
  
          console.log("Owner User Data:", ownerUserData);
          console.log("Owner User Error:", ownerError);
  
          if (ownerError) {
            console.error("Erreur lors de la récupération du propriétaire du post :", ownerError.message);
          } else {
            ownerData = ownerUserData;
          }
        }
  
        // Set user state based on sender or owner data
        if (senderData) {
          setUser(senderData);
        } else if (ownerData) {
          setUser(ownerData);
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
          <h3>Informations de le propriétaire</h3>
          <p><strong>Nom d'utilisateur :</strong> {user.username || "Inconnu"}</p>
          <p><strong>Téléphone :</strong> {user.phone || "Non spécifié"}</p>
          <p><strong>Email :</strong> {user.email || "Non spécifié"}</p>
          <p><strong>Country :</strong> {user.country || "Non spécifié"}</p>
        </div>
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

export default AcceptedPreview;
