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


    // =========================================================
    // Bank Slip Upload File Count
    // =========================================================

    const getBankSlipUploadCount = (item) => {

        let bankSlipPaths =
            item.bank_slip_paths


        if (typeof bankSlipPaths === "string") {

            try {

                bankSlipPaths =
                    JSON.parse(
                        bankSlipPaths
                    )

            } catch {

                bankSlipPaths = []

            }

        }


        return Array.isArray(bankSlipPaths)
            ? bankSlipPaths.length
            : 0

    }


    // =========================================================
    // Bank Slip Printed Copies
    // =========================================================

    const getBankSlipPrintedCopies = (item) => {

        let bankSlipCopies =
            item.bank_slip_copies


        if (typeof bankSlipCopies === "string") {

            try {

                bankSlipCopies =
                    JSON.parse(
                        bankSlipCopies
                    )

            } catch {

                bankSlipCopies = []

            }

        }


        if (!Array.isArray(bankSlipCopies)) {
            return 0
        }


        return bankSlipCopies.reduce(
            (sum, copies) =>
                sum +
                (Number(copies) || 0),
            0
        )

    }


    const loadChartData = async () => {

        const {
            data,
            error
        } = await supabase
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


        if (error) {

            debugError(
                "Load chart data error:",
                error
            )

            return

        }


        const now = new Date()

        let startDate = null
        let endDate = null


        // =========================================================
        // DATE RANGE
        // =========================================================

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

            const day =
                now.getDay()


            const mondayOffset =
                day === 0
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

            const day =
                now.getDay()


            const mondayOffset =
                day === 0
                    ? -6
                    : 1 - day


            startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() +
                mondayOffset -
                7
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


        // =========================================================
        // GROUPED DATA
        // =========================================================

        const grouped = {}


        // =========================================================
        // CREATE EMPTY DATE BUCKETS
        // =========================================================

        if (startDate && endDate) {

            for (
                let date = new Date(startDate);
                date < endDate;
                date.setDate(
                    date.getDate() + 1
                )
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


        // =========================================================
        // PROCESS SUBMISSIONS
        // =========================================================

        data.forEach(item => {


            // =====================================================
            // TOTAL UPLOADS
            //
            // Date = created_at
            // No status filter
            // =====================================================

            if (item.created_at) {

                const uploadDate =
                    new Date(
                        item.created_at
                    )


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


                    // ---------------------------------------------
                    // Total Uploads
                    // ---------------------------------------------

                    grouped[dateString].uploads++


                    // ---------------------------------------------
                    // Total Upload Files
                    //
                    // ic_front_path = 1
                    // ic_back_path  = 1
                    // bank_slip_paths.length
                    // ---------------------------------------------

                    if (item.ic_front_path) {

                        grouped[
                            dateString
                        ].uploadFiles++

                    }


                    if (item.ic_back_path) {

                        grouped[
                            dateString
                        ].uploadFiles++

                    }


                    grouped[
                        dateString
                    ].uploadFiles +=
                        getBankSlipUploadCount(item)

                }

            }


            // =====================================================
            // TOTAL PRINTED FILES
            //
            // Date = printed_date
            // Status = Printed
            // Source = printSource
            //
            // IC = ic_copies
            // Bank Slip = sum(bank_slip_copies)
            // =====================================================

            if (
                item.status === "Printed" &&
                item.printed_date
            ) {

                const printedDate =
                    new Date(
                        item.printed_date
                    )


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


                    // ---------------------------------------------
                    // IC Printed Copies
                    // ---------------------------------------------

                    const icCopies =
                        Number(
                            item.ic_copies
                        ) || 0


                    grouped[
                        dateString
                    ].printed +=
                        icCopies


                    // ---------------------------------------------
                    // Bank Slip Printed Copies
                    // ---------------------------------------------

                    grouped[
                        dateString
                    ].printed +=
                        getBankSlipPrintedCopies(item)

                }

            }

        })


        // =========================================================
        // SORT BY DATE
        // =========================================================

        const result =
            Object.values(
                grouped
            ).sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            )


        setChartData(
            result
        )

    }


    // =========================================================
    // LOAD
    // =========================================================

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