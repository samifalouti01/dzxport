import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import "./NavBar.css";

const NavBar = () => {
  const location = useLocation();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
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
      console.error("Erreur lors de l'ajout d'offre :", error.message);
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

  return (
    <>
      <nav className="navbar">
        <Link
          to="/transit"
          className={`nav-item ${location.pathname === "/transit" ? "active" : ""}`}
        >
          <i className={`bi ${location.pathname === "/transit" ? "bi-house-door-fill" : "bi-house"} nav-icon`}></i>
          <span className="nav-text">Home</span>
        </Link>

        <Link
          to="/transit/my-offers"
          className={`nav-item ${location.pathname === "/transit/my-offers" ? "active" : ""}`}
        >
          <i className={`bi ${location.pathname === "/transit/my-offers" ? "bi bi-clipboard-check-fill" : "bi bi-clipboard-check"} nav-icon`}></i>
          <span className="nav-text">Mes offres</span>
        </Link>

        <Link
          to="/transit/profile"
          className={`nav-item ${location.pathname === "/transit/profile" ? "active" : ""}`}
        >
          <i className={`bi ${location.pathname === "/transit/profile" ? "bi-person-fill" : "bi-person"} nav-icon`}></i>
          <span className="nav-text">Profile</span>
        </Link>
      </nav>
    </>
  );
};

export default NavBar;