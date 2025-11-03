"""
Enhanced Dynamic Workflow Executor for Visual Workflow Builder
Supports conditional routing based on activity results (e.g., email parsing completeness)
"""
import asyncio
from datetime import timedelta
from typing import Any, Dict, List, Optional
from temporalio import workflow
from temporalio.common import RetryPolicy


class WorkflowState:
    """Maintains state during workflow execution"""

    def __init__(self):
        self.node_results: Dict[str, Any] = {}
        self.execution_path: List[str] = []  # Track which nodes were executed

    def set_node_result(self, node_id: str, result: Any):
        """Store result of a node execution"""
        self.node_results[node_id] = result
        self.execution_path.append(node_id)

    def get_node_result(self, node_id: str) -> Any:
        """Get result of a node"""
        return self.node_results.get(node_id)


def get_node_by_id(nodes: List[Dict], node_id: str) -> Optional[Dict]:
    """Get node by ID"""
    for node in nodes:
        if node.get("id") == node_id:
            return node
    return None


def get_outgoing_edges(edges: List[Dict], source_id: str, edge_label: Optional[str] = None) -> List[Dict]:
    """Get all edges going out from a source node, optionally filtered by label"""
    outgoing = []
    for edge in edges:
        if edge.get("source") == source_id:
            if edge_label is None or edge.get("label") == edge_label:
                outgoing.append(edge)
    return outgoing


@workflow.defn
class VisualWorkflowExecutor:
    """
    Dynamic workflow executor for visual workflows built with React Flow
    Supports conditional branching based on activity results
    """

    def __init__(self):
        self.state = WorkflowState()

    @workflow.query
    def get_state(self) -> Dict[str, Any]:
        """Query current workflow state"""
        return {
            "node_results": self.state.node_results,
            "execution_path": self.state.execution_path
        }

    @workflow.run
    async def run(self, workflow_data: Dict[str, Any]) -> Any:
        """
        Execute a workflow from visual builder JSON definition

        Args:
            workflow_data: JSON workflow definition with nodes and edges

        Returns:
            Final workflow result with execution state
        """
        workflow.logger.info(f"Starting visual workflow execution")

        nodes = workflow_data.get("nodes", [])
        edges = workflow_data.get("edges", [])

        if not nodes:
            raise ValueError("Workflow has no nodes")

        # Find start node (first action node or trigger)
        current_node_id = nodes[0].get("id") if nodes else None

        if not current_node_id:
            raise ValueError("Workflow has no start node")

        # Execute nodes
        while current_node_id:
            node = get_node_by_id(nodes, current_node_id)
            if not node:
                workflow.logger.warning(f"Node not found: {current_node_id}, ending workflow")
                break

            node_label = node.get("label", node.get("id"))
            workflow.logger.info(f"Executing node: {node_label} (ID: {current_node_id})")

            # Execute node and get result
            try:
                result = await self._execute_node(node)
                self.state.set_node_result(current_node_id, result)
                workflow.logger.info(f"Node {node_label} completed successfully")
            except Exception as e:
                workflow.logger.error(f"Node {node_label} failed: {str(e)}")
                self.state.set_node_result(current_node_id, {"error": str(e), "status": "failed"})
                # Continue to next node or fail based on error handling policy
                raise

            # Determine next node based on edges and result
            current_node_id = await self._get_next_node(current_node_id, result, edges, nodes)

        workflow.logger.info(f"Workflow completed. Execution path: {' → '.join(self.state.execution_path)}")

        return {
            "status": "completed",
            "execution_path": self.state.execution_path,
            "final_results": self.state.node_results
        }

    async def _execute_node(self, node: Dict[str, Any]) -> Any:
        """Execute a single node"""
        activity_name = node.get("activity")
        params = node.get("params", {}).copy()  # Make a copy to avoid mutating template

        if not activity_name:
            workflow.logger.warning(f"Node {node.get('id')} has no activity, skipping")
            return {"status": "skipped"}

        # Auto-populate parameters from previous node results
        # This allows data to flow between activities automatically
        if self.state.execution_path:
            last_node_id = self.state.execution_path[-1] if self.state.execution_path else None
            if last_node_id and last_node_id in self.state.node_results:
                previous_result = self.state.node_results[last_node_id]
                if isinstance(previous_result, dict):
                    # Special handling for document extraction workflow
                    if activity_name == 'extract_data_from_pdf' and 'pdf_base64' in previous_result:
                        # Auto-fill pdf_base64 from previous extract_document_from_email activity
                        params['pdf_base64'] = previous_result['pdf_base64']
                        workflow.logger.info(f"Auto-filled pdf_base64 from previous node: {last_node_id}")

                    # Auto-fill workflow_id and extracted_data for save_extraction_as_markdown
                    if activity_name == 'save_extraction_as_markdown':
                        if 'extracted_data' in previous_result:
                            params['extracted_data'] = previous_result['extracted_data']
                            workflow.logger.info(f"Auto-filled extracted_data from previous node: {last_node_id}")
                        if 'workflow_id' not in params:
                            params['workflow_id'] = workflow.info().workflow_id
                            workflow.logger.info(f"Auto-filled workflow_id: {params['workflow_id']}")

        # Activity execution options
        activity_options = {
            "start_to_close_timeout": timedelta(seconds=120),
            "retry_policy": RetryPolicy(
                maximum_attempts=3,
                initial_interval=timedelta(seconds=1),
                maximum_interval=timedelta(seconds=10),
            ),
        }

        # Special handling for wait_for_duration
        if activity_name == "wait_for_duration":
            # Ensure duration is an integer (may come as string from UI)
            duration = params.get("duration", 30)
            if isinstance(duration, str):
                try:
                    duration = int(duration)
                except ValueError:
                    workflow.logger.warning(f"Invalid duration '{duration}', defaulting to 30")
                    duration = 30

            unit = params.get("unit", "seconds")

            # Convert to seconds
            if unit == "minutes":
                wait_seconds = duration * 60
            elif unit == "hours":
                wait_seconds = duration * 3600
            elif unit == "days":
                wait_seconds = duration * 86400
            else:  # seconds
                wait_seconds = duration

            # Ensure non-negative sleep duration
            if wait_seconds < 0:
                workflow.logger.warning(f"Negative sleep duration {wait_seconds}, defaulting to 0")
                wait_seconds = 0

            workflow.logger.info(f"Waiting for {wait_seconds} seconds...")
            if wait_seconds > 0:
                await workflow.sleep(wait_seconds)
            return {"status": "completed", "waited_seconds": wait_seconds}

        # Execute activity
        workflow.logger.info(f"Executing activity: {activity_name}")
        try:
            result = await workflow.execute_activity(
                activity_name,
                params,
                **activity_options,
            )
            return result
        except Exception as e:
            workflow.logger.error(f"Activity {activity_name} failed: {str(e)}")
            raise

    async def _get_next_node(
        self,
        current_node_id: str,
        current_result: Any,
        edges: List[Dict],
        nodes: List[Dict]
    ) -> Optional[str]:
        """
        Determine the next node to execute based on current result and edges
        Supports conditional routing based on activity results
        """
        # Get all outgoing edges from current node
        outgoing_edges = get_outgoing_edges(edges, current_node_id)

        if not outgoing_edges:
            workflow.logger.info(f"No outgoing edges from {current_node_id}, workflow ending")
            return None

        # If there's only one edge, follow it
        if len(outgoing_edges) == 1:
            return outgoing_edges[0].get("target")

        # Multiple edges - need to determine which path to take based on result
        # Check if current result has routing information
        if isinstance(current_result, dict):
            # Check for completeness field (email parsing)
            completeness = current_result.get("completeness")
            is_gibberish = current_result.get("is_gibberish", False)

            if completeness:
                workflow.logger.info(f"Routing based on completeness: {completeness}, is_gibberish: {is_gibberish}")

                # Map completeness to edge labels
                # If gibberish or incomplete, route to escalation
                if completeness == "complete" and not is_gibberish:
                    route_edges = get_outgoing_edges(edges, current_node_id, "complete")
                elif completeness == "partial" and not is_gibberish:
                    route_edges = get_outgoing_edges(edges, current_node_id, "partial")
                else:  # incomplete or gibberish
                    # Try to find edge with label "incomplete/gibberish" or just "incomplete" or "gibberish"
                    route_edges = get_outgoing_edges(edges, current_node_id, "incomplete/gibberish")
                    if not route_edges:
                        route_edges = get_outgoing_edges(edges, current_node_id, "incomplete")
                    if not route_edges:
                        route_edges = get_outgoing_edges(edges, current_node_id, "gibberish")

                if route_edges:
                    next_node_id = route_edges[0].get("target")
                    workflow.logger.info(f"Taking '{completeness}' path to node {next_node_id}")
                    return next_node_id
                else:
                    workflow.logger.warning(f"No matching edge found for completeness='{completeness}', is_gibberish={is_gibberish}, falling through to default")

            # Check for status field
            status = current_result.get("status")
            if status:
                workflow.logger.info(f"Routing based on status: {status}")

                # Try to find edge with matching label
                for edge in outgoing_edges:
                    if edge.get("label") == status:
                        next_node_id = edge.get("target")
                        workflow.logger.info(f"Taking '{status}' path to node {next_node_id}")
                        return next_node_id

        # Default: take first edge (no label or no match)
        default_edge = outgoing_edges[0]
        next_node_id = default_edge.get("target")
        workflow.logger.info(f"Taking default path to node {next_node_id}")
        return next_node_id
