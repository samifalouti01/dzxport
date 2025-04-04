import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import "./Notifications.css";

const AcceptedPreview = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [owner, setOwner] = useState(null);
  const [sender, setSender] = useState(null);
  const [currentUser, setCurrentUser] = useState({ id: null, country: null });
  const [shippingSent, setShippingSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isOwnerView, setIsOwnerView] = useState(false); // Track if user is owner or sender

  // Fetch post data
  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, created_at, user_id, product, image, from, quantity, unity, lists")
      .eq("id", postId)
      .single();
    if (error) throw new Error(`Post fetch error: ${error.message}`);
    return data;
  };

  // Fetch user data
  const fetchUser = async (userId) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, phone, email, role, country")
      .eq("id", userId)
      .single();
    if (error) throw new Error(`User fetch error: ${error.message}`);
    return data;
  };

  // Fetch accepted proposal and determine user role
  const fetchProposal = async (userId) => {
    // Try as sender first
    let { data: senderProposal, error: senderError } = await supabase
      .from("proposals")
      .select("sender_id, owner_id, status")
      .eq("post_id", postId)
      .eq("sender_id", userId)
      .eq("status", "accepted")
      .single();

    if (senderProposal) {
      setIsOwnerView(false);
      return senderProposal;
    } else if (senderError && senderError.code !== "PGRST116") {
      throw new Error(`Sender proposal fetch error: ${senderError.message}`);
    }

    // Try as owner
    let { data: ownerProposal, error: ownerError } = await supabase
      .from("proposals")
      .select("sender_id, owner_id, status")
      .eq("post_id", postId)
      .eq("owner_id", userId)
      .eq("status", "accepted")
      .single();

    if (ownerProposal) {
      setIsOwnerView(true);
      return ownerProposal; // Fixed: Removed erroneous 'return usual'
    } else if (ownerError && ownerError.code !== "PGRST116") {
      throw new Error(`Owner proposal fetch error: ${ownerError.message}`);
    }

    throw new Error("No accepted proposal found for this user");
  };

  // Fetch current user
  const fetchCurrentUser = async () => {
    const userId = localStorage.getItem("id");
    if (!userId) throw new Error("Please log in to view this page");
    const { data, error } = await supabase
      .from("users")
      .select("id, country")
      .eq("id", userId)
      .single();
    if (error) throw new Error(`Current user fetch error: ${error.message}`);
    return { id: data.id, country: data.country };
  };

  // Check shipping status
  const checkShippingStatus = async (userId) => {
    if (!userId) return false;
    const { data, error } = await supabase
      .from("ship_posts")
      .select("id")
      .eq("post_id", postId)
      .eq("sender_id", userId)
      .maybeSingle();
    if (error) throw new Error(`Shipping status error: ${error.message}`);
    return !!data;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const currentUserData = await fetchCurrentUser();
        const postData = await fetchPost();
        if (!postData) throw new Error("No post data found");

        const proposalData = await fetchProposal(currentUserData.id);
        const ownerData = await fetchUser(proposalData.owner_id);
        const senderData = await fetchUser(proposalData.sender_id);
        const shippingStatus = await checkShippingStatus(currentUserData.id);

        setPost(postData);
        setOwner(ownerData);
        setSender(senderData);
        setCurrentUser(currentUserData);
        setShippingSent(shippingStatus);
      } catch (err) {
        console.error("Error loading data:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (postId) loadData();
  }, [postId]);

  const handleCreateShippingOffer = async () => {
    if (!post || !currentUser.id || !currentUser.country) return;

    const shippingOffer = {
      post_id: post.id,
      user_id: post.user_id,
      product: post.product,
      from: post.from,
      to: currentUser.country,
      quantity: post.quantity,
      unity: post.unity,
      image: post.image || null,
      sender_id: currentUser.id,
    };

    try {
      const { data, error } = await supabase
        .from("ship_posts")
        .insert(shippingOffer)
        .select();
      if (error) throw new Error(`Shipping offer error: ${error.message}`);
      alert("Shipping offer created successfully!");
      setShippingSent(true);
    } catch (err) {
      console.error(err.message);
      alert("Failed to create shipping offer");
    }
  };

  const handleBack = () => navigate(-1);
  const handleImageClick = () => setIsImageOpen(true);
  const handleCloseImage = (e) => {
    if (e.target.classList.contains("image-popup")) setIsImageOpen(false);
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (error) return <p className="error">Error: {error}</p>;
  if (!post) return <p className="error">No post found</p>;

  return (
    <div className="alert-container1">
      <button onClick={handleBack} className="backButton">
        <i className="bi bi-chevron-left"></i> {post.product || "Unknown"}
      </button>

      <div className="alert-card">
        {post.image && (
          <img
            src={post.image}
            alt={post.product}
            className="alert-image"
            onClick={handleImageClick}
            onError={(e) => {
              console.log("Image failed to load:", post.image);
              e.target.style.display = "none";
            }}
          />
        )}
        <div className="alert-info">
          <h3 className="alert-title">Product: {post.product || "Unknown"}</h3>
          <p className="alert-detail">
            Quantity: <span>{post.quantity || "Not specified"} {post.unity}</span>
          </p>
          <p className="alert-detail">
            From: <span>{post.from || "Anonymous"}</span>
          </p>
          <p className="alert-detail">
            Posted on: <span>{new Date(post.created_at).toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* Display user info based on role */}
      {isOwnerView && sender ? (
        <div className="user-info">
          <h3>Sender Information</h3>
          <p><strong>Username:</strong> {sender.username || "Unknown"}</p>
          <p><strong>Phone:</strong> {sender.phone || "Not specified"}</p>
          <p><strong>Email:</strong> {sender.email || "Not specified"}</p>
          <p><strong>Country:</strong> {sender.country || "Not specified"}</p>
        </div>
      ) : !isOwnerView && owner ? (
        <div className="user-info">
          <h3>Owner Information</h3>
          <p><strong>Username:</strong> {owner.username || "Unknown"}</p>
          <p><strong>Phone:</strong> {owner.phone || "Not specified"}</p>
          <p><strong>Email:</strong> {owner.email || "Not specified"}</p>
          <p><strong>Country:</strong> {owner.country || "Not specified"}</p>
        </div>
      ) : (
        <p className="error">User information not available</p>
      )}

      {/* Shipping offer section */}
      <div className="ship-container">
        <button
          className="shipping-offer-btn"
          onClick={handleCreateShippingOffer}
          disabled={shippingSent || !isOwnerView}
        >
          {shippingSent
            ? "Shipping Offer Sent"
            : isOwnerView
            ? "Create Shipping Offer"
            : "Shipping Offer (Owner Only)"}
        </button>
        {!isOwnerView && (
          <p className="info-text"></p>
        )}
        {isOwnerView && !shippingSent && (
          <p className="info-text"></p>
        )}
      </div>

      {isImageOpen && (
        <div className="image-popup" onClick={handleCloseImage}>
          <img src={post.image} alt="Enlarged" className="popup-image" />
        </div>
      )}
    </div>
  );
};

export default AcceptedPreview;