"""
Main API router for the backend.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import logging
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..config.settings import settings
from ..core.database import db_manager
from ..core.models import User, Project, Model, Dataset, Job
from ..core.job_queue import job_queue_manager
from ..core.cache import cache_manager

# Create router
router = APIRouter()

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Configure CORS
router.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_config().api.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencies
def get_db():
    """Get database session."""
    with db_manager.get_session() as session:
        yield session

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Get current user from token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token,
            settings.get_config().api.jwt_secret,
            algorithms=[settings.get_config().api.jwt_algorithm]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# Authentication endpoints
@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint to get access token."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(seconds=settings.get_config().api.jwt_expires_in)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@router.post("/users/", response_model=dict)
async def create_user(
    username: str,
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    """Create new user."""
    # Check if user exists
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Create user
    hashed_password = pwd_context.hash(password)
    user = User(
        username=username,
        email=email,
        password_hash=hashed_password
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "User created successfully", "user_id": user.id}

@router.get("/users/me/", response_model=dict)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "is_admin": current_user.is_admin,
        "created_at": current_user.created_at
    }

# Project endpoints
@router.post("/projects/", response_model=dict)
async def create_project(
    name: str,
    description: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new project."""
    project = Project(
        name=name,
        description=description,
        user_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return {"message": "Project created successfully", "project_id": project.id}

@router.get("/projects/", response_model=List[dict])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's projects."""
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    return [
        {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "created_at": project.created_at,
            "updated_at": project.updated_at
        }
        for project in projects
    ]

# Model endpoints
@router.post("/models/", response_model=dict)
async def create_model(
    name: str,
    model_type: str,
    architecture: dict,
    hyperparameters: dict,
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new model."""
    # Check if project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    model = Model(
        name=name,
        model_type=model_type,
        architecture=architecture,
        hyperparameters=hyperparameters,
        project_id=project_id
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    
    return {"message": "Model created successfully", "model_id": model.id}

@router.post("/models/{model_id}/train", response_model=dict)
async def train_model(
    model_id: int,
    training_params: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start model training job."""
    # Check if model exists and belongs to user's project
    model = db.query(Model).join(Project).filter(
        Model.id == model_id,
        Project.user_id == current_user.id
    ).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
        
    # Enqueue training job
    job_id = await job_queue_manager.enqueue_job(
        job_type='train_model',
        parameters={
            'model_id': model_id,
            'training_params': training_params
        },
        user_id=current_user.id
    )
    
    return {"message": "Training job started", "job_id": job_id}

# Dataset endpoints
@router.post("/datasets/", response_model=dict)
async def create_dataset(
    name: str,
    data_type: str,
    data_path: str,
    metadata: Optional[dict] = None,
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new dataset."""
    # Check if project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    dataset = Dataset(
        name=name,
        data_type=data_type,
        data_path=data_path,
        metadata=metadata,
        project_id=project_id
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    return {"message": "Dataset created successfully", "dataset_id": dataset.id}

# Job endpoints
@router.get("/jobs/{job_id}", response_model=dict)
async def get_job_status(
    job_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get status of a job."""
    job_status = await job_queue_manager.get_job_status(job_id)
    if not job_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
        
    # Check if job belongs to user
    if job_status['user_id'] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this job"
        )
        
    return job_status

@router.post("/jobs/{job_id}/cancel", response_model=dict)
async def cancel_job(
    job_id: int,
    current_user: User = Depends(get_current_user)
):
    """Cancel a job."""
    # Check if job exists and belongs to user
    job_status = await job_queue_manager.get_job_status(job_id)
    if not job_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
        
    if job_status['user_id'] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this job"
        )
        
    success = await job_queue_manager.cancel_job(job_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job cannot be cancelled"
        )
        
    return {"message": "Job cancelled successfully"}

# Utility functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.get_config().api.jwt_secret,
        algorithm=settings.get_config().api.jwt_algorithm
    )
    return encoded_jwt 