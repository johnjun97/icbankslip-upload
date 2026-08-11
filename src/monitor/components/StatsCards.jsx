export default function StatsCards({
    loadingTotal,
    total,
    loadingUploadFiles,
    totalUploadFiles,
    loadingPrinted,
    printed,
    cardPrintSource,
    setCardPrintSource,
    printSources
}) {

    return (
        <div className="dashboard-grid second-row">

            <div className="monitor-card">

                <h2>
                    Total Uploads
                </h2>

                <p>
                    {loadingTotal ? "Loading..." : total}
                </p>

            </div>

            <div className="monitor-card">

                <h2>
                    Total Upload Files
                </h2>

                <p>
                    {loadingUploadFiles
                        ? "Loading..."
                        : totalUploadFiles}
                </p>

            </div>

            <div className="monitor-card printed-card">

                <div className="card-title-row">

                    <h2>
                        Total Printed Files From
                    </h2>

                    <select
                        className="filter-select"
                        value={cardPrintSource}
                        onChange={(e) =>
                            setCardPrintSource(e.target.value)
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

                </div>

                <p>
                    {loadingPrinted ? "Loading..." : printed}
                </p>

            </div>

        </div>
    )
}