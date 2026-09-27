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
      <div className="empty-state-card">
        <div className="empty-state-icon">?</div>
        <h1>User Portal</h1>
        <p>
          Please log in to submit and view your
          support tickets.
        </p>

        <button
          type="button"
          className="submit-button"
          onClick={onRequireLogin}
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="user-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Support Center</span>
          <h1>User Portal</h1>
          <p>
            Create a request, track its progress, and
            keep the conversation in one place.
          </p>
        </div>

        <div className="account-summary">
          <span className="account-summary-label">
            Signed in as
          </span>
          <strong>{currentUser.name}</strong>
          <small>{currentUser.email}</small>
        </div>
      </div>

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

      <div className="user-portal-grid">
        <section className="portal-panel create-ticket-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">New request</span>
              <h2>Submit a Support Ticket</h2>
            </div>
          </div>

          <form
            className="create-ticket-form"
            onSubmit={handleCreateTicket}
          >
            <label className="field-group">
              <span>Title</span>
              <input
                type="text"
                placeholder="Brief summary of the issue"
                value={newTitle}
                onChange={(event) =>
                  setNewTitle(event.target.value)
                }
                required
              />
            </label>

            <div className="form-row">
              <label className="field-group">
                <span>Category</span>
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
              </label>

              <label className="field-group">
                <span>Priority</span>
                <select
                  value={newPriority}
                  onChange={(event) =>
                    setNewPriority(event.target.value)
                  }
                >
                  <option value="">
                    Low (default)
                  </option>
                  <option value="low">Low</option>
                  <option value="medium">
                    Medium
                  </option>
                  <option value="high">High</option>
                  <option value="urgent">
                    Urgent
                  </option>
                </select>
              </label>
            </div>

            <label className="field-group">
              <span>Description</span>
              <textarea
                placeholder="Describe what happened, what you expected, and anything you already tried."
                value={newDescription}
                onChange={(event) =>
                  setNewDescription(event.target.value)
                }
                rows={6}
                required
              />
            </label>

            <button
              type="submit"
              className="submit-button"
              disabled={isCreating}
            >
              {isCreating
                ? "Creating ticket..."
                : "Submit Ticket"}
            </button>
          </form>
        </section>

        <section className="portal-panel tickets-panel">
          <div className="section-heading section-heading-row">
            <div>
              <span className="eyebrow">Your requests</span>
              <h2>My Tickets</h2>
            </div>

            {!isLoadingTickets && (
              <span className="count-pill">
                {tickets.length}
              </span>
            )}
          </div>

          {isLoadingTickets && (
            <div className="inline-empty-state">
              Loading tickets...
            </div>
          )}

          {!isLoadingTickets &&
            tickets.length === 0 && (
              <div className="inline-empty-state">
                <strong>No tickets yet</strong>
                <span>
                  Your submitted support requests will
                  appear here.
                </span>
              </div>
            )}

          {!isLoadingTickets &&
            tickets.map((ticket) => {
              const isExpanded =
                expandedTicketId === ticket.id;

              const comments =
                ticketComments[ticket.id] || [];

              const activity =
                ticketActivity[ticket.id] || [];

              const statusClass = String(
                ticket.status || "open"
              ).replace(/\s+/g, "-");

              const priorityClass = String(
                ticket.priority || "low"
              ).replace(/\s+/g, "-");

              return (
                <article
                  className="user-ticket-card"
                  key={ticket.id}
                >
                  <div className="ticket-card-header">
                    <div>
                      <span className="ticket-number">
                        Ticket #{ticket.id}
                      </span>
                      <h3>{ticket.title}</h3>
                    </div>

                    <span
                      className={`ticket-badge status-${statusClass}`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <div className="ticket-badges">
                    <span className="ticket-badge neutral-badge">
                      {ticket.category}
                    </span>

                    <span
                      className={`ticket-badge priority-${priorityClass}`}
                    >
                      {ticket.priority} priority
                    </span>
                  </div>

                  <p className="ticket-description">
                    {ticket.description}
                  </p>

                  <div className="ticket-info-grid">
                    <div>
                      <span>Assigned to</span>
                      <strong>
                        {ticket.assigned_to_name ||
                          "Unassigned"}
                      </strong>
                    </div>

                    <div>
                      <span>Created</span>
                      <strong>
                        {new Date(
                          ticket.created_at
                        ).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div className="ticket-card-actions">
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
                  </div>

                  {isExpanded && (
                    <div className="user-ticket-details">
                      <div className="details-grid">
                        <div className="user-ticket-notes">
                          <div className="details-heading">
                            <h4>Conversation</h4>
                            <span>
                              {comments.length} message
                              {comments.length === 1 ? "" : "s"}
                            </span>
                          </div>

                          {comments.length === 0 ? (
                            <div className="inline-empty-state compact">
                              No messages yet.
                            </div>
                          ) : (
                            comments.map((comment) => (
                              <div
                                className="user-ticket-note"
                                key={comment.id}
                              >
                                <p>{comment.comment}</p>
                                <small>
                                  {comment.author}
                                  {" · "}
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
                              className="submit-button"
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
                          <div className="details-heading">
                            <h4>Activity</h4>
                            <span>
                              {activity.length} event
                              {activity.length === 1 ? "" : "s"}
                            </span>
                          </div>

                          {activity.length === 0 ? (
                            <div className="inline-empty-state compact">
                              No activity recorded yet.
                            </div>
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
                                  {entry.performed_by ||
                                    "System"}
                                  {" · "}
                                  {new Date(
                                    entry.created_at
                                  ).toLocaleString()}
                                </small>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
        </section>
      </div>
    </div>
  );
}

export default UserPage;
