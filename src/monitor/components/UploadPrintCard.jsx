import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend
} from 'recharts'

import { supabase } from '../../lib/supabase'

import { workbookToBytes } from '@office-kit/xlsx/io'

import {
    createWorkbook,
    addWorksheet
} from '@office-kit/xlsx/workbook'

import {
    setCell,
    setFreezePanes,
    setColumnWidths
} from '@office-kit/xlsx/worksheet'

import {
    setBold,
    setFontSize,
    setCellBackgroundColor,
    setCellNumberFormat
} from '@office-kit/xlsx/styles'

import {
    makeBarChart,
    makeBarSeries,
    makeChartSpace
} from '@office-kit/xlsx/chart'

import {
    addChartAt
} from '@office-kit/xlsx/drawing'


function UploadPrintCard({
    total,
    totalUploadFiles,
    printed,
    loadingTotal,
    loadingUploadFiles,
    loadingPrinted,
    printSource,
    setPrintSource,
    printSources,
    chartData,
    chartRange,
    setChartRange
}) {


    const handleExport = async () => {

        try {

            // =========================================================
            // DATE RANGE
            // =========================================================

            const now = new Date()

            let startDate = null
            let endDate = null


            if (chartRange === "today") {

                const start = new Date()

                start.setHours(0, 0, 0, 0)

                startDate = start

            }


            if (chartRange === "yesterday") {

                const start = new Date()

                start.setDate(
                    start.getDate() - 1
                )

                start.setHours(0, 0, 0, 0)

                const end = new Date(start)

                end.setDate(
                    end.getDate() + 1
                )

                startDate = start
                endDate = end

            }


            if (chartRange === "7days") {

                const start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() - 6
                )

                start.setHours(0, 0, 0, 0)

                startDate = start

            }


            if (chartRange === "thisweek") {

                const day = now.getDay()

                const mondayOffset =
                    day === 0
                        ? -6
                        : 1 - day

                const start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() + mondayOffset
                )

                start.setHours(0, 0, 0, 0)

                startDate = start

            }


            if (chartRange === "lastweek") {

                const day = now.getDay()

                const mondayOffset =
                    day === 0
                        ? -6
                        : 1 - day

                const start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() + mondayOffset - 7
                )

                start.setHours(0, 0, 0, 0)

                const end = new Date(start)

                end.setDate(
                    end.getDate() + 7
                )

                startDate = start
                endDate = end

            }


            if (chartRange === "30days") {

                const start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() - 29
                )

                start.setHours(0, 0, 0, 0)

                startDate = start

            }


            if (chartRange === "month") {

                const start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                )

                start.setHours(0, 0, 0, 0)

                startDate = start

            }


            if (chartRange === "lastMonth") {

                const start = new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    1
                )

                start.setHours(0, 0, 0, 0)

                const end = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                )

                end.setHours(0, 0, 0, 0)

                startDate = start
                endDate = end

            }


            // =========================================================
            // 1. GET UPLOAD DATA
            //
            // Date column = created_at
            // NO status filter
            // =========================================================

            let uploadQuery = supabase
                .from('submissions')
                .select('*')


            if (startDate) {

                uploadQuery = uploadQuery.gte(
                    'created_at',
                    startDate.toISOString()
                )

            }


            if (endDate) {

                uploadQuery = uploadQuery.lt(
                    'created_at',
                    endDate.toISOString()
                )

            }


            const {
                data: uploadData,
                error: uploadError
            } = await uploadQuery.order(
                'created_at',
                {
                    ascending: false
                }
            )


            if (uploadError) {
                throw uploadError
            }


            // =========================================================
            // 2. GET PRINTED DATA
            //
            // Date column = printed_date
            // status = Printed
            // printed_from filter applies here
            // =========================================================

            let printedQuery = supabase
                .from('submissions')
                .select('*')
                .eq(
                    'status',
                    'Printed'
                )


            if (printSource !== "all") {

                printedQuery = printedQuery.eq(
                    'printed_from',
                    printSource
                )

            }


            if (startDate) {

                printedQuery = printedQuery.gte(
                    'printed_date',
                    startDate.toISOString()
                )

            }


            if (endDate) {

                printedQuery = printedQuery.lt(
                    'printed_date',
                    endDate.toISOString()
                )

            }


            const {
                data: printedData,
                error: printedError
            } = await printedQuery.order(
                'printed_date',
                {
                    ascending: false
                }
            )


            if (printedError) {
                throw printedError
            }


            const safeUploadData =
                uploadData || []


            const safePrintedData =
                printedData || []


            // =========================================================
            // 3. CHECK WHETHER THERE IS ANY DATA
            // =========================================================

            if (
                safeUploadData.length === 0 &&
                safePrintedData.length === 0
            ) {

                alert(
                    "No submission records found for the selected filters."
                )

                return

            }


            // =========================================================
            // 4. CONVERT DATABASE TIMESTAMP TO MALAYSIA TIME
            // =========================================================

            const malaysiaDate = (value) => {

                if (!value) {
                    return null
                }


                const date = new Date(value)


                const parts =
                    new Intl.DateTimeFormat(
                        "en-CA",
                        {
                            timeZone: "Asia/Kuala_Lumpur",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hourCycle: "h23"
                        }
                    ).formatToParts(date)


                const get = (type) =>
                    parts.find(
                        part => part.type === type
                    )?.value


                return new Date(
                    Number(get("year")),
                    Number(get("month")) - 1,
                    Number(get("day")),
                    Number(get("hour")),
                    Number(get("minute")),
                    Number(get("second"))
                )

            }


            // =========================================================
            // 5. MALAYSIA DATE KEY
            //
            // Used for daily summary/chart.
            // =========================================================

            const malaysiaDateKey = (value) => {

                if (!value) {
                    return null
                }


                const date = new Date(value)


                const parts =
                    new Intl.DateTimeFormat(
                        "en-CA",
                        {
                            timeZone: "Asia/Kuala_Lumpur",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit"
                        }
                    ).formatToParts(date)


                const get = (type) =>
                    parts.find(
                        part => part.type === type
                    )?.value


                return `${get("year")}-${get("month")}-${get("day")}`

            }


            // =========================================================
            // 6. STORE UPLOAD FILE COUNTS
            //
            // Keyed by submission ID
            //
            // IC front       = 1
            // IC back        = 1
            // Bank slips     = array length
            // =========================================================

            const uploadFileCounts =
                new Map()


            safeUploadData.forEach(item => {

                let totalUploadFiles = 0


                if (item.ic_front_path) {
                    totalUploadFiles += 1
                }


                if (item.ic_back_path) {
                    totalUploadFiles += 1
                }


                let bankSlipPaths =
                    item.bank_slip_paths


                if (
                    typeof bankSlipPaths === "string"
                ) {

                    try {

                        bankSlipPaths =
                            JSON.parse(
                                bankSlipPaths
                            )

                    } catch {

                        bankSlipPaths = []

                    }

                }


                if (
                    Array.isArray(bankSlipPaths)
                ) {

                    totalUploadFiles +=
                        bankSlipPaths.length

                }


                uploadFileCounts.set(
                    item.id,
                    totalUploadFiles
                )

            })


            // =========================================================
            // 7. STORE PRINTED FILE COUNTS
            //
            // Keyed by submission ID
            //
            // Total Printed =
            // ic_copies + sum(bank_slip_copies)
            // =========================================================

            const printedFileCounts =
                new Map()


            safePrintedData.forEach(item => {

                const icCopies =
                    Number(item.ic_copies) || 0


                let bankSlipCopies =
                    item.bank_slip_copies


                if (
                    typeof bankSlipCopies === "string"
                ) {

                    try {

                        bankSlipCopies =
                            JSON.parse(
                                bankSlipCopies
                            )

                    } catch {

                        bankSlipCopies = []

                    }

                }


                const totalBankSlipCopies =
                    Array.isArray(bankSlipCopies)
                        ? bankSlipCopies.reduce(
                            (sum, copies) =>
                                sum +
                                (Number(copies) || 0),
                            0
                        )
                        : 0


                const totalPrinted =
                    icCopies +
                    totalBankSlipCopies


                printedFileCounts.set(
                    item.id,
                    totalPrinted
                )

            })


            // =========================================================
            // 8. COMBINE SUBMISSIONS
            //
            // A submission can exist in:
            // - uploadData
            // - printedData
            // - both
            //
            // Use ID to avoid duplicate rows.
            // =========================================================

            const submissionMap =
                new Map()


            safeUploadData.forEach(item => {

                submissionMap.set(
                    item.id,
                    item
                )

            })


            safePrintedData.forEach(item => {

                if (
                    !submissionMap.has(item.id)
                ) {

                    submissionMap.set(
                        item.id,
                        item
                    )

                }

            })


            const combinedData =
                Array.from(
                    submissionMap.values()
                )


            // =========================================================
            // 9. BUILD RAW EXPORT DATA
            // =========================================================

            const exportRows =
                combinedData.map(item => {

                    return {

                        id:
                            item.id,

                        created_at:
                            malaysiaDate(
                                item.created_at
                            ),

                        qrcode:
                            item.qrcode,

                        "Total_Upload Files":
                            uploadFileCounts.get(
                                item.id
                            ) || 0,

                        status:
                            item.status,

                        printed_from:
                            item.printed_from,

                        printed_date:
                            malaysiaDate(
                                item.printed_date
                            ),

                        Total_Printed:
                            printedFileCounts.get(
                                item.id
                            ) || 0

                    }

                })


            // =========================================================
            // 10. BUILD DAILY SUMMARY
            //
            // Uploads:
            //   based on created_at
            //
            // Upload Files:
            //   based on uploadFileCounts
            //
            // Printed Files:
            //   based on printed_date + printedFileCounts
            // =========================================================

            const dailyMap =
                new Map()


            const ensureDay = (dateKey) => {

                if (!dateKey) {
                    return null
                }


                if (!dailyMap.has(dateKey)) {

                    dailyMap.set(
                        dateKey,
                        {
                            date: dateKey,
                            uploads: 0,
                            uploadFiles: 0,
                            printed: 0
                        }
                    )

                }


                return dailyMap.get(
                    dateKey
                )

            }


            safeUploadData.forEach(item => {

                const dateKey =
                    malaysiaDateKey(
                        item.created_at
                    )


                const day =
                    ensureDay(dateKey)


                if (!day) {
                    return
                }


                day.uploads += 1


                day.uploadFiles +=
                    uploadFileCounts.get(
                        item.id
                    ) || 0

            })


            safePrintedData.forEach(item => {

                const dateKey =
                    malaysiaDateKey(
                        item.printed_date
                    )


                const day =
                    ensureDay(dateKey)


                if (!day) {
                    return
                }


                day.printed +=
                    printedFileCounts.get(
                        item.id
                    ) || 0

            })


            // =========================================================
            // 11. DETERMINE DAILY RANGE
            //
            // For normal ranges:
            //   use selected start/end
            //
            // For "all":
            //   use earliest/latest actual activity date.
            // =========================================================

            let dailyStart = null
            let dailyEnd = null


            if (startDate) {

                dailyStart =
                    new Date(startDate)

            }


            if (endDate) {

                dailyEnd =
                    new Date(endDate)

                dailyEnd.setDate(
                    dailyEnd.getDate() - 1
                )

            }


            if (
                !dailyStart &&
                !dailyEnd
            ) {

                const allDateKeys =
                    Array.from(
                        dailyMap.keys()
                    ).sort()


                if (
                    allDateKeys.length > 0
                ) {

                    const first =
                        allDateKeys[0]

                    const last =
                        allDateKeys[
                        allDateKeys.length - 1
                        ]


                    dailyStart =
                        new Date(
                            `${first}T00:00:00`
                        )


                    dailyEnd =
                        new Date(
                            `${last}T00:00:00`
                        )

                }

            }


            // If there is no activity date,
            // still create one day based on today.
            if (
                !dailyStart ||
                !dailyEnd
            ) {

                dailyStart =
                    new Date()

                dailyStart.setHours(
                    0,
                    0,
                    0,
                    0
                )


                dailyEnd =
                    new Date(
                        dailyStart
                    )

            }


            // =========================================================
            // 12. BUILD EVERY DAY INCLUDING ZERO-ACTIVITY DAYS
            // =========================================================

            const dailyRows = []


            const currentDay =
                new Date(
                    dailyStart
                )


            currentDay.setHours(
                0,
                0,
                0,
                0
            )


            const finalDay =
                new Date(
                    dailyEnd
                )


            finalDay.setHours(
                0,
                0,
                0,
                0
            )


            while (
                currentDay <= finalDay
            ) {

                const year =
                    currentDay.getFullYear()


                const month =
                    String(
                        currentDay.getMonth() + 1
                    ).padStart(
                        2,
                        "0"
                    )


                const day =
                    String(
                        currentDay.getDate()
                    ).padStart(
                        2,
                        "0"
                    )


                const dateKey =
                    `${year}-${month}-${day}`


                const existing =
                    dailyMap.get(
                        dateKey
                    )


                dailyRows.push({

                    date:
                        new Date(
                            currentDay
                        ),

                    dateKey,

                    uploads:
                        existing?.uploads || 0,

                    uploadFiles:
                        existing?.uploadFiles || 0,

                    printed:
                        existing?.printed || 0

                })


                currentDay.setDate(
                    currentDay.getDate() + 1
                )

            }


            // =========================================================
            // 13. TOTALS
            // =========================================================

            const totalUploads =
                safeUploadData.length


            const totalUploadFilesExport =
                safeUploadData.reduce(
                    (sum, item) =>
                        sum +
                        (
                            uploadFileCounts.get(
                                item.id
                            ) || 0
                        ),
                    0
                )


            const totalPrintedFiles =
                safePrintedData.reduce(
                    (sum, item) =>
                        sum +
                        (
                            printedFileCounts.get(
                                item.id
                            ) || 0
                        ),
                    0
                )


            // =========================================================
            // 14. CREATE WORKBOOK
            // =========================================================

            const workbook =
                createWorkbook()


            const rawSheet =
                addWorksheet(
                    workbook,
                    "Raw"
                )


            const summarySheet =
                addWorksheet(
                    workbook,
                    "Summary & Chart"
                )


            // =========================================================
            // 15. RAW SHEET
            // =========================================================

            const rawHeaders = [
                "id",
                "created_at",
                "qrcode",
                "Total_Upload Files",
                "status",
                "printed_from",
                "printed_date",
                "Total_Printed"
            ]


            rawHeaders.forEach(
                (header, index) => {

                    const cell =
                        setCell(
                            rawSheet,
                            1,
                            index + 1,
                            header
                        )


                    setBold(
                        workbook,
                        cell
                    )


                    setCellBackgroundColor(
                        workbook,
                        cell,
                        "FFD9EAF7"
                    )

                }
            )


            exportRows.forEach(
                (row, rowIndex) => {

                    const excelRow =
                        rowIndex + 2


                    const values = [

                        row.id,

                        row.created_at,

                        row.qrcode,

                        row[
                        "Total_Upload Files"
                        ],

                        row.status,

                        row.printed_from,

                        row.printed_date,

                        row.Total_Printed

                    ]


                    values.forEach(
                        (value, columnIndex) => {

                            const cell =
                                setCell(
                                    rawSheet,
                                    excelRow,
                                    columnIndex + 1,
                                    value ?? null
                                )


                            if (
                                columnIndex === 1 ||
                                columnIndex === 6
                            ) {

                                if (value) {

                                    setCellNumberFormat(
                                        workbook,
                                        cell,
                                        "dd/mm/yyyy hh:mm:ss"
                                    )

                                }

                            }

                        }
                    )

                }
            )


            setFreezePanes(
                rawSheet,
                "A2"
            )


            setColumnWidths(
                rawSheet,
                [
                    18,
                    22,
                    28,
                    20,
                    16,
                    18,
                    22,
                    16
                ]
            )


            // =========================================================
            // 16. SUMMARY & CHART SHEET
            // =========================================================

            // Title
            const titleCell =
                setCell(
                    summarySheet,
                    1,
                    1,
                    "Summary & Chart"
                )


            setBold(
                workbook,
                titleCell
            )


            setFontSize(
                workbook,
                titleCell,
                16
            )


            // Selected range
            const rangeLabelCell =
                setCell(
                    summarySheet,
                    2,
                    1,
                    "Selected Range"
                )


            setBold(
                workbook,
                rangeLabelCell
            )


            setCell(
                summarySheet,
                2,
                2,
                chartRange
            )


            // Print source
            const sourceLabelCell =
                setCell(
                    summarySheet,
                    3,
                    1,
                    "Print Source"
                )


            setBold(
                workbook,
                sourceLabelCell
            )


            setCell(
                summarySheet,
                3,
                2,
                printSource === "all"
                    ? "All Sources"
                    : printSource
            )


            // =========================================================
            // 17. SUMMARY TOTALS
            // =========================================================

            const summaryHeader =
                setCell(
                    summarySheet,
                    5,
                    1,
                    "Summary"
                )


            setBold(
                workbook,
                summaryHeader
            )


            setFontSize(
                workbook,
                summaryHeader,
                13
            )


            const summaryRows = [

                [
                    "Total Uploads",
                    totalUploads
                ],

                [
                    "Total Upload Files",
                    totalUploadFilesExport
                ],

                [
                    "Total Printed Pages",
                    totalPrintedFiles
                ]

            ]


            summaryRows.forEach(
                (row, index) => {

                    const excelRow =
                        index + 6


                    const labelCell =
                        setCell(
                            summarySheet,
                            excelRow,
                            1,
                            row[0]
                        )


                    const valueCell =
                        setCell(
                            summarySheet,
                            excelRow,
                            2,
                            row[1]
                        )


                    setBold(
                        workbook,
                        labelCell
                    )


                    setBold(
                        workbook,
                        valueCell
                    )


                    if (index === 0) {

                        setCellBackgroundColor(
                            workbook,
                            labelCell,
                            "FFDDEBF7"
                        )

                        setCellBackgroundColor(
                            workbook,
                            valueCell,
                            "FFDDEBF7"
                        )

                    }


                    if (index === 1) {

                        setCellBackgroundColor(
                            workbook,
                            labelCell,
                            "FFE2F0D9"
                        )

                        setCellBackgroundColor(
                            workbook,
                            valueCell,
                            "FFE2F0D9"
                        )

                    }


                    if (index === 2) {

                        setCellBackgroundColor(
                            workbook,
                            labelCell,
                            "FFFCE4D6"
                        )

                        setCellBackgroundColor(
                            workbook,
                            valueCell,
                            "FFFCE4D6"
                        )

                    }

                }
            )


            // =========================================================
            // 18. DAILY TABLE
            // =========================================================

            const dailyHeaderRow = 10


            const dailyHeaders = [
                "Date",
                "Uploads",
                "Upload Files",
                "Printed Pages"
            ]


            dailyHeaders.forEach(
                (header, index) => {

                    const cell =
                        setCell(
                            summarySheet,
                            dailyHeaderRow,
                            index + 1,
                            header
                        )


                    setBold(
                        workbook,
                        cell
                    )


                    setCellBackgroundColor(
                        workbook,
                        cell,
                        "FFEFEFEF"
                    )

                }
            )


            dailyRows.forEach(
                (row, index) => {

                    const excelRow =
                        dailyHeaderRow +
                        index +
                        1


                    const dateCell =
                        setCell(
                            summarySheet,
                            excelRow,
                            1,
                            row.date
                        )


                    setCellNumberFormat(
                        workbook,
                        dateCell,
                        "dd/mm/yyyy"
                    )


                    setCell(
                        summarySheet,
                        excelRow,
                        2,
                        row.uploads
                    )


                    setCell(
                        summarySheet,
                        excelRow,
                        3,
                        row.uploadFiles
                    )


                    setCell(
                        summarySheet,
                        excelRow,
                        4,
                        row.printed
                    )

                }
            )


            setFreezePanes(
                summarySheet,
                "A11"
            )


            setColumnWidths(
                summarySheet,
                [
                    16,
                    14,
                    18,
                    18,
                    4,
                    16,
                    16,
                    16,
                    16
                ]
            )


            // =========================================================
            // 19. CREATE NATIVE EXCEL BAR CHART
            //
            // Same data structure as the web chart:
            //
            // Date
            // Uploads
            // Upload Files
            // Printed Files
            // =========================================================

            const firstChartRow =
                dailyHeaderRow + 1


            const lastChartRow =
                dailyHeaderRow +
                dailyRows.length


            if (
                dailyRows.length > 0
            ) {

                const categoryRef =
                    `'Summary & Chart'!$A$${firstChartRow}:$A$${lastChartRow}`


                const uploadsRef =
                    `'Summary & Chart'!$B$${firstChartRow}:$B$${lastChartRow}`


                const uploadFilesRef =
                    `'Summary & Chart'!$C$${firstChartRow}:$C$${lastChartRow}`


                const printedRef =
                    `'Summary & Chart'!$D$${firstChartRow}:$D$${lastChartRow}`


                const chart =
                    makeBarChart({

                        barDir: "col",

                        grouping: "clustered",

                        series: [

                            makeBarSeries({

                                idx: 0,

                                tx: {
                                    kind: "literal",
                                    value: "Total Uploads"
                                },

                                cat: {
                                    ref: categoryRef
                                },

                                val: {
                                    ref: uploadsRef
                                }

                            }),

                            makeBarSeries({

                                idx: 1,

                                tx: {
                                    kind: "literal",
                                    value: "Total Upload Files"
                                },

                                cat: {
                                    ref: categoryRef
                                },

                                val: {
                                    ref: uploadFilesRef
                                }

                            }),

                            makeBarSeries({

                                idx: 2,

                                tx: {
                                    kind: "literal",
                                    value: "Total Printed Pages"
                                },

                                cat: {
                                    ref: categoryRef
                                },

                                val: {
                                    ref: printedRef
                                }

                            })

                        ]

                    })


                const chartSpace =
                    makeChartSpace({

                        plotArea: {
                            chart
                        },

                        title:
                            "Upload and Print Statistics",

                        // Keep the native Excel legend hidden,
                        // matching the automated report structure.
                        legend: undefined

                    })


                addChartAt(
                    summarySheet,
                    "F11",
                    {
                        space: chartSpace
                    },
                    {
                        widthPx: 800,
                        heightPx: 350
                    }
                )

            }


            // =========================================================
            // 20. CREATE XLSX BYTES
            // =========================================================

            const bytes =
                await workbookToBytes(
                    workbook
                )


            // =========================================================
            // 21. DOWNLOAD FILE
            // =========================================================

            const blob =
                new Blob(
                    [
                        bytes
                    ],
                    {
                        type:
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    }
                )


            const url =
                URL.createObjectURL(
                    blob
                )


            const link =
                document.createElement(
                    "a"
                )


            link.href = url


            const exportDate =
                new Intl.DateTimeFormat(
                    "en-CA",
                    {
                        timeZone: "Asia/Kuala_Lumpur",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                    }
                )
                    .format(new Date())
                    .replace(
                        /-/g,
                        ""
                    )


            const sourceName =
                printSource === "all"
                    ? "all-sources"
                    : printSource.replace(
                        /\s+/g,
                        "-"
                    )


            link.download =
                `${exportDate} ICBankSlipKiosk-${sourceName}-${chartRange}.xlsx`


            document.body.appendChild(
                link
            )


            link.click()


            document.body.removeChild(
                link
            )


            URL.revokeObjectURL(
                url
            )


        } catch (error) {

            console.error(
                "Export error:",
                error
            )


            alert(
                "Failed to export submissions."
            )

        }

    }


    return (
        <div className="monitor-card upload-print-card">

            <div className="card-title-row">

                <h2>
                    Upload & Print Overview
                </h2>

                <div className="chart-filters">

                    <button
                        className="export-button"
                        onClick={handleExport}
                    >
                        Export
                    </button>

                    <select
                        className="filter-select"
                        value={printSource}
                        onChange={(e) =>
                            setPrintSource(
                                e.target.value
                            )
                        }
                    >

                        <option value="all">
                            All Sources
                        </option>

                        {printSources.map(
                            (source) => (

                                <option
                                    key={source}
                                    value={source}
                                >
                                    {source}
                                </option>

                            )
                        )}

                    </select>

                    <select
                        className="filter-select"
                        value={chartRange}
                        onChange={(e) =>
                            setChartRange(
                                e.target.value
                            )
                        }
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

                        <option value="thisweek">
                            This Week
                        </option>

                        <option value="lastweek">
                            Last Week
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

            </div>


            <div className="upload-print-stats">

                <div className="upload-print-stat">

                    <div className="stat-label">
                        Total Uploads
                    </div>

                    <div className="stat-value">

                        {loadingTotal
                            ? "..."
                            : total
                        }

                    </div>

                </div>


                <div className="upload-print-stat">

                    <div className="stat-label">
                        Total Upload Files
                    </div>

                    <div className="stat-value">

                        {loadingUploadFiles
                            ? "..."
                            : totalUploadFiles
                        }

                    </div>

                </div>


                <div className="upload-print-stat">

                    <div className="stat-label">
                        Total Printed Pages
                    </div>

                    <div className="stat-value">

                        {loadingPrinted
                            ? "..."
                            : printed
                        }

                    </div>

                </div>

            </div>


            <div className="chart-section">

                <h3>
                    Upload and Print Statistics
                </h3>

                <ResponsiveContainer
                    width="100%"
                    height={300}
                >

                    <BarChart
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 20,
                            left: 10,
                            bottom: 35
                        }}
                    >

                        <CartesianGrid />

                        <XAxis
                            dataKey="date"
                            tick={({
                                x,
                                y,
                                payload
                            }) => {

                                const date =
                                    new Date(
                                        payload.value
                                    )


                                const dateText =
                                    `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`


                                const dayText =
                                    date.toLocaleDateString(
                                        'en-US',
                                        {
                                            weekday:
                                                'short'
                                        }
                                    )


                                return (
                                    <g
                                        transform={`translate(${x},${y})`}
                                    >

                                        <text
                                            x={0}
                                            y={0}
                                            dy={12}
                                            textAnchor="middle"
                                            fill="#666"
                                            fontSize={12}
                                        >
                                            {dateText}
                                        </text>

                                        <text
                                            x={0}
                                            y={0}
                                            dy={28}
                                            textAnchor="middle"
                                            fill="#999"
                                            fontSize={11}
                                        >
                                            ({dayText})
                                        </text>

                                    </g>
                                )

                            }}
                        />

                        <YAxis />

                        <Tooltip
                            labelFormatter={(label) => {

                                const date =
                                    new Date(
                                        label
                                    )


                                return date.toLocaleDateString(
                                    'en-GB'
                                )

                            }}

                            itemSorter={(item) => {

                                const order = {

                                    uploads: 1,

                                    uploadFiles: 2,

                                    printed: 3

                                }


                                return (
                                    order[
                                    item.dataKey
                                    ] || 99
                                )

                            }}
                        />

                        <Legend
                            verticalAlign="bottom"
                            wrapperStyle={{
                                paddingTop: 15
                            }}
                            content={() => (

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        justifyContent:
                                            "center",
                                        gap:
                                            "20px"
                                    }}
                                >

                                    <span>

                                        <span
                                            style={{
                                                display:
                                                    "inline-block",
                                                width:
                                                    10,
                                                height:
                                                    10,
                                                backgroundColor:
                                                    "#8884d8",
                                                marginRight:
                                                    5
                                            }}
                                        />

                                        Total Uploads

                                    </span>


                                    <span>

                                        <span
                                            style={{
                                                display:
                                                    "inline-block",
                                                width:
                                                    10,
                                                height:
                                                    10,
                                                backgroundColor:
                                                    "#82ca9d",
                                                marginRight:
                                                    5
                                            }}
                                        />

                                        Total Upload Files

                                    </span>


                                    <span>

                                        <span
                                            style={{
                                                display:
                                                    "inline-block",
                                                width:
                                                    10,
                                                height:
                                                    10,
                                                backgroundColor:
                                                    "#ff7300",
                                                marginRight:
                                                    5
                                            }}
                                        />

                                        Total Printed Pages

                                    </span>

                                </div>

                            )}
                        />


                        <Bar
                            dataKey="uploads"
                            name="Total Uploads"
                            fill="#8884d8"
                        />


                        <Bar
                            dataKey="uploadFiles"
                            name="Total Upload Files"
                            fill="#82ca9d"
                        />


                        <Bar
                            dataKey="printed"
                            name="Total Printed Pages"
                            fill="#ff7300"
                        />

                    </BarChart>

                </ResponsiveContainer>

            </div>

        </div>
    )
}


export default UploadPrintCard