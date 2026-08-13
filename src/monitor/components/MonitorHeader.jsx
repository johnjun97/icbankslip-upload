export default function MonitorHeader({ email, lastUpdated, onLogout }) {

    return (
        <div className="monitor-header">

            <div>
                <h1>
                    Kiosk Monitor
                </h1>

                <p>
    {email}

    {lastUpdated && (
        <span>
            {" "}updated as {lastUpdated.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit'
            })}
        </span>
    )}
</p>


            </div>

            <div className="monitor-actions">

                <button
                    className="logout-button"
                    onClick={onLogout}
                >
                    Logout
                </button>

            </div>

        </div>
    )
}