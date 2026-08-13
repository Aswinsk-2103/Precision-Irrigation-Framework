from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import DESCENDING
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME     = os.getenv("DB_NAME", "precision_irrigation")

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=2000)
        db = client[DB_NAME]
        # Create indexes with a quick ping/timeout
        await client.admin.command('ping')
        await db.sensor_data.create_index([("timestamp", DESCENDING)])
        await db.predictions.create_index([("timestamp", DESCENDING)])
        await db.irrigation_history.create_index([("timestamp", DESCENDING)])
        await db.weather_data.create_index([("timestamp", DESCENDING)])
        print(f"[OK] Connected to MongoDB: {DB_NAME}")
    except Exception as e:
        print(f"[WARN] MongoDB not connected ({e}). Running without MongoDB persistent storage.")


async def close_db():
    global client
    if client:
        client.close()
        print("[INFO] MongoDB connection closed.")


def get_db():
    return db
