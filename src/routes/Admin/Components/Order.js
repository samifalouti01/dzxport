import React, { useEffect, useState } from 'react';
import { supabase } from "../../../supabaseClient";
import './Order.css';

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');  // State for search query

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('order')
          .select('*')
          .order('created_at', { ascending: false });

        if (ordersError) {
          throw ordersError;
        }

        const ordersWithUserData = await Promise.all(ordersData.map(async (order) => {
          const { data: userData, error: userError } = await supabase
            .from('user_data')
            .select('perso, ppcg')
            .eq('id', order.user_id)
            .single();

          if (userError) {
            order.userData = null;
            if (userError.code === 'PGRST116') {
              setError(`No user found for user_id: ${order.user_id}`);
            } else {
              throw userError;
            }
          } else {
            order.userData = userData;
          }
          return order;
        }));

        setOrders(ordersWithUserData);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    return (
      order.id.toString().includes(searchQuery) ||
      (order.name && order.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.email && order.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleValidate = async (orderId, userId, currentTotalPrice) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('user_data')
        .select('perso, ppcg, parrain_id')
        .eq('id', userId)
        .single();
    
      if (userError) {
        if (userError.code === 'PGRST116') {
          setError(`No user found for user_id: ${userId}`);
        } else {
          throw userError;
        }
        return;
      }
  
      const currentPersoValue = parseFloat(userData.perso) || 0;
      const currentPrice = parseFloat(currentTotalPrice) || 0;
      const newPersoValue = currentPersoValue + currentPrice;
  
      const currentPpcgValue = parseFloat(userData.ppcg) || 0;
      const newPpcgValue = currentPpcgValue + currentPrice;
  
      // Log values to check if the calculations are correct
      console.log(`User Data for ID ${userId}:`, userData);
      console.log(`Updating perso: ${currentPersoValue} + ${currentPrice} = ${newPersoValue}`);
      console.log(`Updating ppcg: ${currentPpcgValue} + ${currentPrice} = ${newPpcgValue}`);
  
      // Update the order status to 'validated'
      const { error: updateOrderError } = await supabase
        .from('order')
        .update({ order_status: 'validated' })
        .eq('id', orderId);
    
      if (updateOrderError) {
        throw updateOrderError;
      }
    
      // Update the user's perso and ppcg values
      const { error: updateUserError } = await supabase
        .from('user_data')
        .update({
          perso: newPersoValue.toString(),
          ppcg: newPpcgValue.toString(),
        })
        .eq('id', userId);
    
      if (updateUserError) {
        throw updateUserError;
      }
    
      if (userData.parrain_id) {
        const parrainIds = userData.parrain_id
          .split(',')
          .map(id => id.trim())
          .filter(id => id && !isNaN(id));
  
        console.log(`User has valid parrain_ids: ${parrainIds}`);
    
        if (parrainIds.length === 0) {
          console.log('No valid parrain_ids to update.');
          return;
        }
  
        const { data: parrainsData, error: parrainsError } = await supabase
          .from('user_data')
          .select('id, parainage_points, ppcg')
          .in('id', parrainIds);
    
        if (parrainsError) {
          throw parrainsError;
        }
  
        console.log("Parrains Data:", parrainsData);
    
        for (const parrain of parrainsData) {
          const currentParainagePoints = parseFloat(parrain.parainage_points) || 0;
          const currentPpcgValue = parseFloat(parrain.ppcg) || 0;
    
          const newParainagePoints = currentParainagePoints + currentPrice;
          const newPpcgValue = currentPpcgValue + currentPrice;
    
          console.log(`Updating parrain ID ${parrain.id}:`);
          console.log(`Parainage Points: ${currentParainagePoints} + ${currentPrice} = ${newParainagePoints}`);
          console.log(`PPCG: ${currentPpcgValue} + ${currentPrice} = ${newPpcgValue}`);
    
          const { error: updateParrainError } = await supabase
            .from('user_data')
            .update({
              parainage_points: newParainagePoints.toString(),
              ppcg: newPpcgValue.toString(),
            })
            .eq('id', parrain.id);
    
          if (updateParrainError) {
            throw updateParrainError;
          }
        }
      }
    
      setOrders(prevOrders => prevOrders.map(order => {
        if (order.id === orderId) {
          return { ...order, order_status: 'validated' };
        }
        return order;
      }));
    
    } catch (error) {
      setError(error.message);
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

  if (error) {
    return <div>Error: {error}</div>;
  }

  const isValidImageUrl = (url) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
  };

  const handleActionChange = async (orderId, newStatus) => {
    try {
      if (!newStatus) {
        alert("Please select a valid status.");
        return;
      }
  
      const { error: updateOrderError } = await supabase
        .from("order")
        .update({ order_status: newStatus })
        .eq("id", orderId);
  
      if (updateOrderError) {
        throw updateOrderError;
      }
  
      if (newStatus === "validated") {
        const order = orders.find((order) => order.id === orderId);
        if (!order || !order.user_id) {
          throw new Error("Order or User not found.");
        }
  
        const { data: userData, error: userError } = await supabase
          .from("user_data")
          .select("perso, ppcg, parrain_id")
          .eq("id", order.user_id)
          .single();
  
        if (userError) {
          throw userError;
        }
  
        const currentPersoValue = parseFloat(userData.perso) || 0;
        const currentPpcgValue = parseFloat(userData.ppcg) || 0;
        const currentPrice = parseFloat(order.total_price) || 0;
  
        const newPersoValue = currentPersoValue + currentPrice;
        const newPpcgValue = currentPpcgValue + currentPrice;
  
        const { error: updateUserError } = await supabase
          .from("user_data")
          .update({
            perso: newPersoValue.toString(),
            ppcg: newPpcgValue.toString(),
          })
          .eq("id", order.user_id);
  
        if (updateUserError) {
          throw updateUserError;
        }
  
        if (userData.parrain_id) {
          const parrainIds = userData.parrain_id
            .split(",")
            .map(id => id.trim())
            .filter(id => id && !isNaN(id));
  
          if (parrainIds.length === 0) {
            console.log("No valid parrain_ids to update.");
          } else {
            const { data: parrainsData, error: parrainsError } = await supabase
              .from("user_data")
              .select("id, ppcg")
              .in("id", parrainIds);
  
            if (parrainsError) {
              throw parrainsError;
            }
  
            for (const parrain of parrainsData) {
              const currentParrainPpcgValue = parseFloat(parrain.ppcg) || 0;
              const newParrainPpcgValue = currentParrainPpcgValue + currentPrice;
  
              const { error: updateParrainError } = await supabase
                .from("user_data")
                .update({
                  ppcg: newParrainPpcgValue.toString(),
                })
                .eq("id", parrain.id);
  
              if (updateParrainError) {
                throw updateParrainError;
              }
  
              console.log(`Updated parrain ID ${parrain.id}'s ppcg to ${newParrainPpcgValue}`);
            }
          }
        }
      }
  
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, order_status: newStatus } : order
        )
      );
  
      alert(`Order status updated to "${newStatus}" successfully!`);
    } catch (error) {
      setError(`Failed to update order status: ${error.message}`);
    }
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
            <th>Product Image</th>
            <th>Created At</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Total Price</th>
            <th>Wilaya</th>
            <th>Commune</th>
            <th>Address</th>
            <th>Order Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>
                {order.product_image ? (
                  <img
                    src={order.product_image}
                    alt={order.name || "Product Image"}
                    onError={(e) => (e.target.style.display = "none")}
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "10px",
                      cursor: "pointer",
                    }}
                    onClick={() => openModal(order.product_image)}
                  />
                ) : (
                  <span>No Image Available</span>
                )}
              </td>
              <td>{new Date(order.created_at).toLocaleString()}</td>
              <td>{order.name}</td>
              <td>{order.phone}</td>
              <td>{order.total_price * 100} Dinars</td>
              <td>{order.wilaya}</td>
              <td>{order.commune}</td>
              <td>{order.address}</td>
              <td>{order.order_status}</td>
              <td>
                <select
                  value={order.order_status}
                  onChange={(e) => handleActionChange(order.id, e.target.value)}
                  style={{ padding: "5px", borderRadius: "5px" }}
                >
                  <option value="">Select</option>
                  <option value="validated">Validate</option>
                  <option value="refused">Reject</option>
                  <option value="cancelled">Cancel</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            <img
              src={modalImage}
              alt={`Full-size view of ${modalImage}`}
              className="modal-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
