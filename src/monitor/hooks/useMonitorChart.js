import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { debugError } from '../../lib/debug'

export default function useMonitorChart(
    user,
    chartRange,
    printSource
) {

    const [chartData, setChartData] = useState([])

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
            debugError(
                "Load chart data error:",
                error
            )
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

        // Create empty dates
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
                    printSource === "all" ||
                    item.printed_from === printSource
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

    }, [chartRange, printSource, user])

    useEffect(() => {

        if (!user) return

        const interval = setInterval(() => {

            console.log(
                `[Monitor] Re-fetching chart data at ${new Date().toLocaleTimeString()}`
            )

            loadChartData()

        }, 5 * 60 * 1000)

        return () => clearInterval(interval)

    }, [user, chartRange, printSource])

    return {
        chartData
    }
}