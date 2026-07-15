import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './Monitor.css'

function Monitor() {

    const [user, setUser] = useState(null)
    const [checkingUser, setCheckingUser] = useState(true)

    const [range, setRange] = useState("month")
    const [total, setTotal] = useState(null)
    const [loadingData, setLoadingData] = useState(true)

    useEffect(() => {

        const checkUser = async () => {

            const {
                data,
                error
            } = await supabase.auth.getUser()

            if (error) {
                console.error(error)
                window.location.href = "/monitor-login"
                return
            }

            if (!data.user) {
                window.location.href = "/monitor-login"
                return
            }

            setUser(data.user)
            setCheckingUser(false)
        }


        checkUser()

    }, [])

    useEffect(() => {

        if (user) {
            loadData()
        }

    }, [range, user])

    const loadData = async () => {

        setLoadingData(true)
        let query = supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
        const now = new Date()


        if (range === "today") {
            const start = new Date()
            start.setHours(0, 0, 0, 0)
            query = query.gte(
                'created_at',
                start.toISOString()
            )
        }

        if (range === "7days") {

            const start = new Date()
            start.setDate(
                now.getDate() - 7
            )
            query = query.gte(
                'created_at',
                start.toISOString()
            )
        }
        if (range === "30days") {

            const start = new Date()
            start.setDate(
                now.getDate() - 30
            )
            query = query.gte(
                'created_at',
                start.toISOString()
            )

        }


        if (range === "month") {
            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )
            query = query.gte(
                'created_at',
                start.toISOString()
            )
        }

        const { count, error } = await query

        if (error) {
            console.error(error)
            setLoadingData(false)
            return
        }
        setTotal(count)
        setLoadingData(false)

    }

    if (checkingUser) {
        return <h2>Loading...</h2>
    }

    const logout = async () => {

        await supabase.auth.signOut()

        window.location.href = "/monitor-login"

    }

    return (
        <div className="monitor-page">

            <div className="monitor-header">

                <div>
                    <h1>
                        Kiosk Monitor
                    </h1>

                    <p>
                        {user.email}
                    </p>
                </div>


                <div className="monitor-actions">

                    <select
                        className="filter-select"
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                    >
                        <option value="today">
                            Today
                        </option>

                        <option value="7days">
                            Last 7 Days
                        </option>

                        <option value="30days">
                            Last 30 Days
                        </option>

                        <option value="month">
                            This Month
                        </option>

                        <option value="all">
                            All Time
                        </option>

                    </select>


                    <button
                        className="logout-button"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>

            </div>


            <div className="dashboard-grid">

                <div className="monitor-card">

                    <h2>
                        Total Uploads
                    </h2>

                    <p>
                        {loadingData ? "Loading..." : total}
                    </p>

                </div>

            </div>

        </div>
    )
}
export default Monitor