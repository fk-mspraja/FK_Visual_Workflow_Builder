"""
Document Extraction Activities
AI-powered document processing using Anthropic Claude
"""
import os
import base64
import imaplib
import email
import json
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from temporalio import activity
from anthropic import Anthropic
import logging

logger = logging.getLogger(__name__)


@activity.defn
async def request_document_via_email(params: dict):
    """
    Send email requesting document (BOL, Invoice, etc.)

    Args:
        params: {
            'recipient_email': Email address to send to
            'document_type': Type of document (BOL, Invoice, POD, etc.)
            'shipment_id': Optional shipment reference
            'due_date': Optional due date for document
        }

    Returns:
        {
            'status': 'sent',
            'message_id': str,
            'sent_at': timestamp,
            'document_type': str
        }
    """
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    recipient = params['recipient_email']
    doc_type = params.get('document_type', 'BOL')
    shipment_id = params.get('shipment_id', 'N/A')
    due_date = params.get('due_date', 'ASAP')

    # Gmail SMTP settings
    smtp_server = 'smtp.gmail.com'
    smtp_port = 587
    sender_email = os.getenv('GMAIL_ADDRESS') or os.getenv('GMAIL_USER')
    sender_password = os.getenv('GMAIL_APP_PASSWORD')

    if not sender_email or not sender_password:
        raise ValueError("Gmail credentials not configured in environment variables")

    # Create message
    msg = MIMEMultipart('alternative')
    msg['From'] = sender_email
    msg['To'] = recipient
    msg['Subject'] = f'FourKites: {doc_type} Document Request - Shipment {shipment_id}'

    # HTML email body
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #0066cc;">📄 Document Request - {doc_type}</h2>

          <p>Hello,</p>

          <p>We need the <strong>{doc_type}</strong> document for shipment <strong>{shipment_id}</strong>.</p>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Document Details:</h3>
            <ul>
              <li><strong>Document Type:</strong> {doc_type}</li>
              <li><strong>Shipment ID:</strong> {shipment_id}</li>
              <li><strong>Due Date:</strong> {due_date}</li>
            </ul>
          </div>

          <p><strong>Please reply to this email with the {doc_type} document attached as PDF.</strong></p>

          <p style="font-size: 12px; color: #666; margin-top: 30px;">
            This is an automated message from FourKites Document Processing System.<br>
            Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 11px; color: #999;">
            FourKites Inc. | Supply Chain Visibility Platform
          </p>
        </div>
      </body>
    </html>
    """

    msg.attach(MIMEText(html_content, 'html'))

    # Send email
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()

        message_id = f"msg-{datetime.now().timestamp()}"

        logger.info(f"Document request email sent to {recipient} for {doc_type}")

        return {
            'status': 'sent',
            'message_id': message_id,
            'sent_to': recipient,
            'sent_at': datetime.now().isoformat(),
            'document_type': doc_type,
            'shipment_id': shipment_id,
            'action_count': 1
        }
    except Exception as e:
        logger.error(f"Failed to send document request email: {str(e)}")
        raise


@activity.defn
async def extract_document_from_email(params: dict):
    """
    Fetch email reply and extract PDF attachment

    Args:
        params: {
            'from_email': Email address to check for replies
            'subject_filter': Subject text to filter (e.g., 'Re:')
            'since_hours': How many hours back to search (default: 1)
        }

    Returns:
        {
            'status': 'found' or 'not_found',
            'pdf_base64': Base64 encoded PDF content (if found),
            'pdf_filename': Original filename,
            'received_at': timestamp
        }
    """
    from_email = params.get('from_email', 'msp.raja@fourkites.com')
    subject_filter = params.get('subject_filter', 'Re:')
    since_hours = params.get('since_hours', 1)

    # Gmail IMAP settings
    imap_server = 'imap.gmail.com'
    email_user = os.getenv('GMAIL_ADDRESS') or os.getenv('GMAIL_USER')
    email_password = os.getenv('GMAIL_APP_PASSWORD')

    if not email_user or not email_password:
        raise ValueError("Gmail credentials not configured")

    try:
        # Connect to Gmail IMAP
        mail = imaplib.IMAP4_SSL(imap_server)
        mail.login(email_user, email_password)
        mail.select('inbox')

        # Search for recent emails
        from datetime import timedelta
        since_date = (datetime.now() - timedelta(hours=since_hours)).strftime('%d-%b-%Y')
        search_criteria = f'(SINCE {since_date} FROM "{from_email}" SUBJECT "{subject_filter}")'

        _, message_numbers = mail.search(None, search_criteria)

        if not message_numbers[0]:
            logger.warning(f"No email found from {from_email} with subject filter '{subject_filter}'")
            return {
                'status': 'not_found',
                'message': f'No email with PDF attachment found from {from_email}',
                'action_count': 1
            }

        # Get the most recent email
        latest_email_id = message_numbers[0].split()[-1]
        _, msg_data = mail.fetch(latest_email_id, '(RFC822)')

        email_body = msg_data[0][1]
        message = email.message_from_bytes(email_body)

        # Extract PDF attachment
        pdf_data = None
        pdf_filename = None

        for part in message.walk():
            if part.get_content_maintype() == 'multipart':
                continue
            if part.get('Content-Disposition') is None:
                continue

            filename = part.get_filename()
            if filename and filename.lower().endswith('.pdf'):
                pdf_data = part.get_payload(decode=True)
                pdf_filename = filename
                break

        mail.close()
        mail.logout()

        if pdf_data:
            pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
            logger.info(f"PDF attachment '{pdf_filename}' extracted from email")

            return {
                'status': 'found',
                'pdf_base64': pdf_base64,
                'pdf_filename': pdf_filename,
                'received_at': datetime.now().isoformat(),
                'from_email': from_email,
                'action_count': 1
            }
        else:
            return {
                'status': 'not_found',
                'message': 'Email found but no PDF attachment',
                'action_count': 1
            }

    except Exception as e:
        logger.error(f"Failed to extract document from email: {str(e)}")
        raise


@activity.defn
async def extract_data_from_pdf(params: dict):
    """
    Use AI (Anthropic Claude) to extract structured data from PDF

    Args:
        params: {
            'pdf_base64': Base64 encoded PDF content,
            'document_type': Type of document (BOL, Invoice, etc.),
            'extraction_schema': Optional dict defining what fields to extract,
            'pdf_format_hint': Optional string describing PDF format/structure
        }

    Returns:
        {
            'status': 'extracted',
            'extracted_data': dict with all extracted fields,
            'confidence': 'High'/'Medium'/'Low',
            'extraction_method': 'ai_anthropic'
        }
    """
    pdf_base64 = params.get('pdf_base64')
    doc_type = params.get('document_type', 'BOL')
    custom_schema = params.get('extraction_schema')
    format_hint = params.get('pdf_format_hint', '')

    if not pdf_base64:
        raise ValueError("No PDF data provided")

    # Initialize Anthropic client
    anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
    if not anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY not configured")

    anthropic = Anthropic(api_key=anthropic_api_key)

    # If custom schema provided, use it
    if custom_schema and isinstance(custom_schema, dict):
        import json
        schema_json = json.dumps(custom_schema, indent=2)
        extraction_prompt = f"""
        Analyze this {doc_type} document and extract the following fields in JSON format:

        {schema_json}

        {"Document format: " + format_hint if format_hint else ""}

        Return ONLY valid JSON matching the schema above. Extract all fields from the document.
        If a field is not present or cannot be determined, use null.
        """
    # Define extraction schema based on document type
    elif doc_type == 'BOL':
        extraction_prompt = """
        Analyze this Bill of Lading (BOL) document and extract the following information in JSON format:

        {
          "bol_number": "BOL reference number",
          "shipper_name": "Shipper company name",
          "shipper_address": "Full shipper address",
          "consignee_name": "Consignee company name",
          "consignee_address": "Full consignee address",
          "carrier_name": "Carrier/trucking company name",
          "pickup_date": "Pickup date (YYYY-MM-DD)",
          "delivery_date": "Expected delivery date (YYYY-MM-DD)",
          "origin": "Origin location",
          "destination": "Destination location",
          "items": [
            {
              "description": "Item description",
              "quantity": "Number of units",
              "weight": "Weight with unit",
              "dimensions": "Dimensions if available"
            }
          ],
          "total_weight": "Total weight",
          "special_instructions": "Any special handling instructions",
          "freight_charges": "Freight charges if mentioned"
        }

        Extract all available information. If a field is not present, use null.
        """
    elif doc_type == 'Invoice':
        extraction_prompt = """
        Analyze this Invoice document and extract the following information in JSON format:

        {
          "invoice_number": "Invoice number",
          "invoice_date": "Invoice date (YYYY-MM-DD)",
          "due_date": "Payment due date",
          "vendor_name": "Vendor/supplier name",
          "vendor_address": "Vendor address",
          "bill_to_name": "Bill to company name",
          "bill_to_address": "Bill to address",
          "line_items": [
            {
              "description": "Item description",
              "quantity": "Quantity",
              "unit_price": "Price per unit",
              "total": "Line total"
            }
          ],
          "subtotal": "Subtotal amount",
          "tax": "Tax amount",
          "total_amount": "Total amount due",
          "payment_terms": "Payment terms"
        }

        Extract all available information. If a field is not present, use null.
        """
    else:
        extraction_prompt = f"""
        Analyze this {doc_type} document and extract all relevant information in structured JSON format.
        Include fields that are typically found in this type of document.
        """

    try:
        # Call Anthropic API with PDF
        message = anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": "application/pdf",
                                "data": pdf_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": extraction_prompt
                        }
                    ]
                }
            ]
        )

        # Parse AI response
        extracted_text = message.content[0].text

        # Try to parse as JSON
        import json
        try:
            # Find JSON in the response
            json_start = extracted_text.find('{')
            json_end = extracted_text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = extracted_text[json_start:json_end]
                extracted_data = json.loads(json_str)
            else:
                extracted_data = {'raw_text': extracted_text}
        except json.JSONDecodeError:
            extracted_data = {'raw_text': extracted_text}

        logger.info(f"Successfully extracted data from {doc_type} document using AI")

        return {
            'status': 'extracted',
            'extracted_data': extracted_data,
            'confidence': 'High',
            'extraction_method': 'ai_anthropic',
            'document_type': doc_type,
            'extracted_at': datetime.now().isoformat(),
            'action_count': 1
        }

    except Exception as e:
        logger.error(f"Failed to extract data from PDF: {str(e)}")
        raise


@activity.defn
async def save_extraction_as_markdown(params: dict):
    """
    Save extracted data as markdown file in workflow output folder

    Args:
        params: {
            'extracted_data': dict with extracted information,
            'workflow_id': Workflow ID for folder naming,
            'document_type': Type of document,
            'pdf_filename': Original PDF filename
        }

    Returns:
        {
            'status': 'saved',
            'markdown_path': Path to saved file,
            'markdown_content': The markdown content
        }
    """
    extracted_data = params.get('extracted_data', {})
    workflow_id = params.get('workflow_id', 'unknown')
    doc_type = params.get('document_type', 'Document')
    pdf_filename = params.get('pdf_filename', 'document.pdf')

    # Create output directory
    output_dir = f'/Users/msp.raja/temporal-project/workflow_outputs/{workflow_id}'
    os.makedirs(output_dir, exist_ok=True)

    # Generate markdown content
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    markdown_content = f"""# {doc_type} Extraction Results

**Workflow ID:** {workflow_id}
**Source Document:** {pdf_filename}
**Extracted At:** {timestamp}
**Extraction Method:** AI-Powered (Anthropic Claude)

---

## Extracted Data

"""

    # Format extracted data as markdown
    def format_value(value, indent=0):
        indent_str = '  ' * indent
        if isinstance(value, dict):
            lines = []
            for k, v in value.items():
                key_formatted = k.replace('_', ' ').title()
                if isinstance(v, (dict, list)):
                    lines.append(f"{indent_str}**{key_formatted}:**")
                    lines.append(format_value(v, indent + 1))
                else:
                    lines.append(f"{indent_str}**{key_formatted}:** {v}")
            return '\n'.join(lines)
        elif isinstance(value, list):
            lines = []
            for i, item in enumerate(value, 1):
                lines.append(f"{indent_str}{i}. {format_value(item, indent + 1)}")
            return '\n'.join(lines)
        else:
            return str(value)

    markdown_content += format_value(extracted_data)

    markdown_content += f"""

---

## Raw JSON Data

```json
{json.dumps(extracted_data, indent=2)}
```

---

*Generated by FourKites Document Extraction Workflow*
"""

    # Save markdown file
    markdown_filename = f'{doc_type.lower()}_extraction_{datetime.now().strftime("%Y%m%d_%H%M%S")}.md'
    markdown_path = os.path.join(output_dir, markdown_filename)

    with open(markdown_path, 'w') as f:
        f.write(markdown_content)

    logger.info(f"Extraction results saved to {markdown_path}")

    return {
        'status': 'saved',
        'markdown_path': markdown_path,
        'markdown_filename': markdown_filename,
        'markdown_content': markdown_content,
        'output_directory': output_dir,
        'action_count': 1
    }
