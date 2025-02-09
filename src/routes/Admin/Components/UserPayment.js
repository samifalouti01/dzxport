import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import "./UserPayment.css";

const UserPayment = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const determineLevel = (ppcg) => {
    if (!ppcg || isNaN(ppcg)) return "Distributeur";
    if (ppcg >= 50000) return "Manager Senior";
    if (ppcg >= 30000) return "Manager Junior";
    if (ppcg >= 18700) return "Manager";
    if (ppcg >= 12500) return "Animateur Senior";
    if (ppcg >= 6250) return "Animateur Junior";
    if (ppcg >= 100) return "Animateur";
    return "Distributeur";
  };

  const commissionMatrix = {
    "Manager Senior": {
      "Manager Senior": 0,
      "Manager Junior": 2,
      Manager: 4,
      "Animateur Senior": 6,
      "Animateur Junior": 8,
      Animateur: 10,
      Distributeur: 0,
    },
    "Manager Junior": {
      "Manager Senior": 0,
      "Manager Junior": 0,
      Manager: 2,
      "Animateur Senior": 4,
      "Animateur Junior": 6,
      Animateur: 8,
      Distributeur: 0,
    },
    Manager: {
      "Manager Senior": 0,
      "Manager Junior": 0,
      Manager: 0,
      "Animateur Senior": 2,
      "Animateur Junior": 4,
      Animateur: 6,
      Distributeur: 0,
    },
    "Animateur Senior": {
      "Manager Senior": 0,
      "Manager Junior": 0,
      Manager: 0,
      "Animateur Senior": 0,
      "Animateur Junior": 2,
      Animateur: 4,
      Distributeur: 0,
    },
    "Animateur Junior": {
      "Manager Senior": 0,
      "Manager Junior": 0,
      Manager: 0,
      "Animateur Senior": 0,
      "Animateur Junior": 0,
      Animateur: 2,
      Distributeur: 0,
    },
    Animateur: {
      "Manager Senior": 0,
      "Manager Junior": 0,
      Manager: 0,
      "Animateur Senior": 0,
      "Animateur Junior": 0,
      Animateur: 0,
      Distributeur: 0,
    },
    Distributeur: {
      "Manager Senior": 0,
      "Manager Junior": 0,
      Manager: 0,
      "Animateur Senior": 0,
      "Animateur Junior": 0,
      Animateur: 0,
      Distributeur: 0,
    },
  };

  const calculateIncome = (userLevel, teamMembers) => {
    let totalIncome = 0;

    teamMembers.forEach((member) => {
      const teamLevel = determineLevel(member.ppcg);
      const commission = commissionMatrix[userLevel]?.[teamLevel] || 0;
      totalIncome += (member.ppcg * commission) / 100;
    });

    return totalIncome;
  };

  const fetchUsers = async () => {
    setLoading(true);
  
    try {
      const { data: userData, error: userError } = await supabase
        .from("user_data")
        .select("*");
  
      if (userError) throw userError;
  
      const { data: historyData, error: historyError } = await supabase
        .from("history_data")
        .select("id, ppcg");
  
      if (historyError) throw historyError;
  
      const ppcgLookup = historyData.reduce((acc, record) => {
        acc[record.id] = record.ppcg;
        return acc;
      }, {});
  
      const processedUsers = userData.map((user) => {
        const userStatus = user.perso && parseFloat(user.perso) >= 100 ? "actif" : "inactif";
        const teamMembers = userData.filter(
          (u) => u.parrain_id && u.parrain_id.split(",").includes(String(user.id))
        );
        const userLevel = determineLevel(ppcgLookup[user.id] || 0);
        const totalIncome = calculateIncome(userLevel, teamMembers);
  
        return {
          ...user,
          level: userLevel,
          totalIncome,
          teamSize: teamMembers.length,
          status: userStatus,
        };
      });
  
      setUsers(processedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const filteredUsers = users.filter((user) => {
    return statusFilter === "all" || user.status === statusFilter;
  });

  return (
    <div>
      <div className="payments-container">
        <h1 style={{ color: "black" }}>User Payments</h1>
        <div className="sort-buttons">
          <button onClick={() => handleStatusFilter("actif")}>Actif</button>
          <button onClick={() => handleStatusFilter("inactif")}>Inactif</button>
          <button onClick={() => handleStatusFilter("all")}>All</button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th style={{ color: "black" }}>ID</th>
                <th style={{ color: "black" }}>Name</th>
                <th style={{ color: "black" }}>Phone</th>
                <th style={{ color: "black" }}>RIP</th>
                <th style={{ color: "black" }}>Level</th>
                <th style={{ color: "black" }}>Total Income (DA)</th>
                <th style={{ color: "black" }}>Team Size</th>
                <th style={{ color: "black" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.phone}</td>
                  <td>{user.rip}</td>
                  <td>{user.level}</td>
                  <td>{user.totalIncome * 100} DA</td>
                  <td>{user.teamSize}</td>
                  <td
                    className={user.status === "actif" ? "active-status" : "inactive-status"}
                  >
                    {user.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserPayment;
