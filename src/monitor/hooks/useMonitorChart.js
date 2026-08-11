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

        const now = new Date()

        let startDate = new Date()
        let endDate = new Date(now)

        if (chartRange === "7days") {

            startDate.setDate(now.getDate() - 7)

        }

        if (chartRange === "30days") {

            startDate.setDate(now.getDate() - 30)

        }

        if (chartRange === "month") {

            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )

        }

        if (chartRange === "lastMonth") {

            startDate = new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1
            )

            endDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )

        }

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

        /*
         * Get submissions that were either:
         *
         * 1. Uploaded during the selected period
         * OR
         * 2. Printed during the selected period
         *
         * This is important because upload date and print date
         * can be different.
         */

        if (chartRange !== "all") {

            query = query.or(
                `created_at.gte.${startDate.toISOString()},printed_date.gte.${startDate.toISOString()}`
            )

        }

        if (chartRange === "lastMonth") {

            query = query
                .or(
                    `created_at.lt.${endDate.toISOString()},printed_date.lt.${endDate.toISOString()}`
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

        /*
         * Create empty dates
         */

        if (chartRange !== "all") {

            for (
                let date = new Date(startDate);
                date < endDate;
                date.setDate(date.getDate() + 1)
            ) {

                const dateString =
                    date.toLocaleDateString()

                grouped[dateString] = {
                    date: dateString,
                    uploads: 0,
                    uploadFiles: 0,
                    printed: 0
                }

            }

        }

        /*
         * Process submissions
         */

        data.forEach(item => {

            /*
             * UPLOAD STATISTICS
             */

            if (item.created_at) {

                const uploadDate =
                    new Date(
                        item.created_at
                    )

                const uploadDateString =
                    uploadDate.toLocaleDateString()

                const uploadInRange =
                    chartRange === "all" ||
                    (
                        uploadDate >= startDate &&
                        uploadDate < endDate
                    )

                if (uploadInRange) {

                    if (!grouped[uploadDateString]) {

                        grouped[uploadDateString] = {
                            date: uploadDateString,
                            uploads: 0,
                            uploadFiles: 0,
                            printed: 0
                        }

                    }

                    grouped[uploadDateString].uploads++

                    if (item.ic_front_path) {
                        grouped[uploadDateString].uploadFiles++
                    }

                    if (item.ic_back_path) {
                        grouped[uploadDateString].uploadFiles++
                    }

                    if (item.bank_slip_path) {
                        grouped[uploadDateString].uploadFiles++
                    }

                }

            }

            /*
             * PRINT STATISTICS
             */

            if (
                item.status === "Printed" &&
                item.printed_date &&
                (
                    printSource === "all" ||
                    item.printed_from === printSource
                )
            ) {

                const printedDate =
                    new Date(
                        item.printed_date
                    )

                const printedDateString =
                    printedDate.toLocaleDateString()

                const printedInRange =
                    chartRange === "all" ||
                    (
                        printedDate >= startDate &&
                        printedDate < endDate
                    )

                if (printedInRange) {

                    if (!grouped[printedDateString]) {

                        grouped[printedDateString] = {
                            date: printedDateString,
                            uploads: 0,
                            uploadFiles: 0,
                            printed: 0
                        }

                    }

                    if (item.ic_front_path) {
                        grouped[printedDateString].printed++
                    }

                    if (item.ic_back_path) {
                        grouped[printedDateString].printed++
                    }

                    if (item.bank_slip_path) {
                        grouped[printedDateString].printed++
                    }

                }

            }

        })

        /*
         * Sort chart dates
         */

        setChartData(
            Object.values(grouped).sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            )
        )

    }

    useEffect(() => {

        if (user) {
            loadChartData()
        }

    }, [
        chartRange,
        printSource,
        user
    ])

    useEffect(() => {

        if (!user) return

        const interval = setInterval(() => {

            console.log(
                `[Monitor] Re-fetching chart data at ${new Date().toLocaleTimeString()}`
            )

            loadChartData()

        }, 5 * 60 * 1000)

        return () => clearInterval(interval)

    }, [
        user,
        chartRange,
        printSource
    ])

    return {
        chartData
    }

}