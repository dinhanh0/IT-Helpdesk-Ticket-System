import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [priority, setPriority] = useState("")
  const [category, setCategory] = useState("")
  const [sort, setSort] = useState("")


  async function fetchTickets(){
    try{
      const response = await fetch(`http://localhost:5000/api/tickets?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&priority=${encodeURIComponent(priority)}&category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}`)

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
        className = "search-section"
      >
        <input
          type = "text"
          placeholder="search tickets"
          value = {search}
          onChange = {(event) => setSearch(event.target.value)}/>

        <select
          value = {status}
          onChange = {(event) => setStatus(event.target.value)}>
          <option value="">All status</option>
          <option value="open">Open</option>
          <option value="in progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priority}
          onChange = {(event) => setPriority(event.target.value)}>
          <option value ="">All priorities</option>
          <option value ="high">High</option>
          <option value ="medium">Medium</option>
          <option value ="low">Low</option>
        </select>

        <select
          value ={category}
          onChange = {(event) => setCategory(event.target.value)}
          >
          <option value ="">All categories</option>
          <option value = "Hardware">Hardware</option>
          <option value = "Software">Software</option>
          <option value = "Network">Network</option>
          <option value = "Account">Account</option>
          <option value = "Other">Other</option>

        </select>

        <select
          value ={sort}
          onChange = {(event) => setSort(event.target.value)}
          >
          <option value ="">Default sort</option>
          <option value = "oldest">Oldest</option>
          <option value = "newest">Newest</option>
          <option value = "priority">Priority</option>
          <option value = "status">Status</option>
        </select>

        <button onClick = {fetchTickets}>
          search
        </button>

      </div>


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
