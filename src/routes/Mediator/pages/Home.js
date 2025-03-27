import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import NavBar from "../components/NavBar";
import "./Home.css";

const Home = () => {
  const [shipPosts, setShipPosts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [proposalStatuses, setProposalStatuses] = useState({});
  const [minQuantity, setMinQuantity] = useState(null);
  const [maxQuantity, setMaxQuantity] = useState(null);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const uniqueFromLocations = [...new Set(shipPosts.map(post => post.from))].sort();
  const uniqueToLocations = [...new Set(shipPosts.map(post => post.to))].sort();

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
    // Implement proposal sending logic here
  };

  const filteredPosts = shipPosts.filter((post) => {
    // Quantity filtering
    const quantity = parseFloat(post.quantity) || 0;
    const min = minQuantity ? parseFloat(minQuantity) : -Infinity;
    const max = maxQuantity ? parseFloat(maxQuantity) : Infinity;
    const withinQuantityRange = quantity >= min && quantity <= max;

    // Location filtering (case-insensitive)
    const fromMatch = filterFrom 
      ? post.from.toLowerCase() === filterFrom.toLowerCase()
      : true;
    const toMatch = filterTo
      ? post.to.toLowerCase() === filterTo.toLowerCase()
      : true;

    return withinQuantityRange && fromMatch && toMatch;
  });

  return (
    <div className="Home">
      <div className="list">
        <div className="header-section">
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="bi bi-filter"></i>
            {showFilters ? 'Masquer filtres' : 'Filtres'}
          </button>
        </div>

        {showFilters && (
          <div className="filters">
            <div className="price-filter">
              <h5>Filtrer par quantité</h5>
              <input
                type="number"
                placeholder="Quantité minimum"
                value={minQuantity || ''}
                onChange={(e) => setMinQuantity(e.target.value)}
              />
              <input
                type="number"
                placeholder="Quantité maximum"
                value={maxQuantity || ''}
                onChange={(e) => setMaxQuantity(e.target.value)}
              />
            </div>
            
            <div className="location-filter">
              <h5>Filtrer par localisation</h5>
              <select
                value={filterFrom || ''}
                onChange={(e) => setFilterFrom(e.target.value)}
              >
                <option value="">Tous les départs</option>
                {uniqueFromLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              
              <select
                value={filterTo || ''}
                onChange={(e) => setFilterTo(e.target.value)}
              >
                <option value="">Toutes les destinations</option>
                {uniqueToLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
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
                De: <span>{post.from}</span> À: <span>{post.to || "Non spécifié"}</span>
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