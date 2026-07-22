import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './Monitor.css'

function Monitor() {

    const [user, setUser] = useState(null)
    const [checkingUser, setCheckingUser] = useState(true)

    const [range, setRange] = useState("month")
    const [printSources, setPrintSources] = useState([])
    const [printSource, setPrintSource] = useState("all")

    const [total, setTotal] = useState(null)
    const [printed, setPrinted] = useState(null)
    const [pending, setPending] = useState(null)
    const [expired, setExpired] = useState(null)
    const [storageFiles, setStorageFiles] = useState(null)
    const [loadingData, setLoadingData] = useState(true)

    const loadPrintSources = async () => {

        const { data, error } = await supabase
            .from('submissions')
            .select('printed_from')
            .not('printed_from', 'is', null)

        if (error) {
            console.error(
                "Load print sources error:",
                error
            )
            return
        }


        const uniqueSources = [
            ...new Set(
                data.map(item => item.printed_from)
            )
        ]


        setPrintSources(uniqueSources)

    }

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

            await loadPrintSources()

            setCheckingUser(false)
        }


        checkUser()

    }, [])

    useEffect(() => {

        if (user) {
            loadData()
        }

    }, [range, printSource, user])

    const loadData = async () => {

        setLoadingData(true)
let query = supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })

if (printSource !== "all") {

    query = query.eq(
        'printed_from',
        printSource
    )

}
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

        if (range === "lastMonth") {

            const start = new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1
            )

            const end = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )

            query = query
                .gte(
                    'created_at',
                    start.toISOString()
                )
                .lt(
                    'created_at',
                    end.toISOString()
                )
        }

        const { count, error } = await query

        if (error) {
            console.error(error)
            setLoadingData(false)
            return
        }

        setTotal(count)

        const getStatusCount = async (status) => {

            let statusQuery = supabase
                .from('submissions')
                .select('*', {
                    count: 'exact',
                    head: true
                })
                .eq(
                    'status',
                    status
                )

            if (printSource !== "all") {

                statusQuery = statusQuery.eq(
                    'printed_from',
                    printSource
                )

            }
            // copy same date filter
            if (range === "today") {

                const start = new Date()
                start.setHours(0, 0, 0, 0)

                statusQuery = statusQuery.gte(
                    'created_at',
                    start.toISOString()
                )
            }


            if (range === "7days") {

                const start = new Date()

                start.setDate(
                    now.getDate() - 7
                )

                statusQuery = statusQuery.gte(
                    'created_at',
                    start.toISOString()
                )
            }


            if (range === "30days") {

                const start = new Date()

                start.setDate(
                    now.getDate() - 30
                )

                statusQuery = statusQuery.gte(
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

                statusQuery = statusQuery.gte(
                    'created_at',
                    start.toISOString()
                )
            }


            if (range === "lastMonth") {

                const start = new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    1
                )

                const end = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                )

                statusQuery = statusQuery
                    .gte(
                        'created_at',
                        start.toISOString()
                    )
                    .lt(
                        'created_at',
                        end.toISOString()
                    )
            }


            const result = await statusQuery

            return result.count || 0

        }


        setPrinted(await getStatusCount("Printed"))
        setPending(await getStatusCount("Pending"))
        setExpired(await getStatusCount("Expired"))

        const countStorageFiles = async () => {

            const folders = [
                "ic-front",
                "ic-back",
                "bank-slip"
            ]

            let totalFiles = 0

            for (const folder of folders) {

                const { data, error } = await supabase.storage
                    .from('uploads')
                    .list(folder, {
                        limit: 1000
                    })

                if (error) {
                    console.error(
                        "Storage count error:",
                        error
                    )
                    continue
                }

                totalFiles += data.length
            }

            return totalFiles
        }


        setStorageFiles(
            await countStorageFiles()
        )

        setLoadingData(false)

    }

    if (checkingUser) {
        return (
            <div className="monitor-loading">
                Checking login...
            </div>
        )
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

                        <option value="lastMonth">
                            Last Month
                        </option>

                        <option value="all">
                            All Time
                        </option>

                    </select>


                    <select
                        className="filter-select"
                        value={printSource}
                        onChange={(e) => setPrintSource(e.target.value)}
                    >

                        <option value="all">
                            All Sources
                        </option>

                        {
                            printSources.map((source) => (
                                <option
                                    key={source}
                                    value={source}
                                >
                                    {source}
                                </option>
                            ))
                        }

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

                <div className="monitor-card">

                    <h2>
                        Total Printed
                    </h2>

                    <p>
                        {loadingData ? "Loading..." : printed}
                    </p>

                </div>


                <div className="monitor-card">

                    <h2>
                        Pending
                    </h2>

                    <p>
                        {loadingData ? "Loading..." : pending}
                    </p>

                </div>


                <div className="monitor-card">

                    <h2>
                        Expired
                    </h2>

                    <p>
                        {loadingData ? "Loading..." : expired}
                    </p>

                </div>

                <div className="monitor-card">

                    <h2>
                        Storage Files
                    </h2>

                    <p>
                        {loadingData ? "Loading..." : storageFiles}
                    </p>

                </div>

            </div>

        </div>
    )
}
export default Monitor