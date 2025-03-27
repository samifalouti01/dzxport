import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import NavBar from "../components/NavBar";
import { useQuery } from "@tanstack/react-query";
import "./Home.css";

const fetchPosts = async () => {
  try {
    const userId = localStorage.getItem("id");

    if (!userId) {
      console.error("No user ID found in localStorage.");
      return [];
    }

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .neq("user_id", userId) // Exclude posts where user_id matches localStorage ID
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error fetching posts:", error.message);
    return [];
  }
};

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState("vendre"); // Default to "Vendre"
  const [selectedCountry, setSelectedCountry] = useState("");
  const uniqueLocations = [...new Set(posts.map(post => post.from || post.to))].sort();
  const [searchTerm, setSearchTerm] = useState("");
  const [proposalStatuses, setProposalStatuses] = useState({});
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { data: fetchedPosts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
    staleTime: 60000, // Cache pour 1 minute
  });   

  useEffect(() => {
    setPosts(fetchedPosts);
    fetchProposalStatuses(fetchedPosts);
  }, [fetchedPosts]);

  useEffect(() => {
    filterPosts();
  }, [posts, activeFilter, selectedCountry, searchTerm]);

  const filterPosts = () => {
    let filtered = posts.filter((post) => post.lists === activeFilter);

    if (selectedCountry) {
      filtered = filtered.filter((post) => post.from.toLowerCase() === selectedCountry.toLowerCase());
    }

    if (searchTerm) {
      filtered = filtered.filter((post) =>
        post.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.quantity.toString().includes(searchTerm)
      );
    }

    setFilteredPosts(filtered);
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

  const fetchProposalStatuses = async (posts) => {
    const senderId = localStorage.getItem("id");
    if (!senderId) return;

    const postIds = posts.map((post) => post.id);
    const { data, error } = await supabase
      .from("proposals")
      .select("post_id, status")
      .in("post_id", postIds)
      .eq("sender_id", senderId);

    if (error) {
      console.error("Erreur lors de la récupération des statuts :", error.message);
      return;
    }

    const statuses = {};
    data.forEach((proposal) => {
      statuses[proposal.post_id] = proposal.status;
    });

    setProposalStatuses(statuses);
  };

  const sendProposal = async (post) => {
    const senderId = localStorage.getItem("id");
    if (!senderId) {
      alert("Vous devez être connecté pour envoyer une proposition.");
      return;
    }

    const { data, error } = await supabase.from("proposals").insert([
      {
        post_id: post.id,
        sender_id: senderId,
        owner_id: post.user_id,
        status: "pending",
      },
    ]).select("status").single();

    if (error) {
      console.error("Erreur lors de l'envoi de la proposition :", error.message);
    } else {
      alert("Proposition envoyée avec succès !");
      setProposalStatuses((prev) => ({
        ...prev,
        [post.id]: data.status,
      }));
      sendNotification(post.user_id, post.id);
    }
  };
  
  const sendNotification = async (receiverId, postId) => {
    const { error } = await supabase.from("notifications").insert([
      {
        receiver_id: receiverId,
        post_id: postId,
      },
    ]);
  
    if (error) {
      console.error("Erreur lors de l'envoi de la notification :", error.message);
    }
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsImageOpen(true);
  };  

  // Fonction pour fermer l'image si on clique en dehors
  const handleCloseImage = (e) => {
    if (e.target.classList.contains("image-popup")) {
      setIsImageOpen(false);
    }
  };

  return (
    <div className="Home">
        {/* Buttons for filtering "Vendre" & "Acheter" */}
        <div className="container">
          <div className="lists-buttons">
            <button
              className={activeFilter === "vendre" ? "active" : ""}
              onClick={() => setActiveFilter("vendre")}
            >
              <i className="bi bi-arrow-down"></i>
              Pour Import
            </button>
            <button
              className={activeFilter === "acheter" ? "active" : ""}
              onClick={() => setActiveFilter("acheter")}
            >
              <i className="bi bi-arrow-up"></i>
              Pour Export
            </button>
          </div>
          {/* Filter Options */}
          <div className="list-header">
            <select
              value={selectedCountry || ''}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">Pays</option>
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Recherche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      <div className="list">

        {/* Posts List */}
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <div key={index} className="post">
              <img onClick={() => handleImageClick(post.image)} src={post.image} alt={post.title} />
              <div className="time">
                <h1>{post.product}</h1>
                <p>{calculateTimeElapsed(post.created_at)}</p>
              </div>
              <p>
                Quantité: <span>{post.quantity} {post.unity}</span>
              </p>
              <p>
                De: <span>{post.from}</span>
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
