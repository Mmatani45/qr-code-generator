
const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const sharp = require("sharp");
const multer = require("multer");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Upload a PNG, JPG, or WebP image."));
        }
    }
});

app.post(
    "/api/generate-qr",
    upload.single("logo"),
    async (req, res) => {
        try {
            const { url } = req.body;

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

            // Generate the QR code as a PNG buffer
            const qrBuffer = await QRCode.toBuffer(url, {
                type: "png",
                width: 400,
                margin: 4,
                errorCorrectionLevel: "H"
            });

            let finalBuffer = qrBuffer;

            // Add a logo if the user uploaded one
            if (req.file) {
                const logoBuffer = await sharp(req.file.buffer)
                    .resize(76, 76, {
                        fit: "contain",
                        background: "#ffffff"
                    })
                    .png()
                    .toBuffer();

                // White background behind the logo
                const logoBackground = await sharp({
                    create: {
                        width: 88,
                        height: 88,
                        channels: 4,
                        background: "#ffffff"
                    }
                })
                    .png()
                    .toBuffer();

                const logoWithBackground = await sharp(logoBackground)
                    .composite([
                        {
                            input: logoBuffer,
                            gravity: "centre"
                        }
                    ])
                    .png()
                    .toBuffer();

                // Place the logo in the centre
                finalBuffer = await sharp(qrBuffer)
                    .composite([
                        {
                            input: logoWithBackground,
                            gravity: "centre"
                        }
                    ])
                    .png()
                    .toBuffer();
            }

            const qrCodeImage =
                `data:image/png;base64,${finalBuffer.toString("base64")}`;

            res.status(200).json({
                message: "QR code generated successfully.",
                url,
                qrCode: qrCodeImage
            });

        } catch (error) {
            console.error("QR generation error:", error);

            res.status(500).json({
                message: "Unable to generate QR code."
            });
        }
    }
);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
