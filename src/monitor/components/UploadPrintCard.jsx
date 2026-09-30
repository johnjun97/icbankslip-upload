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
import * as XLSX from 'xlsx'

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

                startDate = start

            }


            if (chartRange === "month") {

                const start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                )

                startDate = start

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

                startDate = start
                endDate = end

            }


            // =========================================================
            // 1. TOTAL UPLOAD FILES
            //
            // Date column = created_at
            // NO status filter
            //
            // ic_front_path  = 1
            // ic_back_path   = 1
            // bank_slip_paths = array length
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
            // 2. TOTAL PRINTED FILES
            //
            // Date column = printed_date
            // status = Printed
            // printed_from filter applies here
            //
            // Total Printed =
            // ic_copies + sum(bank_slip_copies)
            // =========================================================

            let printedQuery = supabase
                .from('submissions')
                .select('*')
                .eq(
                    'status',
                    'Printed'
                )


            // Source filter
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


            // =========================================================
            // 3. CHECK WHETHER THERE IS ANY DATA
            // =========================================================

            if (
                (!uploadData || uploadData.length === 0) &&
                (!printedData || printedData.length === 0)
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
                    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`
                )

            }


            // =========================================================
            // 5. STORE UPLOAD FILE COUNTS
            //
            // Keyed by submission ID
            // =========================================================

            const uploadFileCounts = new Map()


            uploadData.forEach(item => {

                let totalUploadFiles = 0


                // IC Front
                if (item.ic_front_path) {
                    totalUploadFiles += 1
                }


                // IC Back
                if (item.ic_back_path) {
                    totalUploadFiles += 1
                }


                // Bank Slip Paths
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


                if (Array.isArray(bankSlipPaths)) {

                    totalUploadFiles +=
                        bankSlipPaths.length

                }


                uploadFileCounts.set(
                    item.id,
                    totalUploadFiles
                )

            })


            // =========================================================
            // 6. STORE PRINTED FILE COUNTS
            //
            // Keyed by submission ID
            // =========================================================

            const printedFileCounts = new Map()


            printedData.forEach(item => {

                const icCopies =
                    Number(item.ic_copies) || 0


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
            // 7. COMBINE SUBMISSIONS
            //
            // A submission can exist in either:
            //
            // - uploadData
            // - printedData
            // - both
            //
            // Use ID to avoid duplicate rows.
            // =========================================================

            const submissionMap = new Map()


            uploadData.forEach(item => {

                submissionMap.set(
                    item.id,
                    item
                )

            })


            printedData.forEach(item => {

                if (!submissionMap.has(item.id)) {

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
            // 8. BUILD EXPORT ROWS
            // =========================================================

            const exportRows =
                combinedData.map(item => {

                    const row = {}


                    Object.keys(item)
                        .filter(
                            column =>
                                column !== "ic_copies" &&
                                column !== "bank_slip_copies"
                        )
                        .forEach(column => {

                            if (
                                column === "created_at" ||
                                column === "printed_date"
                            ) {

                                row[column] =
                                    malaysiaDate(
                                        item[column]
                                    )

                            } else {

                                row[column] =
                                    item[column]

                            }

                        })


                    // -------------------------------------------------
                    // Total Upload Files
                    //
                    // ONLY comes from created_at query
                    // -------------------------------------------------

                    row.Total_Upload_Files =
                        uploadFileCounts.get(
                            item.id
                        ) || 0


                    // -------------------------------------------------
                    // Total Printed
                    //
                    // ONLY comes from printed_date query
                    // -------------------------------------------------

                    row.Total_printed =
                        printedFileCounts.get(
                            item.id
                        ) || 0


                    return row

                })


            // =========================================================
            // 9. CREATE WORKSHEET
            // =========================================================

            const worksheet =
                XLSX.utils.json_to_sheet(
                    exportRows
                )


            // =========================================================
            // 10. FORMAT EXCEL DATE COLUMNS
            // =========================================================

            const headers =
                Object.keys(
                    exportRows[0]
                )


            const createdAtColumn =
                headers.indexOf(
                    "created_at"
                )


            const printedDateColumn =
                headers.indexOf(
                    "printed_date"
                )


            exportRows.forEach(
                (row, index) => {

                    const excelRow =
                        index + 2


                    if (
                        createdAtColumn !== -1 &&
                        row.created_at
                    ) {

                        worksheet[
                            XLSX.utils.encode_cell({
                                r: excelRow - 1,
                                c: createdAtColumn
                            })
                        ].z =
                            "dd/mm/yyyy hh:mm:ss"

                    }


                    if (
                        printedDateColumn !== -1 &&
                        row.printed_date
                    ) {

                        worksheet[
                            XLSX.utils.encode_cell({
                                r: excelRow - 1,
                                c: printedDateColumn
                            })
                        ].z =
                            "dd/mm/yyyy hh:mm:ss"

                    }

                }
            )


            // =========================================================
            // 11. CREATE WORKBOOK
            // =========================================================

            const workbook =
                XLSX.utils.book_new()


            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Submissions"
            )


            // =========================================================
            // 12. FILE NAME
            // =========================================================

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
                    .replace(/-/g, "")


            const sourceName =
                printSource === "all"
                    ? "all-sources"
                    : printSource.replace(
                        /\s+/g,
                        "-"
                    )


            XLSX.writeFile(
                workbook,
                `${exportDate} submissions-${sourceName}-${chartRange}.xlsx`
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
                            setPrintSource(e.target.value)
                        }
                    >
                        <option value="all">
                            All Sources
                        </option>

                        {printSources.map((source) => (
                            <option
                                key={source}
                                value={source}
                            >
                                {source}
                            </option>
                        ))}

                    </select>

                    <select
                        className="filter-select"
                        value={chartRange}
                        onChange={(e) =>
                            setChartRange(e.target.value)
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
                        Total Printed Files
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
                            tick={({ x, y, payload }) => {
                                const date = new Date(payload.value)

                                const dateText = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`

                                const dayText = date.toLocaleDateString('en-US', {
                                    weekday: 'short'
                                })

                                return (
                                    <g transform={`translate(${x},${y})`}>
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
                                const date = new Date(label)
                                return date.toLocaleDateString('en-GB')
                            }}
                            itemSorter={(item) => {

                                const order = {
                                    uploads: 1,
                                    uploadFiles: 2,
                                    printed: 3
                                }

                                return order[item.dataKey] || 99
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
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: "20px"
                                    }}
                                >
                                    <span>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                width: 10,
                                                height: 10,
                                                backgroundColor: "#8884d8",
                                                marginRight: 5
                                            }}
                                        />
                                        Total Uploads
                                    </span>

                                    <span>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                width: 10,
                                                height: 10,
                                                backgroundColor: "#82ca9d",
                                                marginRight: 5
                                            }}
                                        />
                                        Total Upload Files
                                    </span>

                                    <span>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                width: 10,
                                                height: 10,
                                                backgroundColor: "#ff7300",
                                                marginRight: 5
                                            }}
                                        />
                                        Total Printed Files
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
                            name="Total Printed Files"
                            fill="#ff7300"
                        />

                    </BarChart>

                </ResponsiveContainer>

            </div>

        </div>
    )
}

export default UploadPrintCard