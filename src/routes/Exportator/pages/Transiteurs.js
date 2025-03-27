import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import { supabase } from "../../../utils/supabaseClient";
import './Transiteurs.css';

const Transiteurs = () => {
  const [transits, setTransits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sentProposals, setSentProposals] = useState(new Set()); 
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const uniqueFromLocations = [...new Set(transits.map(transit => transit.from))].sort();
  const uniqueToLocations = [...new Set(transits.map(transit => transit.to))].sort();

  // Fetch transits and user's existing proposals from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const senderId = localStorage.getItem('id');
        if (!senderId) {
          throw new Error('Utilisateur non connecté');
        }

        // Fetch all transits
        const { data: transitsData, error: transitsError } = await supabase
          .from('transits')
          .select('*')
          .order('created_at', { ascending: false });

        if (transitsError) throw transitsError;
        setTransits(transitsData);

        // Fetch user's existing proposals
        const { data: proposalsData, error: proposalsError } = await supabase
          .from('transit_proposals')
          .select('transit_id')
          .eq('sender_id', senderId);

        if (proposalsError) throw proposalsError;

        // Store transit IDs of already sent proposals
        const sentTransitIds = new Set(proposalsData.map((proposal) => proposal.transit_id));
        setSentProposals(sentTransitIds);

      } catch (error) {
        setError('Erreur lors de la récupération des données : ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle sending an offer
  const handleSendOffer = async (transit) => {
    try {
      const senderId = localStorage.getItem('id');
      if (!senderId) {
        alert('Veuillez vous connecter pour envoyer une offre.');
        return;
      }

      const ownerId = transit.user_id;
      const transitId = transit.id;

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
            sender_id: senderId,
            owner_id: ownerId,
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
            receiver_id: ownerId,
            transit_id: transitId,
            sender_id: senderId,
            seen: false,
          },
        ]);

      if (notificationError) {
        console.error('Transit notification error:', notificationError);
        throw notificationError;
      }

      console.log('Transit notification inserted:', notificationData);

      // Update sentProposals to disable the button for this transit
      setSentProposals((prev) => new Set(prev).add(transitId));

      alert('Offre envoyée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l’envoi de l’offre :', error.message, error.details || error);
      alert(`Une erreur s'est produite lors de l'envoi de l'offre : ${error.message}`);
    }
  };

  const filteredTransits = transits.filter((transit) => {
    // Price filtering
    const price = parseFloat(transit.price);
    const min = minPrice ? parseFloat(minPrice) : -Infinity;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    const withinPriceRange = price >= min && price <= max;
  
    // Location filtering (case-insensitive)
    const fromMatch = filterFrom 
      ? transit.from.toLowerCase().includes(filterFrom.toLowerCase())
      : true;
    const toMatch = filterTo
      ? transit.to.toLowerCase().includes(filterTo.toLowerCase())
      : true;
  
    return withinPriceRange && fromMatch && toMatch;
  });

  return (
    <div>
      <div className="transiteurs-container">
        <div className="header-section">
          <h1>Transiteurs</h1>
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="bi bi-filter"></i>
            {showFilters ? 'Masquer filtres' : 'Filtres'}
          </button>
        </div>
  
        {showFilters && (
          <div className="filters">
            <div className="price-filter">
              <h5>Filtrer par prix</h5>
              <input
                type="number"
                placeholder="Prix minimum"
                value={minPrice || ''}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                type="number"
                placeholder="Prix maximum"
                value={maxPrice || ''}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            
            <div className="location-filter">
              <h5>Filtrer par localisation</h5>
              <select
                value={filterFrom || ''}
                onChange={(e) => setFilterFrom(e.target.value)}
              >
                <option value="">Tous les départs</option>
                {uniqueFromLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              
              <select
                value={filterTo || ''}
                onChange={(e) => setFilterTo(e.target.value)}
              >
                <option value="">Toutes les destinations</option>
                {uniqueToLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
  
        {loading && <p>Chargement...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && filteredTransits.length === 0 && (
          <p>Aucune offre disponible pour le moment.</p>
        )}
        <div className="transits-grid">
          {filteredTransits.map((transit) => (
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
                disabled={sentProposals.has(transit.id)}
              >
                {sentProposals.has(transit.id) ? 'Offre envoyée' : 'Envoyer une offre'}
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