import { useState } from "react";
import "./App.css";
import UserPage from "./pages/UserPage.jsx";
import TechnicianPage from "./pages/TechnicianPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

function App() {
  const [currentPage, setCurrentPage] = useState("user");
  const [ticketRefresh, setTicketRefresh] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  function handleLogin(user){
    setCurrentUser(user);
    setCurrentPage("technician")
  }

  function handleTicketCreated() {
    setTicketRefresh((previousValue) => previousValue + 1);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>IT Help Desk Ticket System</h1>

        <nav className="navigation">
          <button
            type="button"
            onClick={() => setCurrentPage("user")}
            disabled={currentPage === "user"}
          >
            User Portal
          </button>

          <button
            type="button"
            onClick={() => 
              setCurrentPage(
                currentUser ? "technician" : "login"
              )
            }
            disabled={currentPage === "technician"}
          >
            Technician Portal
          </button>
        </nav>
      </header>

      <main>
        {currentPage === "user" && (
          <UserPage onTicketCreated={handleTicketCreated} />
        )}

        {currentPage === "login" && (
          <LoginPage
            onLogin = {handleLogin}
          />
        )}

        {currentPage === "technician" && (
          <TechnicianPage ticketRefresh={ticketRefresh} />
        )}
      </main>
    </div>
  );
}

export default App;