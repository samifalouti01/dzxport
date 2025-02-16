import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import NavBar from "../components/NavBar";
import "./Accepter.css";

const Accepter = () => {
    const [acceptedPosts, setAcceptedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAcceptedPosts = async () => {
            const userId = localStorage.getItem("id");

            if (!userId) {
                console.error("❌ No user ID found in localStorage.");
                setLoading(false);
                return;
            }

            setLoading(true);

            const { data: proposals, error: proposalError } = await supabase
                .from("proposals")
                .select("post_id")
                .eq("sender_id", userId)
                .eq("status", "accepted");

            if (proposalError) {
                console.error("❌ Error fetching proposals:", proposalError.message);
                setLoading(false);
                return;
            }

            if (!proposals || proposals.length === 0) {
                setAcceptedPosts([]);
                setLoading(false);
                return;
            }

            const postIds = proposals.map(p => p.post_id);

            const { data: postsData, error: postsError } = await supabase
                .from("posts")
                .select("id, product, image, quantity, unity, from, created_at")
                .in("id", postIds);

            if (postsError) {
                console.error("❌ Error fetching posts:", postsError.message);
                setLoading(false);
                return;
            }

            setAcceptedPosts(postsData);
            setLoading(false);
        };

        fetchAcceptedPosts();
    }, []);

    const handlePostClick = (postId) => {
        navigate(`/main/accepted-preview/${postId}`);
    };

    return (
        <div>
            <h1 style={{ padding: "20px", fontSize: "22px", fontWeight: "bold" }}>Mes Propositions Acceptées</h1>
            <NavBar />

            {loading ? (
                <p className="loading">Chargement...</p>
            ) : acceptedPosts.length === 0 ? (
                <p className="no-posts">Aucune proposition acceptée pour l'instant.</p>
            ) : (
                <div className="accepted-posts">
                    {acceptedPosts.map(post => (
                        <div 
                            key={post.id} 
                            className="post-card" 
                            onClick={() => handlePostClick(post.id)} // Navigate on click
                            style={{ cursor: "pointer" }} // Make it look clickable
                        >
                            {post.image && <img src={post.image} alt={post.product} className="post-image" />}
                            <h3>{post.product}</h3>
                            <p><strong>Quantité :</strong> {post.quantity} {post.unity}</p>
                            <p><strong>De :</strong> {post.from}</p>
                            <p><strong>Date :</strong> {new Date(post.created_at).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Accepter;
