// Basic Express server setup
const express = require('express');

//import db.js 
const pool = require("./db");

const app = express();
const port = 5000; 

const allowedCategories = ["Hardware", "Software", "Network", "Account", "Other"]
const allowedPriorities = ["low", "medium", "high", "urgent"]
const allowedStatus = ["open", "in progress", "resolved", "closed"]


// Enable JSON parsing middleware (useful if you expand the API later)
app.use(express.json());

app.get("/", (req, res) => {
    res.send("IT Help Desk Ticket System API is running");
});

// GET retrieve the data from an array
// app.get('/api/tickets', (req, res) => {
//     res.json(tickets)
// });

// GET retrieve the data from Postgresql
app.get('/api/tickets', async (req, res) => {
    const searchTerm = req.query.search;
    const statusTerm = req.query.status
    const priorityTerm = req.query.priority
    const categoryTerm = req.query.category
    const sortTerm = req.query.sort

    const pageNumber = Number(req.query.page) || 1
    const limitNumber = Number(req.query.limit) || 10

    if (!(Number.isInteger(pageNumber) && (pageNumber >= 1))){
        return res.status(400).json({message: "page must be a positive whole number"})
    }

    if (!(Number.isInteger(limitNumber) && limitNumber >= 1 && limitNumber <= 100)){
        return res.status(400).json({message: "limit must be a positive whole number between 1 and 100"})
    }
        
    const offset = (pageNumber - 1) * limitNumber

    const allowedSorts = ['oldest', 'newest', 'priority', 'status']

    let sqlQuery =
    `
    SELECT * 
    FROM tickets
    `
    let conditions = []
    let values = []

    if (statusTerm){
        if (!allowedStatus.includes(statusTerm)){
            return res.status(400).json({message: "status should be 'open', 'in progress', 'resolved', or 'closed'"})
        }
        let placeHolder = values.length + 1
        conditions.push(`status = $${placeHolder}`)
        values.push(statusTerm)

    }

    if(priorityTerm){
        if(!allowedPriorities.includes(priorityTerm)){
            return res.status(400).json({message: "priority should be 'low', 'medium', 'high', or 'urgent'"})
        }
        let placeHolder = values.length + 1
        conditions.push(`priority = $${placeHolder}`)
        values.push(priorityTerm)
    }

    if(categoryTerm){
        if(!allowedCategories.includes(categoryTerm)){
            return res.status(400).json({message: "category should be 'Hardware', 'Software', 'Network', 'Account', or 'Other'"})
        }
        let placeHolder = values.length + 1
        conditions.push(`category = $${placeHolder}`)
        values.push(categoryTerm)
    }

    if(searchTerm){
        let placeHolder = values.length + 1
        conditions.push(`(title ILIKE $${placeHolder} OR description ILIKE $${placeHolder})`)
        values.push(`%${searchTerm}%`)
    }


    if (conditions.length !== 0){
        sqlQuery += " WHERE " + conditions.join(" AND ")
    }

    if (sortTerm && !allowedSorts.includes(sortTerm)){
        return res.status(400).json({message: "sort should be 'newest', 'oldest', 'priority', or 'status'"})
    }

    sqlQuery += " ORDER BY"
    if (sortTerm == "newest" || !sortTerm){
        sqlQuery += " created_at DESC"
    }

    else if (sortTerm == "oldest"){
        sqlQuery += " created_at ASC"
    }

    else if (sortTerm == "priority"){
        sqlQuery += " priority"
    }
    else if (sortTerm == "status"){
        sqlQuery += " status"
    }


    const limitPlaceholder = values.length + 1
    sqlQuery += ` LIMIT $${limitPlaceholder}`
    values.push(limitNumber)

    const offsetPlaceholder = values.length + 1
    sqlQuery += ` OFFSET $${offsetPlaceholder}`
    values.push(offset)

    try {
        const result = await pool.query(sqlQuery,values)
        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Database query failed"})
    }
});

// GET retrieves the data
app.get('/api/tickets/:id', async (req,res) => {
    const urlId = Number(req.params.id);

    //const ticket = tickets.find(t => t.id === urlId); //returns the ticket id if found and 'undefined' if doesn't

    const sqlQuery = 'SELECT * FROM tickets where id = $1'
    const values = [urlId]

    try {
        const result = await pool.query(sqlQuery,values)

        if (result.rows.length === 0){
            return res.status(404).json({message: "No matching ticket found"})
        }
        res.json(result.rows[0])


    }catch(error){
        res.status(500).json({error: "Error retrieving ticket "})
    }

});

// POST sends the data 
app.post('/api/tickets', async (req, res) => {

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


    const sqlQuery = 'INSERT INTO tickets (name,email,title,category,description, priority, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *'
    const values = [name, email, title, category, description, priority ?? 'low', 'open']

    try{
        const result = await pool.query(sqlQuery,values)
        res.status(201).json(result.rows[0])

    }catch (error){
        res.status(500).json({error: "Error creating a ticket"})
    }

});

//PUT updates the data
app.put('/api/tickets/:id', async (req,res) => {

    const urlId = Number(req.params.id);

    const { name, email, title, category, description, priority, status} = req.body

    if (!name || !email || !title || !category || !description || !priority || !status){
        return res.status(400).json({message: "required fields are missing"})
    }
    if (category !== undefined && !allowedCategories.includes(category) ){
        return res.status(400).json({message: "category should be 'Hardware', 'Software', 'Network', 'Account', or 'Other'"})
    }

    if ( priority !== undefined && !allowedPriorities.includes(priority)){
        return res.status(400).json({message: "priority should be 'low', 'medium', 'high', or 'urgent'"})
    }

    if (status !== undefined && !allowedStatus.includes(status)){
        return res.status(400).json({message: "status should be 'open', 'in progress', 'resolved', or 'closed'"})
    }

    const sqlQuery = `
    UPDATE tickets 
    SET name = $1, email =$2, title= $3, category = $4, description = $5, priority = $6, status =$7, updated_at = CURRENT_TIMESTAMP
    WHERE id = $8
    RETURNING *
    `
    const values =[name, email, title, category, description, priority, status, urlId]

    try {
        const result = await pool.query(sqlQuery,values)
        if (result.rows.length === 0){
            return res.status(404).json({message: "No matching ticket found"})
        }
        res.json({
            message:'Ticket updated successfully', ticket: result.rows[0]
        });
            

    }catch(error){
        return res.status(500).json({error: "Error updating ticket"})
    }

});

app.delete('/api/tickets/:id', async (req,res) =>{
    const urlId = Number(req.params.id);

    const sqlQuery = `
    DELETE 
    FROM tickets
    WHERE id = $1
    RETURNING *
    `

    const values = [urlId]

    try{

        const result = await pool.query(sqlQuery,values)
        
        if (result.rows.length === 0){
            return res.status(404).json ({message: "Ticket not found"})
        }
        
        const deletedTicket = result.rows[0]
        res.json({
            message:"The following ticket was deleted successfully",
            deletedTicket: deletedTicket

        }) 

    }catch (error){
        return res.status(500).json ({error: "Error deleting ticket"})
    }
    
})


app.listen(port, () =>{
    console.log(`Server is running on http://localhost:${port}`);
});


