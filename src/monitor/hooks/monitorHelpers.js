// Get the selected date range
export const getDateRange = (range) => {
    const now = new Date()

    const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    )

    let start = null
    let end = null

    switch (range) {
        case "today":
            start = today
            end = new Date(today)
            end.setDate(end.getDate() + 1)
            break

        case "yesterday":
            end = today
            start = new Date(today)
            start.setDate(start.getDate() - 1)
            break

        case "7days":
            start = new Date(today)
            start.setDate(start.getDate() - 6)
            end = new Date(today)
            end.setDate(end.getDate() + 1)
            break

        case "thisweek": {
            const day = today.getDay()
            const mondayOffset = day === 0 ? -6 : 1 - day

            start = new Date(today)
            start.setDate(start.getDate() + mondayOffset)

            end = new Date(start)
            end.setDate(end.getDate() + 7)
            break
        }

        case "lastweek": {
            const day = today.getDay()
            const mondayOffset = day === 0 ? -6 : 1 - day

            start = new Date(today)
            start.setDate(start.getDate() + mondayOffset - 7)

            end = new Date(start)
            end.setDate(end.getDate() + 7)
            break
        }

        case "30days":
            start = new Date(today)
            start.setDate(start.getDate() - 29)
            end = new Date(today)
            end.setDate(end.getDate() + 1)
            break

        case "month":
            start = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            )
            end = new Date(today)
            end.setDate(end.getDate() + 1)
            break

        case "lastMonth":
            start = new Date(
                today.getFullYear(),
                today.getMonth() - 1,
                1
            )
            end = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            )
            break

        case "all":
        default:
            break
    }

    return { start, end }
}


// Apply the same date filter to any Supabase query
export const applyDateRange = (query, column, range) => {
    const { start, end } = getDateRange(range)

    if (start) {
        query = query.gte(column, start.toISOString())
    }

    if (end) {
        query = query.lt(column, end.toISOString())
    }

    return query
}


// Convert JSON strings or arrays into arrays
export const parseArray = (value) => {
    if (Array.isArray(value)) {
        return value
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }

    return []
}