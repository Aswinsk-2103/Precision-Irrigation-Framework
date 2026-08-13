from fastapi import APIRouter, HTTPException
from app.models.user import UserCreate, UserLogin, UserOut, Token
from app.database.connection import get_db
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timezone, timedelta
import os

router = APIRouter(prefix="/api/auth", tags=["Auth"])

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

DEFAULT_USERS = [
    {"username": "farmer",  "email": "farmer@farm.com",  "password": "farmer123",  "role": "farmer", "full_name": "Demo Farmer"},
    {"username": "admin",   "email": "admin@farm.com",   "password": "admin123",   "role": "admin",  "full_name": "System Admin"},
]


def _hash(pw): return pwd_ctx.hash(pw)
def _verify(pw, h): return pwd_ctx.verify(pw, h)

def _create_token(data: dict):
    exp = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MIN)
    return jwt.encode({**data, "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)


async def _seed_users(db):
    count = await db.users.count_documents({})
    if count == 0:
        docs = [{**u, "password": _hash(u["password"]), "created_at": datetime.now(timezone.utc)} for u in DEFAULT_USERS]
        await db.users.insert_many(docs)
        print("[OK] Default users seeded (farmer/farmer123, admin/admin123)")


@router.post("/register")
async def register(data: UserCreate):
    db = get_db()
    if await db.users.find_one({"username": data.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    doc = data.model_dump()
    doc["password"] = _hash(doc["password"])
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.users.insert_one(doc)
    return {"id": str(result.inserted_id), "status": "registered"}


@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    db = get_db()
    await _seed_users(db)
    user = await db.users.find_one({"username": data.username})
    if not user or not _verify(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = _create_token({"sub": user["username"], "role": user.get("role", "farmer")})
    user_out = UserOut(
        id=str(user["_id"]),
        username=user["username"],
        email=user["email"],
        role=user.get("role", "farmer"),
        full_name=user.get("full_name"),
        created_at=user.get("created_at"),
    )
    return Token(access_token=token, user=user_out)


@router.get("/me")
async def get_me():
    """Return demo user info (simplified for demo — no auth middleware)."""
    return {"username": "farmer", "role": "farmer", "full_name": "Demo Farmer"}
