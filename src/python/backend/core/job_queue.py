"""
Job queue manager for the backend.
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Callable, Dict, Optional

from ..config.settings import settings
from .database import db_manager
from .models import Job


class JobQueueManager:
    """Job queue manager for handling background tasks."""

    def __init__(self):
        self.config = settings.get_config()
        self.logger = logging.getLogger(__name__)
        self._queue = asyncio.Queue()
        self._workers = []
        self._is_running = False

    async def initialize(self):
        """Initialize job queue manager."""
        try:
            self._is_running = True
            # Start worker tasks
            for _ in range(self.config.num_workers):
                worker = asyncio.create_task(self._worker_loop())
                self._workers.append(worker)
            self.logger.info("Job queue manager initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize job queue manager: {e}")
            raise

    async def shutdown(self):
        """Shutdown job queue manager."""
        self._is_running = False
        # Wait for all workers to complete
        if self._workers:
            await asyncio.gather(*self._workers)
        self.logger.info("Job queue manager shut down")

    async def _worker_loop(self):
        """Worker loop for processing jobs."""
        while self._is_running:
            try:
                job_data = await self._queue.get()
                await self._process_job(job_data)
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Worker error: {e}")
            finally:
                self._queue.task_done()

    async def _process_job(self, job_data: Dict[str, Any]):
        """Process a single job."""
        job_id = job_data["job_id"]
        job_type = job_data["job_type"]
        parameters = job_data["parameters"]
        user_id = job_data["user_id"]

        try:
            # Update job status to running
            with db_manager.get_session() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job:
                    job.status = "running"
                    job.started_at = datetime.utcnow()
                    session.commit()

            # Get job handler
            handler = self._get_job_handler(job_type)
            if not handler:
                raise ValueError(f"No handler found for job type: {job_type}")

            # Execute job
            result = await handler(parameters)

            # Update job status to completed
            with db_manager.get_session() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job:
                    job.status = "completed"
                    job.result = result
                    job.completed_at = datetime.utcnow()
                    session.commit()

        except Exception as e:
            self.logger.error(f"Job processing error: {e}")
            # Update job status to failed
            with db_manager.get_session() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job:
                    job.status = "failed"
                    job.error = str(e)
                    job.completed_at = datetime.utcnow()
                    session.commit()

    def _get_job_handler(self, job_type: str) -> Optional[Callable]:
        """Get handler function for job type."""
        handlers = {
            "train_model": self._handle_train_model,
            "evaluate_model": self._handle_evaluate_model,
            "predict": self._handle_predict,
            "optimize_model": self._handle_optimize_model,
            "process_dataset": self._handle_process_dataset,
            "export_model": self._handle_export_model,
            "import_model": self._handle_import_model,
            "delete_model": self._handle_delete_model,
            "delete_dataset": self._handle_delete_dataset,
            "cleanup": self._handle_cleanup,
        }
        return handlers.get(job_type)

    async def enqueue_job(
        self, job_type: str, parameters: Dict[str, Any], user_id: int
    ) -> int:
        """Enqueue a new job."""
        try:
            with db_manager.get_session() as session:
                job = Job(
                    job_type=job_type,
                    status="pending",
                    parameters=parameters,
                    user_id=user_id,
                )
                session.add(job)
                session.commit()
                session.refresh(job)

            await self._queue.put(
                {
                    "job_id": job.id,
                    "job_type": job_type,
                    "parameters": parameters,
                    "user_id": user_id,
                }
            )

            return job.id

        except Exception as e:
            self.logger.error(f"Failed to enqueue job: {e}")
            raise

    async def get_job_status(self, job_id: int) -> Optional[Dict[str, Any]]:
        """Get status of a job."""
        try:
            with db_manager.get_session() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job:
                    return {
                        "id": job.id,
                        "type": job.job_type,
                        "status": job.status,
                        "parameters": job.parameters,
                        "result": job.result,
                        "error": job.error,
                        "created_at": job.created_at,
                        "started_at": job.started_at,
                        "completed_at": job.completed_at,
                    }
            return None
        except Exception as e:
            self.logger.error(f"Failed to get job status: {e}")
            return None

    async def cancel_job(self, job_id: int) -> bool:
        """Cancel a pending job."""
        try:
            with db_manager.get_session() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job and job.status == "pending":
                    job.status = "cancelled"
                    job.completed_at = datetime.utcnow()
                    session.commit()
                    return True
            return False
        except Exception as e:
            self.logger.error(f"Failed to cancel job: {e}")
            return False

    # Job handlers
    async def _handle_train_model(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle model training job."""
        # Implementation depends on your training logic

    async def _handle_evaluate_model(
        self, parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle model evaluation job."""
        # Implementation depends on your evaluation logic

    async def _handle_predict(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle prediction job."""
        # Implementation depends on your prediction logic

    async def _handle_optimize_model(
        self, parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle model optimization job."""
        # Implementation depends on your optimization logic

    async def _handle_process_dataset(
        self, parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle dataset processing job."""
        # Implementation depends on your dataset processing logic

    async def _handle_export_model(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle model export job."""
        # Implementation depends on your export logic

    async def _handle_import_model(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle model import job."""
        # Implementation depends on your import logic

    async def _handle_delete_model(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle model deletion job."""
        # Implementation depends on your deletion logic

    async def _handle_delete_dataset(
        self, parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle dataset deletion job."""
        # Implementation depends on your deletion logic

    async def _handle_cleanup(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle cleanup job."""
        # Implementation depends on your cleanup logic


# Create global job queue manager instance
job_queue_manager = JobQueueManager()
