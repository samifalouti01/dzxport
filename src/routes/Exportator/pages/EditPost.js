import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import NavBar from "../components/NavBar";
import "./EditPost.css";

const EditPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    product: "",
    from: "",
    quantity: "",
    unity: "",
    lists: "vendre",
    imageFile: null,
    imageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false); // State for delete button loading

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) {
        console.error("Error fetching post:", error.message);
      } else {
        setFormData({
          product: data.product,
          from: data.from,
          quantity: data.quantity,
          unity: data.unity,
          lists: data.lists,
          imageUrl: data.image,
        });
      }
    };

    fetchPost();
  }, [postId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = async () => {
    if (!formData.imageFile) return formData.imageUrl;

    const file = formData.imageFile;
    const filePath = `products/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("products")
      .upload(filePath, file);

    if (error) {
      console.error("Image upload error:", error.message);
      return formData.imageUrl;
    }

    const { data: publicUrlData } = supabase.storage
      .from("products")
      .getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const imageUrl = await handleImageUpload();

      const { error } = await supabase
        .from("posts")
        .update({
          product: formData.product,
          from: formData.from,
          quantity: formData.quantity,
          unity: formData.unity,
          lists: formData.lists,
          image: imageUrl,
        })
        .eq("id", postId);

      if (error) throw error;

      alert("Post modifié avec succès !");
      navigate("/main/posts");
    } catch (error) {
      console.error("Erreur lors de la modification :", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer ce post ?");
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) throw error;

      alert("Post supprimé avec succès !");
      navigate("/main/posts");
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
            <i className="bi bi-chevron-left"></i> Modifier le Post <span>{formData.product || "Produit Inconnu"}</span>
        </button>
        {formData.imageUrl && <img src={formData.imageUrl} alt="Post" className="preview-image" />}
        <form onSubmit={handleSubmit}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, imageFile: e.target.files[0] })}
          />
          <label>Nom du produit:</label>
          <input
            type="text"
            name="product"
            placeholder="Produit"
            value={formData.product}
            onChange={handleChange}
            required
          />
          <label>Pays d'origine:</label>
          <input
            type="text"
            name="from"
            placeholder="Pays d'origine"
            value={formData.from}
            onChange={handleChange}
            required
          />
          <label>Type d'unité:</label>
          <select name="unity" value={formData.unity} onChange={handleChange} required>
            <option value="Kg">Kg</option>
            <option value="Unité">Unité</option>
          </select>
          <label>Quantité:</label>
          <input
            type="number"
            name="quantity"
            placeholder="Quantité"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
          <label>Catégorie:</label>
          <select name="lists" value={formData.lists} onChange={handleChange} required>
            <option value="vendre">Vendre</option>
            <option value="acheter">Acheter</option>
          </select>
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

export default EditPost;
