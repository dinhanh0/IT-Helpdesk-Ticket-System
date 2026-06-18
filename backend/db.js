const { Pool } = require("pg"); //import Pool to keep multiple active connections
require('dotenv').config(); // Load dotenv

//create a new pool using .env variables
const pool = new Pool ({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, 
    database: process.env.DB_NAME, 
    password: process.env.DB_PASSWORD 
})

//export to Pool so it can be used in other files
module.exports = pool;