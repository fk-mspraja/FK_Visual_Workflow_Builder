"""
Test AI-powered Email Parsing with Different Response Types
Demonstrates Anthropic Claude's ability to detect completeness and gibberish
"""
import asyncio
from src.activities.gmail_inbox_actions import extract_delivery_info_ai


async def test_email_scenarios():
    """Test different email response scenarios"""

    print("=" * 80)
    print("🤖 AI-Powered Email Parsing Test - Using Anthropic Claude")
    print("=" * 80)
    print()

    scenarios = [
        {
            "name": "Complete Response",
            "email": """
            Thanks for your email. Here's the delivery information you requested:

            Tracking Number: FDX987654321ABC
            Delivery Date: November 15, 2024
            Status: On Schedule
            Current Location: Chicago Distribution Center, IL
            ETA: 2:30 PM CST

            Everything looks good and the shipment is on track.

            Best regards,
            John
            """,
            "expected": "complete"
        },
        {
            "name": "Partial Response (Missing Status)",
            "email": """
            Hi,

            Here's what I have:
            Tracking: UPS123456789
            Expected Delivery: Nov 20, 2024

            Let me know if you need anything else.

            Sarah
            """,
            "expected": "partial"
        },
        {
            "name": "Gibberish Response",
            "email": """
            asdfghjkl qwerty zxcvbnm
            lorem ipsum dolor sit amet
            random words that make no sense
            blah blah blah
            """,
            "expected": "incomplete (gibberish)"
        },
        {
            "name": "Empty/Non-informative Response",
            "email": """
            Hey,

            I'll get back to you on that.

            Thanks
            """,
            "expected": "incomplete"
        },
        {
            "name": "Delayed Shipment",
            "email": """
            Hi there,

            Unfortunately there's been a delay:

            Tracking: DHL789456123
            Original Delivery: Nov 10, 2024
            New Delivery Date: Nov 18, 2024
            Status: Delayed
            Location: Memphis Hub, TN

            Delay Reason: Weather conditions caused processing delays

            We apologize for the inconvenience.
            """,
            "expected": "complete (with delay)"
        }
    ]

    for i, scenario in enumerate(scenarios, 1):
        print(f"\n{'='*80}")
        print(f"Test Scenario {i}: {scenario['name']}")
        print(f"Expected Result: {scenario['expected']}")
        print(f"{'='*80}")
        print()
        print("📧 Email Content:")
        print(scenario['email'][:200] + "..." if len(scenario['email']) > 200 else scenario['email'])
        print()

        # Parse with AI
        result = extract_delivery_info_ai(scenario['email'])

        print("🤖 AI Analysis Results:")
        print(f"   Method: {result.get('extraction_method')}")
        print(f"   Completeness: {result.get('completeness')}")
        print(f"   Confidence: {result.get('confidence')}")
        print(f"   Is Gibberish: {result.get('is_gibberish')}")
        print()

        if result.get('reasoning'):
            print(f"   🧠 AI Reasoning: {result.get('reasoning')}")
            print()

        print("📦 Extracted Data:")
        if result.get('tracking_number'):
            print(f"   ✓ Tracking: {result.get('tracking_number')}")
        else:
            print(f"   ✗ Tracking: Not found")

        if result.get('delivery_date'):
            print(f"   ✓ Delivery Date: {result.get('delivery_date')}")
        else:
            print(f"   ✗ Delivery Date: Not found")

        if result.get('status'):
            print(f"   ✓ Status: {result.get('status')}")
        else:
            print(f"   ✗ Status: Not found")

        if result.get('location'):
            print(f"   ✓ Location: {result.get('location')}")
        else:
            print(f"   ✗ Location: Not found")

        print()

        if result.get('missing_fields'):
            print(f"   ❌ Missing Fields: {', '.join(result.get('missing_fields'))}")

        if result.get('has_delay'):
            print(f"   ⚠️  Delay Detected: {result.get('delay_reason', 'No reason specified')}")

        print()

        # Determine routing
        completeness = result.get('completeness')
        if completeness == 'complete':
            print("   ➡️  ROUTE: Path A (Complete) - Workflow ends successfully")
        elif completeness == 'partial':
            print("   ➡️  ROUTE: Path B (Partial) - Send follow-up email for missing fields")
        else:
            if result.get('is_gibberish'):
                print("   ➡️  ROUTE: Path C (Gibberish) - Escalate to human review")
            else:
                print("   ➡️  ROUTE: Path C (Incomplete) - Escalate due to insufficient information")

        print()
        await asyncio.sleep(1)  # Brief pause between tests

    print("=" * 80)
    print("✅ All test scenarios completed!")
    print()
    print("Summary:")
    print("  • AI can detect complete, partial, and gibberish responses")
    print("  • Intelligent routing based on completeness assessment")
    print("  • Extracts structured data from unstructured email text")
    print("  • Provides reasoning for its decisions")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(test_email_scenarios())
