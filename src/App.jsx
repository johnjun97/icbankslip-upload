import logo from './assets/logo.png'
import './App.css'
import { useState } from 'react'
import { supabase } from './lib/supabase'
import { QRCodeCanvas } from 'qrcode.react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { v4 as uuidv4 } from 'uuid'

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function FilePreview({ file, preview, alt }) {

  if (file.type === "application/pdf") {
    return (
      <div className="pdf-thumbnail">
        <Document
          file={preview}
          onLoadError={(error) => {
            console.error("PDF preview error:", error)
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

  const [files, setFiles] = useState({
    icFront: null,
    icBack: null,
    bankSlip: null
  })

  const handleFileChange = (e, fileName) => {
    const file = e.target.files[0]

    if (!file) return

    if (file) {
      setFiles({
        ...files,
        [fileName]: {
          file: file,
          preview: URL.createObjectURL(file)
        }
      })
    }
  }

  const canSubmit = () => {
    return (
      (files.icFront || files.icBack || files.bankSlip) &&
      agree &&
      !loading
    )
  }

  const uploadFile = async (file, folder) => {
    if (!file) return null

    const fileName = `${uuidv4()}-${file.name}`

    console.log("Uploading:", `${folder}/${fileName}`)

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(`${folder}/${fileName}`, file)

    console.log("Upload response:", data, error)

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    return data.path
  }

  const removeFile = (fileName) => {
    setFiles({
      ...files,
      [fileName]: null
    })
  }

  const handleSubmit = async (e) => {

    const { data } = await supabase.auth.getSession()

    console.log("Current session:", data.session)

    e.preventDefault()

    setLoading(true)

    try {
      const icFrontPath = await uploadFile(
        files.icFront?.file,
        "ic-front"
      )

      const icBackPath = await uploadFile(
        files.icBack?.file,
        "ic-back"
      )

      const bankSlipPath = await uploadFile(
        files.bankSlip?.file,
        "bank-slip"
      )

      // debug code
      // const { data: storageCheck, error: storageError } = await supabase.storage
      //   .from('uploads')
      //   .list('ic-front')

      // console.log("Upload repo storage check:", storageCheck, storageError)

      const qrValue = `NIR-${Date.now()}`

      const { data, error } = await supabase
        .from('submissions')
        .insert({
          ic_front_path: icFrontPath,
          ic_back_path: icBackPath,
          bank_slip_path: bankSlipPath,
          qrcode: qrValue,
          status: "Pending"
        })
        .single()

      if (error) {
        throw error
      }

      setQrCode(qrValue)

    } catch (error) {
      console.error(error)

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
              setFiles({
                icFront: null,
                icBack: null,
                bankSlip: null
              })
              setAgree(false)
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
            Uploading documents...
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
                accept="image/*"
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
                accept="image/*"
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
                onChange={(e) => handleFileChange(e, "bankSlip")}
              />

              <p className="file-note">
                Supported formats: JPG, JPEG, PNG, PDF
              </p>
            </div>
            <div className="preview-box">

              <h3>
                {files.icFront || files.icBack || files.bankSlip
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
                      <small>{files.icFront.file.name}</small>
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
                      <small>{files.icBack.file.name}</small>


                    </div>
                  </div>
                )}

              </div>

              {files.bankSlip && (
                <div className="file-card">

                  <button
                    className="remove-btn"
                    onClick={() => removeFile("bankSlip")}
                    type="button"
                  >
                    X
                  </button>

                  <FilePreview
                    file={files.bankSlip.file}
                    preview={files.bankSlip.preview}
                    alt="Bank Slip"
                  />


                  <div>
                    <p>Bank Slip</p>
                    <small>{files.bankSlip.file.name}</small>
                  </div>

                </div>
              )}

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