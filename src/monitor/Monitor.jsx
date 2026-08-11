import { useEffect, useState } from 'react'
import useMonitorAuth from './hooks/useMonitorAuth'
import { supabase } from '../lib/supabase'
import './Monitor.css'
import { debugError } from '../lib/debug'
import useMonitorStats from './hooks/useMonitorStats'
import useMonitorData from './hooks/useMonitorData'
import MonitorHeader from './components/MonitorHeader'
import SummaryCards from './components/SummaryCards'
import StatsCards from './components/StatsCards'
import StatisticsChart from './components/StatisticsChart'

function Monitor() {

    const {
        user,
        checkingUser
    } = useMonitorAuth()

    const [cardRange, setCardRange] = useState("today")
    const [chartRange, setChartRange] = useState("7days")
    const [printSources, setPrintSources] = useState([])
    const [cardPrintSource, setCardPrintSource] = useState("all")
    const [chartPrintSource, setChartPrintSource] = useState("all")

    const [chartData, setChartData] = useState([])

    const {
        total,
        totalUploadFiles,
        loadingUploadFiles,
        printed,
        loadingTotal,
        loadingPrinted
    } = useMonitorStats(
        user,
        cardRange,
        cardPrintSource
    )

    const {
        pending,
        expired,
        storageFiles,
        loadingData
    } = useMonitorData(user)

    const loadPrintSources = async () => {

        const { data, error } = await supabase
            .from('submissions')
            .select('printed_from')
            .not('printed_from', 'is', null)

        if (error) {
            debugError(
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

        if (user) {
            loadPrintSources()
        }

    }, [user])

    const loadChartData = async () => {

        let query = supabase
            .from('submissions')
            .select(`
        created_at,
        printed_date,
        status,
        printed_from,
        ic_front_path,
        ic_back_path,
        bank_slip_path
    `)

        const now = new Date()



        if (chartRange === "7days") {

            const start = new Date()
            start.setDate(now.getDate() - 7)

            query = query.gte(
                'created_at',
                start.toISOString()
            )

        }

        if (chartRange === "30days") {

            const start = new Date()
            start.setDate(now.getDate() - 30)

            query = query.gte(
                'created_at',
                start.toISOString()
            )

        }

        if (chartRange === "month") {

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

        if (chartRange === "lastMonth") {

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

        const { data, error } = await query

        if (error) {
            debugError("Load chart data error:", error)
            return
        }

        const grouped = {}


        const startDate = new Date()

        if (chartRange === "7days") {
            startDate.setDate(now.getDate() - 7)
        }

        if (chartRange === "30days") {
            startDate.setDate(now.getDate() - 30)
        }

        if (chartRange === "month") {
            startDate.setDate(1)
        }

        if (chartRange === "lastMonth") {
            startDate.setMonth(now.getMonth() - 1)
            startDate.setDate(1)
        }


        // create empty dates
        for (
            let date = new Date(startDate);
            date <= now;
            date.setDate(date.getDate() + 1)
        ) {

            const dateString = date.toLocaleDateString()

            grouped[dateString] = {
                date: dateString,
                uploads: 0,
                uploadFiles: 0,
                printed: 0
            }

        }


        data.forEach(item => {

            const uploadDate = new Date(
                item.created_at
            ).toLocaleDateString()


            if (!grouped[uploadDate]) {
                grouped[uploadDate] = {
                    date: uploadDate,
                    uploads: 0,
                    uploadFiles: 0,
                    printed: 0
                }
            }


            grouped[uploadDate].uploads++

            if (item.ic_front_path) {
                grouped[uploadDate].uploadFiles++
            }

            if (item.ic_back_path) {
                grouped[uploadDate].uploadFiles++
            }

            if (item.bank_slip_path) {
                grouped[uploadDate].uploadFiles++
            }


            if (
                item.status === "Printed" &&
                item.printed_date &&
                (
                    chartPrintSource === "all" ||
                    item.printed_from === chartPrintSource
                )
            ) {

                const printedDate = new Date(
                    item.printed_date
                ).toLocaleDateString()


                if (!grouped[printedDate]) {
                    grouped[printedDate] = {
                        date: printedDate,
                        uploads: 0,
                        uploadFiles: 0,
                        printed: 0
                    }
                }


                if (item.ic_front_path) {
                    grouped[printedDate].printed++
                }

                if (item.ic_back_path) {
                    grouped[printedDate].printed++
                }

                if (item.bank_slip_path) {
                    grouped[printedDate].printed++
                }

            }

        })


        setChartData(
            Object.values(grouped).sort(
                (a, b) => new Date(a.date) - new Date(b.date)
            )
        )

    }

    useEffect(() => {

        if (user) {
            loadChartData()
        }

    }, [chartRange, chartPrintSource, user])

    useEffect(() => {

        if (!user) return

        const interval = setInterval(() => {

            console.log(
                `[Monitor] Re-fetching data at ${new Date().toLocaleTimeString()}`
            )

            loadChartData()

        }, 5 * 60 * 1000) // auto re-fetch in 5 minutes

        return () => clearInterval(interval)

    }, [user, chartRange, chartPrintSource])

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

            <MonitorHeader
                email={user.email}
                onLogout={logout}
            />

            <SummaryCards
                loading={loadingData}
                storageFiles={storageFiles}
                pending={pending}
                expired={expired}
            />

            <div className="monitor-filter-row">

                <select
                    className="filter-select"
                    value={cardRange}
                    onChange={(e) => setCardRange(e.target.value)}
                >
                    <option value="today">
                        Today
                    </option>

                    <option value="yesterday">
                        Yesterday
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

            </div>

            <StatsCards
                loadingTotal={loadingTotal}
                total={total}
                loadingUploadFiles={loadingUploadFiles}
                totalUploadFiles={totalUploadFiles}
                loadingPrinted={loadingPrinted}
                printed={printed}
                cardPrintSource={cardPrintSource}
                setCardPrintSource={setCardPrintSource}
                printSources={printSources}
            />

            <StatisticsChart
                chartData={chartData}
                chartRange={chartRange}
                setChartRange={setChartRange}
                chartPrintSource={chartPrintSource}
                setChartPrintSource={setChartPrintSource}
                printSources={printSources}
            />

        </div>
    )
}

export default Monitor