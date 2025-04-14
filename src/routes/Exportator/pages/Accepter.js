import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import NavBar from "../components/NavBar";
import "./Accepter.css";

const Accepter = () => {
    const [acceptedPosts, setAcceptedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

                // Fetch sender proposals (current user sent proposal, accepted by owner)
                console.log("Fetching as sender...");
                const { data: senderProposals, error: senderError } = await supabase
                    .from("proposals")
                    .select("post_id")
                    .eq("sender_id", userId)
                    .eq("status", "accepted");

                if (senderError) {
                    throw new Error(`Erreur propositions (sender): ${senderError.message}`);
                }

                // Fetch owner proposals (current user owns post, accepted a proposal)
                console.log("Fetching as owner...");
                const { data: ownerPosts, error: ownerError } = await supabase
                    .from("posts")
                    .select("id")
                    .eq("user_id", userId);

                if (ownerError) {
                    throw new Error(`Erreur posts (owner): ${ownerError.message}`);
                }

                let ownerPostIds = [];
                if (ownerPosts && ownerPosts.length > 0) {
                    ownerPostIds = ownerPosts.map(p => p.id);
                    const { data: ownerProposals, error: proposalsError } = await supabase
                        .from("proposals")
                        .select("post_id")
                        .in("post_id", ownerPostIds)
                        .eq("status", "accepted");

                    if (proposalsError) {
                        throw new Error(`Erreur propositions (owner): ${proposalsError.message}`);
                    }

                    ownerPostIds = ownerProposals ? ownerProposals.map(p => p.post_id) : [];
                }

                // Combine sender and owner post IDs, ensuring no duplicates
                const postIds = [
                    ...(senderProposals ? senderProposals.map(p => p.post_id) : []),
                    ...ownerPostIds,
                ].filter((value, index, self) => self.indexOf(value) === index);

                if (postIds.length === 0) {
                    console.log("No accepted proposals found for owner or sender");
                    setAcceptedPosts([]);
                    setLoading(false);
                    return;
                }

                // Fetch post details
                console.log("Fetching posts with IDs:", postIds);
                const { data: postsData, error: postsError } = await supabase
                    .from("posts")
                    .select("id, product, image, quantity, unity, from, created_at, user_id")
                    .in("id", postIds);

                if (postsError) {
                    throw new Error(`Erreur posts: ${postsError.message}`);
                }
                console.log("Posts received:", postsData);

                // Enrich posts with ownership info
                const enrichedPosts = postsData.map(post => ({
                    ...post,
                    isOwner: post.user_id === userId,
                }));

                setAcceptedPosts(enrichedPosts || []);
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

    const handleCreateShippingOffer = async (postId) => {
        try {
            const { data: post, error: postError } = await supabase
                .from("posts")
                .select("id, product, from, quantity, unity, image, user_id")
                .eq("id", postId)
                .single();

            if (postError) throw new Error(`Post fetch error: ${postError.message}`);

            const userId = localStorage.getItem("id");
            const { data: user, error: userError } = await supabase
                .from("users")
                .select("country")
                .eq("id", userId)
                .single();

            if (userError) throw new Error(`User fetch error: ${userError.message}`);

            const shippingOffer = {
                post_id: post.id,
                user_id: post.user_id,
                product: post.product,
                from: post.from,
                to: user.country,
                quantity: post.quantity,
                unity: post.unity,
                image: post.image || null,
                sender_id: userId,
            };

            const { data, error } = await supabase
                .from("ship_posts")
                .insert(shippingOffer)
                .select();

            if (error) throw new Error(`Shipping offer error: ${error.message}`);
            alert("Offre de livraison créée avec succès !");
            // Refresh posts to reflect shipping status
            setAcceptedPosts(prevPosts =>
                prevPosts.map(p =>
                    p.id === postId ? { ...p, shippingSent: true } : p
                )
            );
        } catch (err) {
            console.error(err.message);
            alert("Échec de la création de l'offre de livraison");
        }
    };

    return (
        <div>
            <h1 style={{ padding: "20px", fontSize: "22px", fontWeight: "bold" }}>
                Propositions Acceptées
            </h1>
            <NavBar />

            {loading ? (
                <p className="loading">Chargement...</p>
            ) : error ? (
                <p className="error">{error}</p>
            ) : acceptedPosts.length === 0 ? (
                <p className="no-posts">
                    Aucune proposition acceptée pour l'instant.
                </p>
            ) : (
                <div className="accepted-posts">
                    {acceptedPosts.map(post => (
                        <div
                            key={post.id}
                            className="post-card"
                            style={{ cursor: "pointer" }}
                        >
                            {post.image && (
                                <img
                                    src={post.image}
                                    alt={post.product}
                                    className="post-image"
                                    onError={(e) => {
                                        console.log("Image failed to load:", post.image);
                                        e.target.style.display = "none";
                                    }}
                                />
                            )}
                            <div onClick={() => handlePostClick(post.id)}>
                                <h3>{post.product || "Produit sans nom"}</h3>
                                <p>
                                    <strong>Quantité :</strong> {post.quantity || "N/A"} {post.unity || ""}
                                </p>
                                <p>
                                    <strong>De :</strong> {post.from || "Inconnu"}
                                </p>
                                <p>
                                    <strong>Date :</strong>{" "}
                                    {post.created_at
                                        ? new Date(post.created_at).toLocaleString()
                                        : "Date inconnue"}
                                </p>
                            </div>
                            {post.isOwner && (
                                <>
                                    <button
                                        className="shipping-offer-btn"
                                        onClick={() => handleCreateShippingOffer(post.id)}
                                        disabled={post.shippingSent}
                                    >
                                        {post.shippingSent
                                            ? "Offre de Livraison Envoyée"
                                            : "Créer une Offre de Livraison"}
                                    </button>
                                    <p className="owner-note">
                                        Cliquez pour voir les détails ou créer une offre de livraison
                                    </p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Accepter;