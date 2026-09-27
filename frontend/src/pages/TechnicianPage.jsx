import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../config";

function TechnicianPage({ ticketRefresh }) {
  const token = localStorage.getItem("token")

  const [tickets, setTickets] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  const [isLoadingTickets, setIsLoadingTickets] =
    useState(false);

  const [deletingTicketId, setDeletingTicketId] =
    useState(null);

  const [updatingTicketId, setUpdatingTicketId] =
    useState(null);

  const [assigningTicketId, setAssigningTicketId] =
    useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [commentsByTicket, setCommentsByTicket] =
  useState({});

  const [commentInputs, setCommentInputs] =
    useState({});

  const [loadingCommentsTicketId, setLoadingCommentsTicketId] =
    useState(null);

  const [addingCommentTicketId, setAddingCommentTicketId] =
    useState(null);

  const [openCommentsTicketId, setOpenCommentsTicketId] =
    useState(null);

  const [activityByTicket, setActivityByTicket] = useState({});
  const [loadingActivityTicketId, setLoadingActivityTicketId] = useState(null);
  const [openActivityTicketId, setOpenActivityTicketId] = useState(null)

  const [analytics, setAnalytics] = useState({
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    resolved_tickets: 0,
    closed_tickets: 0,
    urgent_tickets: 0,
    unassigned_tickets: 0,
    average_resolution_hours: null
  })

  const [isLoadingAnalytics, setIsloadingAnalytics] = useState(false)

  const [technicians, setTechnicians] = useState([])

  const fetchTechicians = useCallback(async () => {
    try {
      const response = await fetch (
        `${API_URL}/api/users/technicians`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json();

      if(!response.ok){
        throw new Error (
          data.message ||
            data.error ||
            "Unable to retrieve technicians."
        )
      }

      setTechnicians(data.technicians || [])
    } catch(error) {
      console.error(
        "Error fetching technicians:",
        error
      )

      setErrorMessage(
        error.message || 
          "Unable to retrieve technicians"
      )
    }
  }, [token])

  const fetchAnalytics = useCallback(async () => {
    setIsloadingAnalytics(true);

    try{
      const response = await fetch (
        `${API_URL}/api/tickets/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if(!response.ok){
        throw new Error(
          data.message ||
            data.error ||
            "Unable to retrieve ticket analytics"
        )
      }

      setAnalytics({
        total_tickets: data.total_tickets || 0,
        open_tickets: data.open_tickets || 0,
        in_progress_tickets:
          data.in_progress_tickets || 0,
        resolved_tickets: data.resolved_tickets || 0,
        closed_tickets: data.closed_tickets || 0,
        urgent_tickets: data.urgent_tickets || 0,
        unassigned_tickets:
          data.unassigned_tickets || 0,
        average_resolution_hours: data.average_resolution_hours,
      });
    } catch (error) {
      console.error(
        "Error fetching analytics:", error
      )
    } finally {
      setIsloadingAnalytics(false);
    }
  }, [token]);

  const fetchTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    setErrorMessage("");

    try {
      const queryParams = new URLSearchParams();

      if (search.trim()) {
        queryParams.append("search", search.trim());
      }

      if (status) {
        queryParams.append("status", status);
      }

      if (priority) {
        queryParams.append("priority", priority);
      }

      if (category) {
        queryParams.append("category", category);
      }

      queryParams.append("sort", sort);
      queryParams.append("page", String(page));
      queryParams.append("limit", String(limit));

      const response = await fetch(
        `${API_URL}/api/tickets?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to retrieve tickets."
        );
      }

      setTickets(data.tickets || []);
      setTotalTickets(data.totalTickets || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching tickets:", error);

      setErrorMessage(
        error.message || "Unable to retrieve tickets."
      );

      setTickets([]);
      setTotalTickets(0);
      setTotalPages(1);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [
    search,
    status,
    priority,
    category,
    sort,
    page,
    limit,
    token,
  ]);

  function handleSearch(event) {
    event.preventDefault();

    setSuccessMessage("");

    if (page === 1) {
      fetchTickets();
    } else {
      setPage(1);
    }
  }

  function handleClearFilters() {
    setSearch("");
    setStatus("");
    setPriority("");
    setCategory("");
    setSort("newest");
    setSuccessMessage("");
    setErrorMessage("");

    if (page === 1) {
      setTimeout(() => {
        fetchTickets();
      }, 0);
    } else {
      setPage(1);
    }
  }

  async function handleDeleteTicket(ticketId) {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this ticket?"
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingTicketId(ticketId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/tickets/${ticketId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to delete ticket."
        );
      }

      setSuccessMessage("Ticket deleted successfully.");

      await fetchAnalytics();

      if (tickets.length === 1 && page > 1) {
        setPage((previousPage) => previousPage - 1);
      } else {
        await fetchTickets();
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);

      setErrorMessage(
        error.message || "Unable to delete ticket."
      );
    } finally {
      setDeletingTicketId(null);
    }
  }

  async function handleUpdateTicket(ticket, newStatus) {
    setUpdatingTicketId(ticket.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/tickets/${ticket.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to update ticket."
        );
      }

      const updatedTicket = data.ticket;

      setTickets((currentTickets) =>
        currentTickets.map((currentTicket) =>
          currentTicket.id === ticket.id
            ? updatedTicket
            : currentTicket
        )
      );

      setSuccessMessage(
        "Ticket status updated successfully."
      );

      await fetchAnalytics();


      if (openActivityTicketId === ticket.id) {
        await fetchTicketActivity(ticket.id);
      }
    } catch (error) {
      console.error("Error updating ticket:", error);

      setErrorMessage(
        error.message || "Unable to update ticket."
      );
    } finally {
      setUpdatingTicketId(null);
    }
  }
  
  async function handleAssignTicket(ticket, newAssignedToUserId) {
    setAssigningTicketId(ticket.id);
    setErrorMessage("");
    setSuccessMessage("");

    const assignedToUserId = 
      newAssignedToUserId === ""
        ? null
        : Number(newAssignedToUserId);

    try{
      const response = await fetch (
        `${API_URL}/api/tickets/${ticket.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            assigned_to_user_id: assignedToUserId,
          })
        }
      )
      const data = await response.json();

      if (!response.ok){
        throw new Error(
          data.message ||
            data.error ||
            "Unable to assign ticket."
        )
      }

      await fetchTickets();

      setSuccessMessage(
        assignedToUserId
          ? "Ticket assigned successfully."
          : "Ticket unassigned successfully."
      );

      await fetchAnalytics();


      if (openActivityTicketId === ticket.id) {
        await fetchTicketActivity(ticket.id);
      }

    } catch (error){
      console.error("Error assigning ticket: ", error);

      setErrorMessage(
        error.message || "Unable to assign ticket."
      );
    } finally {
      setAssigningTicketId(null)
    }
  }


  function handlePreviousPage() {
    setPage((previousPage) =>
      Math.max(1, previousPage - 1)
    );
  }

  function handleNextPage() {
    setPage((previousPage) =>
      Math.min(totalPages, previousPage + 1)
    );
  }

  async function fetchTicketComments(ticketId) {
    setLoadingCommentsTicketId(ticketId);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/tickets/${ticketId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to retrieve ticket notes."
        );
      }

      setCommentsByTicket((currentComments) => ({
        ...currentComments,
        [ticketId]: Array.isArray(data)
          ? data
          : data.comments || [],
      }));
    } catch (error) {
      console.error(
        "Error retrieving ticket comments:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to retrieve ticket notes."
      );
    } finally {
      setLoadingCommentsTicketId(null);
    }
  }

  async function handleToggleComments(ticketId) {
    if (openCommentsTicketId === ticketId) {
      setOpenCommentsTicketId(null);
      return;
    }

    setOpenCommentsTicketId(ticketId);

    await fetchTicketComments(ticketId);
  }

  function handleCommentInputChange(ticketId, value) {
    setCommentInputs((currentInputs) => ({
      ...currentInputs,
      [ticketId]: value,
    }));
  }

  async function handleAddComment(ticketId) {
    const commentText =
      commentInputs[ticketId]?.trim();

    if (!commentText) {
      setErrorMessage(
        "Enter a troubleshooting note before submitting."
      );
      return;
    }

    setAddingCommentTicketId(ticketId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/tickets/${ticketId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            comment: commentText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to add ticket note."
        );
      }

      const newComment = data.comment || data;

      setCommentsByTicket((currentComments) => ({
        ...currentComments,
        [ticketId]: [
          ...(currentComments[ticketId] || []),
          newComment,
        ],
      }));

      setCommentInputs((currentInputs) => ({
        ...currentInputs,
        [ticketId]: "",
      }));

      setSuccessMessage(
        "Troubleshooting note added successfully."
      );
    } catch (error) {
      console.error("Error adding comment:", error);

      setErrorMessage(
        error.message ||
          "Unable to add ticket note."
      );
    } finally {
      setAddingCommentTicketId(null);
    }
  }

  async function fetchTicketActivity(ticketId){
    setLoadingActivityTicketId(ticketId);
    setErrorMessage("");

    try{
      const response = await fetch(
        `${API_URL}/api/tickets/${ticketId}/activity`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json();
      
      if(!response.ok){
        throw new Error(
          data.message ||
            data.error ||
            "Unable to retrieve ticket activity."
        );
      }

      setActivityByTicket((currentActivity) => ({
        ...currentActivity,
        [ticketId]: data.activity || [],
      }));
    } catch (error) {
      console.error (
        "Error retrieving ticket activity:", error
      );

      setErrorMessage (
        error.message || "Unable to retrieve ticket activity."
      );
    } finally {
      setLoadingActivityTicketId(null)
    }
  }

  async function handleToggleActivity(ticketId){
    if(openActivityTicketId === ticketId) {
      setOpenActivityTicketId(null);
      return
    }

    setOpenActivityTicketId(ticketId);
    await fetchTicketActivity(ticketId);
  }

  useEffect(() => {
    fetchTickets();
    fetchAnalytics();
    fetchTechicians();
  }, [
    page, 
    limit, 
    ticketRefresh, 
    fetchTickets, 
    fetchAnalytics,
    fetchTechicians
  ]);

  function formatActivityType(activityType) {
    return activityType
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }

  function formatDuration(milliseconds) {
    const totalMinutes = Math.max(
      0,
      Math.floor(milliseconds / 60000)
    );

    const days = Math.floor(
      totalMinutes / 1440
    );

    const hours = Math.floor(
      (totalMinutes % 1440) / 60
    );

    const minutes = totalMinutes % 60;

    const parts = [];

    if (days > 0) {
      parts.push(`${days}d`);
    }

    if (hours > 0) {
      parts.push(`${hours}h`);
    }

    if (minutes > 0 || parts.length === 0) {
      parts.push(`${minutes}m`);
    }

    return parts.join(" ");
  }

  function getSlaDetails(ticket) {
    if (!ticket.sla_due_at || !ticket.created_at) {
      return {
        label: "No SLA",
        className: "sla-none",
        timeText: "No deadline available",
      };
    }

    if (
      ticket.status === "resolved" ||
      ticket.status === "closed"
    ) {
      return {
        label: "Completed",
        className: "sla-completed",
        timeText: ticket.resolved_at
          ? `Completed ${new Date(
              ticket.resolved_at
            ).toLocaleString()}`
          : "Ticket completed",
      };
    }

    const now = new Date();
    const createdAt = new Date(ticket.created_at);
    const dueAt = new Date(ticket.sla_due_at);

    const totalWindow =
      dueAt.getTime() - createdAt.getTime();

    const remainingTime =
      dueAt.getTime() - now.getTime();

    if (remainingTime <= 0) {
      return {
        label: "Breached",
        className: "sla-breached",
        timeText: `Deadline passed ${formatDuration(
          Math.abs(remainingTime)
        )} ago`,
      };
    }

    const remainingPercentage =
      totalWindow > 0
        ? remainingTime / totalWindow
        : 0;

    if (remainingPercentage <= 0.25) {
      return {
        label: "At Risk",
        className: "sla-at-risk",
        timeText: `${formatDuration(
          remainingTime
        )} remaining`,
      };
    }

    return {
      label: "On Track",
      className: "sla-on-track",
      timeText: `${formatDuration(
        remainingTime
      )} remaining`,
    };
  }

  return (
    <div className="technician-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            Operations workspace
          </span>
          <h1>Technician Portal</h1>
          <p>
            Monitor the queue, manage ownership, and
            keep requests moving toward resolution.
          </p>
        </div>

        <div className="queue-summary">
          <span>Current queue</span>
          <strong>{totalTickets}</strong>
          <small>matching tickets</small>
        </div>
      </div>

      <section className="analytics-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Overview</span>
            <h2>Ticket Dashboard</h2>
          </div>
        </div>

        {isLoadingAnalytics ? (
          <div className="inline-empty-state">
            Loading dashboard...
          </div>
        ) : (
          <div className="analytics-grid">
            <div className="analytics-card">
              <span>Total Tickets</span>
              <strong>{analytics.total_tickets}</strong>
            </div>

            <div className="analytics-card">
              <span>Open</span>
              <strong>{analytics.open_tickets}</strong>
            </div>

            <div className="analytics-card">
              <span>In Progress</span>
              <strong>
                {analytics.in_progress_tickets}
              </strong>
            </div>

            <div className="analytics-card">
              <span>Resolved</span>
              <strong>{analytics.resolved_tickets}</strong>
            </div>

            <div className="analytics-card">
              <span>Closed</span>
              <strong>{analytics.closed_tickets}</strong>
            </div>

            <div className="analytics-card analytics-card-alert">
              <span>Urgent</span>
              <strong>{analytics.urgent_tickets}</strong>
            </div>

            <div className="analytics-card">
              <span>Unassigned</span>
              <strong>
                {analytics.unassigned_tickets}
              </strong>
            </div>

            <div className="analytics-card">
              <span>Avg. Resolution</span>
              <strong className="analytics-time">
                {analytics.average_resolution_hours === null
                  ? "N/A"
                  : `${Number(
                      analytics.average_resolution_hours
                    ).toFixed(2)} hrs`}
              </strong>
            </div>
          </div>
        )}
      </section>

      {errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}

      {successMessage && (
        <p className="success-message">
          {successMessage}
        </p>
      )}

      <section className="queue-section">
        <div className="section-heading section-heading-row">
          <div>
            <span className="eyebrow">Ticket queue</span>
            <h2>Requests</h2>
          </div>

          <span className="count-pill">
            {totalTickets}
          </span>
        </div>

        <form
          className="search-section"
          onSubmit={handleSearch}
        >
          <label className="search-field">
            <span className="sr-only">
              Search tickets
            </span>
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </label>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in progress">
              In Progress
            </option>
            <option value="resolved">
              Resolved
            </option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value)
            }
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">
              Medium
            </option>
            <option value="high">High</option>
            <option value="urgent">
              Urgent
            </option>
          </select>

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
          >
            <option value="">All categories</option>
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
            <option value="Other">Other</option>
          </select>

          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value)
            }
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="priority">
              Priority
            </option>
            <option value="status">Status</option>
          </select>

          <button
            type="submit"
            className="submit-button"
          >
            Search
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
          >
            Clear
          </button>
        </form>

        <div className="limit-section">
          <div>
            <strong>{totalTickets}</strong>
            <span> total tickets</span>
          </div>

          <label htmlFor="ticket-limit">
            Show
            <select
              id="ticket-limit"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            per page
          </label>
        </div>

        {isLoadingTickets ? (
          <div className="inline-empty-state">
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="inline-empty-state">
            <strong>No tickets found</strong>
            <span>
              Try adjusting your filters or search.
            </span>
          </div>
        ) : (
          <div className="ticket-list">
            {tickets.map((ticket) => {
              const slaDetails =
                getSlaDetails(ticket);

              const statusClass = String(
                ticket.status || "open"
              ).replace(/\s+/g, "-");

              const priorityClass = String(
                ticket.priority || "low"
              ).replace(/\s+/g, "-");

              return (
                <article
                  className="ticket-card"
                  key={ticket.id}
                >
                  <div className="ticket-card-header">
                    <div>
                      <span className="ticket-number">
                        Ticket #{ticket.id}
                      </span>
                      <h2>{ticket.title}</h2>
                      <p className="requester-line">
                        {ticket.name}
                        <span>·</span>
                        {ticket.email}
                      </p>
                    </div>

                    <span
                      className={`sla-badge ${slaDetails.className}`}
                    >
                      {slaDetails.label}
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

                    <span
                      className={`ticket-badge status-${statusClass}`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <p className="ticket-description">
                    {ticket.description}
                  </p>

                  <div className="tech-ticket-grid">
                    <label className="control-block">
                      <span>Assigned technician</span>

                      <select
                        id={`assignment-${ticket.id}`}
                        value={
                          ticket.assigned_to_user_id ||
                          ""
                        }
                        onChange={(event) =>
                          handleAssignTicket(
                            ticket,
                            event.target.value
                          )
                        }
                        disabled={
                          assigningTicketId ===
                          ticket.id
                        }
                      >
                        <option value="">
                          Unassigned
                        </option>

                        {technicians.map(
                          (technician) => (
                            <option
                              key={technician.id}
                              value={technician.id}
                            >
                              {technician.name}
                            </option>
                          )
                        )}
                      </select>

                      <small>
                        {ticket.assigned_at
                          ? `Assigned ${new Date(
                              ticket.assigned_at
                            ).toLocaleString()}`
                          : "Not currently assigned"}
                      </small>
                    </label>

                    <label className="control-block">
                      <span>Status</span>

                      <select
                        id={`status-${ticket.id}`}
                        value={ticket.status}
                        onChange={(event) =>
                          handleUpdateTicket(
                            ticket,
                            event.target.value
                          )
                        }
                        disabled={
                          updatingTicketId ===
                          ticket.id
                        }
                      >
                        <option value="open">
                          Open
                        </option>
                        <option value="in progress">
                          In Progress
                        </option>
                        <option value="resolved">
                          Resolved
                        </option>
                        <option value="closed">
                          Closed
                        </option>
                      </select>

                      <small>
                        Created{" "}
                        {ticket.created_at
                          ? new Date(
                              ticket.created_at
                            ).toLocaleString()
                          : "date unavailable"}
                      </small>
                    </label>

                    <div className="sla-summary">
                      <span>SLA deadline</span>
                      <strong>
                        {ticket.sla_due_at
                          ? new Date(
                              ticket.sla_due_at
                            ).toLocaleString()
                          : "Not available"}
                      </strong>
                      <small>
                        {slaDetails.timeText}
                      </small>
                    </div>
                  </div>

                  <div className="ticket-action-row">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleComments(ticket.id)
                      }
                      disabled={
                        loadingCommentsTicketId ===
                        ticket.id
                      }
                    >
                      {loadingCommentsTicketId ===
                      ticket.id
                        ? "Loading..."
                        : openCommentsTicketId ===
                            ticket.id
                          ? "Hide Conversation"
                          : "Conversation"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleActivity(ticket.id)
                      }
                      disabled={
                        loadingActivityTicketId ===
                        ticket.id
                      }
                    >
                      {loadingActivityTicketId ===
                      ticket.id
                        ? "Loading..."
                        : openActivityTicketId ===
                            ticket.id
                          ? "Hide Activity"
                          : "Activity"}
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        handleDeleteTicket(ticket.id)
                      }
                      disabled={
                        deletingTicketId === ticket.id
                      }
                    >
                      {deletingTicketId === ticket.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>

                  {openCommentsTicketId ===
                    ticket.id && (
                    <div className="ticket-comments-panel">
                      <div className="details-heading">
                        <h3>Conversation</h3>
                        <span>
                          {(commentsByTicket[ticket.id] ||
                            []).length}{" "}
                          messages
                        </span>
                      </div>

                      {loadingCommentsTicketId ===
                      ticket.id ? (
                        <p>Loading conversation...</p>
                      ) : (
                        <>
                          {(commentsByTicket[ticket.id] ||
                            []).length === 0 ? (
                            <div className="inline-empty-state compact">
                              No messages yet.
                            </div>
                          ) : (
                            <div className="comment-list">
                              {(
                                commentsByTicket[
                                  ticket.id
                                ] || []
                              ).map((comment) => (
                                <div
                                  className="comment-card"
                                  key={comment.id}
                                >
                                  <p>
                                    {comment.comment}
                                  </p>

                                  <small>
                                    <strong>
                                      {comment.author}
                                    </strong>
                                    {" · "}
                                    {comment.created_at
                                      ? new Date(
                                          comment.created_at
                                        ).toLocaleString()
                                      : "Time unavailable"}
                                  </small>
                                </div>
                              ))}
                            </div>
                          )}

                          <textarea
                            rows="4"
                            placeholder="Reply to the user or document the next action..."
                            value={
                              commentInputs[
                                ticket.id
                              ] || ""
                            }
                            onChange={(event) =>
                              handleCommentInputChange(
                                ticket.id,
                                event.target.value
                              )
                            }
                            disabled={
                              addingCommentTicketId ===
                              ticket.id
                            }
                          />

                          <button
                            type="button"
                            className="submit-button"
                            onClick={() =>
                              handleAddComment(ticket.id)
                            }
                            disabled={
                              addingCommentTicketId ===
                                ticket.id ||
                              !commentInputs[
                                ticket.id
                              ]?.trim()
                            }
                          >
                            {addingCommentTicketId ===
                            ticket.id
                              ? "Sending..."
                              : "Send Reply"}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {openActivityTicketId ===
                    ticket.id && (
                    <div className="ticket-activity-panel">
                      <div className="details-heading">
                        <h3>Activity History</h3>
                        <span>
                          {(activityByTicket[ticket.id] ||
                            []).length}{" "}
                          events
                        </span>
                      </div>

                      {loadingActivityTicketId ===
                      ticket.id ? (
                        <p>Loading activity...</p>
                      ) : (
                        (activityByTicket[ticket.id] ||
                          []).length === 0 ? (
                          <div className="inline-empty-state compact">
                            No activity has been
                            recorded yet.
                          </div>
                        ) : (
                          <div className="activity-list">
                            {(
                              activityByTicket[
                                ticket.id
                              ] || []
                            ).map((activity) => (
                              <div
                                className="activity-card"
                                key={activity.id}
                              >
                                <strong>
                                  {formatActivityType(
                                    activity.activity_type
                                  )}
                                </strong>

                                <p>
                                  {activity.description}
                                </p>

                                <small>
                                  {activity.performed_by
                                    ? activity.performed_by
                                    : "System"}
                                  {" · "}
                                  {activity.created_at
                                    ? new Date(
                                        activity.created_at
                                      ).toLocaleString()
                                    : "Time unavailable"}
                                </small>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <div className="pagination">
          <button
            type="button"
            onClick={handlePreviousPage}
            disabled={
              page === 1 || isLoadingTickets
            }
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={
              page >= totalPages ||
              isLoadingTickets
            }
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}

export default TechnicianPage;
