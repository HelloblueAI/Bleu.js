from typing import Any, Dict

from celery import Celery

from ..config.settings import get_config

config = get_config()

celery_app = Celery(
    "bleujs",
    broker=config.celery.broker_url,
    backend=config.celery.result_backend,
    include=["bleujs.core.tasks"],
)

celery_app.conf.update(
    task_serializer=config.celery.task_serializer,
    result_serializer=config.celery.result_serializer,
    accept_content=config.celery.accept_content,
    task_ignore_result=config.celery.task_ignore_result,
    task_time_limit=config.celery.task_time_limit,
    task_soft_time_limit=config.celery.task_soft_time_limit,
    worker_max_tasks_per_child=config.celery.worker_max_tasks_per_child,
    worker_prefetch_multiplier=config.celery.worker_prefetch_multiplier,
)


async def enqueue_job(
    job_id: int,
    job_type: str,
    parameters: Dict[str, Any],
    user_id: int,
) -> None:
    """Enqueue a job for processing."""
    task_name = f"bleujs.core.tasks.process_{job_type}"
    celery_app.send_task(
        task_name,
        kwargs={
            "job_id": job_id,
            "parameters": parameters,
            "user_id": user_id,
        },
    )
