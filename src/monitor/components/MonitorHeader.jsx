export default function MonitorHeader({ email, onLogout }) {

    return (
        <div className="monitor-header">

            <div>
                <h1>
                    Kiosk Monitor
                </h1>

                <p>
                    {email}
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