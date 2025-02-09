import React, { useEffect, useState } from 'react';
import { supabase } from "../../../supabaseClient";
import { FaCopy } from "react-icons/fa";
import './Parrainage.css';

const Parrainage = () => {
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .neq('validate', 'validate'); 

      if (error) {
        console.error(error);
      } else {
        setUserData(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleBlockToggle = async (id, currentBlocked) => {
    try {
      const { error } = await supabase
        .from('user_data')
        .update({ blocked: currentBlocked === 'blocked' ? 'unblocked' : 'blocked' })
        .match({ id });

      if (error) {
        console.error(error);
      } else {
        fetchUserData(); 
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredOrders = userData.filter((user) => {
    return (
      user.id.toString().includes(searchQuery) ||
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleValidateToggle = async (id, currentValidate) => {
    try {
      const { error } = await supabase
        .from('user_data')
        .update({ validate: currentValidate === 'validate' ? 'unvalidate' : 'validate' })
        .match({ id });
  
      if (error) {
        console.error(error);
      } else {
        fetchUserData();  
  
        insertHistoryData(id);  
      }
    } catch (error) {
      console.error(error);
    }
  };  

  const insertHistoryData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('history_data')
        .upsert([
          {
            id: userId,
            ppcg: '0',
            parainage_points: '0',
            parainage_users: '0',
            perso: '0'
          }
        ]);
  
      if (error) {
        console.error("Error inserting into history_data:", error);
      } else {
        console.log("Data successfully inserted into history_data:", data);
      }
    } catch (error) {
      console.error("Error inserting into history_data:", error);
    }
  };
  
  

  const openModal = (imageUrl) => {
    setModalImage(imageUrl);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalImage(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error("Failed to copy text:", err);
    });
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search by ID, Name, or Email"
        value={searchQuery}
        onChange={handleSearchChange}
        style={{ marginBottom: '20px', padding: '8px', width: '100%' }}
      />
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Created At</th>
            <th>Identifier</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Parrain</th>
            <th>Birthdate</th>
            <th>Card Recto</th>
            <th>Card Verso</th>
            <th>Blocked</th>
            <th>Validation</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(user => (
            <tr key={user.id}>
              <td style={{border: "1px solid black"}}>{user.id}</td>
              <td>{user.created_at}</td>
              <td>{user.identifier}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td style={{ textAlign: "center", border: "1px solid black"}}>
              <FaCopy
                style={{ cursor: "pointer", fontSize: "20px", marginTop: "-18px", marginLeft: "-18px", padding: "0px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(user.parrain_id?.split(',')[0]);
                  }}
                />
              </td>
              <td>{user.birthdate}</td>
              <td>
                {user.card_recto && (
                  <img
                    src={user.card_recto}
                    alt={`Card Recto for ${user.name}`} 
                    style={{ width: '100px', height: 'auto', cursor: 'pointer' }}
                    onClick={() => openModal(user.card_recto)}
                  />
                )}
              </td>
              <td>
                {user.card_verso && (
                  <img
                    src={user.card_verso}
                    alt={`Card Verso for ${user.name}`} 
                    style={{ width: '100px', height: 'auto', cursor: 'pointer' }}
                    onClick={() => openModal(user.card_verso)}
                  />
                )}
              </td>
              <td><button onClick={() => handleBlockToggle(user.id, user.blocked)}>
                {user.blocked === 'blocked' ? 'Unblock' : 'Block'}
              </button></td>
              <td>
                <button onClick={() => handleValidateToggle(user.id, user.validate)}>
                  {user.validate === 'validate' ? 'Unvalidate' : 'Validate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={closeModal}>&times;</span>
            <img src={modalImage} alt={`Full-size view of ${modalImage}`} className="modal-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Parrainage;
