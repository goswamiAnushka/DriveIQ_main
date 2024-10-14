import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os

def send_otp_email(email, otp):
    try:
        smtp_host = os.getenv('SMTP_HOST')
        smtp_port = int(os.getenv('SMTP_PORT'))
        smtp_email = os.getenv('SMTP_EMAIL')
        smtp_password = os.getenv('SMTP_PASSWORD')

        sender_email = smtp_email
        recipient_email = email

        message = MIMEMultipart()
        message['From'] = sender_email
        message['To'] = recipient_email
        message['Subject'] = "Your OTP for DriveIQ Registration"

        body = f"Your OTP is {otp}. Please use it to complete your registration."
        message.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.sendmail(sender_email, recipient_email, message.as_string())
        server.quit()

        print(f"OTP sent to {email}.")
    except Exception as e:
        print(f"Failed to send OTP to {email}: {str(e)}")
