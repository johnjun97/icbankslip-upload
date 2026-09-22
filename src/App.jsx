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
import packageInfo from '../package.json'

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
  const [language, setLanguage] = useState("en")

  const t = {
    en: {
      instruction: "Please upload your IC and Bank Slip.",
      icFront: "IC Front Image:",
      icBack: "IC Back Image:",
      fileIcFront: "IC Front",
      fileIcBack: "IC Back",
      fileBankSlip: "Bank Slip",
      bankSlip: "Bank Slip:",
      uploadedDocuments: "Uploaded Documents",
      noDocument: "No document uploaded yet",
      supportedImage: "Supported formats: JPG, JPEG, PNG",
      supportedBankSlip: "Supported formats: JPG, JPEG, PNG, PDF",
      terms:
        "By Clicking on Submit, You agree to Nirvana's",
      termsLink: "Terms and Conditions of Use",
      privacy:
        "To learn more about how Nirvana collects, uses, shares, and protects your personal data, please see Nirvana's",
      privacyLink: "Privacy Policy",
      submit: "Submit",
      uploading: "Uploading...",
      uploadProgress: "Uploading",
      uploadIcFront: "IC Front",
      uploadIcBack: "IC Back",
      uploadBankSlip: "Bank Slip",
      uploadSuccessful: "Upload Successful",
      scanQr: "Please scan this QR code at the kiosk.",
      uploadAnother: "Upload Another Document",
      chooseFile: "Choose File",
      noFileChosen: "No file chosen",
      filesSelected: "files selected",
      preparingUpload: "Preparing upload...",
      copy: "Copy",
      copies: "Copies",
    },

    zh: {
      instruction: "请上传您的身份证和银行单据。",
      icFront: "身份证正面：",
      icBack: "身份证背面：",
      fileIcFront: "身份证正面",
      fileIcBack: "身份证背面",
      fileBankSlip: "银行单据",
      bankSlip: "银行单据：",
      uploadedDocuments: "已上传文件",
      noDocument: "尚未上传任何文件",
      supportedImage: "支持格式：JPG、JPEG、PNG",
      supportedBankSlip: "支持格式：JPG、JPEG、PNG、PDF",
      terms:
        "点击提交即表示您同意 Nirvana 的",
      termsLink: "使用条款",
      privacy:
        "如需了解 Nirvana 如何收集、使用、分享及保护您的个人资料，请参阅 Nirvana 的",
      privacyLink: "隐私政策",
      submit: "提交",
      uploading: "上传中...",
      uploadProgress: "正在上传",
      uploadIcFront: "身份证正面",
      uploadIcBack: "身份证背面",
      uploadBankSlip: "银行单据",
      uploadSuccessful: "上传成功",
      scanQr: "请在自助服务机扫描此二维码。",
      uploadAnother: "上传其他文件",
      chooseFile: "选择文件",
      noFileChosen: "尚未选择文件",
      filesSelected: "个文件已选择",
      preparingUpload: "准备上传...",
      copy: "份",
      copies: "份",
    }
  }

  const [files, setFiles] = useState({
    icFront: null,
    icBack: null,
    bankSlip: []
  })

  const [printCopies, setPrintCopies] = useState(1)
  const [bankSlipCopies, setBankSlipCopies] = useState([])

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

      setBankSlipCopies(prev => [
        ...prev,
        ...selectedFiles.map(() => 1)
      ])

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

      setBankSlipCopies(prev =>
        prev.filter((_, i) => i !== index)
      )

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
    setUploadStatus(t[language].preparingUpload)

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
          name: t[language].uploadIcFront,
          folder: "ic-front",
          file: files.icFront.file
        })
      }

      if (files.icBack) {
        uploadList.push({
          key: "icBack",
          name: t[language].uploadIcBack,
          folder: "ic-back",
          file: files.icBack.file
        })
      }

      files.bankSlip.forEach((bankSlip, index) => {
        uploadList.push({
          key: `bankSlip_${index}`,
          name: `${t[language].uploadBankSlip} ${index + 1}`,
          folder: "bank-slip",
          file: bankSlip.file
        })
      })

      for (let i = 0; i < uploadList.length; i++) {

        const item = uploadList[i]

        setUploadStatus(
          `${t[language].uploadProgress} ${item.name} (${i + 1}/${uploadList.length})`
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
ic_copies:
  (files.icFront || files.icBack)
    ? printCopies
    : 0,
          bank_slip_copies: bankSlipCopies,
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

          <div className="logo-version">

            <img src={logo} alt="Logo" />

            <span>v{packageInfo.version}</span>

            <button
              type="button"
              className="language-button"
              onClick={() => {
                setLanguage(language === "en" ? "zh" : "en")
              }}
            >
              {language === "en" ? "中文" : "EN"}
            </button>

          </div>

          <h2>{t[language].uploadSuccessful}</h2>

          <p>
            {t[language].scanQr}
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

              setPrintCopies(1)
              setBankSlipCopies([])
            }}
          >
            {t[language].uploadAnother}
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
          <div className="logo-version">
            <img src={logo} alt="Logo" />

            <span>v{packageInfo.version}</span>

            <button
              type="button"
              className="language-button"
              onClick={() => {
                setLanguage(language === "en" ? "zh" : "en")
              }}
            >
              {language === "en" ? "中文" : "EN"}
            </button>
          </div>

          <p>{t[language].instruction}</p>

          <form onSubmit={handleSubmit}>
            <div>
              <label>{t[language].icFront}</label>

              <div className="custom-file-input">

                <label className="choose-file-button">
                  {t[language].chooseFile}

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "icFront")}
                  />
                </label>

                <span>
                  {files.icFront
                    ? files.icFront.file.name
                    : t[language].noFileChosen}
                </span>

              </div>

              <p className="file-note">
                {t[language].supportedImage}
              </p>

            </div>

            <div>
              <label>{t[language].icBack}</label>

              <div className="custom-file-input">

                <label className="choose-file-button">
                  {t[language].chooseFile}

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "icBack")}
                  />
                </label>

                <span>
                  {files.icBack
                    ? files.icBack.file.name
                    : t[language].noFileChosen}
                </span>

              </div>

              <p className="file-note">
                {t[language].supportedImage}
              </p>

            </div>

            <div>
              <label>{t[language].bankSlip}</label>

              <div className="custom-file-input">

                <label className="choose-file-button">
                  {t[language].chooseFile}

                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={(e) => handleFileChange(e, "bankSlip")}
                  />
                </label>

                <span>
                  {files.bankSlip.length === 0
                    ? t[language].noFileChosen
                    : files.bankSlip.length === 1
                      ? files.bankSlip[0].file.name
                      : `${files.bankSlip.length} ${t[language].filesSelected}`}
                </span>

              </div>

              <p className="file-note">
                {t[language].supportedBankSlip}
              </p>
            </div>
            <div className="preview-box">

              <h3>
                {files.icFront ||
                  files.icBack ||
                  files.bankSlip.length > 0
                  ? t[language].uploadedDocuments
                  : t[language].noDocument}
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
                      <p>{t[language].fileIcFront}</p>
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
                      <p>{t[language].fileIcBack}</p>
                      <small title={files.icBack.file.name}>
                        {files.icBack.file.name.length > 25
                          ? files.icBack.file.name.substring(0, 22) + "..."
                          : files.icBack.file.name}
                      </small>


                    </div>
                  </div>
                )}

              </div>

              {(files.icFront || files.icBack) && (
                <div className="print-copies-section">
                  <select
                    id="print-copies"
                    className="print-copies-select"
                    value={printCopies}
                    onChange={(e) =>
                      setPrintCopies(Number(e.target.value))
                    }
                  >
                    <option value={1}>1 {t[language].copy}</option>
                    <option value={2}>2 {t[language].copies}</option>
                    <option value={3}>3 {t[language].copies}</option>
                  </select>
                </div>
              )}

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
                    <p>{t[language].fileBankSlip} {index + 1}</p>

                    <small title={bankSlip.file.name}>
                      {bankSlip.file.name.length > 25
                        ? bankSlip.file.name.substring(0, 22) + "..."
                        : bankSlip.file.name}
                    </small>
                  </div>

                  <select
                    className="print-copies-select"
                    value={bankSlipCopies[index] || 1}
                    onChange={(e) => {
                      const value = Number(e.target.value)

                      setBankSlipCopies(prev => {
                        const updated = [...prev]
                        updated[index] = value
                        return updated
                      })
                    }}
                  >
                    <option value={1}>1 {t[language].copy}</option>
                    <option value={2}>2 {t[language].copies}</option>
                    <option value={3}>3 {t[language].copies}</option>
                  </select>

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

                {t[language].terms}{" "}
                <a href="/terms-and-conditions.pdf" target="_blank">
                  {t[language].termsLink}
                </a>
              </label>

              <br />

              <span>
                {t[language].privacy}{" "}
                <a href="/privacy-policy.pdf" target="_blank">
                  {t[language].privacyLink}
                </a>
              </span>
            </div>

            <button
              type="submit"
              disabled={!canSubmit()}
            >
              {loading
                ? t[language].uploading
                : t[language].submit}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default App