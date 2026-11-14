
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { debugError } from '../../lib/debug'
import { getDateRange, parseArray } from './monitorHelpers'

export default function useMonitorChart(
    user,
    chartRange,
    printSource,
    refreshTrigger
) {
    const [chartData, setChartData] = useState([])

    const loadChartData = async () => {
        // Fetch all records using pagination
        let allData = []
        let from = 0
        const pageSize = 1000

        while (true) {

            const { data, error } = await supabase
                .from('submissions')
                .select(`
            id,
            created_at,
            printed_date,
            status,
            printed_from,
            ic_front_path,
            ic_back_path,
            bank_slip_paths,
            ic_copies,
            bank_slip_copies
        `)
                .range(from, from + pageSize - 1)

            if (error) {
                debugError('Load chart data error:', error)
                return
            }

            allData = allData.concat(data || [])

            if (!data || data.length < pageSize) {
                break
            }

            from += pageSize
        }

        const data = allData




        // Use the shared date range
        const { start, end } = getDateRange(chartRange)

        // DEBUG: Compare chart records against date range
        const uploadsInRange = (data || []).filter(item => {
            if (!item.created_at) return false

            const date = new Date(item.created_at)

            return (!start || date >= start) &&
                (!end || date < end)
        })

        const printedInRange = (data || []).filter(item => {
            if (item.status !== 'Printed' || !item.printed_date) {
                return false
            }

            const date = new Date(item.printed_date)

            const inRange =
                (!start || date >= start) &&
                (!end || date < end)

            const correctSource =
                printSource === 'all' ||
                item.printed_from === printSource

            return inRange && correctSource
        })

        // Convert date into a local YYYY-MM-DD key
        const getDateKey = (date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')

            return `${year}-${month}-${day}`
        }

        const createBucket = (date) => {
            return {
                date: getDateKey(date),
                uploads: 0,
                uploadFiles: 0,
                printed: 0
            }
        }

        const grouped = {}

        // Create empty date buckets for selected ranges
        if (start && end) {
            for (
                let date = new Date(start);
                date < end;
                date.setDate(date.getDate() + 1)
            ) {
                const dateKey = getDateKey(date)
                grouped[dateKey] = createBucket(date)
            }
        }

        // Process submissions
        ; (data || []).forEach(item => {

            // =========================================
            // TOTAL UPLOADS
            // Date: created_at
            // =========================================

            if (item.created_at) {
                const uploadDate = new Date(item.created_at)

                const uploadInRange =
                    (!start || uploadDate >= start) &&
                    (!end || uploadDate < end)

                if (uploadInRange) {
                    const dateKey = getDateKey(uploadDate)

                    if (!grouped[dateKey]) {
                        grouped[dateKey] = createBucket(uploadDate)
                    }

                    grouped[dateKey].uploads++

                    // IC front and back files
                    if (item.ic_front_path) {
                        grouped[dateKey].uploadFiles++
                    }

                    if (item.ic_back_path) {
                        grouped[dateKey].uploadFiles++
                    }

                    // Bank slip uploaded files
                    grouped[dateKey].uploadFiles +=
                        parseArray(item.bank_slip_paths).length
                }
            }

            // =========================================
            // TOTAL PRINTED FILES
            // Date: printed_date
            // Status: Printed
            // Source: printSource
            // =========================================

            if (
                item.status === 'Printed' &&
                item.printed_date
            ) {
                const printedDate = new Date(item.printed_date)

                const printedInRange =
                    (!start || printedDate >= start) &&
                    (!end || printedDate < end)

                const correctSource =
                    printSource === 'all' ||
                    item.printed_from === printSource

                if (printedInRange && correctSource) {
                    const dateKey = getDateKey(printedDate)

                    if (!grouped[dateKey]) {
                        grouped[dateKey] = createBucket(printedDate)
                    }

                    // IC printed copies
                    grouped[dateKey].printed +=
                        Number(item.ic_copies) || 0

                    // Bank slip printed copies
                    grouped[dateKey].printed +=
                        parseArray(item.bank_slip_copies).reduce(
                            (sum, copies) =>
                                sum + (Number(copies) || 0),
                            0
                        )
                }
            }
        })

        // Sort dates chronologically
        const result = Object.entries(grouped)
            .sort(([dateA], [dateB]) =>
                dateA.localeCompare(dateB)
            )
            .map(([, value]) => value)

        setChartData(result)
    }

    useEffect(() => {
        if (!user) {
            return
        }

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
