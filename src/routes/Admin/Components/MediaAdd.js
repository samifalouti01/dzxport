// MediaAdd.js
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import './Media.css';

const MediaAdd = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [text, setText] = useState("");

  const handleAddPost = async () => {
    if (!imageUrl || !text) return alert("Please fill in all fields");

    const { data, error } = await supabase.from('posts').insert([
      { image_url: imageUrl, text: text, user_id: 1 } // Replace with admin's user_id
    ]);
    if (error) console.error(error);
    else alert("Post added successfully");
  };

  return (
    <div className="media-add">
      <h2>Add New Post</h2>
      <input
        type="text"
        placeholder="Image URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <textarea
        placeholder="Post text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handleAddPost}>Add Post</button>
    </div>
  );
};

export default MediaAdd;
