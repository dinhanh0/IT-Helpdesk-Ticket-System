import {useState} from "react"
import {API_URL} from "../config"

function LoginPage({ onLogin }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("")

    async function handleSubmit(event) {
        event.preventDefault();

        setErrorMessage("")

        try{
            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            )

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        data.error ||
                        "Unable to log in."
                )
            }

            localStorage.setItem("token", data.token);

            onLogin(data.user);
        } catch (error) {
            setErrorMessage(
                error.message || "Unable to log in."
            )
        }
    }

    return (
        <div className = "login-page">
            <h1>Technician Login</h1>

            {errorMessage && (
                <p className = "error-message">
                    {errorMessage}
                </p>
            )}

            <form onSubmit = {handleSubmit}>
                <input
                    type = "email"
                    placeholder = "Email"
                    value = {email}
                    onChange={(event) => 
                        setEmail(event.target.value)
                    }
                />

                <input
                    type = "password"
                    placeholder="Password"
                    value = {password}
                    onChange={(event) => 
                        setPassword(event.target.value)
                    }
                    />
                
                <button type = "submit">
                    Log in
                </button>
            </form>

            <div className="demo-account">
            <h3>Demo Technician Account</h3>

            <p>
                <strong>Email:</strong> anh@example.com
            </p>

            <p>
                <strong>Password:</strong> Helpdesk123!
            </p>
            </div>
        </div>
    );
}

export default LoginPage;