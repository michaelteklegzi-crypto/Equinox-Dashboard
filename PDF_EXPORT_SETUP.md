# PDF Export & Email Setup Guide

## ✅ Feature Implemented

The PDF export and email feature has been added to the Reports page. Users can now:
1. Select a specific responsible person from a dropdown
2. Download their action items as a professional PDF
3. Send the PDF via email to any recipient

## 📧 Email Configuration Required

To enable email sending, you need to configure SMTP settings in your `.env` file.

### For Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" → Enter "Equinox Dashboard"
   - Click "Generate"
   - Copy the 16-character password

3. **Update `/server/.env`**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### For Outlook/Office 365

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### For Custom SMTP Server

```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

## 🧪 Testing

### 1. Test Email Configuration

```bash
curl http://localhost:3000/api/export/test
```

Should return:
```json
{
  "configured": true,
  "message": "Email service is configured and ready"
}
```

### 2. Test the Feature

1. Go to the Reports page (http://localhost:5173/reports)
2. Select a date range (or use "All Time")
3. Select a specific person from the "All People" dropdown
4. Click "Email PDF" to send via email, or "Download PDF" to save locally

## 📄 PDF Features

The generated PDF includes:
- **Equinox branding** with orange header
- **Report metadata** (person name, date, total actions)
- **Formatted table** with all action items
- **Color-coded status** (Completed = green, Delayed = red, Ongoing = blue)
- **Color-coded priority** (High = bold red, Medium = yellow)
- **Action details** section with descriptions
- **Professional footer** with page numbers

## 🚫 Troubleshooting

### "Email service not configured"
- Check that `SMTP_USER` and `SMTP_PASS` are set in `.env`
- Restart the server after updating `.env`

### "Authentication failed"
- For Gmail, make sure you're using an App Password, not your regular password
- Verify 2FA is enabled on your Google Account

### "Please select a specific person to export"
- You must select an individual person from the dropdown
- "All People" cannot be exported (designed this way to keep PDFs focused)

### PDF not downloading
- Check browser pop-up blocker settings
- Check browser's download settings

## 🔧 Development Notes

- **Client dependencies**: `jspdf`, `jspdf-autotable`
- **Server dependencies**: `nodemailer`
- **New files**:
  - `client/src/utils/pdfExport.js` - PDF generation logic
  - `client/src/components/ExportModal.jsx` - Email input modal
  - `server/routes/export.js` - Email sending API
- **Modified files**:
  - `client/src/pages/Reports.jsx` - UI integration
  - `server/index.js` - Route registration
  - `server/.env` - Email configuration

## 🎯 Next Steps

1. Configure your SMTP credentials
2. Test sending an email to yourself
3. Share the feature with users!
