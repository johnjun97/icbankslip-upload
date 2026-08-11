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
import UploadPrintCard from './components/UploadPrintCard'

function Monitor() {

    const {
        user,
        checkingUser
    } = useMonitorAuth()

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
    chartRange,
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

            <UploadPrintCard
                total={total}
                totalUploadFiles={totalUploadFiles}
                printed={printed}
                loadingTotal={loadingTotal}
                loadingUploadFiles={loadingUploadFiles}
                loadingPrinted={loadingPrinted}
                printSource={printSource}
                setPrintSource={setPrintSource}
                printSources={printSources}
                chartData={chartData}
                chartRange={chartRange}
                setChartRange={setChartRange}
            />

        </div>
    )
}

export default Monitor