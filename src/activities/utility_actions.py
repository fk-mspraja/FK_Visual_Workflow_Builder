"""
Utility Activities for Workflows
Provides logging and general utility functions
"""
from temporalio import activity
from datetime import datetime
import json


@activity.defn
async def log_activity(params: dict) -> dict:
    """
    Log activity execution with metadata

    Args:
        params: {
            "log_level": str (info, warning, error),
            "message": str,
            "metadata": str or dict
        }

    Returns:
        dict with status and logged information
    """
    log_level = params.get("log_level", "info").upper()
    message = params.get("message", "No message provided")
    metadata = params.get("metadata", {})

    # Parse metadata if it's a string
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except:
            pass  # Keep as string if not JSON

    timestamp = datetime.now().isoformat()

    # Log using activity logger
    log_entry = f"[{timestamp}] {message}"

    if log_level == "INFO":
        activity.logger.info(log_entry)
    elif log_level == "WARNING":
        activity.logger.warning(log_entry)
    elif log_level == "ERROR":
        activity.logger.error(log_entry)
    else:
        activity.logger.info(log_entry)

    if metadata:
        activity.logger.info(f"Metadata: {json.dumps(metadata, indent=2)}")

    return {
        "status": "logged",
        "log_level": log_level,
        "message": message,
        "timestamp": timestamp,
        "metadata": metadata
    }


@activity.defn
async def log_workflow_action(params: dict) -> dict:
    """
    Legacy alias for log_activity
    """
    return await log_activity(params)
