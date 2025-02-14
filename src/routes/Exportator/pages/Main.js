import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Outlet } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import Header from "../components/Header";
import "./Main.css";

const queryClient = new QueryClient();

const Main = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="Main">
        <Header />
        <div className="main-container">
          <Outlet />
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default Main;
