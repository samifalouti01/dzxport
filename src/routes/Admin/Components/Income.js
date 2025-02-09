import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";

const Income = () => {
  const [salePrice, setSalePrice] = useState("");
  const [saleBenefit, setSaleBenefit] = useState("");
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalBenefit, setTotalBenefit] = useState(0);
  const [totalCapital, setTotalCapital] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetError = () => setErrorMessage("");

  const fetchIncomeDetails = async () => {
    try {
      setLoading(true);
      resetError();

      const { data, error } = await supabase
        .from("income")
        .select("sale_price, sale_benefit");

      if (error) {
        throw new Error("Failed to fetch income details.");
      }

      const income = data.reduce(
        (totals, item) => {
          const price = Number(item.sale_price || 0);
          const benefit = Number(item.sale_benefit || 0);
          totals.income += price;
          totals.benefits += benefit;
          totals.capital += price - benefit;
          return totals;
        },
        { income: 0, benefits: 0, capital: 0 }
      );

      setTotalIncome(income.income);
      setTotalBenefit(income.benefits);
      setTotalCapital(income.capital);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async () => {
    resetError();

    if (!salePrice || !saleBenefit) {
      setErrorMessage("Both Sale Price and Sale Benefit are required.");
      return;
    }

    const price = Number(salePrice);
    const benefit = Number(saleBenefit);

    if (price < benefit) {
      setErrorMessage("Sale Price must be greater than or equal to Sale Benefit.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from("income").insert([
        { sale_price: price, sale_benefit: benefit },
      ]);

      if (error) {
        throw new Error("Failed to add income.");
      }

      await fetchIncomeDetails();
      setSalePrice("");
      setSaleBenefit("");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeDetails();
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Income Overview</h1>

      {loading ? (
        <p style={styles.loading}>Loading...</p>
      ) : (
        <div style={styles.totalsContainer}>
          <p style={styles.totalItem}>
            <strong>Total Income:</strong> {totalIncome.toFixed(2)} DA
          </p>
          <p style={styles.totalItem}>
            <strong>Total Benefits:</strong> {totalBenefit.toFixed(2)} DA
          </p>
          <p style={styles.totalItem}>
            <strong>Total Capital:</strong> {totalCapital.toFixed(2)} DA
          </p>
        </div>
      )}

      {errorMessage && <p style={styles.error}>{errorMessage}</p>}

      <div style={styles.formContainer}>
        <h2 style={styles.subHeader}>Add Income</h2>
        <input
          type="number"
          placeholder="Sale Price"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          style={styles.input}
          onFocus={resetError}
        />
        <input
          type="number"
          placeholder="Sale Benefit"
          value={saleBenefit}
          onChange={(e) => setSaleBenefit(e.target.value)}
          style={styles.input}
          onFocus={resetError}
        />
        <button
          onClick={handleAddIncome}
          disabled={loading}
          style={styles.button}
        >
          {loading ? "Adding..." : "Add Income"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    textAlign: "center",
    fontSize: "24px",
    color: "black",
    marginBottom: "20px",
  },
  subHeader: {
    fontSize: "20px",
    marginBottom: "10px",
  },
  loading: {
    textAlign: "center",
    fontSize: "16px",
    color: "#555",
  },
  totalsContainer: {
    marginBottom: "20px",
  },
  totalItem: {
    margin: "5px 0",
    fontSize: "16px",
  },
  error: {
    color: "red",
    fontSize: "14px",
    textAlign: "center",
    marginTop: "10px",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "20px",
  },
  input: {
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    padding: "10px",
    fontSize: "16px",
    color: "#fff",
    backgroundColor: "#007BFF",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  buttonDisabled: {
    backgroundColor: "#ddd",
    cursor: "not-allowed",
  },
};

export default Income;
