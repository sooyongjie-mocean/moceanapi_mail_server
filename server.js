const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Email service is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* Fun starts below: */

// Contact form endpoint
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, country, message, turnstileToken } = req.body;

  // Basic validation
  if (!name || !email || !country || !phone || !message || !turnstileToken) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Verify Turnstile token
    console.log("Attempting to get Turnstile response...");
    const turnstileResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
        }),
      }
    );

    const turnstileData = await turnstileResponse.json();

    if (!turnstileData.success) {
      console.log("Turnstile error:", turnstileData);
      return res.status(400).json({ message: "Invalid Turnstile token" });
    } else console.log("Turnstile successs: ", turnstileData.success);

    // Configure nodemailer with your SMTP credentials
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL,
      to: process.env.CONTACT_EMAIL,
      subject: `MoceanAPI Landing 🇵🇭: New Submission from ${name}`,
      text: `
          Name: ${name}
          Email: ${email}
          Phone: ${phone}
          Country: ${country}
          Message: ${message}
        `,
      html: `
          <p>Name: ${name}</p>
          <p>Email: ${email}</p>
          <p>Phone: ${phone}</p>
          <p>Country: ${country}</p>
          <p>Message: ${message.replace(/\n/g, "<br>")}</p>
        `,
    };

    // Send email
    console.log("Attempting to send email now.");
    const info = await transporter.sendMail(mailOptions);
    console.log(info);
    // return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    // return res.status(500).json({ message: "Failed to send email" });
  }
});