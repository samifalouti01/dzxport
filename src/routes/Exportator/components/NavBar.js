import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import "./NavBar.css";

const NavBar = () => {
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    from: "",
    quantity: "",
    unity: "",
    quantityValue: "", // Stocke la valeur de la quantité
    lists: "vendre",
    imageFile: null,
  });
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);
  const touchStartY = useRef(0);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "unity") {
      setShowInput(value !== ""); // Affiche l'input si une unité est sélectionnée
      setFormData({ ...formData, unity: value, quantity: "" });
    } else if (name === "quantityValue") {
      setFormData({ ...formData, quantity: value });
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
          quantity: formData.quantity, // Stocke la valeur saisie
          unity: formData.unity, // Stocke l'unité sélectionnée
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
      quantityValue: "",
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

  return (
    <>
      <nav className="navbar">
        <Link
            to="/exportator"
            className={`nav-item ${location.pathname === "/exportator" ? "active" : ""}`}
        >
            <i className={`bi ${location.pathname === "/exportator" ? "bi-house-door-fill" : "bi-house"} nav-icon`}></i>
            <span className="nav-text">Home</span>
        </Link>

        <button className="nav-item add-post" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-square nav-icon"></i>
            <span className="nav-text">Add Post</span>
        </button>

        <Link
            to="/exportator/profile"
            className={`nav-item ${location.pathname === "/exportator/profile" ? "active" : ""}`}
        >
            <i className={`bi ${location.pathname === "/exportator/profile" ? "bi-person-fill" : "bi-person"} nav-icon`}></i>
            <span className="nav-text">Profile</span>
        </Link>
      </nav>

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
                  name="quantityValue"
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
    </>
  );
};

export default NavBar;
