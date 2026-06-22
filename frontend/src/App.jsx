import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [tickets, setTickets] = useState([]);

  async function fetchTickets(){
    try{
      const response = await fetch("http://localhost:5000/api/tickets")

      const data = await response.json()

      setTickets(data.tickets);

  } catch(error) {
    console.error("Error fetching tickets:", error)
  }
}

useEffect (() => {
  fetchTickets();
}, [])

  return (
    <div 
      className = "app"
    >
      <h1> IT Help Desk Ticket System </h1>

      <div
        className = "ticket-list"
      > 
        {
          tickets.length === 0 ? (
            <p>No tickets found.</p>
          ) : (
          tickets.map(ticket => 
            (
            <div 
            className = "ticket-card"
            key = {ticket.id}
            >
              <h2>{ticket.title}</h2>
              <p>{ticket.name}</p>
              <p>{ticket.email}</p> 
              <p>{ticket.category}</p>
              <p>{ticket.priority}</p>
              <p>{ticket.status}</p>
              <p>{ticket.description}</p>
            </div>
            ))
          )
        }
        
      </div>

    </div>

  )
}

export default App
