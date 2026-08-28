import logo from './assets/logo.png'
import './App.css'
import { useState } from 'react'
import { supabase } from './lib/supabase'
import { QRCodeCanvas } from 'qrcode.react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { v4 as uuidv4 } from 'uuid'
import { debugLog, debugError } from './lib/debug'

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function FilePreview({ file, preview, alt }) {

  if (file.type === "application/pdf") {
    return (
      <div className="pdf-thumbnail">
        <Document
          file={preview}
          onLoadError={(error) => {
            debugError("PDF preview error:", error)
          }}
        >
          <Page
            pageNumber={1}
            width={70}
          />
        </Document>
      </div>
    )
  }

  return (
    <img
      src={preview}
      alt={alt}
    />
  )
}


function App() {

  const [qrCode, setQrCode] = useState(null)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("")

  const [files, setFiles] = useState({
    icFront: null,
    icBack: null,
    bankSlip: []
  })

  const handleFileChange = (e, fileName) => {

    const selectedFiles = Array.from(e.target.files)

    if (selectedFiles.length === 0) return

    const MAX_SIZE = 5 * 1024 * 1024 // 5MB

    const allowedTypes = {
      icFront: [
        "image/jpeg",
        "image/png"
      ],

      icBack: [
        "image/jpeg",
        "image/png"
      ],

      bankSlip: [
        "image/jpeg",
        "image/png",
        "application/pdf"
      ]
    }

    for (const file of selectedFiles) {

      if (file.size > MAX_SIZE) {
        alert(`${file.name}: File size cannot exceed 5MB`)
        e.target.value = ""
        return
      }

      if (!allowedTypes[fileName].includes(file.type)) {
        alert(`${file.name}: Unsupported file format`)
        e.target.value = ""
        return
      }
    }

    if (fileName === "bankSlip") {

      const newFiles = selectedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }))

      setFiles(prev => ({
        ...prev,
        bankSlip: [
          ...prev.bankSlip,
          ...newFiles
        ]
      }))

    } else {

      const file = selectedFiles[0]

      setFiles(prev => ({
        ...prev,
        [fileName]: {
          file,
          preview: URL.createObjectURL(file)
        }
      }))
    }

    e.target.value = ""
  }

  const canSubmit = () => {
    return (
      (
        files.icFront ||
        files.icBack ||
        files.bankSlip.length > 0
      ) &&
      agree &&
      !loading
    )
  }

  const uploadFile = async (file, folder) => {
    if (!file) return null

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${uuidv4()}-${safeName}`

    debugLog("Uploading:", `${folder}/${fileName}`)

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(`${folder}/${fileName}`, file)

    debugLog("Upload response:", data, error)

    if (error) {

      debugError("Upload error:", error)

      throw error
    }

    return data.path
  }

  const logUploadEvent = async ({
    qrcode,
    event,
    fileType = null,
    filePath = null,
    errorMessage = null
  }) => {

    debugLog("LOG EVENT START:", {
      qrcode,
      event,
      fileType,
      filePath,
      errorMessage
    })

    try {
      const { error } = await supabase
        .from("upload_logs")
        .insert({
          qrcode,
          event,
          file_type: fileType,
          file_path: filePath,
          error_message: errorMessage
        })

      if (error) {
        debugError("FAILED TO WRITE UPLOAD LOG:", error)
        return
      }

      debugLog("UPLOAD LOG CREATED")

    } catch (error) {

      debugError("UPLOAD LOG EXCEPTION:", error)

    }
  }

  const deleteUploadedFiles = async (paths) => {

    const validPaths = [
      paths.icFront,
      paths.icBack,
      ...(paths.bankSlips || [])
    ].filter(Boolean)

    if (validPaths.length === 0) return

    debugLog("Cleaning up uploaded files:", validPaths)

    const { data, error } = await supabase.storage
      .from('uploads')
      .remove(validPaths)

    debugLog("Cleanup response:", data, error)

    if (error) {
      debugError("Cleanup error:", error)

      // qrcode is not available in this function,
      // so the cleanup error is currently only logged to console.
    }
  }

  const removeFile = (fileName, index = null) => {

    if (fileName === "bankSlip") {

      const file = files.bankSlip[index]

      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }

      setFiles(prev => ({
        ...prev,
        bankSlip: prev.bankSlip.filter(
          (_, i) => i !== index
        )
      }))

      return
    }

    if (files[fileName]?.preview) {
      URL.revokeObjectURL(files[fileName].preview)
    }

    setFiles(prev => ({
      ...prev,
      [fileName]: null
    }))
  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    if (import.meta.env.VITE_DEBUG === "true") {
      const { data } = await supabase.auth.getSession()

      debugLog("Session user:", data.session?.user)
      debugLog("Session role:", data.session?.user?.role)
      debugLog("User logged in:", data.session?.user?.email)
    }

    setLoading(true)

    const uploadResult = {
      bankSlips: []
    }
    const qrValue = `NIR-${Date.now()}`

    try {

      await logUploadEvent({
        qrcode: qrValue,
        event: "SUBMIT_STARTED"
      })

      const uploadList = []

      if (files.icFront) {
        uploadList.push({
          key: "icFront",
          name: "IC Front",
          folder: "ic-front",
          file: files.icFront.file
        })
      }

      if (files.icBack) {
        uploadList.push({
          key: "icBack",
          name: "IC Back",
          folder: "ic-back",
          file: files.icBack.file
        })
      }

      files.bankSlip.forEach((bankSlip, index) => {
        uploadList.push({
          key: `bankSlip_${index}`,
          name: `Bank Slip ${index + 1}`,
          folder: "bank-slip",
          file: bankSlip.file
        })
      })

      for (let i = 0; i < uploadList.length; i++) {

        const item = uploadList[i]

        setUploadStatus(
          `Uploading ${item.name} (${i + 1}/${uploadList.length})`
        )

        try {

          const path = await uploadFile(
            item.file,
            item.folder
          )

          if (!path) {
            throw new Error(`Failed to upload ${item.name}`)
          }

          if (item.key.startsWith("bankSlip_")) {
            uploadResult.bankSlips.push(path)
          } else {
            uploadResult[item.key] = path
          }

          await logUploadEvent({
            qrcode: qrValue,
            event: "UPLOAD_SUCCESS",
            fileType: item.name,
            filePath: path
          })

        } catch (error) {

          await logUploadEvent({
            qrcode: qrValue,
            event: "UPLOAD_FAILED",
            fileType: item.name,
            errorMessage: error.message
          })

          throw error
        }
      }

      const { error } = await supabase
        .from('submissions')
        .insert({
          ic_front_path: uploadResult.icFront || null,
          ic_back_path: uploadResult.icBack || null,
          bank_slip_paths: uploadResult.bankSlips,
          qrcode: qrValue,
          status: "Pending"
        })

      if (error) {

        debugError("Database insert error:", error)

        await logUploadEvent({
          qrcode: qrValue,
          event: "DATABASE_INSERT_FAILED",
          errorMessage: error.message
        })

        // Database insert failed,
        // so remove the files that were already uploaded.
        await deleteUploadedFiles(uploadResult)

        setUploadStatus(
          `Database Error: ${error.message}`
        )

        return
      }

      await logUploadEvent({
        qrcode: qrValue,
        event: "DATABASE_INSERT_SUCCESS"
      })

      setUploadStatus("")
      setQrCode(qrValue)

    } catch (error) {

      debugError("Submit error:", error)

      await logUploadEvent({
        qrcode: qrValue,
        event: "SUBMIT_FAILED",
        errorMessage: error.message
      })

      // Clean up any files that were successfully uploaded
      // before the error occurred.
      await deleteUploadedFiles(uploadResult)

      setUploadStatus(
        `Error: ${error.message}`
      )

    } finally {

      setLoading(false)

    }
  }

  if (qrCode) {
    return (
      <div className="app">
        <div className="form-container qr-success">

          <img src={logo} alt="Logo" />

          <h2>Upload Successful</h2>

          <p>
            Please scan this QR code at the kiosk.
          </p>

          <QRCodeCanvas
            value={qrCode}
            size={250}
          />

          <p>{qrCode}</p>

          <button
            onClick={() => {
              setQrCode(null)
              if (files.icFront?.preview) {
                URL.revokeObjectURL(files.icFront.preview)
              }

              if (files.icBack?.preview) {
                URL.revokeObjectURL(files.icBack.preview)
              }

              files.bankSlip.forEach(item => {
                if (item?.preview) {
                  URL.revokeObjectURL(item.preview)
                }
              })

              setFiles({
                icFront: null,
                icBack: null,
                bankSlip: []
              })
              setAgree(false)
              setUploadStatus("")
            }}
          >
            Upload Another Document
          </button>

        </div>
      </div>
    )
  }

  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            {uploadStatus}
          </div>
        </div>
      )}

      <div className="app">


        <div className="form-container">
          <img src={logo} alt="Logo" />

          <p>Fill in the above information.</p>

          <form onSubmit={handleSubmit}>
            <div>
              <label>IC Front Image:</label>

              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, "icFront")}
              />
              <p className="file-note">
                Supported formats: JPG, JPEG, PNG
              </p>
            </div>

            <div>
              <label>IC Back Image:</label>

              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, "icBack")}
              />
              <p className="file-note">
                Supported formats: JPG, JPEG, PNG
              </p>
            </div>

            <div>
              <label>Bank Slip:</label>

              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => handleFileChange(e, "bankSlip")}
              />

              <p className="file-note">
                Supported formats: JPG, JPEG, PNG, PDF
              </p>
            </div>
            <div className="preview-box">

              <h3>
                {files.icFront ||
                  files.icBack ||
                  files.bankSlip.length > 0
                  ? "Uploaded Documents"
                  : "No document uploaded yet"}
              </h3>

              <div className="ic-preview-row">

                {files.icFront && (
                  <div className="file-card">

                    <button
                      className="remove-btn"
                      onClick={() => removeFile("icFront")}
                      type="button"
                    >
                      X
                    </button>

                    <FilePreview
                      file={files.icFront.file}
                      preview={files.icFront.preview}
                      alt="IC Front"
                    />

                    <div>
                      <p>IC Front</p>
                      <small title={files.icFront.file.name}>
                        {files.icFront.file.name.length > 25
                          ? files.icFront.file.name.substring(0, 22) + "..."
                          : files.icFront.file.name}
                      </small>
                    </div>

                  </div>
                )}

                {files.icBack && (
                  <div className="file-card">

                    <button
                      className="remove-btn"
                      onClick={() => removeFile("icBack")}
                      type="button"
                    >
                      X
                    </button>
                    <FilePreview
                      file={files.icBack.file}
                      preview={files.icBack.preview}
                      alt="IC Back"
                    />

                    <div>
                      <p>IC Back</p>
                      <small title={files.icBack.file.name}>
                        {files.icBack.file.name.length > 25
                          ? files.icBack.file.name.substring(0, 22) + "..."
                          : files.icBack.file.name}
                      </small>


                    </div>
                  </div>
                )}

              </div>

              {files.bankSlip.map((bankSlip, index) => (
                <div className="file-card" key={bankSlip.preview}>

                  <button
                    className="remove-btn"
                    onClick={() => removeFile("bankSlip", index)}
                    type="button"
                  >
                    X
                  </button>

                  <FilePreview
                    file={bankSlip.file}
                    preview={bankSlip.preview}
                    alt={`Bank Slip ${index + 1}`}
                  />

                  <div>
                    <p>Bank Slip {index + 1}</p>

                    <small title={bankSlip.file.name}>
                      {bankSlip.file.name.length > 25
                        ? bankSlip.file.name.substring(0, 22) + "..."
                        : bankSlip.file.name}
                    </small>
                  </div>

                </div>
              ))}

            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />

                By Clicking on Submit, You agree to Nirvana's{" "}
                <a href="/terms-and-conditions.pdf" target="_blank">
                  Terms and Conditions of Use
                </a>
              </label>

              <br />

              <span>
                To learn more about how Nirvana collects, uses, shares, and protects your personal data,
                please see Nirvana's{" "}
                <a href="/privacy-policy.pdf" target="_blank">
                  Privacy Policy
                </a>
              </span>
            </div>

            <button
              type="submit"
              disabled={!canSubmit()}
            >
              {loading ? "Uploading..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default App