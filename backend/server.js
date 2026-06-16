// Basic Express server setup
const express = require('express');

const app = express();
const port = 5000;

let tickets = [];
let nextId = 1;

// Enable JSON parsing middleware (useful if you expand the API later)
app.use(express.json());

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
        res.status(404).json({ error: "Ticket not found" }) 

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

    const oldTicket = tickets[ticketIndex]

    const updatedTicket = {
        ...oldTicket,
        title: req.body.title ?? oldTicket.title,
        category: req.body.category ?? oldTicket.category,
        description: req.body.description ?? oldTicket.description,
        priority: req.body.priority ?? oldTicket.priority,
        status: req.body.status ?? oldTicket.status,
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


