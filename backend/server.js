const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/generate-qr", async (req, res) => {
    try {
        const { url } = req.body;

        // Validate the URL
        if (!url || typeof url !== "string") {
            return res.status(400).json({
                message: "Please provide a valid URL."
            });
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(url);
        } catch {
            return res.status(400).json({
                message: "Invalid URL format."
            });
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return res.status(400).json({
                message: "Only HTTP and HTTPS URLs are supported."
            });
        }

        // Generate QR code as a Base64 data URL
        const qrCodeImage = await QRCode.toDataURL(url, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: "H"
        });

        res.status(200).json({
            message: "QR code generated successfully.",
            url: url,
            qrCode: qrCodeImage
        });

    } catch (error) {
        console.error("QR generation error:", error);

        res.status(500).json({
            message: "Unable to generate QR code."
        });
    }
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});