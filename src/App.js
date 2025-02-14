import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginSignup from './routes/LoginSignup/LoginSignup';
import MainExportator from './routes/Exportator/pages/Main';
import Home from './routes/Exportator/pages/Home';
import Profile from './routes/Exportator/pages/Profile';
import AddPost from './routes/Exportator/pages/AddPost';
import MainMediator from './routes/Mediator/pages/Main';
import HomeM from './routes/Mediator/pages/Home';
import ProfileM from './routes/Mediator/pages/Profile';
import Create from './routes/Mediator/pages/Create';
import Containers from './routes/Mediator/pages/Containers';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/exportator" element={<MainExportator />}>
          <Route index element={<Home />} />
          <Route path="profile" element={<Profile />} /> 
          <Route path="addpost" element={<AddPost />} />
        </Route>
        <Route path="/mediator" element={<MainMediator />}>
          <Route index element={<HomeM />} />
          <Route path="profile" element={<ProfileM />} /> 
          <Route path="containers" element={<Containers />} />
          <Route path="create" element={<Create />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;