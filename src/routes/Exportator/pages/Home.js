import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import NavBar from "../components/NavBar";
import "./Home.css";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [expandedCardIndex, setExpandedCardIndex] = useState(null); // Track which card is expanded

  const fetchPosts = async () => {
    try {
      const userId = localStorage.getItem("id");
      if (!userId) {
        console.error("No user ID found. Please log in.");
        return;
      }

      // Fetch posts and order by created_at descending
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }); // Sort by newest first

      if (error) throw error;
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error.message);
    }
  };

  const calculateTimeElapsed = (timestamp) => {
    const now = new Date(); // Current time
    const postDate = new Date(timestamp); // Post creation time
    const timeDiff = now - postDate; // Difference in milliseconds

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

  const toggleDetails = (index) => {
    setExpandedCardIndex(index === expandedCardIndex ? null : index);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosts((prevPosts) => [...prevPosts]);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="Home">
      <div className="list">
        {posts.map((post, index) => (
          <div key={index} className="post">
            <h1>{post.product}</h1>
            <p>
              Quantity: <span>{post.quantity} Kg</span>
            </p>
            <p>
              From: <span>{post.from}</span> To: <span>{post.to}</span>
            </p>
            <div className="time">
              <i className="bi bi-clock-history"></i>
              <p>{calculateTimeElapsed(post.created_at)}</p>
            </div>
            <button
              className={`details-button ${
                post.ready ? "enabled" : "disabled"
              }`}
              onClick={() => post.ready && toggleDetails(index)}
              disabled={!post.ready}
            >
              {post.ready ? "View Details" : "Pending"}
            </button>
            {expandedCardIndex === index && post.ready && (
              <div className="details">
                <p>
                  <strong>Email: </strong>
                  <a href={`mailto:${post.mediator_email}`}>
                    {post.mediator_email}
                  </a>
                </p>
                <p>
                  <strong>Phone: </strong>
                  <a href={`tel:${post.mediator_phone}`}>
                    {post.mediator_phone}
                  </a>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      <NavBar />
    </div>
  );
};

export default Home;
