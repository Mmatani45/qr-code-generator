import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
    const [url, setUrl] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const generateQRCode = async (e) => {
        e.preventDefault();

        setError("");
        setQrCode("");

        const trimmedUrl = url.trim();

        if (!trimmedUrl) {
            setError("Please enter a URL.");
            return;
        }

        let normalizedUrl;

        try {
            normalizedUrl = new URL(
                /^https?:\/\//i.test(trimmedUrl)
                    ? trimmedUrl
                    : `https://${trimmedUrl}`
            );

            if (!["http:", "https:"].includes(normalizedUrl.protocol)) {
                throw new Error("Invalid protocol");
            }
        } catch {
            setError("Please enter a valid website URL.");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "http://localhost:5000/api/generate-qr",
                {
                    url: normalizedUrl.href
                }
            );

            setQrCode(response.data.qrCode);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to generate QR code. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const downloadQRCode = () => {
        if (!qrCode) return;

        const link = document.createElement("a");

        link.href = qrCode;
        link.download = "qr-code.png";

        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="container">
            <div className="qr-card">
                <h1>QR Code Generator</h1>

                <p className="subtitle">
                    Convert any website URL into a QR code.
                </p>

                <form onSubmit={generateQRCode}>
                    <label htmlFor="url">Website URL</label>

                    <input
                        id="url"
                        type="text"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Generating..." : "Generate QR Code"}
                    </button>
                </form>

                {error && (
                    <p className="error" role="alert">
                        {error}
                    </p>
                )}

                {qrCode && (
                    <div className="qr-result">
                        <h2>Your QR Code</h2>

                        <img
                            src={qrCode}
                            alt="Generated QR code"
                        />

                        <p>
                            Scan this QR code to open:
                        </p>

                        <a
                            href={url.trim().match(/^https?:\/\//i)
                                ? url.trim()
                                : `https://${url.trim()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {url}
                        </a>

                        <button
                            type="button"
                            className="download-button"
                            onClick={downloadQRCode}
                        >
                            Download QR Code
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;