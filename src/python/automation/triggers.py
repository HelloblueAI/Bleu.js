"""
Specialized event triggers for the automation pipeline.
"""

import asyncio
import os
from datetime import datetime
from typing import Callable, Dict, List, Optional

import aiocron
from aiohttp import web
from prometheus_client import Counter
from sqlalchemy import create_engine, text
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


class FileSystemTrigger(FileSystemEventHandler):
    """File system event trigger."""

    def __init__(
        self,
        path: str,
        patterns: List[str] = None,
        ignore_patterns: List[str] = None,
        handler: Optional[Callable] = None,
        cooldown: int = 0,
    ):
        super().__init__()
        self.path = path
        self.patterns = patterns or ["*"]
        self.ignore_patterns = ignore_patterns or []
        self.handler = handler
        self.cooldown = cooldown
        self.last_triggered = None
        self.observer = Observer()

        # Metrics
        self.event_counter = Counter(
            "filesystem_events_total",
            "Number of file system events",
            ["event_type", "pattern"],
        )

    def start(self) -> None:
        """Start monitoring file system events."""
        self.observer.schedule(self, self.path, recursive=True)
        self.observer.start()

    def stop(self) -> None:
        """Stop monitoring file system events."""
        self.observer.stop()
        self.observer.join()

    async def on_created(self, event) -> None:
        """Handle file creation event."""
        if self._should_handle_event(event.src_path, "created"):
            await self._handle_event(event.src_path, "created")

    async def on_modified(self, event) -> None:
        """Handle file modification event."""
        if self._should_handle_event(event.src_path, "modified"):
            await self._handle_event(event.src_path, "modified")

    async def on_deleted(self, event) -> None:
        """Handle file deletion event."""
        if self._should_handle_event(event.src_path, "deleted"):
            await self._handle_event(event.src_path, "deleted")

    def _should_handle_event(self, path: str, event_type: str) -> bool:
        """Check if event should be handled."""
        # Check cooldown
        if (
            self.last_triggered
            and (datetime.now() - self.last_triggered).total_seconds() < self.cooldown
        ):
            return False

        # Check patterns
        filename = os.path.basename(path)
        if not any(
            filename.endswith(pattern.replace("*", "")) for pattern in self.patterns
        ):
            return False

        if any(
            filename.endswith(pattern.replace("*", ""))
            for pattern in self.ignore_patterns
        ):
            return False

        return True

    async def _handle_event(self, path: str, event_type: str) -> None:
        """Handle file system event."""
        self.last_triggered = datetime.now()
        self.event_counter.labels(
            event_type=event_type, pattern=os.path.splitext(path)[1]
        ).inc()

        if self.handler:
            await self.handler(
                {
                    "event_type": event_type,
                    "path": path,
                    "timestamp": datetime.now().isoformat(),
                }
            )


class ScheduledTrigger:
    """Time-based scheduled trigger."""

    def __init__(
        self, schedule: str, handler: Optional[Callable] = None, timezone: str = "UTC"
    ):
        self.schedule = schedule
        self.handler = handler
        self.timezone = timezone
        self.cron = aiocron.crontab(schedule, func=self._handle_schedule)

        # Metrics
        self.schedule_counter = Counter(
            "scheduled_executions_total", "Number of scheduled executions", ["schedule"]
        )

    async def _handle_schedule(self) -> None:
        """Handle scheduled execution."""
        self.schedule_counter.labels(schedule=self.schedule).inc()

        if self.handler:
            await self.handler(
                {
                    "schedule": self.schedule,
                    "timestamp": datetime.now().isoformat(),
                    "timezone": self.timezone,
                }
            )


class DatabaseTrigger:
    """Database change event trigger."""

    def __init__(
        self,
        connection_string: str,
        query: str,
        interval: int = 60,
        handler: Optional[Callable] = None,
    ):
        self.engine = create_engine(connection_string)
        self.query = query
        self.interval = interval
        self.handler = handler
        self.last_result = None
        self._running = False

        # Metrics
        self.change_counter = Counter(
            "database_changes_total", "Number of database changes detected", ["query"]
        )

    async def start(self) -> None:
        """Start monitoring database changes."""
        self._running = True
        while self._running:
            try:
                await self._check_changes()
                await asyncio.sleep(self.interval)
            except Exception as e:
                print(f"Error monitoring database: {str(e)}")
                await asyncio.sleep(self.interval * 2)

    def stop(self) -> None:
        """Stop monitoring database changes."""
        self._running = False

    async def _check_changes(self) -> None:
        """Check for database changes."""
        async with self.engine.connect() as conn:
            result = await conn.execute(text(self.query))
            current_result = await result.fetchall()

            if self.last_result is not None and current_result != self.last_result:
                self.change_counter.labels(query=self.query).inc()

                if self.handler:
                    await self.handler(
                        {
                            "query": self.query,
                            "previous": self.last_result,
                            "current": current_result,
                            "timestamp": datetime.now().isoformat(),
                        }
                    )

            self.last_result = current_result


class WebhookTrigger:
    """HTTP webhook event trigger."""

    def __init__(
        self,
        path: str,
        port: int = 8000,
        methods: List[str] = None,
        handler: Optional[Callable] = None,
        auth_key: Optional[str] = None,
    ):
        self.path = path
        self.port = port
        self.methods = methods or ["POST"]
        self.handler = handler
        self.auth_key = auth_key
        self.app: Optional[web.Application] = None

        # Metrics
        self.webhook_counter = Counter(
            "webhook_calls_total",
            "Number of webhook calls",
            ["path", "method", "status"],
        )

    async def start(self) -> None:
        """Start webhook server."""
        app = web.Application()
        app.router.add_route("*", self.path, self._handle_webhook)

        self.app = app
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "localhost", self.port)
        await site.start()

    async def _handle_webhook(self, request: web.Request) -> web.Response:
        """Handle incoming webhook."""
        # Validate method
        if request.method not in self.methods:
            self.webhook_counter.labels(
                path=self.path, method=request.method, status="method_not_allowed"
            ).inc()
            return web.Response(status=405)

        # Validate auth
        if self.auth_key:
            auth_header = request.headers.get("Authorization")
            if not auth_header or auth_header != f"Bearer {self.auth_key}":
                self.webhook_counter.labels(
                    path=self.path, method=request.method, status="unauthorized"
                ).inc()
                return web.Response(status=401)

        try:
            # Parse payload
            payload = await request.json()

            # Handle webhook
            if self.handler:
                await self.handler(
                    {
                        "method": request.method,
                        "path": self.path,
                        "headers": dict(request.headers),
                        "payload": payload,
                        "timestamp": datetime.now().isoformat(),
                    }
                )

            self.webhook_counter.labels(
                path=self.path, method=request.method, status="success"
            ).inc()
            return web.Response(status=200)

        except Exception as e:
            self.webhook_counter.labels(
                path=self.path, method=request.method, status="error"
            ).inc()
            return web.Response(status=500, text=str(e))


class MessageQueueTrigger:
    """Message queue event trigger."""

    def __init__(
        self,
        queue_url: str,
        queue_type: str = "rabbitmq",
        handler: Optional[Callable] = None,
        credentials: Optional[Dict] = None,
    ):
        self.queue_url = queue_url
        self.queue_type = queue_type
        self.handler = handler
        self.credentials = credentials or {}
        self.connection = None
        self._running = False

        # Metrics
        self.message_counter = Counter(
            "queue_messages_total",
            "Number of queue messages processed",
            ["queue_type", "status"],
        )

    async def start(self) -> None:
        """Start consuming messages."""
        self._running = True

        if self.queue_type == "rabbitmq":
            import aio_pika

            # Connect to RabbitMQ
            self.connection = await aio_pika.connect_robust(
                self.queue_url, **self.credentials
            )

            # Start consuming
            async with self.connection:
                channel = await self.connection.channel()
                queue = await channel.declare_queue("events")

                async with queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        if not self._running:
                            break

                        try:
                            async with message.process():
                                await self._handle_message(message.body)
                                self.message_counter.labels(
                                    queue_type=self.queue_type, status="success"
                                ).inc()
                        except Exception as e:
                            self.message_counter.labels(
                                queue_type=self.queue_type, status="error"
                            ).inc()
                            print(f"Error processing message: {str(e)}")

    def stop(self) -> None:
        """Stop consuming messages."""
        self._running = False
        if self.connection:
            # Store the task to prevent garbage collection
            self._close_task = asyncio.create_task(self.connection.close())

    async def _handle_message(self, message: bytes) -> None:
        """Handle queue message."""
        if self.handler:
            await self.handler(
                {
                    "queue_type": self.queue_type,
                    "message": message.decode(),
                    "timestamp": datetime.now().isoformat(),
                }
            )
