import React from "react";
import { useNavigate } from "react-router-dom";

function Login() {

  const [form, setForm] = useState({email: "", password: ""})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({...form, [e.taget.name]: e.target.value})
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/login`, 
          {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(form)
          })

          const data = await res.json()
          if(res.ok) {
            localStorage.setItem("token", data.token)
            localStorage.setItem("token", JSON.stringify(data.user))
            navigate("/")

          } else {
            alert(data.message || "signup failed")
          }

    } catch (error) {
      alert("something went wrong during signup")
    }

    finally {
      setLoading(false)
    }

  }

  return <div>login</div>;
}

export default Login;
