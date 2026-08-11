import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { debugError } from '../../lib/debug'

export default function useMonitorAuth() {

    const [user, setUser] = useState(null)
    const [checkingUser, setCheckingUser] = useState(true)

    useEffect(() => {

        const checkUser = async () => {

            const {
                data,
                error
            } = await supabase.auth.getUser()

            if (error) {
                debugError("Check user error:", error)
                window.location.href = "/monitor-login"
                return
            }

            if (!data.user) {
                window.location.href = "/monitor-login"
                return
            }

            setUser(data.user)
            setCheckingUser(false)

        }

        checkUser()

    }, [])

    return {
        user,
        checkingUser
    }
}