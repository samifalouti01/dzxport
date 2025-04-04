import { useState, useRef, useEffect } from "react";
import NavBar from "../components/NavBar";
import { supabase } from "../../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Posts.css";

const Posts = () => {
  const [showModal, setShowModal] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    from: "",
    quantity: "",
    unity: "",
    lists: "vendre",
    imageFile: null,
  });
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);
  const touchStartY = useRef(0);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("id");
    if (userId) {
      const fetchPosts = async () => {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching posts:", error.message);
        } else {
          setPosts(data);
        }
      };

      fetchPosts();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "unity") {
      setShowInput(value !== "");
      setFormData({ ...formData, unity: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = async () => {
    if (!formData.imageFile) return null;

    const file = formData.imageFile;
    const filePath = `products/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("products")
      .upload(filePath, file);

    if (error) {
      console.error("Image upload error:", error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(filePath);
    return publicUrlData.publicUrl;
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

      const imageUrl = await handleImageUpload();
      const { data, error } = await supabase.from("posts").insert([
        {
          product: formData.product,
          from: formData.from,
          quantity: formData.quantity,
          unity: formData.unity,
          lists: formData.lists,
          image: imageUrl || null,
          user_id: userId,
        },
      ]);

      if (error) throw error;

      alert("Post ajouté avec succès !");
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
      product: "",
      from: "",
      quantity: "",
      unity: "",
      lists: "vendre",
      imageFile: null,
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
    setFilteredPosts(posts);
  }, [posts]);

  const filterPosts = () => {
    let filtered = posts;
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

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsImageOpen(true);
  };

  const handleCloseImage = (e) => {
    if (e.target.classList.contains("image-popup")) {
      setIsImageOpen(false);
    }
  };

  return (
    <div>
      <div className="list">
        <h1>Vos publications</h1>
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
              <button className="edit-button" onClick={() => navigate(`/main/edit-post/${post.id}`)}>
                <i className="bi bi-pencil"></i> Edit
              </button>
            </div>
          ))
        ) : (
          <p className="no-results">Aucun résultat trouvé</p>
        )}
        {isImageOpen && selectedImage && (
          <div className="image-popup" onClick={handleCloseImage}>
            <img src={selectedImage} alt="Agrandie" className="popup-image" />
          </div>
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
              ×
            </button>
            <h2>Ajouter un Post</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="product"
                placeholder="Produit"
                value={formData.product}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="from"
                placeholder="Pays d'origine"
                value={formData.from}
                onChange={handleChange}
                required
              />

              {/* Sélection de l'unité */}
              <select name="unity" value={formData.unity} onChange={handleChange} required>
                <option value="">Sélectionner une unité...</option>
                <option value="Kg">Kg</option>
                <option value="Unité">Unité</option>
              </select>

              {/* Champ quantité visible uniquement si une unité est choisie */}
              {showInput && (
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantité"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              )}

              <select name="lists" value={formData.lists} onChange={handleChange} required>
                <option value="vendre">Vendre</option>
                <option value="acheter">Acheter</option>
              </select>

              <label style={{ width: "100%", display: "flex", alignItems: "flex-start" }}>Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, imageFile: e.target.files[0] })}
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
  );
};

export default Posts;