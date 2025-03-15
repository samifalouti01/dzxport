import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import { supabase } from "../../../utils/supabaseClient";
import './Transiteurs.css';

const Transiteurs = () => {
  const [transits, setTransits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch transits data from Supabase
  useEffect(() => {
    const fetchTransits = async () => {
      try {
        const { data, error } = await supabase
          .from('transits')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setTransits(data);
      } catch (error) {
        setError('Erreur lors de la récupération des données : ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransits();
  }, []);

  // Handle sending an offer
  const handleSendOffer = async (transit) => {
    try {
      const senderId = localStorage.getItem('id');
      if (!senderId) {
        alert('Veuillez vous connecter pour envoyer une offre.');
        return;
      }

      const ownerId = transit.user_id; // Text from transits
      const transitId = transit.id; // bigint, but Supabase handles it

      if (!ownerId || !transitId) {
        throw new Error('ID du propriétaire ou du transit manquant.');
      }

      console.log('Sending transit proposal:', { transit_id: transitId, sender_id: senderId, owner_id: ownerId });

      // Insert into transit_proposals table
      const { data: proposalData, error: proposalError } = await supabase
        .from('transit_proposals')
        .insert([
          {
            transit_id: transitId,
            sender_id: senderId, // String, matches text type
            owner_id: ownerId,   // String, matches text type
            status: 'pending',
          },
        ]);

      if (proposalError) {
        console.error('Transit proposal error:', proposalError);
        throw proposalError;
      }

      console.log('Transit proposal inserted:', proposalData);

      // Insert into transit_notifications table
      const { data: notificationData, error: notificationError } = await supabase
        .from('transit_notifications')
        .insert([
          {
            receiver_id: ownerId, // String, matches text type
            transit_id: transitId,
            sender_id: senderId,  // String, matches text type
            seen: false,
          },
        ]);

      if (notificationError) {
        console.error('Transit notification error:', notificationError);
        throw notificationError;
      }

      console.log('Transit notification inserted:', notificationData);

      alert('Offre envoyée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l’envoi de l’offre :', error.message, error.details || error);
      alert(`Une erreur s'est produite lors de l'envoi de l'offre : ${error.message}`);
    }
  };

  return (
    <div>
      <div className="transiteurs-container">
        <h1>Transiteurs</h1>
        {loading && <p>Chargement...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && transits.length === 0 && (
          <p>Aucune offre disponible pour le moment.</p>
        )}
        <div className="transits-grid">
          {transits.map((transit) => (
            <div key={transit.id} className="transit-card">
              <h3>{transit.title}</h3>
              <p>
                <strong>De :</strong> {transit.from} <i className="bi bi-geo-alt" />
              </p>
              <p>
                <strong>À :</strong> {transit.to} <i className="bi bi-geo-alt" />
              </p>
              <p>
                <strong>Prix :</strong> {transit.price} DZD / KG
              </p>
              <button
                className="trs-btn"
                onClick={() => handleSendOffer(transit)}
              >
                Envoyer une offre
              </button>
            </div>
          ))}
        </div>
      </div>
      <NavBar />
    </div>
  );
};

export default Transiteurs;