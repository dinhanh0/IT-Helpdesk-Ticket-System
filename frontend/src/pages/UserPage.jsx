import { useEffect, useState } from "react";
import { API_URL } from "../config";

function UserPage({
  onTicketCreated,
  currentUser,
  onRequireLogin,
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [tickets, setTickets] = useState([]);

  const [expandedTicketId, setExpandedTicketId] =
    useState(null);

  const [ticketComments, setTicketComments] =
    useState({});

  const [ticketActivity, setTicketActivity] =
    useState({});

  const [replyText, setReplyText] =
    useState({});

  const [loadingDetailsId, setLoadingDetailsId] =
    useState(null);

  const [sendingReplyId, setSendingReplyId] =
    useState(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isCreating, setIsCreating] =
    useState(false);

  const [isLoadingTickets, setIsLoadingTickets] =
    useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchMyTickets();
    }
  }, [currentUser]);

  async function fetchMyTickets() {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    setIsLoadingTickets(true);

    try {
      const response = await fetch(
        `${API_URL}/api/my-tickets`,
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
            "Unable to load your tickets."
        );
      }

      setTickets(data.tickets || []);
    } catch (error) {
      console.error(
        "Error loading user tickets:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to load your tickets."
      );
    } finally {
      setIsLoadingTickets(false);
    }
  }

  async function fetchTicketDetails(ticketId) {
    const token = localStorage.getItem("token");

    if (!token) {
      setErrorMessage(
        "Your login session is missing. Please log in again."
      );
      return;
    }

    setLoadingDetailsId(ticketId);

    try {
      const [
        commentsResponse,
        activityResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/api/tickets/${ticketId}/comments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        fetch(
          `${API_URL}/api/tickets/${ticketId}/activity`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      const commentsData =
        await commentsResponse.json();

      const activityData =
        await activityResponse.json();

      if (!commentsResponse.ok) {
        throw new Error(
          commentsData.message ||
            commentsData.error ||
            "Unable to load conversation."
        );
      }

      if (!activityResponse.ok) {
        throw new Error(
          activityData.message ||
            activityData.error ||
            "Unable to load ticket activity."
        );
      }

      setTicketComments((previous) => ({
        ...previous,
        [ticketId]:
          commentsData.comments || [],
      }));

      setTicketActivity((previous) => ({
        ...previous,
        [ticketId]:
          activityData.activity || [],
      }));
    } catch (error) {
      console.error(
        "Error loading ticket details:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to load ticket details."
      );
    } finally {
      setLoadingDetailsId(null);
    }
  }

  async function handleCreateTicket(event) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!currentUser) {
      setErrorMessage(
        "Please log in before submitting a ticket."
      );
      return;
    }

    if (
      !newTitle.trim() ||
      !newCategory ||
      !newDescription.trim()
    ) {
      setErrorMessage(
        "Please fill out all required fields."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorMessage(
        "Your login session is missing. Please log in again."
      );
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch(
        `${API_URL}/api/tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            title: newTitle.trim(),
            category: newCategory,
            priority: newPriority || "low",
            description: newDescription.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to create ticket."
        );
      }

      setSuccessMessage(
        "Ticket created successfully."
      );

      setNewTitle("");
      setNewCategory("");
      setNewPriority("");
      setNewDescription("");

      if (typeof onTicketCreated === "function") {
        onTicketCreated();
      }

      await fetchMyTickets();
    } catch (error) {
      console.error(
        "Error creating ticket:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to create ticket."
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleDetails(ticketId) {
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
      return;
    }

    setExpandedTicketId(ticketId);

    const alreadyLoaded =
      ticketComments[ticketId] !== undefined &&
      ticketActivity[ticketId] !== undefined;

    if (!alreadyLoaded) {
      await fetchTicketDetails(ticketId);
    }
  }

  async function handleSendReply(ticketId) {
    const comment =
      replyText[ticketId]?.trim();

    if (!comment) {
      setErrorMessage(
        "Please enter a reply before sending."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorMessage(
        "Your login session is missing. Please log in again."
      );
      return;
    }

    setSendingReplyId(ticketId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/tickets/${ticketId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to send reply."
        );
      }

      setReplyText((previous) => ({
        ...previous,
        [ticketId]: "",
      }));

      setSuccessMessage(
        "Reply sent successfully."
      );

      await fetchTicketDetails(ticketId);
    } catch (error) {
      console.error(
        "Error sending reply:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to send reply."
      );
    } finally {
      setSendingReplyId(null);
    }
  }

  if (!currentUser) {
    return (
      <div className="user-page">
        <h1>User Portal</h1>

        <p>
          Please log in to submit and view your
          support tickets.
        </p>

        <button
          type="button"
          onClick={onRequireLogin}
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="user-page">
      <h1>User Portal</h1>

      <p>
        Logged in as{" "}
        <strong>{currentUser.name}</strong>
      </p>

      <p>{currentUser.email}</p>

      <h2>Submit a Support Ticket</h2>

      <form
        className="create-ticket-form"
        onSubmit={handleCreateTicket}
      >
        {errorMessage && (
          <p className="error-message">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="success-message">
            {successMessage}
          </p>
        )}

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
          <option value="">
            Select a category
          </option>

          <option value="Hardware">
            Hardware
          </option>

          <option value="Software">
            Software
          </option>

          <option value="Network">
            Network
          </option>

          <option value="Account">
            Account
          </option>

          <option value="Other">
            Other
          </option>
        </select>

        <select
          value={newPriority}
          onChange={(event) =>
            setNewPriority(event.target.value)
          }
        >
          <option value="">
            Default priority: Low
          </option>

          <option value="low">
            Low
          </option>

          <option value="medium">
            Medium
          </option>

          <option value="high">
            High
          </option>

          <option value="urgent">
            Urgent
          </option>
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
          {isCreating
            ? "Creating..."
            : "Submit Ticket"}
        </button>
      </form>

      <section className="my-tickets">
        <h2>My Tickets</h2>

        {isLoadingTickets && (
          <p>Loading tickets...</p>
        )}

        {!isLoadingTickets &&
          tickets.length === 0 && (
            <p>
              You haven't submitted any tickets yet.
            </p>
          )}

        {!isLoadingTickets &&
          tickets.map((ticket) => {
            const isExpanded =
              expandedTicketId === ticket.id;

            const comments =
              ticketComments[ticket.id] || [];

            const activity =
              ticketActivity[ticket.id] || [];

            return (
              <div
                className="user-ticket-card"
                key={ticket.id}
              >
                <h3>{ticket.title}</h3>

                <p>
                  <strong>Ticket ID:</strong>{" "}
                  {ticket.id}
                </p>

                <p>
                  <strong>Category:</strong>{" "}
                  {ticket.category}
                </p>

                <p>
                  <strong>Priority:</strong>{" "}
                  {ticket.priority}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {ticket.status}
                </p>

                <p>
                  <strong>Assigned to:</strong>{" "}
                  {ticket.assigned_to_name ||
                    "Unassigned"}
                </p>

                <p>
                  <strong>Description:</strong>{" "}
                  {ticket.description}
                </p>

                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(
                    ticket.created_at
                  ).toLocaleString()}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleToggleDetails(ticket.id)
                  }
                  disabled={
                    loadingDetailsId === ticket.id
                  }
                >
                  {loadingDetailsId === ticket.id
                    ? "Loading..."
                    : isExpanded
                      ? "Hide Details"
                      : "View Details"}
                </button>

                {isExpanded && (
                  <div className="user-ticket-details">
                    <div className="user-ticket-notes">
                      <h4>Conversation</h4>

                      {comments.length === 0 ? (
                        <p>
                          No messages yet.
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div
                            className="user-ticket-note"
                            key={comment.id}
                          >
                            <p>{comment.comment}</p>

                            <small>
                              {comment.author}
                              {" — "}
                              {new Date(
                                comment.created_at
                              ).toLocaleString()}
                            </small>
                          </div>
                        ))
                      )}

                      <div className="ticket-reply-form">
                        <textarea
                          rows={3}
                          placeholder="Write a reply..."
                          value={
                            replyText[ticket.id] || ""
                          }
                          onChange={(event) =>
                            setReplyText(
                              (previous) => ({
                                ...previous,
                                [ticket.id]:
                                  event.target.value,
                              })
                            )
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            handleSendReply(ticket.id)
                          }
                          disabled={
                            sendingReplyId ===
                            ticket.id
                          }
                        >
                          {sendingReplyId ===
                          ticket.id
                            ? "Sending..."
                            : "Send Reply"}
                        </button>
                      </div>
                    </div>

                    <div className="user-ticket-activity">
                      <h4>Activity History</h4>

                      {activity.length === 0 ? (
                        <p>
                          No activity recorded yet.
                        </p>
                      ) : (
                        activity.map((entry) => (
                          <div
                            className="user-activity-entry"
                            key={entry.id}
                          >
                            <p>
                              {entry.description}
                            </p>

                            <small>
                              {entry.performed_by}
                              {" — "}
                              {new Date(
                                entry.created_at
                              ).toLocaleString()}
                            </small>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </section>
    </div>
  );
}

export default UserPage;