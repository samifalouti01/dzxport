import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

const determineLevel = (ppcg) => {
  if (!ppcg || isNaN(ppcg)) return "Distributeur";
  if (ppcg >= 30000) return "Manager";
  if (ppcg >= 18700) return "Manager Adjoint";
  if (ppcg >= 6250) return "Animateur";
  if (ppcg >= 100) return "Animateur Adjoint";
  return "Distributeur";
};

const MonthlyUp = () => {
  const [userData, setUserData] = useState([]);
  const [firstMonthData, setFirstMonthData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterId, setFilterId] = useState("");

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: userResult, error: userError } = await supabase
        .from('user_data')
        .select('*');
      if (userError) throw userError;

      const { data: firstMonthResult, error: firstMonthError } = await supabase
        .from('first_month')
        .select('*');
      if (firstMonthError) throw firstMonthError;

      const { data: historyResult, error: historyError } = await supabase
        .from('history_data')
        .select('*');
      if (historyError) throw historyError;

      setUserData(userResult);
      setFirstMonthData(firstMonthResult);
      setHistoryData(historyResult);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handlePasscodeSubmit = () => {
    const correctPasscode = "06Sami06";
    if (passcode === correctPasscode) {
      setIsAuthorized(true);
    } else {
      alert("Incorrect passcode! Please try again.");
    }
  };

  const handleUpgrade = async (id) => {
    try {
      const firstMonth = firstMonthData.find(item => item.id === id);
      const user = userData.find(item => item.id === id);
      const historyRecord = historyData.find(item => item.id === id);

      const M1 = Number(firstMonth?.ppcg || 0);
      const M2 = Number(user?.ppcg || 0);
      const totalPcg = M1 + M2;
      const currentHistoryPpcg = Number(historyRecord?.ppcg || 0);
      const finalPpcg = currentHistoryPpcg + totalPcg;

      const { error: historyError } = await supabase
        .from('history_data')
        .upsert([{ 
          id, 
          ppcg: finalPpcg,
          perso: user.perso,
          parainage_points: user.parainage_points,
          parainage_users: user.parainage_users
        }]);
      if (historyError) throw historyError;

      const { error: firstMonthError } = await supabase
        .from('first_month')
        .upsert([{ id, ppcg: 0 }]);
      if (firstMonthError) throw firstMonthError;

      const { error: userError } = await supabase
        .from('user_data')
        .upsert([{ 
          id, 
          ppcg: 0,
          perso: user.perso,
          parainage_points: user.parainage_points,
          parainage_users: user.parainage_users
        }]);
      if (userError) throw userError;

      setSuccessMessage("Upgrade completed successfully!");
      fetchAllData();
    } catch (error) {
      console.error("Error during upgrade:", error);
      setSuccessMessage("Error during upgrade operation");
    }
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleDowngrade = async (id) => {
    try {
      const firstMonth = firstMonthData.find(item => item.id === id);
      const user = userData.find(item => item.id === id);

      const M2 = user?.ppcg || 0;

      const { error: firstMonthError } = await supabase
        .from('first_month')
        .upsert([{ id, ppcg: M2 }]);
      if (firstMonthError) throw firstMonthError;

      const { error: userError } = await supabase
        .from('user_data')
        .upsert([{ 
          id, 
          ppcg: 0,
          perso: user.perso,
          parainage_points: user.parainage_points,
          parainage_users: user.parainage_users
        }]);
      if (userError) throw userError;

      setSuccessMessage("Downgrade completed successfully!");
      fetchAllData();
    } catch (error) {
      console.error("Error during downgrade:", error);
      setSuccessMessage("Error during downgrade operation");
    }
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const getFilteredUsers = () => {
    return historyData
      .filter((history) => {
        const level = determineLevel(Number(history.ppcg || 0));
        const matchesLevel = filterLevel
          ? level.toLowerCase().includes(filterLevel.toLowerCase())
          : true;
        const matchesId = filterId
          ? history.id.toString().includes(filterId)
          : true;
  
        return matchesLevel && matchesId;
      })
      .map((history) => {
        const firstMonth = firstMonthData.find((item) => item.id === history.id) || { ppcg: 0 };
        const user = userData.find((item) => item.id === history.id) || { ppcg: 0 };
        
        return {
          id: history.id,
          level: determineLevel(Number(history.ppcg || 0)), // Using history.ppcg for level determination
          firstMonthPpcg: Number(firstMonth.ppcg || 0),
          userPpcg: Number(user.ppcg || 0),
          totalPcg: Number(firstMonth.ppcg || 0) + Number(user.ppcg || 0)
        };
      });
  };

  return (
    <div>
      {!isAuthorized ? (
        <div>
          <h2>Enter Passcode</h2>
          <input
            type="password"
            className="parrain-input"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter passcode"
          />
          <button onClick={handlePasscodeSubmit}>Submit</button>
        </div>
      ) : (
        <>
          <h1 style={{ color: "black" }}>Monthly Up</h1>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Level</th>
                    <th>M1</th>
                    <th>M2</th>
                    <th>Total PCG</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredUsers().map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.level}</td>
                      <td>{user.firstMonthPpcg}</td>
                      <td>{user.userPpcg}</td>
                      <td>{user.totalPcg}</td>
                      <td>
                        <button onClick={() => handleUpgrade(user.id)}>Upgrade</button>
                        <button onClick={() => handleDowngrade(user.id)}>Downgrade</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MonthlyUp;