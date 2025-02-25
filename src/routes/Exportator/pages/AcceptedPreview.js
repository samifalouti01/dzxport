import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import "./Notifications.css";

const AcceptedPreview = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  const [state, setState] = useState({
    post: null,
    user: null,
    loading: true,
    isImageOpen: false,
    proposalStatus: null,
    currentUserCountry: null,
    senderId: null,
    shippingSent: false
  });

  // Helper function to update state
  const updateState = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Fetch post and users data
  useEffect(() => {
    const fetchPostAndUsers = async () => {
      if (!postId) {
        updateState({ loading: false });
        return;
      }

      try {
        // Fetch post data
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("id, created_at, user_id, product, image, from, quantity, unity, lists")
          .eq("id", postId)
          .single();

        if (postError) {
          console.error("Error fetching post:", postError.message);
          updateState({ loading: false });
          return;
        }

        // Fetch proposal data
        const { data: proposalData, error: proposalError } = await supabase
          .from("proposals")
          .select("owner_id, status")
          .eq("post_id", postId)
          .maybeSingle();

        if (proposalError) {
          console.error("Error fetching proposal:", proposalError.message);
        }

        // Fetch user data based on proposal or post
        const userId = proposalData?.owner_id || postData?.user_id;
        let userData = null;

        if (userId) {
          const { data: userInfo, error: userError } = await supabase
            .from("users")
            .select("username, phone, email, role")
            .eq("id", userId)
            .single();

          if (userError) {
            console.error("Error fetching user:", userError.message);
          } else {
            userData = userInfo;
          }
        }

        updateState({
          post: postData,
          user: userData,
          proposalStatus: proposalData?.status,
          loading: false
        });

      } catch (err) {
        console.error("General error:", err);
        updateState({ loading: false });
      }
    };

    fetchPostAndUsers();
  }, [postId]);

  // Fetch current user's country
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const userId = localStorage.getItem("id");
      if (!userId) return;

      const { data: userData, error } = await supabase
        .from("users")
        .select("id, country")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user country:", error.message);
      } else {
        updateState({ 
          currentUserCountry: userData.country,
          senderId: userData.id 
        });
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch shipping status
  useEffect(() => {
    const fetchShippingStatus = async () => {
      if (!postId || !state.senderId) return;
  
      const { data: shipData, error } = await supabase
        .from("ship_posts")
        .select("id")
        .eq("post_id", postId)
        .eq("sender_id", state.senderId)
        .maybeSingle();
  
      if (error) {
        console.error("Error fetching shipping status:", error.message);
      } else {
        updateState({ shippingSent: !!shipData });
      }
    };
  
    fetchShippingStatus();
  }, [postId, state.senderId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleImageClick = () => {
    updateState({ isImageOpen: true });
  };

  const handleCloseImage = (e) => {
    if (e.target.classList.contains("image-popup")) {
      updateState({ isImageOpen: false });
    }
  };

  const createShippingOffer = async () => {
    if (!state.post || !state.currentUserCountry) return;

    const { error } = await supabase
      .from("ship_posts")
      .insert([{
        post_id: state.post.id,
        user_id: state.post.user_id,
        product: state.post.product,
        from: state.post.from,
        to: state.currentUserCountry,
        quantity: state.post.quantity,
        unity: state.post.unity,
        image: state.post.image,
        sender_id: state.senderId
      }]);

    if (error) {
      console.error("Error creating shipping offer:", error.message);
    } else {
      alert("Shipping offer created successfully!");
      updateState({ shippingSent: true });
    }
  };

  if (state.loading) {
    return <p className="loading">Loading...</p>;
  }

  if (!state.post) {
    return <p className="error">No post found</p>;
  }

  return (
    <div className="alert-container">
      <button onClick={handleBack} className="backButton">
        <i className="bi bi-chevron-left"></i> {state.post.product || "Unknown"}
      </button>
      
      <div className="alert-card">
        {state.post.image && (
          <img
            src={state.post.image}
            alt={state.post.product}
            className="alert-image"
            onClick={handleImageClick}
          />
        )}
        
        <div className="alert-info">
          <h3 className="alert-title">Product: {state.post.product || "Unknown"}</h3>
          <p className="alert-detail">Quantity: <span>{state.post.quantity || "Not specified"} {state.post.unity}</span></p>
          <p className="alert-detail">From: <span>{state.post.from || "Anonymous"}</span></p>
          <p className="alert-detail">Posted on: <span>{new Date(state.post.created_at).toLocaleString()}</span></p>
        </div>
      </div>

      {state.user && (
        <div className="user-info">
          <h3>Owner Information</h3>
          <p><strong>Username:</strong> {state.user.username || "Unknown"}</p>
          <p><strong>Phone:</strong> {state.user.phone || "Not specified"}</p>
          <p><strong>Email:</strong> {state.user.email || "Not specified"}</p>
        </div>
      )}

      {state.post.lists === "acheter" && (
        <div className="ship-container">
          <button
            className="shipping-offer-btn"
            onClick={createShippingOffer}
            disabled={state.shippingSent}
          >
            {state.shippingSent ? "Sent" : "Create Shipping Offer"}
          </button>
        </div>
      )}

      {state.isImageOpen && (
        <div className="image-popup" onClick={handleCloseImage}>
          <img src={state.post.image} alt="Enlarged" className="popup-image" />
        </div>
      )}
    </div>
  );
};

export default AcceptedPreview;