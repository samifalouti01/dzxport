import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./NavBar.css";

const NavBar = () => {
  const location = useLocation();

  return (
    <>
      <nav className="navbar">
        <Link
            to="/main"
            className={`nav-item ${location.pathname === "/main" ? "active" : ""}`}
        >
            <i className={`bi ${location.pathname === "/main" ? "bi-house-door-fill" : "bi-house"} nav-icon`}></i>
            <span className="nav-text">Accueil</span>
        </Link>

        <Link
            to="/main/accepter"
            className={`nav-item ${location.pathname === "/main/accepter" ? "active" : ""}`}
        >
            <i className={`bi ${location.pathname === "/main/accepter" ? "bi-check-circle-fill" : "bi-check-circle"} nav-icon`}></i>
            <span className="nav-text">Accepté</span>
        </Link>

        <Link
            to="/main/posts"
            className={`nav-item ${location.pathname === "/main/posts" ? "active" : ""}`}
        >
            <i className={`bi ${location.pathname === "/main/posts" ? "bi-file-earmark-richtext-fill" : "bi-file-earmark-richtext"} nav-icon`}></i>
            <span className="nav-text">Mes Posts</span>
        </Link>

        <Link
            to="/main/transiteurs"
            className={`nav-item ${location.pathname === "/main/transiteurs" ? "active" : ""}`}
        >
            <i className={`bi ${location.pathname === "/main/transiteurs" ? "bi-train-freight-front-fill" : "bi-train-freight-front"} nav-icon`}></i>
            <span className="nav-text">Transit</span>
        </Link>

        <Link
            to="/main/profile"
            className={`nav-item ${location.pathname === "/main/profile" ? "active" : ""}`}
        >
            <i className={`bi ${location.pathname === "/main/profile" ? "bi-person-fill" : "bi-person"} nav-icon`}></i>
            <span className="nav-text">Profile</span>
        </Link>
      </nav>
    </>
  );
};

export default NavBar;
