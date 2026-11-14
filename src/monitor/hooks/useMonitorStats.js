
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { debugError } from '../../lib/debug'
import {
    applyDateRange,
    parseArray
} from './monitorHelpers'

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
    const [printJob, setPrintJob] = useState(null)
    const [loadingPrintJob, setLoadingPrintJob] = useState(true)

    const [loadingTotal, setLoadingTotal] = useState(true)
    const [loadingPrinted, setLoadingPrinted] = useState(true)


    // =========================================================
    // TOTAL UPLOADS
    // =========================================================

    const loadTotalUploads = async () => {

        setLoadingTotal(true)

        let query = supabase
            .from('submissions')
            .select('*', {
                count: 'exact',
                head: true
            })

        query = applyDateRange(
            query,
            'created_at',
            cardRange
        )

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


    // =========================================================
    // TOTAL UPLOAD FILES
    // =========================================================

    const loadTotalUploadFiles = async () => {

        setLoadingUploadFiles(true)

        let query = supabase
            .from('submissions')
            .select(`
                ic_front_path,
                ic_back_path,
                bank_slip_paths
            `)

        query = applyDateRange(
            query,
            'created_at',
            cardRange
        )

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
            totalFiles += parseArray(
                item.bank_slip_paths
            ).length

        })

        setTotalUploadFiles(totalFiles)
        setLoadingUploadFiles(false)

    }


    // =========================================================
    // PRINTED PAGES & PRINT JOBS
    // =========================================================

    const loadPrinted = async () => {

        setLoadingPrinted(true)
        setLoadingPrintJob(true)

        let query = supabase
            .from('submissions')
            .select(`
                ic_copies,
                bank_slip_copies
            `, {
                count: 'exact'
            })
            .eq(
                'status',
                'Printed'
            )

        // Print source filter
        if (cardPrintSource !== "all") {

            query = query.eq(
                'printed_from',
                cardPrintSource
            )

        }

        // Date range filter
        query = applyDateRange(
            query,
            'printed_date',
            cardRange
        )

        const { data, count, error } = await query

        if (error) {

            debugError(
                "Load printed files error:",
                error
            )

            setLoadingPrinted(false)
            setLoadingPrintJob(false)
            return
        }

        let totalCopies = 0

        data.forEach(item => {

            // IC copies
            const icCopies =
                Number(item.ic_copies) || 0

            totalCopies += icCopies

            // Bank slip copies
            const bankSlipCopies = parseArray(
                item.bank_slip_copies
            )

            totalCopies += bankSlipCopies.reduce(
                (sum, copies) =>
                    sum + (Number(copies) || 0),
                0
            )

        })

        setPrinted(totalCopies)
        setPrintJob(count || 0)

        setLoadingPrinted(false)
        setLoadingPrintJob(false)

    }


    // =========================================================
    // LOAD DATA
    // =========================================================

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


    // =========================================================
    // RETURN
    // =========================================================

    return {
        total,
        totalUploadFiles,
        loadingUploadFiles,
        printed,
        printJob,
        loadingTotal,
        loadingPrinted,
        loadingPrintJob
    }

}
