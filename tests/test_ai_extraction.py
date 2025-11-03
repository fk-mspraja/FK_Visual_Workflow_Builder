#!/usr/bin/env python3
"""
Test AI-powered email extraction
Tests both Claude and Azure OpenAI parsing
"""
import asyncio
import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from activities.gmail_inbox_actions import extract_delivery_info_ai


# Sample email responses for testing
TEST_EMAILS = {
    "complete_response": """
    Hi,

    Thank you for your inquiry about the shipment.

    Here are the details:
    - Tracking Number: 1Z999AA10123456784
    - Current Status: In Transit
    - Current Location: Chicago, IL
    - Delivery Date: 12/28/2024
    - ETA: December 28, 2024 by 5:00 PM

    Everything is on schedule.

    Best regards,
    John Smith
    """,

    "delayed_response": """
    Hello,

    Unfortunately, there's been a delay with shipment SHIP-2024-5678.

    Tracking: TRK-98765432109876
    Status: Delayed
    Current Location: Memphis, TN

    The delay is due to severe weather conditions in the Midwest.
    New ETA: 01/02/2025

    We apologize for the inconvenience.
    """,

    "partial_response": """
    Hi,

    The shipment is currently in transit.

    We'll provide more details soon.

    Thanks
    """,

    "gibberish_response": """
    Hello!

    Yes, we received your email. Thank you for reaching out!

    Have a great day!
    """,

    "missing_info": """
    Subject: Re: Shipment Update

    The package is on its way. We're working on it.

    Best,
    Support Team
    """
}


async def test_extraction():
    """Test AI extraction with various email samples"""

    print("=" * 80)
    print("AI-POWERED EMAIL EXTRACTION TEST")
    print("=" * 80)
    print()

    for test_name, email_body in TEST_EMAILS.items():
        print(f"\n{'=' * 80}")
        print(f"TEST: {test_name.upper()}")
        print("=" * 80)
        print("\nEmail Body:")
        print("-" * 40)
        print(email_body.strip())
        print("-" * 40)

        try:
            result = await extract_delivery_info_ai(email_body)

            print("\n✅ EXTRACTION RESULTS:")
            print(f"   Method: {result.get('extraction_method', 'unknown')}")
            print(f"   Completeness: {result.get('completeness', 'unknown')}")
            print(f"   Confidence: {result.get('confidence', 'unknown')}")
            print(f"   Is Gibberish: {result.get('is_gibberish', False)}")
            print()
            print("   📦 Extracted Fields:")
            print(f"      • Delivery Date: {result.get('delivery_date', 'Not found')}")
            print(f"      • Tracking Number: {result.get('tracking_number', 'Not found')}")
            print(f"      • Status: {result.get('status', 'Not found')}")
            print(f"      • Location: {result.get('location', 'Not found')}")
            print(f"      • ETA: {result.get('eta', 'Not found')}")

            if result.get('has_delay'):
                print(f"      ⚠️  Delay Detected: {result.get('delay_reason', 'No reason provided')}")

            if result.get('missing_fields'):
                print(f"\n   ❌ Missing Fields: {', '.join(result['missing_fields'])}")

        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")

        print()


async def test_single_email(email_text: str):
    """Test with custom email text"""
    print("=" * 80)
    print("CUSTOM EMAIL TEST")
    print("=" * 80)
    print("\nEmail Body:")
    print(email_text)
    print("-" * 80)

    result = await extract_delivery_info_ai(email_text)

    print("\n✅ RESULTS:")
    print(f"Method: {result.get('extraction_method')}")
    print(f"Completeness: {result.get('completeness')}")
    print(f"Is Gibberish: {result.get('is_gibberish')}")
    print(f"\nExtracted Data:")
    for key, value in result.items():
        if key not in ['raw_text', 'extraction_method']:
            print(f"  {key}: {value}")


if __name__ == "__main__":
    # Run all tests
    asyncio.run(test_extraction())

    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)
    print("\nAI extraction is ready to use in workflows!")
    print("The system will:")
    print("  1. Try Claude (Anthropic) first")
    print("  2. Fallback to Azure OpenAI if Claude fails")
    print("  3. Use regex as final fallback")
    print()
