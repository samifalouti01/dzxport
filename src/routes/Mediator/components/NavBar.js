import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';

const NavBar = () => {
  const location = useLocation(); // Get current route location

  return (
    <nav className="navbar">
        <Link
            to="/mediator"
            className={`nav-item ${location.pathname === "/mediator" ? "active" : ""}`}
        >
            <i className="bi bi-house nav-icon"></i> {/* Bootstrap Home Icon */}
            <span className="nav-text">Home</span>
        </Link>
        <Link
            to="/mediator/containers"
            className={`nav-item ${location.pathname === "/mediator/containers" ? "active" : ""}`}
        >
            <i className="bi bi-box-seam nav-icon"></i> {/* Bootstrap Person Icon */}
            <span className="nav-text">Containers</span>
        </Link>
        <Link
            to="/mediator/create"
            className={`nav-item ${location.pathname === "/mediator/create" ? "active" : ""}`}
        >
            <i className="bi bi-plus-square nav-icon"></i> {/* Bootstrap Plus Square Icon */}
            <span className="nav-text">Create</span>
        </Link>
        <Link
            to="/mediator/profile"
            className={`nav-item ${location.pathname === "/mediator/profile" ? "active" : ""}`}
        >
            <i className="bi bi-person nav-icon"></i> {/* Bootstrap Person Icon */}
            <span className="nav-text">Profile</span>
        </Link>
    </nav>
);
};

export default NavBar;