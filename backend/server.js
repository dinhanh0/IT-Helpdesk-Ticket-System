const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

const PORT = process.env.PORT || 5000;

const allowedCategories = [
  "Hardware",
  "Software",
  "Network",
  "Account",
  "Other",
];

const allowedPriorities = [
  "low",
  "medium",
  "high",
  "urgent",
];

const allowedStatuses = [
  "open",
  "in progress",
  "resolved",
  "closed",
];

const allowedSorts = [
  "oldest",
  "newest",
  "priority",
  "status",
];

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allows tools such as Thunder Client and requests without an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("This origin is not allowed by CORS."));
    },
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "IT Help Desk Ticket System API is running",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      message: "API and database are connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(500).json({
      error: "Database connection failed",
    });
  }
});

// GET all tickets with filters, sorting, and pagination.
app.get("/api/tickets", async (req, res) => {
  const searchTerm = req.query.search?.trim();
  const statusTerm = req.query.status;
  const priorityTerm = req.query.priority;
  const categoryTerm = req.query.category;
  const sortTerm = req.query.sort || "newest";

  const pageNumber = Number(req.query.page) || 1;
  const limitNumber = Number(req.query.limit) || 10;

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return res.status(400).json({
      message: "page must be a positive whole number",
    });
  }

  if (
    !Number.isInteger(limitNumber) ||
    limitNumber < 1 ||
    limitNumber > 100
  ) {
    return res.status(400).json({
      message: "limit must be a positive whole number between 1 and 100",
    });
  }

  if (statusTerm && !allowedStatuses.includes(statusTerm)) {
    return res.status(400).json({
      message:
        "status should be 'open', 'in progress', 'resolved', or 'closed'",
    });
  }

  if (priorityTerm && !allowedPriorities.includes(priorityTerm)) {
    return res.status(400).json({
      message:
        "priority should be 'low', 'medium', 'high', or 'urgent'",
    });
  }

  if (categoryTerm && !allowedCategories.includes(categoryTerm)) {
    return res.status(400).json({
      message:
        "category should be 'Hardware', 'Software', 'Network', 'Account', or 'Other'",
    });
  }

  if (!allowedSorts.includes(sortTerm)) {
    return res.status(400).json({
      message:
        "sort should be 'newest', 'oldest', 'priority', or 'status'",
    });
  }

  const conditions = [];
  const filterValues = [];

  if (statusTerm) {
    filterValues.push(statusTerm);
    conditions.push(`status = $${filterValues.length}`);
  }

  if (priorityTerm) {
    filterValues.push(priorityTerm);
    conditions.push(`priority = $${filterValues.length}`);
  }

  if (categoryTerm) {
    filterValues.push(categoryTerm);
    conditions.push(`category = $${filterValues.length}`);
  }

  if (searchTerm) {
    filterValues.push(`%${searchTerm}%`);

    conditions.push(
      `(title ILIKE $${filterValues.length}
        OR description ILIKE $${filterValues.length})`
    );
  }

  const whereClause =
    conditions.length > 0
      ? ` WHERE ${conditions.join(" AND ")}`
      : "";

  const sortClauses = {
    newest: "created_at DESC",
    oldest: "created_at ASC",
    priority: `
      CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      created_at DESC
    `,
    status: "status ASC, created_at DESC",
  };

  const offset = (pageNumber - 1) * limitNumber;

  const ticketValues = [...filterValues];

  ticketValues.push(limitNumber);
  const limitPlaceholder = `$${ticketValues.length}`;

  ticketValues.push(offset);
  const offsetPlaceholder = `$${ticketValues.length}`;

  const ticketsQuery = `
    SELECT *
    FROM tickets
    ${whereClause}
    ORDER BY ${sortClauses[sortTerm]}
    LIMIT ${limitPlaceholder}
    OFFSET ${offsetPlaceholder}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM tickets
    ${whereClause}
  `;

  try {
    const [ticketsResult, countResult] = await Promise.all([
      pool.query(ticketsQuery, ticketValues),
      pool.query(countQuery, filterValues),
    ]);

    const totalTickets = Number(countResult.rows[0].total);
    const totalPages = Math.max(
      1,
      Math.ceil(totalTickets / limitNumber)
    );

    res.json({
      page: pageNumber,
      limit: limitNumber,
      count: ticketsResult.rows.length,
      totalTickets,
      totalPages,
      tickets: ticketsResult.rows,
    });
  } catch (error) {
    console.error("Error retrieving tickets:", error);

    res.status(500).json({
      error: "Database query failed",
    });
  }
});

// GET one ticket.
app.get("/api/tickets/:id", async (req, res) => {
  const ticketId = Number(req.params.id);

  if (!Number.isInteger(ticketId) || ticketId < 1) {
    return res.status(400).json({
      message: "Ticket ID must be a positive whole number",
    });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM tickets WHERE id = $1",
      [ticketId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No matching ticket found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error retrieving ticket:", error);

    res.status(500).json({
      error: "Error retrieving ticket",
    });
  }
});

// POST a new ticket.
app.post("/api/tickets", async (req, res) => {
  const {
    name,
    email,
    title,
    category,
    description,
    priority = "low",
  } = req.body;

  if (
    !name?.trim() ||
    !email?.trim() ||
    !title?.trim() ||
    !category ||
    !description?.trim()
  ) {
    return res.status(400).json({
      message:
        "Missing name, email, title, category, or description",
    });
  }

  if (!allowedCategories.includes(category)) {
    return res.status(400).json({
      message:
        "category should be 'Hardware', 'Software', 'Network', 'Account', or 'Other'",
    });
  }

  if (!allowedPriorities.includes(priority)) {
    return res.status(400).json({
      message:
        "priority should be 'low', 'medium', 'high', or 'urgent'",
    });
  }

  const sqlQuery = `
    INSERT INTO tickets (
      name,
      email,
      title,
      category,
      description,
      priority,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    name.trim(),
    email.trim(),
    title.trim(),
    category,
    description.trim(),
    priority,
    "open",
  ];

  try {
    const result = await pool.query(sqlQuery, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating ticket:", error);

    res.status(500).json({
      error: "Error creating a ticket",
    });
  }
});

// PUT supports partial updates.
// This allows the technician page to send only { status: "resolved" }.
app.put("/api/tickets/:id", async (req, res) => {
  const ticketId = Number(req.params.id);

  if (!Number.isInteger(ticketId) || ticketId < 1) {
    return res.status(400).json({
      message: "Ticket ID must be a positive whole number",
    });
  }

  const {
    name,
    email,
    title,
    category,
    description,
    priority,
    status,
  } = req.body;

  if (
    category !== undefined &&
    !allowedCategories.includes(category)
  ) {
    return res.status(400).json({
      message:
        "category should be 'Hardware', 'Software', 'Network', 'Account', or 'Other'",
    });
  }

  if (
    priority !== undefined &&
    !allowedPriorities.includes(priority)
  ) {
    return res.status(400).json({
      message:
        "priority should be 'low', 'medium', 'high', or 'urgent'",
    });
  }

  if (
    status !== undefined &&
    !allowedStatuses.includes(status)
  ) {
    return res.status(400).json({
      message:
        "status should be 'open', 'in progress', 'resolved', or 'closed'",
    });
  }

  try {
    const existingResult = await pool.query(
      "SELECT * FROM tickets WHERE id = $1",
      [ticketId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        message: "No matching ticket found",
      });
    }

    const existingTicket = existingResult.rows[0];

    const updatedTicket = {
      name: name ?? existingTicket.name,
      email: email ?? existingTicket.email,
      title: title ?? existingTicket.title,
      category: category ?? existingTicket.category,
      description: description ?? existingTicket.description,
      priority: priority ?? existingTicket.priority,
      status: status ?? existingTicket.status,
    };

    if (
      !updatedTicket.name?.trim() ||
      !updatedTicket.email?.trim() ||
      !updatedTicket.title?.trim() ||
      !updatedTicket.description?.trim()
    ) {
      return res.status(400).json({
        message: "Ticket fields cannot be empty",
      });
    }

    const updateQuery = `
      UPDATE tickets
      SET
        name = $1,
        email = $2,
        title = $3,
        category = $4,
        description = $5,
        priority = $6,
        status = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const values = [
      updatedTicket.name.trim(),
      updatedTicket.email.trim(),
      updatedTicket.title.trim(),
      updatedTicket.category,
      updatedTicket.description.trim(),
      updatedTicket.priority,
      updatedTicket.status,
      ticketId,
    ];

    const result = await pool.query(updateQuery, values);

    res.json({
      message: "Ticket updated successfully",
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating ticket:", error);

    res.status(500).json({
      error: "Error updating ticket",
    });
  }
});

// DELETE a ticket.
app.delete("/api/tickets/:id", async (req, res) => {
  const ticketId = Number(req.params.id);

  if (!Number.isInteger(ticketId) || ticketId < 1) {
    return res.status(400).json({
      message: "Ticket ID must be a positive whole number",
    });
  }

  try {
    const result = await pool.query(
      `
        DELETE FROM tickets
        WHERE id = $1
        RETURNING *
      `,
      [ticketId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    res.json({
      message: "Ticket deleted successfully",
      deletedTicket: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);

    res.status(500).json({
      error: "Error deleting ticket",
    });
  }
});

// Express error handler, including rejected CORS requests.
app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  res.status(500).json({
    error: error.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});