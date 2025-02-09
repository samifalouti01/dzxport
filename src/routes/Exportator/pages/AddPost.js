import React, { useState } from "react";
import { supabase } from "../../../utils/supabaseClient";
import NavBar from "../components/NavBar";
import "./AddPost.css";

const AddPost = () => {
  const [formData, setFormData] = useState({
    product: "",
    quantity: "",
    from: "",
    to: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem("id");
      if (!userId) {
        console.error("No user ID found. Please log in.");
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .insert([{ ...formData, user_id: userId }]);

      if (error) throw error;

      alert("Post added successfully!");
      setFormData({ product: "", quantity: "", from: "", to: "" }); // Reset form
    } catch (error) {
      console.error("Error adding post:", error.message);
    }
  };

  return (
    <div className="AddPost">
      <form className="post-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="product">Product</label>
          <input
            type="text"
            id="product"
            name="product"
            value={formData.product}
            onChange={handleChange}
            placeholder="Enter product name"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="quantity">Quantity (Kg)</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Enter quantity"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="from">From</label>
          <input
            type="text"
            id="from"
            name="from"
            value={formData.from}
            onChange={handleChange}
            placeholder="Enter origin"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="to">To</label>
          <input
            type="text"
            id="to"
            name="to"
            value={formData.to}
            onChange={handleChange}
            placeholder="Enter destination"
            required
          />
        </div>
        <button type="submit" className="submit-button">Add Post</button>
      </form>
      <NavBar />
    </div>
  );
};

export default AddPost;
