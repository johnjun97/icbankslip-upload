export default function SummaryCards({
    loading,
    storageFiles,
    pending,
    expired,
    totalLog
}) {

    return (
        <div className="dashboard-grid">

            <div className="monitor-card">

                <h2>
                    Storage Files
                </h2>

                <p>
                    {loading ? "Loading..." : storageFiles}
                </p>

            </div>

            <div className="monitor-card">

                <h2>
                    Pending
                </h2>

                <p>
                    {loading ? "Loading..." : pending}
                </p>

            </div>

            <div className="monitor-card">

                <h2>
                    Expired Uploads
                </h2>

                <p>
                    {loading ? "Loading..." : expired}
                </p>

            </div>

            <div className="monitor-card">

    <h2>
        Total Log
    </h2>

    <p>
        {loading ? "Loading..." : totalLog}
    </p>

</div>

        </div>
    )
}