import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../config";

function TechnicianPage({ ticketRefresh }) {
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

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

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
        `${API_URL}/api/tickets?${queryParams.toString()}`
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
    } catch (error) {
      console.error("Error updating ticket:", error);

      setErrorMessage(
        error.message || "Unable to update ticket."
      );
    } finally {
      setUpdatingTicketId(null);
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

  useEffect(() => {
    fetchTickets();
  }, [page, limit, ticketRefresh]);

  return (
    <div className="technician-page">
      <h1>Technician Portal</h1>
      <p>Manage support tickets</p>

      {errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}

      {successMessage && (
        <p className="success-message">
          {successMessage}
        </p>
      )}

      <form
        className="search-section"
        onSubmit={handleSearch}
      >
        <input
          type="text"
          placeholder="Search tickets"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in progress">In Progress</option>
          <option value="resolved">Resolved</option>
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
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
        >
          <option value="">All categories</option>
          <option value="Hardware">Hardware</option>
          <option value="Software">Software</option>
          <option value="Network">Network</option>
          <option value="Account">Account</option>
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
          <option value="priority">Priority</option>
          <option value="status">Status</option>
        </select>

        <button type="submit">Search</button>

        <button
          type="button"
          onClick={handleClearFilters}
        >
          Clear Filters
        </button>
      </form>

      <div className="limit-section">
        <label htmlFor="ticket-limit">
          Tickets per page:
        </label>

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

        <span>Total tickets: {totalTickets}</span>
      </div>

      {isLoadingTickets ? (
        <p>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p>No tickets found.</p>
      ) : (
        <div className="ticket-list">
          {tickets.map((ticket) => (
            <div
              className="ticket-card"
              key={ticket.id}
            >
              <h2>{ticket.title}</h2>

              <p>
                <strong>Ticket ID:</strong> {ticket.id}
              </p>

              <p>
                <strong>Name:</strong> {ticket.name}
              </p>

              <p>
                <strong>Email:</strong> {ticket.email}
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
                <strong>Description:</strong>{" "}
                {ticket.description}
              </p>

              <div className="ticket-status-section">
                <label htmlFor={`status-${ticket.id}`}>
                  <strong>Status:</strong>
                </label>

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
                    updatingTicketId === ticket.id
                  }
                >
                  <option value="open">Open</option>
                  <option value="in progress">
                    In Progress
                  </option>
                  <option value="resolved">
                    Resolved
                  </option>
                  <option value="closed">Closed</option>
                </select>

                {updatingTicketId === ticket.id && (
                  <span> Updating...</span>
                )}
              </div>

              <p>
                <strong>Created:</strong>{" "}
                {ticket.created_at
                  ? new Date(
                      ticket.created_at
                    ).toLocaleString()
                  : "Not available"}
              </p>

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
                  : "Delete Ticket"}
              </button>
            </div>
          ))}
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
            page >= totalPages || isLoadingTickets
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default TechnicianPage;