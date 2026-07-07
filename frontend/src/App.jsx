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
  

  //states for ticket form creation

  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPriority, setNewPriority] = useState("")
  const [errorMessage,setErrorMessage] = useState("")
  const [successMessage,setSuccessMessage] = useState("")


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

async function handleCreateTicket() {
  try{

    setErrorMessage("")
    setSuccessMessage("")

    if (newName.trim() == "" || newEmail.trim() === ""|| newTitle.trim() === "" || newCategory ==="" || newPriority ==="" || newDescription.trim() ===""){
      setErrorMessage("All fields are required")
      return
    }

    const response = await fetch("http://localhost:5000/api/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: newName,
        email: newEmail,
        title: newTitle,
        category: newCategory,
        priority: newPriority,
        description: newDescription
      })
    }
    )
    const data = await response.json()
    
    if (!response.ok){
      console.error("Error sending request", data)
      setErrorMessage("Failed to create ticket")
      return
    }

    setSuccessMessage("Ticket created successfully")

    setNewName("")
    setNewEmail("")
    setNewTitle("")
    setNewCategory("")
    setNewPriority("")
    setNewDescription("")


    if (page === 1){
      fetchTickets()
    }
    else{
      setPage(1)
    }


  } catch (error){
      setErrorMessage("Could not connect to server")
    console.error("Could not connect to server", error)
  }
}

async function handleDeleteTicket(ticketId){
  setErrorMessage("")
  setSuccessMessage("")

  const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    }
    )
  response.json()

  if(!response.ok){
    console.error("Error sending request", data)
    setErrorMessage("Failed to delete ticket")
    return
  }

  if(){
    fetchTickets
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
        className = "create-ticket-form">
        
        {errorMessage && <p>{errorMessage}</p>}
        
        {successMessage && <p>{successMessage}</p>}

        <input
          type = "text"
          placeholder = "name"
          value = {newName}
          onChange={(event) => setNewName(event.target.value)}
        
        />

        <input
          type = "email"
          placeholder = "email"
          value = {newEmail}
          onChange={(event) => setNewEmail(event.target.value)} 
        />
        
        <input
          type = "text"
          placeholder = "title"
          value = {newTitle}
          onChange = {(event) => setNewTitle(event.target.value)}
        />

        <select
          value = {newCategory}
          onChange={(event) => setNewCategory(event.target.value)}>
          <option value ="">Default</option>
          <option value = "Hardware"> Hardware </option>
          <option value = "Software"> Software </option>
          <option value = "Network"> Network </option>
          <option value = "Account"> Account </option>
          <option value = "Other"> Other </option>

        </select>
        

        <select
          value = {newPriority}
          onChange={(event) => setNewPriority(event.target.value)}>
          <option value ="">Default</option>
          <option value = "low"> Low </option>
          <option value = "medium"> Medium </option>
          <option value = "high"> High </option>
          <option value = "urgent"> Urgent </option>
        </select>

        <textarea
          placeholder = "type your description"
          value = {newDescription}
          onChange={(event) => setNewDescription(event.target.value)}
          rows={4}
          cols={50}
        />

        <button onClick={handleCreateTicket}>

          Submit

        </button>

      </div>

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
