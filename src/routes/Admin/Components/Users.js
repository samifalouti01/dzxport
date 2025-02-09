import React, { useEffect, useState } from 'react';
import { supabase } from "../../../supabaseClient";
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
        .neq('validate', 'unvalidate'); 

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
      }
    } catch (error) {
      console.error(error);
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
              <td>{user.id}</td>
              <td>{user.created_at}</td>
              <td>{user.identifier}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
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
