import React from "react";
import { Outlet } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import Header from "../components/Header";
import "./Main.css";

const Main = () => {

  return (
    <div className="Main">
      <Header />
      <div className="main-container">
        <Outlet />
      </div>
    </div>
  );
};

export default Main;
