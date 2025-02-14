import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import NavBar from "../components/NavBar";

const Containers = () => {
  const [containers, setContainers] = useState([]);

  const fetchContainers = async () => {
    try {
      const userId = localStorage.getItem("id");
      if (!userId) {
        console.error("No user ID found. Please log in.");
        return;
      }

      // Fetch posts and order by created_at descending
      const { data, error } = await supabase
        .from("containers")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }); // Sort by newest first

      if (error) throw error;
      setContainers(data);
    } catch (error) {
      console.error("Error fetching posts:", error.message);
    }
  };

  const calculateTimeElapsed = (timestamp) => {
    const now = new Date(); // Current time
    const containerDate = new Date(timestamp); // Post creation time
    const timeDiff = now - containerDate; // Difference in milliseconds

    const minutes = Math.floor(timeDiff / (1000 * 60)); // Convert to minutes
    const hours = Math.floor(timeDiff / (1000 * 60 * 60)); // Convert to hours
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
    const months = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30)); // Convert to months
    const years = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 365)); // Convert to years

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else if (days < 30) {
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    } else if (months < 12) {
      return `${months} month${months !== 1 ? "s" : ""} ago`;
    } else {
      return `${years} year${years !== 1 ? "s" : ""} ago`;
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setContainers((prevContainers) => [...prevContainers]); 
    }, 60000); 

    return () => clearInterval(interval); 
  }, []);

  const calculateProgress = (postQuantity, containerQuantity) => {
    const totalQuantity = parseInt(containerQuantity, 10);
  
    // Calculate the sum of post quantities
    const currentQuantity = postQuantity
      ? postQuantity.split(",").reduce((acc, val) => acc + Number(val), 0)
      : 0;
  
    // Calculate progress percentage
    const progress = (currentQuantity / totalQuantity) * 100;
  
    return Math.min(progress, 100); // Ensure the value does not exceed 100%
  };

  const countEqualDigits = (postId) => {
    if (!postId) return 0;
  
    const numbers = postId.split(',').map(num => num.trim());
    return numbers.filter(num => {
      const digits = new Set(num.split(''));
      return digits.size === 1;
    }).length;
  };

  const sumNumbers = (postQuantity) => {
    if (!postQuantity) return 0;
  
    const numbers = postQuantity.split(',').map(num => parseInt(num.trim(), 10));
    return numbers.reduce((acc, num) => acc + num, 0);
  };  
  
  const markContainerReady = async (container) => {
    try {
      if (!container.post_id) {
        console.error("No post IDs found for this container.");
        return;
      }
  
      // Extract post IDs from the container's post_id column
      const postIds = container.post_id.split(",").map((id) => id.trim());
  
      // Fetch mediator email and phone from container or user
      const mediatorEmail = container.mediator_email || "default-email@example.com"; // Replace with actual logic
      const mediatorPhone = container.mediator_phone || "1234567890"; // Replace with actual logic
  
      // Update the posts table
      const { error: postError } = await supabase
        .from("posts")
        .update({
          ready: true,
          mediator_email: mediatorEmail,
          mediator_phone: mediatorPhone,
        })
        .in("id", postIds);
  
      if (postError) throw postError;
  
      // Update the containers table for this container
      const { error: containerError } = await supabase
        .from("containers")
        .update({ ready: true })
        .eq("id", container.id);
  
      if (containerError) throw containerError;
  
      // Update UI to reflect the changes
      setContainers((prevContainers) =>
        prevContainers.map((c) =>
          c.id === container.id ? { ...c, ready: true } : c
        )
      );
  
      alert(`Container ${container.name} is marked as ready, and posts updated!`);
    } catch (error) {
      console.error("Error marking container as ready:", error.message);
    }
  };
  
  
  return (
    <div className="Containers">
      <div className="list">
        {containers.map((container, index) => (
          <div key={index} className="container">
            <h1>{container.name}</h1>
            <p>
              Capacity: <span>{container.quantity} Kg</span>
            </p>
            <p>
              From: <span>{container.from}</span> To: <span>{container.to}</span>
            </p>
            <p>Posts: <span>{container.post_id ? countEqualDigits(container.post_id) : "No posts yet"}</span></p>
            <p>Quantity: <span>{container.post_quantity ? sumNumbers(container.post_quantity) : "0"} Kg</span></p>
            <div className="progress">
              <div
                className="progress-bar"
                role="progressbar"
                style={{
                  width: `${calculateProgress(container.post_quantity, container.quantity)}%`,
                }}
                aria-valuenow={calculateProgress(container.post_quantity, container.quantity)}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {Math.round(calculateProgress(container.post_quantity, container.quantity))}%
              </div>
            </div>
            <div className="time">
              <i className="bi bi-clock-history"></i>
              <p>{calculateTimeElapsed(container.created_at)}</p>
            </div>
            <button
              className="ready-button"
              onClick={() => markContainerReady(container)}
              disabled={container.ready} // Disable if already marked as ready
            >
              {container.ready ? "Already Ready" : "Mark as Ready"}
            </button>
          </div>
        ))}
      </div>
      <NavBar />
    </div>
  );  
};

export default Containers;
