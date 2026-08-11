import { useEffect, useState } from 'react'
import useMonitorAuth from './hooks/useMonitorAuth'
import { supabase } from '../lib/supabase'
import './Monitor.css'
import { debugError } from '../lib/debug'
import useMonitorStats from './hooks/useMonitorStats'
import useMonitorData from './hooks/useMonitorData'
import useMonitorChart from './hooks/useMonitorChart'
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
    const [printSource, setPrintSource] = useState("all")

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
        printSource
    )

    const {
        pending,
        expired,
        storageFiles,
        loadingData
    } = useMonitorData(user)

    const {
        chartData
    } = useMonitorChart(
        user,
        chartRange,
        printSource
    )

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
                printSource={printSource}
                setPrintSource={setPrintSource}
                printSources={printSources}
            />

            <StatisticsChart
                chartData={chartData}
                chartRange={chartRange}
                setChartRange={setChartRange}
            />

        </div>
    )
}

export default Monitor