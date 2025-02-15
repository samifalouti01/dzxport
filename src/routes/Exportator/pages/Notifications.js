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

  useEffect(() => {
    const fetchPostAndUser = async () => {
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
  
        if (postData?.user_id) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("username, phone, email, role, plan")
            .eq("id", postData.user_id)
            .single();
  
          if (userError) {
            console.error("Erreur lors de la récupération de l'utilisateur :", userError.message);
          } else {
            setUser(userData);
          }
        }
      } catch (err) {
        console.error("Erreur générale :", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchPostAndUser();
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
        <i className="bi bi-chevron-left"></i> Retour
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

export default Notifications;
