import { useState, useEffect } from "react"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { supabase } from '../lib/supabase'
import './MonitorLogin.css'

function MonitorLogin() {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {

        const checkSession = async () => {

            const {
                data
            } = await supabase.auth.getUser()


            if (data.user) {
                window.location.href = "/monitor"
            }

        }


        checkSession()

    }, [])

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

<div className="password-wrapper">

    <input
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => {
            if (e.key === "Enter") {
                login()
            }
        }}
    />


    <span
        className="eye-icon"
        onClick={() => setShowPassword(!showPassword)}
    >
        {
            showPassword
                ? <FaEyeSlash />
                : <FaEye />
        }
    </span>

</div>

                <button onClick={login}>
                    Login
                </button>

            </div>

        </div>
    )
}

export default MonitorLogin