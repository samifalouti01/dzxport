import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient"; 

const PaListPay = () => {
  const [paList, setPaList] = useState([]);
  const [message, setMessage] = useState(""); 

  useEffect(() => {
    const fetchPaList = async () => {
      try {
        const { data, error } = await supabase
          .from("pa_list")
          .select("id, user_id, parrain_id, created_at") 
          .order("created_at", { ascending: false }); 

        if (error) throw error;

        const updatedPaList = await Promise.all(
          data.map(async (item) => {
            const { parrain_id } = item;

            const { data: userData, error: userError } = await supabase
              .from("user_data")
              .select("name, rip")
              .eq("id", parrain_id?.split(",")[0]) 
              .single();

            if (userError) {
              console.error("Error fetching user data:", userError);
            }

            return {
              ...item,
              name: userData?.name || "Unknown",
              rip: userData?.rip || "Unknown",
            };
          })
        );

        setPaList(updatedPaList);
      } catch (error) {
        console.error("Error fetching pa_list:", error);
        setMessage("Error fetching data from pa_list. Please try again.");
      }
    };

    fetchPaList();
  }, []);

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from("pa_list")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPaList(paList.filter((item) => item.id !== id));
      setMessage("Record deleted successfully.");
    } catch (error) {
      console.error("Error deleting record:", error);
      setMessage("Error deleting the record. Please try again.");
    }
  };

  return (
    <div>
      {message && <div className="message">{message}</div>}

      <h2>Pa List</h2>
      <table>
        <thead>
          <tr>
            <th>Parrain ID</th>
            <th>Name</th>
            <th>RIP</th>
            <th>Get</th>
            <th>Created At</th>
            <th>Actions</th> 
          </tr>
        </thead>
        <tbody>
          {paList.length > 0 ? (
            paList.map((item) => (
              <tr key={item.id}> 
                <td>{item.parrain_id?.split(",")[0]}</td>
                <td>{item.name}</td>
                <td>{item.rip}</td>
                <td>1500 DA</td>
                <td>{new Date(item.created_at).toLocaleString()}</td> 
                <td>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ color: "red" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No data available</td> 
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaListPay;
