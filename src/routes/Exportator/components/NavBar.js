import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import "./NavBar.css";

const NavBar = () => {
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    from: "",
    quantity: "",
    lists: "vendre",
    imageFile: null,
  });
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);
  const touchStartY = useRef(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
  
    // Get the public URL from Supabase
    const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(filePath);
  
    return publicUrlData.publicUrl; // Correctly returning the public URL
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
          lists: formData.lists,
          image: imageUrl || null,
          user_id: userId,
        },
      ]);

      if (error) throw error;

      alert("Post added successfully!");
      closeModal();
    } catch (error) {
      console.error("Error adding post:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      product: "",
      from: "",
      quantity: "",
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

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const touchEndY = e.touches[0].clientY;
    if (touchEndY - touchStartY.current > 50) {
      closeModal();
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link
          to="/exportator"
          className={`nav-item ${location.pathname === "/exportator" ? "active" : ""}`}
        >
          <i className="bi bi-house nav-icon"></i>
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
          <i className="bi bi-person nav-icon"></i>
          <span className="nav-text">Profile</span>
        </Link>
      </nav>

      {showModal && (
        <div className="modal-overlay">
          <div
            className="modal slide-in"
            ref={modalRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
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
              <input
                type="number"
                name="quantity"
                placeholder="Quantité en Kg"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
              <select name="lists" value={formData.lists} onChange={handleChange}>
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
