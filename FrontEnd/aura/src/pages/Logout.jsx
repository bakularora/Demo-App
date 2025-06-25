import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const [clientId, setClientId] = useState(null);
  const navigate = useNavigate();

  // Fetch the client_id from the backend API
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/google-client-id`) // Backend endpoint
      .then((response) => {
        setClientId(response.data.googleClientId);
      })
      .catch((error) => {
        console.error("Error fetching Google client ID:", error);
      });
  }, []);

  // Initialize Google API once the client_id is available
  useEffect(() => {
    if (clientId) {
      window.gapi.load("auth2", () => {
        window.gapi.auth2.init({
          client_id: clientId,
        });
      });
    }
  }, [clientId]);

  const handleLogout = () => {
    if (window.gapi) {
      // Log out from Google first
      window.gapi.auth2
        .getAuthInstance()
        .signOut()
        .then(() => {
          console.log("User signed out from Google");

          // Then log out from your backend
          axios
            .post(`${import.meta.env.VITE_BACKEND_URL}/logout`, {}, { withCredentials: true })
            .then((response) => {
              if (response.status === 200) {
                console.log("Logged out from backend successfully");
                navigate("/"); // Redirect to home page or login page
              }
            })
            .catch((error) => {
              console.log("Error logging out from backend:", error);
            });
        });
    } else {
      console.error("Google API is not loaded");
    }
  };

  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Logout;
