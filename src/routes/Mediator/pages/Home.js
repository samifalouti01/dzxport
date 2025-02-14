import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import NavBar from "../components/NavBar";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState("");

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error.message);
    }
  };

  const fetchContainers = async () => {
    try {
      const userId = localStorage.getItem("id");
      const { data, error } = await supabase
        .from("containers")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      setContainers(data);
    } catch (error) {
      console.error("Error fetching containers:", error.message);
    }
  };

  const handleAddToContainer = async (post) => {
    if (!selectedContainer) {
      alert("Please select a container.");
      return;
    }
  
    const container = containers.find(
      (container) => container.id === Number(selectedContainer)
    );
  
    if (!container) {
      console.error("Container not found.");
      return;
    }
  
    // Calculate the total quantity of items in the container
    const totalPostQuantity = container.post_quantity
      ? container.post_quantity
          .split(",")
          .reduce((acc, val) => acc + Number(val), 0)
      : 0;
  
    // Check if adding the new post exceeds the container's capacity
    if (totalPostQuantity + Number(post.quantity) > Number(container.quantity)) {
      alert("This container is full. Cannot add more posts.");
      return;
    }
  
    try {
      // Append new post data to the existing container data
      const updatedPostId = container.post_id
        ? `${container.post_id},${post.id}`
        : `${post.id}`;
      const updatedPostProduct = container.post_product
        ? `${container.post_product},${post.product}`
        : `${post.product}`;
      const updatedPostQuantity = container.post_quantity
        ? `${container.post_quantity},${post.quantity}`
        : `${post.quantity}`;
  
      // Update the container with the concatenated values
      const { error } = await supabase
        .from("containers")
        .update({
          post_id: updatedPostId,
          post_product: updatedPostProduct,
          post_quantity: updatedPostQuantity,
        })
        .eq("id", container.id);
  
      if (error) throw error;
  
      // Update the local containers state
      const updatedContainers = containers.map((c) =>
        c.id === container.id
          ? {
              ...c,
              post_id: updatedPostId,
              post_product: updatedPostProduct,
              post_quantity: updatedPostQuantity,
            }
          : c
      );
      setContainers(updatedContainers);
  
      alert("Post added to container successfully!");
    } catch (error) {
      console.error("Error adding post to container:", error.message);
    }
  };  

  useEffect(() => {
    fetchPosts();
    fetchContainers();
  }, []);

  return (
    <div className="Home">
      <div className="list">
        {posts.map((post) => (
          <div key={post.id} className="post">
            <h1>{post.product}</h1>
            <p>Quantity: <span>{post.quantity} Kg</span></p>
            <p>From: <span>{post.from}</span> To: <span>{post.to}</span></p>
            <select
              onChange={(e) => setSelectedContainer(e.target.value)}
              value={selectedContainer}
              required
            >
              <option value="">Select Container</option>
              {containers.map((container) => (
                <option key={container.id} value={container.id}>
                  {container.name} (Capacity: {container.quantity} Kg)
                </option>
              ))}
            </select>
            <button onClick={() => handleAddToContainer(post)}>
              Add to Container
            </button>
          </div>
        ))}
      </div>
      <NavBar />
    </div>
  );
};

export default Home;
