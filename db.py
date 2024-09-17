from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Get the MongoDB URI from the environment variable
MONGODB_URI = os.getenv("MONGODB_URI")

# Create a MongoClient instance and connect to the MongoDB Atlas cluster
client = MongoClient(MONGODB_URI)

# Specify the database name (e.g., "bleujs")
db = client["bleujs"]

# Create or access a collection named 'test_collection'
collection = db["test_collection"]

# Insert a sample document
sample_document = {"name": "Test Document", "description": "This is a test document"}
insert_result = collection.insert_one(sample_document)

# Output the inserted document ID
print("Inserted document ID:", insert_result.inserted_id)

# Verify the collection now contains documents
print("Collections:", db.list_collection_names())
print("Documents in 'test_collection':", list(collection.find()))
