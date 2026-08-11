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

    return (
        <div className="monitor-card upload-print-card">

            <div className="card-title-row">

                <h2>
                    Upload & Print Overview
                </h2>

                <div className="chart-filters">

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
    wrapperStyle={{
        paddingTop: 15
    }}
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