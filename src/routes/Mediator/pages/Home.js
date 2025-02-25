import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import NavBar from "../components/NavBar";

const Home = () => {
  const [shipPosts, setShipPosts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [proposalStatuses, setProposalStatuses] = useState({});

  useEffect(() => {
    const fetchShipPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("ship_posts")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setShipPosts(data || []);
      } catch (error) {
        console.error("Error fetching shipping posts:", error.message);
      }
    };

    fetchShipPosts();
  }, []);

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsImageOpen(true);
  };

  const handleCloseImage = (e) => {
    if (e.target.classList.contains("image-popup")) {
      setIsImageOpen(false);
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

  const sendProposal = (post) => {
    console.log("Sending proposal for:", post);
    // Implémenter la logique d'envoi d'une proposition
  };

  return (
    <div className="Home">
      <div className="list">
        {shipPosts.length > 0 ? (
          shipPosts.map((post, index) => (
            <div key={index} className="post">
              {post.image && (
                <img onClick={() => handleImageClick(post.image)} src={post.image} alt={post.product} />
              )}
              <div className="time">
                <h1>{post.product}</h1>
                <p>{calculateTimeElapsed(post.created_at)}</p>
              </div>
              <p>
                Quantité: <span>{post.quantity} {post.unity}</span>
              </p>
              <p>
                De: <span>{post.from} à: {post.to || "Non spécifié"}</span>
              </p>
              {proposalStatuses[post.id] ? (
                <p style={{ color: "white" }} className={`proposal-status ${proposalStatuses[post.id]}`}>
                  {proposalStatuses[post.id] === "pending" ? "En attente" : capitalizeFirstLetter(proposalStatuses[post.id])}
                </p>
              ) : (
                <button className="proposal-button" onClick={() => sendProposal(post)}>
                  Envoyer une proposition
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="no-results">Aucun résultat trouvé</p>
        )}
      </div>

      {isImageOpen && selectedImage && (
        <div className="image-popup" onClick={handleCloseImage}>
          <img src={selectedImage} alt="Agrandie" className="popup-image" />
        </div>
      )}

      <NavBar />
    </div>
  );
};

export default Home;
