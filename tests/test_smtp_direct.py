"""
Direct SMTP test - no Temporal required

Tests Gmail SMTP connectivity directly
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

# Load .env
load_dotenv()

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

print("="*70)
print("🧪 Direct Gmail SMTP Test")
print("="*70)
print()
print(f"Gmail Address: {GMAIL_ADDRESS}")
print(f"SMTP Server: {SMTP_SERVER}:{SMTP_PORT}")
print()

# Create test email
msg = MIMEMultipart('alternative')
msg['From'] = GMAIL_ADDRESS
msg['To'] = GMAIL_ADDRESS  # Send to yourself
msg['Subject'] = "FourKites Workflow Builder - SMTP Test"

html_body = """
<html>
<body style="font-family: Arial, sans-serif;">
    <h2 style="color: #10b981;">✅ SMTP Test Successful!</h2>
    <p>Your Gmail SMTP configuration is working correctly.</p>
    <p><strong>Server:</strong> smtp.gmail.com:587</p>
    <p><strong>From:</strong> {gmail}</p>
    <p>You can now use real email actions in your workflows!</p>
</body>
</html>
""".format(gmail=GMAIL_ADDRESS)

msg.attach(MIMEText(html_body, 'html'))

print("🔌 Connecting to Gmail SMTP...")
try:
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        print("✅ Connected!")
        print("🔐 Starting TLS...")
        server.starttls()
        print("✅ TLS enabled!")
        print("🔑 Logging in...")
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        print("✅ Logged in!")
        print(f"📧 Sending test email to {GMAIL_ADDRESS}...")
        server.send_message(msg)
        print("✅ Email sent!")

    print()
    print("="*70)
    print("🎉 SUCCESS! Check your inbox for the test email.")
    print("="*70)

except Exception as e:
    print()
    print("="*70)
    print("❌ FAILED!")
    print("="*70)
    print(f"Error: {str(e)}")
    print()
    print("Troubleshooting:")
    print("1. Check .env file exists in project root")
    print("2. Verify GMAIL_ADDRESS is correct")
    print("3. Verify GMAIL_APP_PASSWORD is a 16-character app password")
    print("4. Make sure 2-factor auth is enabled on your Google account")
    print("5. Generate new app password at: https://myaccount.google.com/apppasswords")
