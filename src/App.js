import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginSignup from './routes/LoginSignup/LoginSignup';
import MainExportator from './routes/Exportator/pages/Main';
import Home from './routes/Exportator/pages/Home';
import Profile from './routes/Exportator/pages/Profile';
import AddPost from './routes/Exportator/pages/AddPost';
import Transiteurs from './routes/Exportator/pages/Transiteurs';
import Accepter from './routes/Exportator/pages/Accepter';
import Notifications from './routes/Exportator/pages/Notifications';
import AcceptedPreview from './routes/Exportator/pages/AcceptedPreview';
import Posts from './routes/Exportator/pages/Posts';
import EditPost from './routes/Exportator/pages/EditPost';
import MainMediator from './routes/Mediator/pages/Main';
import HomeM from './routes/Mediator/pages/Home';
import ProfileM from './routes/Mediator/pages/Profile';
import Create from './routes/Mediator/pages/Create';
import Containers from './routes/Mediator/pages/Containers';
import Notifi from './routes/Mediator/pages/Notifications';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/main" element={<MainExportator />}>
          <Route index element={<Home />} />
          <Route path="transiteurs" element={<Transiteurs />} /> 
          <Route path="accepter" element={<Accepter />} /> 
          <Route path="profile" element={<Profile />} /> 
          <Route path="addpost" element={<AddPost />} />
          <Route path="posts" element={<Posts />} />
          <Route path="edit-post/:postId" element={<EditPost />} />
          <Route path="notification/:postId" element={<Notifications />} />
          <Route path="accepted-preview/:postId" element={<AcceptedPreview />} />
        </Route>
        <Route path="/transit" element={<MainMediator />}>
          <Route index element={<HomeM />} />
          <Route path="profile" element={<ProfileM />} /> 
          <Route path="containers" element={<Containers />} />
          <Route path="create" element={<Create />} />
          <Route path="notification/:transitId" element={<Notifi />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;