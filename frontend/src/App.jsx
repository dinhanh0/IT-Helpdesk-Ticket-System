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

  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingTicketId, setDeletingTicketId] = useState(null)
  const [updatingTicketId, setUpdatingTicketId] = useState(null)

  async function fetchTickets(options = {}){
    const searchValue = options.search ?? search
    const statusValue = options.status ?? status
    const priorityValue = options.priority ?? priority
    const categoryValue = options.category ?? category
    const sortValue = options.sort ?? sort
    const pageValue = options.page ?? page
    const limitValue = options.limit ?? limit

    try{
      setErrorMessage("")

      setIsLoadingTickets(true)
      const response = await fetch(`http://localhost:5000/api/tickets?search=${encodeURIComponent(searchValue)}&status=${encodeURIComponent(statusValue)}&priority=${encodeURIComponent(priorityValue)}&category=${encodeURIComponent(categoryValue)}&sort=${encodeURIComponent(sortValue)}&page=${pageValue}&limit=${limitValue}`)

      const data = await response.json()

      if(!response.ok){
        console.error("Error fetching tickets", data)
        setErrorMessage("Error fetching tickets")
        return
      }
      console.log(data)
      
      setTickets(data.tickets);
      setTotalPages(data.totalPages)
      
  } catch(error) {
      console.error("Could not connect to server", error)
      setErrorMessage("Could not connect to server")
  } finally{
      setIsLoadingTickets(false)
  }

}

function handleSearch() {
  if (page === 1){
    fetchTickets();
  } else{
    setPage(1)
  }
}

async function handleClearFilters(){
  setSearch("")
  setStatus("")
  setPriority("")
  setCategory("")
  setSort("")
  setPage(1)

  await fetchTickets({
    search: "",
    status: "",
    priority: "",
    category: "",
    sort: "",
    page: 1,
    limit: limit
  })
}

async function handleCreateTicket() {
  try{

    setErrorMessage("")
    setSuccessMessage("")

    if (newName.trim() === "" || newEmail.trim() === ""|| newTitle.trim() === "" || newCategory ==="" || newPriority ==="" || newDescription.trim() ===""){
      setErrorMessage("All fields are required")
      return
    }

    setIsCreating(true)


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
      await fetchTickets()
    }
    else{
      setPage(1)
    }


  } catch (error){
      setErrorMessage("Could not connect to server")
    console.error("Could not connect to server", error)
  } finally {
      setIsCreating(false)

  }
}

async function handleDeleteTicket(ticketId){
  const confirmed = window.confirm("Are you sure you want to delete this ticket?")

  if (!confirmed){
    return
  }

  try{
    setDeletingTicketId(ticketId)
    setErrorMessage("")
    setSuccessMessage("")

    const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}`, {
        method: "DELETE"
        
      }
      )
    const data = await response.json()

    if(!response.ok){
      console.error("Error sending request", data)
      setErrorMessage("Failed to delete ticket")
      return
    }

    await fetchTickets()
    setSuccessMessage("Ticket deleted successfully")

  } catch(error) {
    setErrorMessage("Failed to connect to server")
    console.error("Failed to connect to server", error)
  } finally{
    setDeletingTicketId(null)
  }
}

async function handleUpdateTicket(ticket, newStatus){
  try{

    setUpdatingTicketId(ticket.id)
    setErrorMessage("")
    setSuccessMessage("")
    
    const response = await fetch(`http://localhost:5000/api/tickets/${ticket.id}`,{
    method: "PUT",
    headers: {
      "Content-Type": "application/json"},
    body: JSON.stringify({
      name: ticket.name,
      email: ticket.email,
      title: ticket.title,
      category: ticket.category,
      priority: ticket.priority,
      description: ticket.description,   
      status: newStatus    

    })     
  })

  const data = await response.json()

  if (!response.ok){
    console.log(data)
    console.error("Failed to update ticket")
    setErrorMessage("Failed to update ticket")
    return
  }

  else{
    await fetchTickets()
    setSuccessMessage("Ticket updated successfully")
  }

}catch(error){
  console.error("Error connecting to server")
  setErrorMessage("Error connecting to server")
} finally {
  setUpdatingTicketId(null)
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

        <button 
          onClick={()=>handleCreateTicket()}
          disabled = {isCreating}
          
          >

          {isCreating ? "Creating..." : "Submit"}

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
          <option value="resolved">Resolved</option>
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

        <button 
        onClick = {handleSearch}
        disabled = {isLoadingTickets}
        >
          {isLoadingTickets ? "Loading..." : "Search"}
        </button>

        <button
        onClick={handleClearFilters}
        >
          Clear Filters
        </button>

      </div>


      <div
        className = "ticket-list"
      > 
        {
          isLoadingTickets ? (
            <p> Loading tickets... </p>
          ) : tickets.length === 0 ? (
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
              <select 
              value={ticket.status}
              onChange={(event) => handleUpdateTicket(ticket, event.target.value)}
              disabled = {updatingTicketId === ticket.id}
              >
                <option value="open">Open</option>
                <option value="in progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <p>{ticket.description}</p>

              <button 
              onClick={()=> handleDeleteTicket(ticket.id)}
              disabled = {deletingTicketId === ticket.id}
              >
                {deletingTicketId === ticket.id ? "Deleting..." : "Delete"}
              </button>
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
        
        disabled = {page <= 1 || isLoadingTickets}>
          Previous
        </button >
        
        Page {page} of {totalPages} | {limit} per page

        <button onClick = {()=>{
          setPage(page + 1)
        }}
        
        disabled = {page >= totalPages || isLoadingTickets}>

          Next
        </button>
        
      </div>

    </div>

  )
}

export default App
