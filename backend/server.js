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
  const assignedToTerm = req.query.assignedTo?.trim();
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

  if(
    assignedToTerm &&
    assignedToTerm !== "unassigned" &&
    assignedToTerm.length > 100
  ) {
    return res.status(400).json({
      message: "assignedTo cannot be longer than 100 characters"
    })
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

  if (assignedToTerm === "unassigned"){
    conditions.push("assigned_to IS NULL")
  } else if (assignedToTerm) {
    filterValues.push(assignedToTerm);
    conditions.push(`assigned_to = $${filterValues.length}`)
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

// GET all comments for one ticket.
app.get("/api/tickets/:id/comments", async (req, res) => {

  const ticketId = Number(req.params.id);

  if (!Number.isInteger(ticketId) || ticketId < 1) {
    return res.status(400).json({
      message: "ticket ID must be a positive whole number"
    })
  }

  try {
    const ticketResult = await pool.query(
      "SELECT id FROM tickets WHERE id = $1",
      [ticketId]
    );

    if(ticketResult.rows.length === 0){
      return res.status(404).json({
        message: "No matching ticket found"
      })
    }

    const commentsResult = await pool.query(
      `
        SELECT *
        FROM ticket_comments
        WHERE ticket_id = $1
        ORDER BY created_at ASC
      `,
      [ticketId]
    );

    res.json({
      ticketId,
      count: commentsResult.rows.length,
      comments: commentsResult.rows
    })
  } catch (error) {
    console.error ("Error retrieving comments:", error);

    res.status(500).json({
      error: "Error retrieving ticket comments",
    });
  }
})

//GET ticket dashboard analytic
app.get("/api/tickets/analytics", async (req, res) => {
  try{
    const result = await pool.query (`
      SELECT
        COUNT(*)::INTEGER as total_tickets,

        COUNT(*) FILTER (
          WHERE status = 'open'
        )::INTEGER AS open_tickets,

        COUNT(*) FILTER (
          WHERE status = 'in progress'
        )::INTEGER AS in_progress_tickets,
        COUNT(*) FILTER (
          WHERE status = 'resolved'
        )::INTEGER AS resolved_tickets,

        COUNT(*) FILTER (
          WHERE status = 'closed'
        )::INTEGER AS closed_tickets,

        COUNT(*) FILTER (
          WHERE priority = 'urgent'
        )::INTEGER AS urgent_tickets,

        COUNT(*) FILTER (
          WHERE assigned_to IS NULL
        )::INTEGER AS unassigned_tickets,

        ROUND(
          AVG(
            EXTRACT(
              EPOCH FROM (resolved_at - created_at)
            ) / 3600
          ) FILTER (
            WHERE resolved_at IS NOT NULL
          )::NUMERIC,
          2
        ) AS average_resolution_hours
      FROM tickets
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error(
      "Error retrieving ticket analytics:",
      error
    );

    res.status(500).json({
      error: "Error retrieving ticket analytics",
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

//GET activity history for one ticket
app.get("/api/tickets/:id/activity", async (req, res) => {
  const ticketId = Number(req.params.id);

  if (!Number.isInteger(ticketId) || ticketId < 1) {
    return res.status(400).json({
      message: "Ticket ID must be a positive whole number"
    })
  }

  try{
    const ticketResult = await pool.query(
      "SELECT id FROM tickets WHERE id = $1",
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        message: "No matching ticket found"
      })
    }

    const activityResult = await pool.query(
      `
        SELECT *
        FROM ticket_activity
        WHERE ticket_id = $1
        ORDER BY created_at ASC, id ASC
      `,
      [ticketId]
    );

    res.json({
      activity: activityResult.rows
    })
  } catch (error) {
    console.error(
      "Error retrieving ticket activity:", error
    );

    res.status(500).json({
      error: "Error retrieving ticket activity"
    })
  }
});

// POST a new comment for one ticket.
app.post("/api/tickets/:id/comments", async (req, res) => {
  const ticketId = Number(req.params.id);
  const { author, comment } = req.body;

  if (!Number.isInteger(ticketId) || ticketId < 1) {
    return res.status(400).json({
      message: "Ticket ID must be a positive whole number",
    });
  }

  if (!author?.trim() || !comment?.trim()) {
    return res.status(400).json({
      message: "Author and comment are required",
    });
  }

  if (author.trim().length > 100) {
    return res.status(400).json({
      message: "Author cannot be longer than 100 characters",
    });
  }

  try {
    const ticketResult = await pool.query(
      "SELECT id FROM tickets WHERE id = $1",
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        message: "No matching ticket found",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO ticket_comments (
          ticket_id,
          author,
          comment
        )
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [
        ticketId,
        author.trim(),
        comment.trim(),
      ]
    );

    res.status(201).json({
      message: "Comment added successfully",
      comment: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating comment:", error);

    res.status(500).json({
      error: "Error creating ticket comment",
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
      status,
      sla_due_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      CURRENT_TIMESTAMP +
        CASE $6::VARCHAR
          WHEN 'urgent' THEN INTERVAL '4 hours'
          WHEN 'high' THEN INTERVAL '8 hours'
          WHEN 'medium' THEN INTERVAL '24 hours'
          WHEN 'low' THEN INTERVAL '72 hours'
          ELSE INTERVAL '72 hours'
        END
    )
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

  const client = await pool.connect();

  try {
    await client.query("BEGIN")

    const result = await client.query(sqlQuery, values);
    const newTicket = result.rows[0];

    await client.query(
      `
        INSERT INTO ticket_activity(
          ticket_id,
          activity_type,
          description,
          performed_by
        )
        VALUES($1,$2,$3,$4)
      
      `,

      [
        newTicket.id,
        "ticket_created",
        "Ticket was created",
        newTicket.name
      ]

    );

    await client.query("COMMIT");

    res.status(201).json(newTicket);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error creating ticket:", error);

    res.status(500).json({
      error: "Error creating a ticket",
    });
  }finally {
    client.release();
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
    assigned_to,
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

  if (
    assigned_to !== undefined &&
    assigned_to !== null &&
    typeof assigned_to !== "string"
  ) {
    return res.status(400).json({
      message: "assigned_to must be a string or null",
    })
  }

  if (
    typeof assigned_to === "string" &&
    assigned_to.trim().length > 100
  ) {
    return res.status(400).json({
      message: "assigned_to cannot be longer than 100 characters",
    })
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

    const normalizedAssignedTo = 
      assigned_to === undefined
        ? existingTicket.assigned_to
        : assigned_to?.trim() || null; // ?. is optional chaining. Call .trim() only when assigned_to is not null or undefined.

    const updatedTicket = {
      name: name ?? existingTicket.name,
      email: email ?? existingTicket.email,
      title: title ?? existingTicket.title,
      category: category ?? existingTicket.category,
      description: 
        description ?? existingTicket.description,
      priority: priority ?? existingTicket.priority,
      status: status ?? existingTicket.status,
      assigned_to: normalizedAssignedTo,
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

        sla_due_at = CASE
          WHEN priority IS DISTINCT FROM $6::VARCHAR
            THEN created_at +
              CASE $6::VARCHAR
                WHEN 'urgent' THEN INTERVAL '4 hours'
                WHEN 'high' THEN INTERVAL '8 hours'
                WHEN 'medium' THEN INTERVAL '24 hours'
                WHEN 'low' THEN INTERVAL '72 hours'
                ELSE INTERVAL '72 hours'
              END
          ELSE sla_due_at
        END,

        status = $7,

        resolved_at = CASE
          WHEN $7::VARCHAR IN ('resolved', 'closed')
            AND status NOT IN ('resolved', 'closed')
            THEN CURRENT_TIMESTAMP

          WHEN $7::VARCHAR NOT IN ('resolved', 'closed')
            THEN NULL

          ELSE resolved_at
        END,

        assigned_to = $8::VARCHAR(100),

        assigned_at = CASE
          WHEN $8::VARCHAR(100) IS NULL THEN NULL
          WHEN assigned_to IS DISTINCT FROM $8::VARCHAR(100)
            THEN CURRENT_TIMESTAMP
          ELSE assigned_at
        END,

        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
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
      updatedTicket.assigned_to,
      ticketId,
    ];

    const activityEntries = [];
    const performedBy = "Anh Dinh"

    if(updatedTicket.status !== existingTicket.status){
      activityEntries.push({
        activityType: "status_changed",
        description: `status changed from ${existingTicket.status} to ${updatedTicket.status}`
      })
    }

    if(
      existingTicket.assigned_to === null &&
      updatedTicket.assigned_to !== null
    ) {
      activityEntries.push({
        activityType: "assigned",
        description: `Ticket assigned to ${updatedTicket.assigned_to}`
      });
    } else if (
      existingTicket.assigned_to !== null &&
      updatedTicket.assigned_to === null
    ) {
      activityEntries.push({
        activityType: "unassigned",
        description: `Ticket unassigned from ${existingTicket.assigned_to}`
      })
    } else if (
      existingTicket.assigned_to !== null &&
      updatedTicket.assigned_to !== null &&
      existingTicket.assigned_to !== updatedTicket.assigned_to
    ) {
      activityEntries.push({
        activityType: "reassigned",
        description: `Ticket reassigned from ${existingTicket.assigned_to} to ${updatedTicket.assigned_to}`
      })
    }

    const client = await pool.connect();

    try{
      await client.query("BEGIN")
      
      const result = await client.query(
        updateQuery,
        values
      )

      for (const activity of activityEntries) {
        await client.query(

          `
            INSERT INTO ticket_activity(
              ticket_id,
              activity_type,
              description,
              performed_by
            )
            VALUES ($1,$2,$3,$4)
          `,
          [
            ticketId,
            activity.activityType,
            activity.description,
            performedBy
          ]
        )
      }

      await client.query("COMMIT")

      res.json({
        message: "Ticket updated successfully",
        ticket: result.rows[0]
      })
    } catch (error) {
      await client.query ("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

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