import { useState } from "react";
import { API_URL } from "../config";

function UserPage({ onTicketCreated }) {
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateTicket(event) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (
      !newName.trim() ||
      !newEmail.trim() ||
      !newTitle.trim() ||
      !newCategory ||
      !newDescription.trim()
    ) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          title: newTitle.trim(),
          category: newCategory,
          priority: newPriority || "low",
          description: newDescription.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to create ticket."
        );
      }

      setSuccessMessage("Ticket created successfully.");

      if (typeof onTicketCreated === "function") {
        onTicketCreated();
      }

      setNewName("");
      setNewEmail("");
      setNewTitle("");
      setNewCategory("");
      setNewPriority("");
      setNewDescription("");
    } catch (error) {
      console.error("Error creating ticket:", error);

      setErrorMessage(
        error.message || "Unable to create ticket."
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="user-page">
      <h1>User Portal</h1>
      <p>Submit a new support ticket.</p>

      <form
        className="create-ticket-form"
        onSubmit={handleCreateTicket}
      >
        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}

        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}

        <input
          type="text"
          placeholder="Name"
          value={newName}
          onChange={(event) =>
            setNewName(event.target.value)
          }
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={newEmail}
          onChange={(event) =>
            setNewEmail(event.target.value)
          }
          required
        />

        <input
          type="text"
          placeholder="Ticket title"
          value={newTitle}
          onChange={(event) =>
            setNewTitle(event.target.value)
          }
          required
        />

        <select
          value={newCategory}
          onChange={(event) =>
            setNewCategory(event.target.value)
          }
          required
        >
          <option value="">Select a category</option>
          <option value="Hardware">Hardware</option>
          <option value="Software">Software</option>
          <option value="Network">Network</option>
          <option value="Account">Account</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={newPriority}
          onChange={(event) =>
            setNewPriority(event.target.value)
          }
        >
          <option value="">Default priority: Low</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <textarea
          placeholder="Describe the problem"
          value={newDescription}
          onChange={(event) =>
            setNewDescription(event.target.value)
          }
          rows={4}
          required
        />

        <button
          type="submit"
          className="submit-button"
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : "Submit Ticket"}
        </button>
      </form>
    </div>
  );
}

export default UserPage;