"""
Main API router for the backend.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..config.settings import get_config
from ..core.api_client import api_client
from ..core.auth import (
    create_access_token,
    get_current_active_user,
    get_current_user,
    get_password_hash,
    verify_password,
)
from ..core.database import get_db
from ..core.models import (
    APICallLogResponse,
    Dataset,
    DatasetCreate,
    DatasetResponse,
    Job,
    JobCreate,
    JobList,
    JobResponse,
    JobUpdate,
    Model,
    ModelCreate,
    ModelResponse,
    Project,
    ProjectCreate,
    ProjectResponse,
    Subscription,
    SubscriptionResponse,
    SubscriptionTier,
    Token,
    TokenData,
    UsageStats,
    User,
    UserCreate,
    UserResponse,
)
from ..core.queue import enqueue_job
from ..core.subscription import SubscriptionService

config = get_config()

# Create router
router = APIRouter()

# Security
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Configure CORS
router.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication endpoints
@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """Login endpoint to get access token."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=config.api.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# Subscription endpoints
@router.get("/subscription", response_model=Subscription)
async def get_subscription(user_id: int, db: Session = Depends(get_db)) -> Subscription:
    """Get or create a subscription for a user."""
    return SubscriptionService.get_or_create_subscription(db, user_id)


@router.get("/subscription/usage", response_model=UsageStats)
async def get_usage_stats(user_id: int, db: Session = Depends(get_db)) -> UsageStats:
    """Get API usage statistics for a user."""
    return SubscriptionService.get_usage_stats(db, user_id)


# AI endpoints
@router.post("/predict")
async def predict(request: Request, user_id: int, db: Session = Depends(get_db)):
    """Make a prediction using the API."""
    # Check API access
    has_access, error_message = SubscriptionService.check_api_access(
        db, user_id, "/predict", method="POST"
    )
    if not has_access:
        raise HTTPException(status_code=429, detail=error_message)

    # Start timing the request
    start_time = datetime.utcnow()

    try:
        # TODO: Implement prediction logic here
        result = {"prediction": "example"}

        # Update API call log with success
        response_time = (datetime.utcnow() - start_time).total_seconds()
        SubscriptionService.update_api_call_log(
            db, user_id, "/predict", "POST", 200, response_time
        )

        return result

    except Exception as e:
        # Update API call log with error
        response_time = (datetime.utcnow() - start_time).total_seconds()
        SubscriptionService.update_api_call_log(
            db, user_id, "/predict", "POST", 500, response_time
        )
        raise HTTPException(status_code=500, detail=str(e))


# User endpoints
@router.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create new user."""
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username, email=user.email, password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        is_active=new_user.is_active,
        is_admin=new_user.is_admin,
        created_at=new_user.created_at,
    )


@router.get("/users/me/", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at,
    )


# Project endpoints
@router.post("/projects/", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create new project."""
    new_project = Project(
        name=project.name, description=project.description, user_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return ProjectResponse(
        id=new_project.id,
        name=new_project.name,
        description=new_project.description,
        created_at=new_project.created_at,
        updated_at=new_project.updated_at,
    )


@router.get("/projects/", response_model=List[ProjectResponse])
def read_projects(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List user's projects."""
    projects = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )
        for project in projects
    ]


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def read_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    if project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


# Model endpoints
@router.post("/models/", response_model=ModelResponse)
def create_model(
    model: ModelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create new model."""
    # Check if project exists and belongs to user
    project = (
        db.query(Project)
        .filter(Project.id == model.project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    new_model = Model(
        name=model.name,
        model_type=model.model_type,
        architecture=model.architecture,
        hyperparameters=model.hyperparameters,
        project_id=model.project_id,
    )
    db.add(new_model)
    db.commit()
    db.refresh(new_model)

    return ModelResponse(
        id=new_model.id,
        name=new_model.name,
        model_type=new_model.model_type,
        architecture=new_model.architecture,
        hyperparameters=new_model.hyperparameters,
        project_id=new_model.project_id,
    )


@router.get("/models/", response_model=List[ModelResponse])
def read_models(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List user's models."""
    models = (
        db.query(Model)
        .filter(Model.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        ModelResponse(
            id=model.id,
            name=model.name,
            model_type=model.model_type,
            architecture=model.architecture,
            hyperparameters=model.hyperparameters,
            project_id=model.project_id,
        )
        for model in models
    ]


@router.get("/models/{model_id}", response_model=ModelResponse)
def read_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific model."""
    model = db.query(Model).filter(Model.id == model_id).first()
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Model not found"
        )
    if model.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return ModelResponse(
        id=model.id,
        name=model.name,
        model_type=model.model_type,
        architecture=model.architecture,
        hyperparameters=model.hyperparameters,
        project_id=model.project_id,
    )


# Dataset endpoints
@router.post("/datasets/", response_model=DatasetResponse)
def create_dataset(
    dataset: DatasetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create new dataset."""
    # Check if project exists and belongs to user
    project = (
        db.query(Project)
        .filter(Project.id == dataset.project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    new_dataset = Dataset(
        name=dataset.name,
        data_type=dataset.data_type,
        data_path=dataset.data_path,
        metadata=dataset.metadata,
        project_id=dataset.project_id,
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    return DatasetResponse(
        id=new_dataset.id,
        name=new_dataset.name,
        data_type=new_dataset.data_type,
        data_path=new_dataset.data_path,
        metadata=new_dataset.metadata,
        project_id=new_dataset.project_id,
    )


@router.get("/datasets/", response_model=List[DatasetResponse])
def read_datasets(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List user's datasets."""
    datasets = (
        db.query(Dataset)
        .filter(Dataset.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        DatasetResponse(
            id=dataset.id,
            name=dataset.name,
            data_type=dataset.data_type,
            data_path=dataset.data_path,
            metadata=dataset.metadata,
            project_id=dataset.project_id,
        )
        for dataset in datasets
    ]


@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
def read_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific dataset."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found"
        )
    if dataset.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return DatasetResponse(
        id=dataset.id,
        name=dataset.name,
        data_type=dataset.data_type,
        data_path=dataset.data_path,
        metadata=dataset.metadata,
        project_id=dataset.project_id,
    )


# Job endpoints
@router.post("/jobs", response_model=Job)
async def create_job(user_id: int, job_type: str, db: Session = Depends(get_db)) -> Job:
    """Create a new job."""
    # Check API access
    has_access, error_message = SubscriptionService.check_api_access(
        db, user_id, "/jobs", method="POST"
    )
    if not has_access:
        raise HTTPException(status_code=429, detail=error_message)

    # Start timing the request
    start_time = datetime.utcnow()

    try:
        # Create the job
        job = Job(user_id=user_id, job_type=job_type, status="pending")
        db.add(job)
        db.commit()
        db.refresh(job)

        # Update API call log with success
        response_time = (datetime.utcnow() - start_time).total_seconds()
        SubscriptionService.update_api_call_log(
            db, user_id, "/jobs", "POST", 201, response_time
        )

        return job

    except Exception as e:
        # Update API call log with error
        response_time = (datetime.utcnow() - start_time).total_seconds()
        SubscriptionService.update_api_call_log(
            db, user_id, "/jobs", "POST", 500, response_time
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs", response_model=JobList)
async def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    job_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List jobs with pagination and filtering."""
    query = db.query(Job).filter(Job.user_id == current_user.id)

    if status:
        query = query.filter(Job.status == status)
    if job_type:
        query = query.filter(Job.job_type == job_type)

    total = query.count()
    jobs = query.offset(skip).limit(limit).all()
    pages = (total + limit - 1) // limit

    return JobList(
        jobs=[
            JobResponse(
                id=job.id,
                job_type=job.job_type,
                status=job.status,
                progress=job.progress,
                result=job.result,
                error=job.error,
                created_at=job.created_at,
                updated_at=job.updated_at,
                started_at=job.started_at,
                completed_at=job.completed_at,
            )
            for job in jobs
        ],
        total=total,
        page=skip // limit + 1,
        size=limit,
        pages=pages,
    )


@router.get("/jobs/{job_id}", response_model=Job)
async def get_job(job_id: int, user_id: int, db: Session = Depends(get_db)) -> Job:
    """Get a job by ID."""
    # Check API access
    has_access, error_message = SubscriptionService.check_api_access(
        db, user_id, f"/jobs/{job_id}", method="GET"
    )
    if not has_access:
        raise HTTPException(status_code=429, detail=error_message)

    # Start timing the request
    start_time = datetime.utcnow()

    try:
        # Get the job
        job = db.query(Job).filter(Job.id == job_id, Job.user_id == user_id).first()

        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Update API call log with success
        response_time = (datetime.utcnow() - start_time).total_seconds()
        SubscriptionService.update_api_call_log(
            db, user_id, f"/jobs/{job_id}", "GET", 200, response_time
        )

        return job

    except HTTPException:
        # Update API call log with error
        response_time = (datetime.utcnow() - start_time).total_seconds()
        SubscriptionService.update_api_call_log(
            db, user_id, f"/jobs/{job_id}", "GET", 404, response_time
        )
        raise
    except Exception as e:
        # Update API call log with error
        response_time = (datetime.utcnow() - start_time).total_seconds()
        SubscriptionService.update_api_call_log(
            db, user_id, f"/jobs/{job_id}", "GET", 500, response_time
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/jobs/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_update: JobUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update a job's status and progress."""
    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.user_id == current_user.id,
        )
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail=f"Job {job_id} not found",
        )

    for field, value in job_update.dict(exclude_unset=True).items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    return JobResponse(
        id=job.id,
        job_type=job.job_type,
        status=job.status,
        progress=job.progress,
        result=job.result,
        error=job.error,
        created_at=job.created_at,
        updated_at=job.updated_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
    )
