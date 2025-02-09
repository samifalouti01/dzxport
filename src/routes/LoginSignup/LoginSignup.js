import React, { useState } from 'react';
import './LoginSignup.css';
import { supabase } from '../../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const LoginSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Exportator'); // Default role
  const [isSignUp, setIsSignUp] = useState(false);
  const [notification, setNotification] = useState('');
  const navigate = useNavigate();

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      showNotification("Email and password are required.");
      return;
    }

    try {
      if (isSignUp) {
        // Sign up logic
        const { data, error } = await supabase
          .from("users")
          .insert([{ email, password, role }]) // Add role to the signup data
          .select("*")
          .single();

        if (error) {
          console.error("Error signing up:", error.message);
          showNotification("Error signing up. Please try again.");
        } else {
          console.log("User signed up successfully:", data);
          localStorage.setItem("id", data.id);
          showNotification("Signup successful! Redirecting...");

          // Navigate to the role-specific page
          if (role === "Exportator") {
            navigate("/exportator");
          } else if (role === "Mediator") {
            navigate("/mediator");
          }
        }
      } else {
        // Login logic
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .eq("password", password)
          .single();

        if (error || !data) {
          console.error("Invalid login credentials:", error?.message || "User not found");
          showNotification("Invalid login credentials. Please try again.");
        } else {
          console.log("User logged in successfully:", data);
          localStorage.setItem("id", data.id);

          // Navigate based on role
          if (data.role === "Exportator") {
            navigate("/exportator");
          } else if (data.role === "Mediator") {
            navigate("/mediator");
          } else {
            showNotification("Invalid role. Please contact support.");
          }
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      showNotification("Unexpected error. Please try again.");
    }
  };

  return (
    <div className="login-signup">
      {notification && <div className="notification">{notification}</div>}
      <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {isSignUp && (
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="Exportator">Exportator</option>
          <option value="Mediator">Mediator</option>
        </select>
      )}
      <button onClick={handleSubmit}>{isSignUp ? 'Sign Up' : 'Login'}</button>
      <p onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
      </p>
    </div>
  );
};

export default LoginSignup;
