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

function StatisticsChart({
    chartData,
    chartRange,
    setChartRange
}) {

    return (
        <div className="monitor-card chart-card">

            <div className="card-title-row">

                <h2>
                    Upload and Print Statistics
                </h2>

                <div className="chart-filters">

                    <select
                        className="filter-select"
                        value={chartRange}
                        onChange={(e) =>
                            setChartRange(e.target.value)
                        }
                    >

                        <option value="7days">
                            Last 7 Days
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

            <ResponsiveContainer
                width="100%"
                height={300}
            >

                <BarChart data={chartData}>

                    <CartesianGrid />

                    <XAxis
                        dataKey="date"
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
                        content={() => (
                            <ul className="custom-chart-legend">

                                <li>
                                    <span className="legend-uploads">
                                        ■ Total Uploads
                                    </span>
                                </li>

                                <li>
                                    <span className="legend-upload-files">
                                        ■ Total Upload Files
                                    </span>
                                </li>

                                <li>
                                    <span className="legend-printed">
                                        ■ Total Printed Files
                                    </span>
                                </li>

                            </ul>
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
    )
}

export default StatisticsChart