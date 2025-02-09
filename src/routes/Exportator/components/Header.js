import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from "react-icons/fi";
import Logo from '../logo192.png';
import './Header.css';

const Header = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            navigate("/");
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setLoading(false);
        }
    };

  return (
    <header className="header">
      <div className="logo-container">
        <img src={Logo} alt="Logo" className="logo" />
      </div>
        <button
            className="logout-button"
            onClick={handleLogout}
            disabled={loading}
            aria-busy={loading}
        >
            {loading ? (
                <div className="spinner" aria-hidden="true"></div>
            ) : (
                <>
                    <FiLogOut className="logout-icon" /> Logout
                </>
            )}
        </button>
    </header>
  );
};

export default Header;