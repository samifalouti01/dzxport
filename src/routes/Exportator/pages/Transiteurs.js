import React, { useState } from 'react';
import { Search, Loader2, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';
import NavBar from '../components/NavBar';
import './Transiteurs.css';

const Transiteurs = () => {

  return (
    <>
      <div>
        <h1>Transiteurs</h1>
      </div>
      <NavBar />
    </>
  );
};

export default Transiteurs;
