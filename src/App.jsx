import logo from './assets/logo.png'
import './App.css'
import { useState } from 'react'
import { supabase } from './lib/supabase'
import { QRCodeCanvas } from 'qrcode.react'

function App() {

  const [qrCode, setQrCode] = useState(null)

  const [files, setFiles] = useState({
    icFront: null,
    icBack: null,
    bankSlip: null
  })

  const handleFileChange = (e, fileName) => {
    const file = e.target.files[0]

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

  const uploadFile = async (file, folder) => {
    if (!file) return null

    const fileName = `${Date.now()}-${file.name}`

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(`${folder}/${fileName}`, file)

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    return data.path
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

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

    const qrValue = `NIR-${Date.now()}`

    const { data: testData, error: testError } = await supabase
      .from('submissions')
      .select('*')
      .limit(1)

    console.log("select test:", testData, testError)

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        status: 'Pending',
        qrcode: qrValue
      })
      .single()

    if (error) {
      console.error(error)
    } else {
      console.log('Saved:', data)

      setQrCode(qrValue)
    }

  }

  return (


    <div className="app">
      <div className="form-container">
        <img src={logo} alt="Logo" />

        <p>Fill in the above information.</p>

        <form onSubmit={handleSubmit}>
          <div>
            <label>IC Front Image:</label>

            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange(e, "icFront")}
            />
          </div>

          <div>
            <label>IC Back Image:</label>

            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange(e, "icBack")}
            />
          </div>

          <div>
            <label>Bank Slip:</label>

            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange(e, "bankSlip")}
            />
          </div>
          <div className="preview-box">

            <h3>
              {files.icFront || files.icBack || files.bankSlip
                ? "Uploaded Documents"
                : "No document uploaded yet"}
            </h3>

            {files.icFront && (
              <div className="file-card">
                <img src={files.icFront.preview} alt="IC Front" />

                <div>
                  <p>IC Front</p>
                  <small>{files.icFront.file.name}</small>
                </div>
              </div>
            )}

            {files.icBack && (
              <div className="file-card">
                <img src={files.icBack.preview} alt="IC Back" />

                <div>
                  <p>IC Back</p>
                  <small>{files.icBack.file.name}</small>
                </div>
              </div>
            )}

            {files.bankSlip && (
              <div className="file-card">

                {files.bankSlip.file.type === "application/pdf" ? (
                  <div className="pdf-thumbnail">
                    PDF
                  </div>
                ) : (
                  <img src={files.bankSlip.preview} alt="Bank Slip" />
                )}

                <div>
                  <p>Bank Slip</p>
                  <small>{files.bankSlip.file.name}</small>
                </div>

              </div>
            )}

          </div>

          <div>
            <label>
              <input type="checkbox" />

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

          <button type="submit">
            Submit
          </button>
        </form>
        {qrCode && (
          <div className="qr-box">
            <h3>Upload Successful</h3>

            <p>Please scan this QR code at the kiosk.</p>

            <QRCodeCanvas
              value={qrCode}
              size={200}
            />

            <p>{qrCode}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App