import React, { useState } from "react";
import { supabase } from "../../../supabaseClient";
import "./Post.css";

const Post = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select an image to upload.");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    setIsLoading(true);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("store_rec")
        .upload(fileName, file);

      if (uploadError) {
        setMessage(`Error uploading image: ${uploadError.message}`);
        setIsLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("store_rec")
        .getPublicUrl(fileName);

      if (!publicUrlData.publicUrl) {
        setMessage("Could not retrieve public URL for the image.");
        setIsLoading(false);
        return;
      }

      const publicUrl = publicUrlData.publicUrl;

      const payload = {
        title,
        description,
        price,
        product_image: publicUrl,
      };

      const { error: insertError } = await supabase
        .from("store")
        .insert([payload]);

      if (insertError) {
        setMessage(`Error inserting data: ${insertError.message}`);
      } else {
        setMessage("Post added successfully!");
        setTimeout(() => setMessage(""), 2000);
        // Clear the form after successful upload
        setTitle("");
        setDescription("");
        setPrice("");
        setFile(null);
        setPreview(null);
      }
    } catch (error) {
      setMessage("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile)); // Create a preview URL
    } else {
      setFile(null);
      setPreview(null); // Clear the preview if no file is selected
    }
  };

  return (
    <div className="post-container">
      <h1 style={{ color: "black"}}>Create New Post</h1>
      <input
        className="parrain-input"
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="parrain-input"
        type="text"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <textarea
        className="parrain-input"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <form className="dform">
        <span className="dform-title">Upload your file</span>
        <p className="dform-paragraph">File should be an image</p>
        <label htmlFor="file-input" className="drop-container">
          <span className="drop-title">Drop files here</span>
          or
          <input
            type="file"
            accept="image/*"
            required
            id="file-input"
            onChange={handleFileChange} // Use the new handler
            style={{ display: "none" }}
          />
        </label>
        {preview && (
          <div className="image-preview">
            <img
              src={preview}
              alt="Image Preview"
              style={{ maxWidth: "100%", marginTop: "10px" }}
            />
          </div>
        )}
      </form>
      <button
        className="button-primary"
        onClick={handleUpload}
        disabled={isLoading}
      >
        {isLoading ? <span className="spinner"></span> : "Upload"}
      </button>
      {message && <p style={{ color: "green"}}>{message}</p>}
    </div>
  );
};

export default Post;
