import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { debugError } from '../../lib/debug'

export default function useMonitorData(user) {

    const [pending, setPending] = useState(null)
    const [expired, setExpired] = useState(null)
    const [storageFiles, setStorageFiles] = useState(null)
    const [loadingData, setLoadingData] = useState(true)


    const loadData = async () => {

        setLoadingData(true)


        // Pending and Expired ignore filters
        const getSystemStatusCount = async (status) => {

            const { count, error } = await supabase
                .from('submissions')
                .select('*', {
                    count: 'exact',
                    head: true
                })
                .eq(
                    'status',
                    status
                )

            if (error) {

                debugError(
                    `Load ${status} count error:`,
                    error
                )

            }

            return count || 0

        }


        setPending(
            await getSystemStatusCount("Pending")
        )

        setExpired(
            await getSystemStatusCount("Expired")
        )


        const countStorageFiles = async () => {

            const folders = [
                "ic-front",
                "ic-back",
                "bank-slip"
            ]

            let totalFiles = 0


            for (const folder of folders) {

                const { data, error } = await supabase.storage
                    .from('uploads')
                    .list(folder, {
                        limit: 1000
                    })


                if (error) {

                    debugError(
                        "Storage count error:",
                        error
                    )

                    continue

                }


                totalFiles += data.length

            }


            return totalFiles

        }


        const files = await countStorageFiles()

        setStorageFiles(files)

        setLoadingData(false)

    }


    useEffect(() => {

        if (!user) return

        loadData()

    }, [user])


    return {
        pending,
        expired,
        storageFiles,
        loadingData
    }

}