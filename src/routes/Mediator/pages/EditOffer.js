import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import NavBar from "../components/NavBar";
import "./EditOffer.css";

const EditOffer = () => {
    const { offerId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
      title: "",
      from: "",
      to: "",
      price: "",
    });
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false); 
  
    useEffect(() => {
      const fetchOffer = async () => {
        const { data, error } = await supabase
          .from("transits")
          .select("*")
          .eq("id", offerId)
          .single();
  
        if (error) {
          console.error("Error fetching post:", error.message);
        } else {
          setFormData({
            title: data.title,
            from: data.from,
            to: data.to,
            price: data.price,
          });
        }
      };
  
      fetchOffer();
    }, [offerId]);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
  
      try {  
        const { error } = await supabase
          .from("transits")
          .update({
            title: formData.title,
            from: formData.from,
            to: formData.to,
            price: formData.price,
          })
          .eq("id", offerId);
  
        if (error) throw error;
  
        alert("Offre modifié avec succès !");
        navigate("/transit/my-offers");
      } catch (error) {
        console.error("Erreur lors de la modification :", error.message);
      } finally {
        setLoading(false);
      }
    };
  
    const handleDelete = async () => {
      const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer cette offre ?");
      if (!confirmDelete) return;
  
      setDeleting(true);
      try {
        const { error } = await supabase.from("transits").delete().eq("id", offerId);
  
        if (error) throw error;
  
        alert("Offre supprimé avec succès !");
        navigate("/transit/my-offers");
      } catch (error) {
        console.error("Erreur lors de la suppression :", error.message);
      } finally {
        setDeleting(false);
      }
    };
  
    const handleBack = () => {
      navigate(-1); // Retourner à la page précédente
    };
  
    return (
      <>
        <div className="edit-post-container">
          <button onClick={handleBack} className="bck">
              <i className="bi bi-chevron-left"></i> Modifier l'offre <span>{formData.title || "Produit Inconnu"}</span>
          </button>
          <form onSubmit={handleSubmit}>
            <label>Titre:</label>
            <input
              type="text"
              name="title"
              placeholder="Titre"
              value={formData.title}
              onChange={handleChange}
              required
            />
            <label>De:</label>
            <input
              type="text"
              name="from"
              placeholder="De..."
              value={formData.from}
              onChange={handleChange}
              required
            />
            <label>A:</label>
            <input
              type="text"
              name="to"
              placeholder="A..."
              value={formData.to}
              onChange={handleChange}
              required
            />
            <label>Prix:</label>
            <input
              type="number"
              name="price"
              placeholder="Prix"
              value={formData.price}
              onChange={handleChange}
              required
            />
            <div className="btns">
              <button type="submit" className="smb-button" disabled={loading}>
                  <i className="bi bi-floppy2-fill"></i> {loading ? "Modification en cours..." : "Modifier"}
              </button>
              <button type="button" onClick={handleDelete} className="delete-button" disabled={deleting}>
                  <i className="bi bi-trash"></i> {deleting ? "Suppression en cours..." : "Supprimer"}
              </button>
            </div>
          </form>
          <NavBar />
        </div>
      </>
    );
  };
  
  export default EditOffer;