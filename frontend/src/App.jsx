import { useEffect, useState } from "react";
import { API_URL } from "./config";
import "./App.css";
import UserPage from "./pages/UserPage.jsx";
import TechnicianPage from "./pages/TechnicianPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

function App() {
  const [currentPage, setCurrentPage] =
    useState("login");

  const [isCheckingAuth, setIsCheckingAuth] =
    useState(true);

  const [ticketRefresh, setTicketRefresh] =
    useState(0);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [loginDraft, setLoginDraft] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    async function restoreLogin() {
      const token = localStorage.getItem("token");

      if (!token) {
        setCurrentPage("login");
        setIsCheckingAuth(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              "Unable to restore login."
          );
        }

        setCurrentUser(data.user);

        if (
          data.user.role === "technician" ||
          data.user.role === "admin"
        ) {
          setCurrentPage("technician");
        } else {
          setCurrentPage("user");
        }
      } catch (error) {
        console.error(
          "Unable to restore login:",
          error
        );

        localStorage.removeItem("token");

        setCurrentUser(null);

        setCurrentPage("login");
      } finally {
        setIsCheckingAuth(false);
      }
    }

    restoreLogin();
  }, []);

  function handleLogin(user) {
    setCurrentUser(user);

    setLoginDraft({
      email: "",
      password: "",
    });

    if (
      user.role === "technician" ||
      user.role === "admin"
    ) {
      setCurrentPage("technician");
    } else {
      setCurrentPage("user");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");

    setCurrentUser(null);

    setCurrentPage("login");
  }

  function handlePortalClick() {
    if (!currentUser) {
      setCurrentPage("login");
      return;
    }

    if (
      currentUser.role === "technician" ||
      currentUser.role === "admin"
    ) {
      setCurrentPage("technician");
    } else {
      setCurrentPage("user");
    }
  }

  function handleTicketCreated() {
    setTicketRefresh(
      (previousValue) => previousValue + 1
    );
  }

  if (isCheckingAuth) {
    return (
      <div className="app">
        <p>Checking login...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <button
          type="button"
          className="brand-button"
          onClick={handlePortalClick}
          aria-label="Open portal"
        >
          <span className="brand-mark">
            IT
          </span>

          <span className="brand-copy">
            <strong>Help Desk</strong>

            <small>
              Ticket System
            </small>
          </span>
        </button>

        <div className="header-actions">
          {currentUser && (
            <div className="user-chip">
              <span className="user-avatar">
                {currentUser.name
                  ?.charAt(0)
                  ?.toUpperCase() || "U"}
              </span>

              <span className="user-chip-copy">
                <strong>
                  {currentUser.name}
                </strong>

                <small>
                  {currentUser.role}
                </small>
              </span>
            </div>
          )}

          <nav className="navigation">
            <button
              type="button"
              onClick={handlePortalClick}
              disabled={
                currentPage === "user" ||
                currentPage ===
                  "technician" ||
                currentPage === "login"
              }
            >
              Portal
            </button>

            <button
              type="button"
              onClick={() =>
                setCurrentPage("demo")
              }
              disabled={
                currentPage === "demo"
              }
            >
              Demo Accounts
            </button>

            {currentUser && (
              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Log Out
              </button>
            )}
          </nav>
        </div>
      </header>

      <main>
        {currentPage === "login" && (
          <LoginPage
            onLogin={handleLogin}
            loginDraft={loginDraft}
            setLoginDraft={setLoginDraft}
          />
        )}

        {currentPage === "user" &&
          currentUser && (
            <UserPage
              onTicketCreated={
                handleTicketCreated
              }
              currentUser={currentUser}
              onRequireLogin={() =>
                setCurrentPage("login")
              }
            />
          )}

        {currentPage === "technician" &&
          currentUser &&
          (currentUser.role ===
            "technician" ||
            currentUser.role ===
              "admin") && (
            <TechnicianPage
              ticketRefresh={
                ticketRefresh
              }
            />
          )}

        {currentPage === "demo" && (
          <div className="demo-accounts-page">
            <h2>
              Demo Accounts
            </h2>

            <p className="demo-accounts-description">
              Use these accounts to
              test the different roles
              in the IT Help Desk Ticket
              System.
            </p>

            <div className="demo-account-card">
              <h3>
                Technician Account
              </h3>

              <p>
                <strong>
                  Email:
                </strong>{" "}
                anh@example.com
              </p>

              <p>
                <strong>
                  Password:
                </strong>{" "}
                DemoHelpdeskTech!2026
              </p>
            </div>

            <div className="demo-account-card">
              <h3>
                User Account 1
              </h3>

              <p>
                <strong>
                  Email:
                </strong>{" "}
                user1@example.com
              </p>

              <p>
                <strong>
                  Password:
                </strong>{" "}
                DemoHelpdeskUser1!2026
              </p>
            </div>

            <div className="demo-account-card">
              <h3>
                User Account 2
              </h3>

              <p>
                <strong>
                  Email:
                </strong>{" "}
                user2@example.com
              </p>

              <p>
                <strong>
                  Password:
                </strong>{" "}
                DemoHelpdeskUser2!2026
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;