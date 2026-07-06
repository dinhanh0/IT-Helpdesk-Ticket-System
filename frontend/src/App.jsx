import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [priority, setPriority] = useState("")
  const [category, setCategory] = useState("")
  const [sort, setSort] = useState("")
  const [page, setPage] = useState(1)
  const[totalPages,setTotalPages] = useState(1)
  const [limit, setLimit] = useState(2)
  



  async function fetchTickets(){
    try{
      const response = await fetch(`http://localhost:5000/api/tickets?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&priority=${encodeURIComponent(priority)}&category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}&page=${page}&limit=${limit}`)

      const data = await response.json()
      console.log(data)

      setTickets(data.tickets);
      setTotalPages(data.totalPages)

  } catch(error) {
    console.error("Error fetching tickets:", error)
  }

}

function handleSearch() {
  if (page === 1){
    fetchTickets();
  } else{
    setPage(1)
  }
}



useEffect (() => {
  fetchTickets();
}, [page, limit])
  
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

        <select
          value = {limit}
          onChange = {(event) => {
            setLimit(Number(event.target.value))
            setPage(1)
          }}>

            <option value = "2"> 2 per page</option>
            <option value = "5"> 5 per page</option> 
            <option value = "10"> 10 per page</option> 
            <option value = "20"> 20 per page</option>   


        </select>

        <button onClick = {handleSearch}>
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

      <div
        className = "pagination">
        <button onClick = { () => {
          if (page > 1) {
            setPage(page - 1)
          }
        }}
        
        disabled = {page <= 1}>
          Previous
        </button >
        
        Page {page} of {totalPages} | {limit} per page

        <button onClick = {()=>{
          setPage(page + 1)
        }}
        
        disabled = {page >= totalPages}>

          Next
        </button>
        
      </div>

    </div>

  )
}

export default App
