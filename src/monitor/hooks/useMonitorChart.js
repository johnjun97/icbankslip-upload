import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { debugError } from '../../lib/debug'

export default function useMonitorChart(
    user,
    chartRange,
    printSource,
    refreshTrigger
) {

    const [chartData, setChartData] = useState([])

    const getBankSlipCount = (item) => {

        let count = 0

        // Old format
        if (item.bank_slip_path) {
            count++
        }

        // New format
        if (Array.isArray(item.bank_slip_paths)) {
            count += item.bank_slip_paths.length
        }

        return count
    }

    const loadChartData = async () => {

        const { data, error } = await supabase
            .from('submissions')
            .select(`
                created_at,
                printed_date,
                status,
                printed_from,
                ic_front_path,
                ic_back_path,
                bank_slip_path,
                bank_slip_paths
            `)

        if (error) {
            debugError(
                "Load chart data error:",
                error
            )
            return
        }

        const now = new Date()

        let startDate
        let endDate

        /*
         * Determine date range
         */

        if (chartRange === "today") {

            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            )

            endDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1
            )

        }

        else if (chartRange === "yesterday") {

            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 1
            )

            endDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            )

        }

        else if (chartRange === "thisweek") {

            const day = now.getDay()

            const mondayOffset = day === 0
                ? -6
                : 1 - day

            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + mondayOffset
            )

            endDate = new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate() + 7
            )

        }

        else if (chartRange === "lastweek") {

            const day = now.getDay()

            const mondayOffset = day === 0
                ? -6
                : 1 - day

            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + mondayOffset - 7
            )

            endDate = new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate() + 7
            )

        }

        else if (chartRange === "7days") {

            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 6
            )

            endDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1
            )

        }

        else if (chartRange === "30days") {

            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 29
            )

            endDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1
            )

        }

        else if (chartRange === "month") {

            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )

            endDate = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                1
            )

        }

        else if (chartRange === "lastMonth") {

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

        /*
         * All Time
         */

        else {

            startDate = null
            endDate = null

        }


        const grouped = {}


        /*
         * Create empty dates
         */

        if (startDate && endDate) {

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
             * Upload statistics
             */

            const uploadDate =
                new Date(item.created_at)

            const uploadInRange =
                !startDate ||
                (
                    uploadDate >= startDate &&
                    uploadDate < endDate
                )


            if (uploadInRange) {

                const dateString =
                    uploadDate.toLocaleDateString()

                if (!grouped[dateString]) {

                    grouped[dateString] = {
                        date: dateString,
                        uploads: 0,
                        uploadFiles: 0,
                        printed: 0
                    }

                }

                grouped[dateString].uploads++


                if (item.ic_front_path) {
                    grouped[dateString].uploadFiles++
                }

                if (item.ic_back_path) {
                    grouped[dateString].uploadFiles++
                }

                grouped[dateString].uploadFiles += getBankSlipCount(item)

            }


            /*
             * Printed statistics
             */

            if (
                item.status === "Printed" &&
                item.printed_date
            ) {

                const printedDate =
                    new Date(item.printed_date)

                const printedInRange =
                    !startDate ||
                    (
                        printedDate >= startDate &&
                        printedDate < endDate
                    )

                const correctSource =
                    printSource === "all" ||
                    item.printed_from === printSource


                if (
                    printedInRange &&
                    correctSource
                ) {

                    const dateString =
                        printedDate.toLocaleDateString()

                    if (!grouped[dateString]) {

                        grouped[dateString] = {
                            date: dateString,
                            uploads: 0,
                            uploadFiles: 0,
                            printed: 0
                        }

                    }


                    if (item.ic_front_path) {
                        grouped[dateString].printed++
                    }

                    if (item.ic_back_path) {
                        grouped[dateString].printed++
                    }

                    grouped[dateString].printed += getBankSlipCount(item)

                }

            }

        })


        /*
         * Sort by date
         */

        const result =
            Object.values(grouped).sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            )


        setChartData(result)

    }

    useEffect(() => {

        if (!user) return

        loadChartData()

    }, [
        user,
        chartRange,
        printSource,
        refreshTrigger
    ])

    return {
        chartData
    }
}