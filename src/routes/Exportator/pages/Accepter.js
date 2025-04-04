import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import NavBar from "../components/NavBar";
import "./Accepter.css";

const Accepter = () => {
    const [acceptedPosts, setAcceptedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOwnerView, setIsOwnerView] = useState(false); // Track if user is owner or sender
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAcceptedPosts = async () => {
            try {
                console.log("Fetching accepted posts...");
                const userId = localStorage.getItem("id");
                console.log("User ID:", userId);

                if (!userId) {
                    setError("Veuillez vous connecter pour voir vos propositions.");
                    setLoading(false);
                    return;
                }

                setLoading(true);
                setError(null);

                // First, try to fetch as sender
                console.log("Fetching as sender...");
                let { data: senderProposals, error: senderError } = await supabase
                    .from("proposals")
                    .select("post_id")
                    .eq("sender_id", userId)
                    .eq("status", "accepted");

                if (senderError) {
                    throw new Error(`Erreur propositions (sender): ${senderError.message}`);
                }

                let postIds;
                if (senderProposals && senderProposals.length > 0) {
                    // User is a sender
                    console.log("Sender proposals received:", senderProposals);
                    postIds = senderProposals.map(p => p.post_id);
                    setIsOwnerView(false);
                } else {
                    // Try fetching as owner
                    console.log("Fetching as owner...");
                    const { data: ownerPosts, error: ownerError } = await supabase
                        .from("posts")
                        .select("id")
                        .eq("user_id", userId);

                    if (ownerError) {
                        throw new Error(`Erreur posts (owner): ${ownerError.message}`);
                    }

                    if (ownerPosts && ownerPosts.length > 0) {
                        const ownerPostIds = ownerPosts.map(p => p.id);
                        const { data: ownerProposals, error: proposalsError } = await supabase
                            .from("proposals")
                            .select("post_id")
                            .in("post_id", ownerPostIds)
                            .eq("status", "accepted");

                        if (proposalsError) {
                            throw new Error(`Erreur propositions (owner): ${proposalsError.message}`);
                        }

                        if (ownerProposals && ownerProposals.length > 0) {
                            console.log("Owner proposals received:", ownerProposals);
                            postIds = ownerProposals.map(p => p.post_id);
                            setIsOwnerView(true);
                        } else {
                            console.log("No accepted proposals found for owner or sender");
                            setAcceptedPosts([]);
                            setLoading(false);
                            return;
                        }
                    } else {
                        console.log("No posts or proposals found");
                        setAcceptedPosts([]);
                        setLoading(false);
                        return;
                    }
                }

                console.log("Fetching posts with IDs:", postIds);
                const { data: postsData, error: postsError } = await supabase
                    .from("posts")
                    .select("id, product, image, quantity, unity, from, created_at, user_id")
                    .in("id", postIds);

                if (postsError) {
                    throw new Error(`Erreur posts: ${postsError.message}`);
                }
                console.log("Posts received:", postsData);

                setAcceptedPosts(postsData || []);
            } catch (err) {
                console.error("❌ Error:", err.message);
                setError(err.message);
            } finally {
                setLoading(false);
                console.log("Fetch completed");
            }
        };

        fetchAcceptedPosts();
    }, []);

    const handlePostClick = (postId) => {
        console.log("Navigating to post:", postId);
        navigate(`/main/accepted-preview/${postId}`);
    };

    return (
        <div>
            <h1 style={{ padding: "20px", fontSize: "22px", fontWeight: "bold" }}>
                {isOwnerView ? "Propositions Acceptées pour Mes Posts" : "Mes Propositions Acceptées"}
            </h1>
            <NavBar />

            {loading ? (
                <p className="loading">Chargement...</p>
            ) : error ? (
                <p className="error">{error}</p>
            ) : acceptedPosts.length === 0 ? (
                <p className="no-posts">
                    {isOwnerView 
                        ? "Aucune proposition acceptée pour vos posts." 
                        : "Aucune proposition acceptée pour l'instant."}
                </p>
            ) : (
                <div className="accepted-posts">
                    {acceptedPosts.map(post => (
                        <div 
                            key={post.id} 
                            className="post-card" 
                            onClick={() => handlePostClick(post.id)}
                            style={{ cursor: "pointer" }}
                        >
                            {post.image && (
                                <img 
                                    src={post.image} 
                                    alt={post.product} 
                                    className="post-image"
                                    onError={(e) => {
                                        console.log("Image failed to load:", post.image);
                                        e.target.style.display = 'none';
                                    }}
                                />
                            )}
                            <h3>{post.product || "Produit sans nom"}</h3>
                            <p>
                                <strong>Quantité :</strong> {post.quantity || "N/A"} {post.unity || ""}
                            </p>
                            <p>
                                <strong>De :</strong> {post.from || "Inconnu"}
                            </p>
                            <p>
                                <strong>Date :</strong>{" "}
                                {post.created_at ? 
                                    new Date(post.created_at).toLocaleString() : 
                                    "Date inconnue"}
                            </p>
                            {isOwnerView && (
                                <p className="owner-note">
                                    Cliquez pour créer une offre de livraison
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Accepter;