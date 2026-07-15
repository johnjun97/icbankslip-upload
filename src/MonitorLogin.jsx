import { useState } from "react"
import { supabase } from "./lib/supabase"
import './MonitorLogin.css'

function MonitorLogin() {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")


    const login = async () => {

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            alert(error.message)
            return
        }

        window.location.href = "/monitor"
    }


    return (
        <div className="monitor-login-page">

            <div className="monitor-login-card">

                <h2>
                    Monitor Login
                </h2>


                <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            login()
                        }
                    }}
                />

                <button onClick={login}>
                    Login
                </button>

            </div>

        </div>
    )
}

export default MonitorLogin