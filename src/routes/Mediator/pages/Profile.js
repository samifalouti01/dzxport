import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import { Edit2, Save, X } from "lucide-react";
import { supabase } from "../../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

const SettingsField = ({ label, value, onSave, type = "text", placeholder = "" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  return (
    <div className="settings-field">
      <div className="settings-field-header">
        <span className="settings-field-label">{label}</span>
        {!isEditing ? (
          <button className="edit-button" onClick={() => setIsEditing(true)}>
            <Edit2 className="button-icon" />
          </button>
        ) : (
          <div className="button-group">
            <button className="save-button" onClick={handleSave}>
              <Save className="button-icon" />
            </button>
            <button className="cancel-button" onClick={handleCancel}>
              <X className="button-icon" />
            </button>
          </div>
        )}
      </div>
      {!isEditing ? (
        <p className="settings-field-value">
          {value || <span className="empty-value">Not set</span>}
        </p>
      ) : (
        <input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="settings-input"
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

const Profile = () => {
  const [userData, setUserData] = useState({
    email: "",
    phone: "",
    password: "",
    username: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("id");
    if (userId) {
      const fetchUserData = async () => {
        const { data, error } = await supabase
          .from("users")
          .select("email, phone, password, username")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
        } else {
          setUserData(data);
        }
      };
      fetchUserData();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleUpdate = async (field, value) => {
    const userId = localStorage.getItem("id");
    if (!userId) {
      console.error("No user ID found. Please log in.");
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ [field]: value })
        .eq("id", userId);

      if (error) {
        setMessage("Error updating details");
      } else {
        setMessage("Details updated successfully!");
        setUserData((prev) => ({ ...prev, [field]: value }));
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Update failed:", error);
      setMessage("Something went wrong while updating.");
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-card">
          <div className="settings-header">
            <h2 className="settings-title">Account Settings</h2>
          </div>
          <div className="settings-content">
            {message && <div className="message">{message}</div>}
            <SettingsField
              label="Username"
              value={userData.username}
              onSave={(value) => handleUpdate("username", value)}
            />
            <SettingsField
              label="Email"
              value={userData.email}
              onSave={(value) => handleUpdate("email", value)}
              type="email"
            />
            <SettingsField
              label="Phone"
              value={userData.phone}
              onSave={(value) => handleUpdate("phone", value)}
            />
            <SettingsField
              label="Password"
              value="********"
              onSave={(value) => handleUpdate("password", value)}
              type="password"
            />
          </div>
        </div>
      </div>
      <NavBar />
    </div>
  );
};

export default Profile;
