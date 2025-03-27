import { useState, useRef, useEffect } from "react";
import NavBar from "../components/NavBar";
import { supabase } from "../../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./MyOffers.css";

const MyOffers = () => {
    const [showModal, setShowModal] = useState(false);
    const [showInput, setShowInput] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        from: "",
        to: "",
        price: "",
    });
    const [loading, setLoading] = useState(false);
    const modalRef = useRef(null);
    const touchStartY = useRef(0);
    const [offers, setOffers] = useState([]);
    const [filteredOffers, setFilteredOffers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem("id");
        if (userId) {
            const fetchOffers = async () => {
                const userId = localStorage.getItem("id");
                if (!userId) return;
            
                const { data, error } = await supabase
                    .from("transits")
                    .select("*")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false });
            
                if (error) {
                    console.error("Error fetching posts:", error.message);
                } else {
                    setOffers(data);
                }
            };
    
            fetchOffers();
        }
    }, []);    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
      }; 
    
      const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        try {
          const userId = localStorage.getItem("id");
          if (!userId) {
            alert("No user ID found. Please log in.");
            return;
          }
    
          const { data, error } = await supabase.from("transits").insert([
            {
              title: formData.title,
              from: formData.from,
              to: formData.to,
              price: formData.price,
              user_id: userId,
            },
          ]);
    
          if (error) throw error;
    
          alert("Offre ajouté avec succès !");
          closeModal();
        } catch (error) {
          console.error("Erreur lors de l'ajout du post :", error.message);
        } finally {
          setLoading(false);
        }
      };
    
      const closeModal = () => {
        setShowModal(false);
        setShowInput(false);
        setFormData({
          title: "",
          from: "",
          to: "",
          price: "",
        });
      };
    
      useEffect(() => {
        const handleClickOutside = (event) => {
          if (modalRef.current && !modalRef.current.contains(event.target)) {
            closeModal();
          }
        };
    
        if (showModal) {
          setTimeout(() => {
            document.querySelector(".modal").classList.add("slide-in");
          }, 30);
          document.addEventListener("mousedown", handleClickOutside);
        }
    
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [showModal]);
    
      useEffect(() => {
        setFilteredOffers(offers); 
    }, [offers]);    

    const filterPosts = () => {
        let filtered = offers; 
        setFilteredOffers(filtered);
    };    
      
      const calculateTimeElapsed = (timestamp) => {
          const now = new Date();
          const offerDate = new Date(timestamp);
          const timeDiff = now - offerDate;
          
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
      
    return (
        <div>
            <div className="list">
                <h1>Vos offres</h1>
                {filteredOffers.length > 0 ? (
                    filteredOffers.map((offer, index) => (
                    <div key={index} className="post">
                        <div className="time">
                            <h1>{offer.title}</h1>
                            <p>{calculateTimeElapsed(offer.created_at)}</p>
                        </div>
                        <p>
                            De: <span>{offer.from}</span> | À: <span>{offer.to}</span>
                        </p>
                        <p>
                            Prix: <span>{offer.price} DZD</span>
                        </p>
                            <button className="edit-button" onClick={() => navigate(`/transit/edit-offer/${offer.id}`)}>
                                <i className="bi bi-pencil"></i> Edit
                            </button>
                    </div>            
                    ))
                    ) : (
                    <p className="no-results">Aucun résultat trouvé</p>
                    )}
                </div>
                <div className="add-post-b">
                    <button className="add-post" onClick={() => setShowModal(true)}>
                        <i className="bi bi-plus nav-icon"></i>
                    </button>
                </div>
                {showModal && (
                <div className="modal-overlay">
                    <div
                        className="modal slide-in"
                        ref={modalRef}
                        onTouchStart={(e) => (touchStartY.current = e.touches[0].clientY)}
                        onTouchMove={(e) => {
                        if (e.touches[0].clientY - touchStartY.current > 50) closeModal();
                        }}
                    >
                        <button className="close-button" onClick={closeModal}>
                        &times;
                        </button>
                        <h2>Ajouter une Offre</h2>
                        <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="title"
                            placeholder="Titre de l'offre"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="text"
                            name="from"
                            placeholder="De..."
                            value={formData.from}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="text"
                            name="to"
                            placeholder="À..."
                            value={formData.to}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="number"
                            name="price"
                            placeholder="Prix"
                            value={formData.price}
                            onChange={handleChange}
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? "Ajout en cours..." : "Ajouter"}
                        </button>
                        </form>
                    </div>
                </div>
            )}
            <NavBar />
        </div>
    )
};

export default MyOffers;