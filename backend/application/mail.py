import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

SMTP_SERVER_HOST = os.getenv("SMTP_HOST", "sandbox.smtp.mailtrap.io")
SMTP_SERVER_PORT = int(os.getenv("SMTP_PORT", 2525))

SENDER_ADDRESS = os.getenv("SMTP_USER")
SENDER_PASSWORD = os.getenv("SMTP_PASS")


def send_email(to_address, subject, message, content="html", attachment_file=None):

    msg = MIMEMultipart()
    msg['From'] = SENDER_ADDRESS
    msg['To'] = to_address
    msg['Subject'] = subject

    # body
    msg.attach(MIMEText(message, "html" if content == "html" else "plain"))

    # attachment (optional)
    if attachment_file:
        with open(attachment_file, 'rb') as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())

        encoders.encode_base64(part)

        filename = os.path.basename(attachment_file)

        part.add_header(
            "Content-Disposition",
            f'attachment; filename="{filename}"'
        )

        msg.attach(part)

    try:
        server = smtplib.SMTP(SMTP_SERVER_HOST, SMTP_SERVER_PORT, timeout=30)

        server.ehlo()
        server.starttls()
        server.ehlo()

        server.login(SENDER_ADDRESS, SENDER_PASSWORD)

        server.send_message(msg)

        server.quit()

    except Exception as e:
        print("EMAIL ERROR:", repr(e))
        raise
