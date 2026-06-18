// Basic Express server setup
const express = require('express');

//import db.js 
const pool = require("./db");

const app = express();
const port = 5000;

let tickets = [];
let nextId = 1;

const allowedCategories = ["Hardware", "Software", "Network", "Account", "Other"]
const allowedPriorities = ["low", "medium", "high", "urgent"]
const allowedStatus = ["open", "in progress", "resolved", "closed"]


// Enable JSON parsing middleware (useful if you expand the API later)
app.use(express.json());

app.get("/api/test-db", async(req,res) => {
    try {
        const result = await pool.query("SELECT * FROM tickets");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database connection failed" });
    }
});

app.get("/", (req, res) => {
    res.send("IT Help Desk Ticket System API is running");
});

// GET retrieve the data
app.get('/api/tickets', (req, res) => {
    res.json(tickets)
});

app.get('/api/tickets/:id', (req,res) => {
    const urlId = Number(req.params.id);

    const ticket = tickets.find(t => t.id === urlId); //returns the ticket id if found and 'undefined' if doesn't

    if(!ticket){
        return res.status(404).json({ error: "Ticket not found" }) 

    } else {
        res.json(ticket)
    }

});

// POST sends the data
app.post('/api/tickets', (req, res) => {

    const { name, email, title, category, description, priority } = req.body;  //'req' means request

    if (!name || !email || !title || !category || !description){
        return res.status(400).json({message: "Missing name, email, title, category or description fields, try again"})
    }

    if (category !== undefined && !allowedCategories.includes(category) ){
        return res.status(400).json({message: "category should be 'Hardware', 'Software', 'Network', 'Account', or 'Other'"})
    }

    if ( priority !== undefined && !allowedPriorities.includes(priority)){
        return res.status(400).json({message: "priority should be 'low', 'medium', 'high', or 'urgent'"})
    }


    const newTicket = {
        id: nextId++, 
        name,
        email,
        title,
        category,
        description,
        priority: priority ?? 'low',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
    }

    tickets.push(newTicket);

    res.json(newTicket)
});


app.put('/api/tickets/:id', (req,res) => {

    const urlId = Number(req.params.id);

    const ticketIndex = tickets.findIndex(t => t.id === urlId); // findIndex returns the array index if found, or -1 if not found

    console.log("ticketIndex:", ticketIndex);

    if(ticketIndex === -1){
        return res.status(404).json({ error: "Ticket not found" }) 

    }

    const { title, category, description, priority, status} = req.body

    if (category !== undefined && !allowedCategories.includes(category) ){
        return res.status(400).json({message: "category should be 'Hardware', 'Software', 'Network', 'Account', or 'Other'"})
    }

    if ( priority !== undefined && !allowedPriorities.includes(priority)){
        return res.status(400).json({message: "priority should be 'low', 'medium', 'high', or 'urgent'"})
    }

    if (status !== undefined && !allowedStatus.includes(status)){
        return res.status(400).json({message: "status should be 'open', 'in progress', 'resolved', or 'closed'"})
    }

    const oldTicket = tickets[ticketIndex]

    const updatedTicket = {
        ...oldTicket,
        title: title ?? oldTicket.title,
        category: category ?? oldTicket.category,
        description: description ?? oldTicket.description,
        priority: priority ?? oldTicket.priority,
        status: status ?? oldTicket.status,
        updatedAt: new Date()
    }


    tickets[ticketIndex] = updatedTicket;

    


    res.json(updatedTicket);
});

app.delete('/api/tickets/:id', (req,res) =>{
    const urlId = Number(req.params.id);
    const ticketIndex = tickets.findIndex(t => t.id === urlId);

    if (ticketIndex === -1){
        return res.status(404).json({error: "Ticket not found"}); 
    }

    const deletedTicketArray = tickets.splice(ticketIndex,1);
    const deletedTicket = deletedTicketArray[0];

    res.json({
        message:"The following ticket was deleted successfully",
        deletedTicket: deletedTicket

    })
    
})


app.listen(port, () =>{
    console.log(`Server is running on http://localhost:${port}`);
});


