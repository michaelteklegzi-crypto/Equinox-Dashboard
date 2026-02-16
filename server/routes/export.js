const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// POST /api/export/email - Send action items PDF via email
router.post('/email', async (req, res) => {
    try {
        const { pdfBase64, recipientEmail, personName, subject, message } = req.body;

        // Validation
        if (!pdfBase64 || !recipientEmail || !personName) {
            return res.status(400).json({
                error: 'Missing required fields: pdfBase64, recipientEmail, personName'
            });
        }

        // Check if email is configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return res.status(500).json({
                error: 'Email service not configured. Please set SMTP_USER and SMTP_PASS in .env file.'
            });
        }

        // Create transporter
        const transporter = createTransporter();

        // Prepare email
        const mailOptions = {
            from: `"Equinox Dashboard" <${process.env.SMTP_USER}>`,
            to: recipientEmail,
            subject: subject || `Action Items for ${personName} - ${new Date().toLocaleDateString()}`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">Equinox Dashboard</h1>
            <p style="margin: 5px 0 0 0;">Action Items Report</p>
          </div>
          <div class="content">
            <p>Dear ${personName},</p>
            <p>${message || 'Please find attached your action items report.'}</p>
            <p>This report includes all action items currently assigned to you, along with their status, priority, and deadlines.</p>
            <p><strong>Report generated on:</strong> ${new Date().toLocaleString()}</p>
            <p>If you have any questions or need clarification on any items, please don't hesitate to reach out.</p>
            <p>Best regards,<br>Equinox Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Equinox Dashboard system.</p>
          </div>
        </body>
        </html>
      `,
            attachments: [
                {
                    filename: `ActionItems_${personName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
                    content: pdfBase64,
                    encoding: 'base64'
                }
            ]
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', info.messageId);
        res.json({
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({
            error: 'Failed to send email',
            details: error.message
        });
    }
});

// GET /api/export/test - Test email configuration
router.get('/test', async (req, res) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return res.status(500).json({
                configured: false,
                error: 'SMTP credentials not configured in .env file'
            });
        }

        const transporter = createTransporter();
        await transporter.verify();

        res.json({
            configured: true,
            message: 'Email service is configured and ready',
            smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
            smtpUser: process.env.SMTP_USER
        });
    } catch (error) {
        res.status(500).json({
            configured: false,
            error: 'Email service configuration error',
            details: error.message
        });
    }
});

module.exports = router;
