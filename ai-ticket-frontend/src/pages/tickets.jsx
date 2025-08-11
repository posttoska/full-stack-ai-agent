import React from "react";

function Tickets() {

  const [form, setForm] = useState({email: "", password: ""})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({...form, [e.taget.name]: e.target.value})
  }

  const handleTickets = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/tickets`, 
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

  return <div>tickets</div>;
}

export default Tickets;
