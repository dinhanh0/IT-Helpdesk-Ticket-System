import { useState } from "react";
import { API_URL } from "../config";

function LoginPage({
  onLogin,
  loginDraft,
  setLoginDraft,
}) {
  const [errorMessage, setErrorMessage] =
    useState("");

  const [isLoggingIn, setIsLoggingIn] =
    useState(false);

  const email = loginDraft.email;
  const password = loginDraft.password;

  function handleEmailChange(event) {
    setLoginDraft((previous) => ({
      ...previous,
      email: event.target.value,
    }));
  }

  function handlePasswordChange(event) {
    setLoginDraft((previous) => ({
      ...previous,
      password: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage(
        "Email and password are required."
      );
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to log in."
        );
      }

      localStorage.setItem(
        "token",
        data.token
      );

      if (typeof onLogin === "function") {
        onLogin(data.user);
      }
    } catch (error) {
      console.error(
        "Error logging in:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to log in."
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="login-page">
      <h1>Account Login</h1>

      <p>
        Log in to access your support account.
      </p>

      <form
        className="login-form"
        onSubmit={handleSubmit}
      >
        {errorMessage && (
          <p className="error-message">
            {errorMessage}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={handleEmailChange}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
          required
        />

        <button
          type="submit"
          disabled={isLoggingIn}
        >
          {isLoggingIn
            ? "Logging in..."
            : "Log In"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;