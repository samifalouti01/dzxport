import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';

const NavBar = () => {
  const location = useLocation(); // Get current route location

  return (
    <nav className="navbar">
        <Link
            to="/exportator"
            className={`nav-item ${location.pathname === "/exportator" ? "active" : ""}`}
        >
            <i className="bi bi-house nav-icon"></i> {/* Bootstrap Home Icon */}
            <span className="nav-text">Home</span>
        </Link>
        <Link
            to="/exportator/addpost"
            className={`nav-item ${location.pathname === "/exportator/addpost" ? "active" : ""}`}
        >
            <i className="bi bi-plus-square nav-icon"></i> {/* Bootstrap Plus Square Icon */}
            <span className="nav-text">Add Post</span>
        </Link>
        <Link
            to="/exportator/profile"
            className={`nav-item ${location.pathname === "/exportator/profile" ? "active" : ""}`}
        >
            <i className="bi bi-person nav-icon"></i> {/* Bootstrap Person Icon */}
            <span className="nav-text">Profile</span>
        </Link>
    </nav>
);
};

export default NavBar;