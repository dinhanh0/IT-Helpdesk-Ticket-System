// Basic Express server setup
const express = require('express');

const app = express();
const port = 5000;

let tickets = []
let nextId = 1;
// Enable JSON parsing middleware (useful if you expand the API later)
app.use(express.json());

app.get("/", (req, res) => {
    res.send("IT Help Desk Ticket System API is running");
});

// GET retrieve the data
app.get('/api/tickets', (req, res) => {
    res.send(tickets)
});

// POST sends the data
app.post('/api/tickets', (req, res) => {

    const { title, description, priority } = req.body;

    const newTicket = {
        id: nextId++, 
        title,
        description,
        priority: priority || 'low',
        status: 'open',
        createdAt: new Date()
    }

    tickets.push(newTicket);

    const newTicket1 = {id: 1, title: "test", description: "this is a test", priority, status, createdAt}

    res.json(newTicket)
});



app.listen(port, () =>{
    console.log(`Server is running on http://localhost:${port}`);
});


