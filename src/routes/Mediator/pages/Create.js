import React, { useState } from "react";
import { supabase } from "../../../utils/supabaseClient";
import NavBar from "../components/NavBar";
import "./Create.css";

const Create = () => {
  const [formData, setFormData] = useState({
    name: "",
    from: "",
    to: "",
    quantity: "",
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
        .from("containers")
        .insert([{ ...formData, user_id: userId }]);

      if (error) throw error;

      alert("Container created successfully!");
      setFormData({ name: "", from: "", to: "", quantity: "" }); // Reset form
    } catch (error) {
      console.error("Error creating container:", error.message);
    }
  };

  return (
    <div className="AddContainer">
      <form className="container-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Container Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter container name"
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
        <div className="form-group">
          <label htmlFor="quantity">Container Capacity (Kg)</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Enter container capacity"
            required
          />
        </div>
        <button type="submit" className="submit-button">Create Container</button>
      </form>
      <NavBar />
    </div>
  );
};

export default Create;
