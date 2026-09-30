import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { debugError } from '../../lib/debug'

export default function useMonitorStats(
    user,
    cardRange,
    cardPrintSource,
    refreshTrigger
) {

    const [total, setTotal] = useState(null)
    const [totalUploadFiles, setTotalUploadFiles] = useState(null)
    const [loadingUploadFiles, setLoadingUploadFiles] = useState(true)
    const [printed, setPrinted] = useState(null)
    const [loadingTotal, setLoadingTotal] = useState(true)
    const [loadingPrinted, setLoadingPrinted] = useState(true)


    const loadTotalUploads = async () => {

        setLoadingTotal(true)

        const now = new Date()

        let query = supabase
            .from('submissions')
            .select('*', {
                count: 'exact',
                head: true
            })


        if (cardRange === "today") {

            const start = new Date()
            start.setHours(0, 0, 0, 0)

            query = query.gte(
                'created_at',
                start.toISOString()
            )

        }


        if (cardRange === "yesterday") {

            const start = new Date()
            start.setDate(start.getDate() - 1)
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setDate(end.getDate() + 1)

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

        if (cardRange === "7days") {

            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 6
            )

            query = query
                .gte(
                    'created_at',
                    start.toISOString()
                )
        }

        if (cardRange === "thisweek") {

            const day = now.getDay()

            const mondayOffset = day === 0
                ? -6
                : 1 - day

            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + mondayOffset
            )

            query = query.gte(
                'created_at',
                start.toISOString()
            )

        }


        if (cardRange === "lastweek") {

            const day = now.getDay()

            const mondayOffset = day === 0
                ? -6
                : 1 - day

            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + mondayOffset - 7
            )

            const end = new Date(
                start.getFullYear(),
                start.getMonth(),
                start.getDate() + 7
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


        if (cardRange === "month") {

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


        if (cardRange === "lastMonth") {

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

            debugError(
                "Load total uploads error:",
                error
            )

            setLoadingTotal(false)

            return
        }


        setTotal(count || 0)

        setLoadingTotal(false)

    }


    const loadTotalUploadFiles = async () => {

        setLoadingUploadFiles(true)

        const now = new Date()

        let query = supabase
            .from('submissions')
            .select(`
            ic_front_path,
            ic_back_path,
            bank_slip_paths
        `)


        if (cardRange === "today") {

            const start = new Date()
            start.setHours(0, 0, 0, 0)

            query = query.gte(
                'created_at',
                start.toISOString()
            )

        }


        if (cardRange === "yesterday") {

            const start = new Date()
            start.setDate(start.getDate() - 1)
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setDate(end.getDate() + 1)

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


        if (cardRange === "7days") {

            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 6
            )

            query = query.gte(
                'created_at',
                start.toISOString()
            )

        }


        if (cardRange === "thisweek") {

            const day = now.getDay()

            const mondayOffset = day === 0
                ? -6
                : 1 - day

            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + mondayOffset
            )

            query = query.gte(
                'created_at',
                start.toISOString()
            )

        }


        if (cardRange === "lastweek") {

            const day = now.getDay()

            const mondayOffset = day === 0
                ? -6
                : 1 - day

            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + mondayOffset - 7
            )

            const end = new Date(
                start.getFullYear(),
                start.getMonth(),
                start.getDate() + 7
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


        if (cardRange === "month") {

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


        if (cardRange === "lastMonth") {

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
                "Load total upload files error:",
                error
            )

            setLoadingUploadFiles(false)

            return
        }


        let totalFiles = 0

        data.forEach(item => {

            // IC front
            if (item.ic_front_path) {
                totalFiles += 1
            }

            // IC back
            if (item.ic_back_path) {
                totalFiles += 1
            }

            // Bank slip files
            if (Array.isArray(item.bank_slip_paths)) {

                totalFiles +=
                    item.bank_slip_paths.length

            }

        })


        setTotalUploadFiles(totalFiles)

        setLoadingUploadFiles(false)

    }


    const loadPrinted = async () => {

        setLoadingPrinted(true)

        const now = new Date()

        let query = supabase
            .from('submissions')
            .select(`
    ic_copies,
    bank_slip_copies
`)
            .eq(
                'status',
                'Printed'
            )


        if (cardPrintSource !== "all") {

            query = query.eq(
                'printed_from',
                cardPrintSource
            )

        }


        if (cardRange === "today") {

            const start = new Date()
            start.setHours(0, 0, 0, 0)

            query = query.gte(
                'printed_date',
                start.toISOString()
            )

        }


        if (cardRange === "yesterday") {

            const start = new Date()
            start.setDate(start.getDate() - 1)
            start.setHours(0, 0, 0, 0)

            const end = new Date(start)
            end.setDate(end.getDate() + 1)

            query = query
                .gte(
                    'printed_date',
                    start.toISOString()
                )
                .lt(
                    'printed_date',
                    end.toISOString()
                )

        }

        if (cardRange === "7days") {

            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 6
            )

            query = query
                .gte(
                    'printed_date',
                    start.toISOString()
                )

        }


        if (cardRange === "thisweek") {

            const day = now.getDay()

            const mondayOffset = day === 0
                ? -6
                : 1 - day

            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + mondayOffset
            )

            query = query.gte(
                'printed_date',
                start.toISOString()
            )

        }


        if (cardRange === "lastweek") {

            const day = now.getDay()

            const mondayOffset = day === 0
                ? -6
                : 1 - day

            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + mondayOffset - 7
            )

            const end = new Date(
                start.getFullYear(),
                start.getMonth(),
                start.getDate() + 7
            )

            query = query
                .gte(
                    'printed_date',
                    start.toISOString()
                )
                .lt(
                    'printed_date',
                    end.toISOString()
                )

        }


        if (cardRange === "month") {

            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            )

            query = query.gte(
                'printed_date',
                start.toISOString()
            )

        }


        if (cardRange === "lastMonth") {

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
                    'printed_date',
                    start.toISOString()
                )
                .lt(
                    'printed_date',
                    end.toISOString()
                )

        }


        const { data, error } = await query


        if (error) {

            debugError(
                "Load printed files error:",
                error
            )

            setLoadingPrinted(false)

            return
        }


        let totalCopies = 0

        data.forEach(item => {

            // IC copies
            const icCopies =
                Number(item.ic_copies) || 0

            totalCopies += icCopies

            // Bank slip copies
            if (Array.isArray(item.bank_slip_copies)) {

                const bankSlipCopies =
                    item.bank_slip_copies.reduce(
                        (sum, copies) =>
                            sum + (Number(copies) || 0),
                        0
                    )

                totalCopies += bankSlipCopies
            }

        })

        setPrinted(totalCopies)

        setLoadingPrinted(false)

    }


    useEffect(() => {

        if (!user) return

        loadTotalUploads()
        loadTotalUploadFiles()
        loadPrinted()

    }, [
        user,
        cardRange,
        cardPrintSource,
        refreshTrigger
    ])


    return {
        total,
        totalUploadFiles,
        loadingUploadFiles,
        printed,
        loadingTotal,
        loadingPrinted
    }

}