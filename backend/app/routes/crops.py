from fastapi import APIRouter, HTTPException
from app.models.crop import Crop, CropUpdate
from app.database.connection import get_db
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api", tags=["Crops"])

# Default crops seeded on first request
DEFAULT_CROPS = [
    {"name": "Rice",      "optimal_moisture_min": 70, "optimal_moisture_max": 85, "min_moisture_threshold": 60, "max_moisture_threshold": 90, "typical_water_requirement": 25, "icon": "🌾", "is_custom": False,
     "growth_stages": [{"name":"Germination","min_moisture":75,"max_moisture":85,"water_requirement":10},{"name":"Vegetative","min_moisture":70,"max_moisture":85,"water_requirement":20},{"name":"Flowering","min_moisture":72,"max_moisture":85,"water_requirement":25},{"name":"Fruiting","min_moisture":70,"max_moisture":82,"water_requirement":22},{"name":"Maturity","min_moisture":60,"max_moisture":75,"water_requirement":15}]},
    {"name": "Wheat",     "optimal_moisture_min": 45, "optimal_moisture_max": 65, "min_moisture_threshold": 35, "max_moisture_threshold": 75, "typical_water_requirement": 18, "icon": "🌿", "is_custom": False,
     "growth_stages": [{"name":"Germination","min_moisture":50,"max_moisture":65,"water_requirement":8},{"name":"Vegetative","min_moisture":45,"max_moisture":60,"water_requirement":15},{"name":"Flowering","min_moisture":50,"max_moisture":65,"water_requirement":20},{"name":"Fruiting","min_moisture":45,"max_moisture":60,"water_requirement":18},{"name":"Maturity","min_moisture":35,"max_moisture":50,"water_requirement":10}]},
    {"name": "Tomato",    "optimal_moisture_min": 55, "optimal_moisture_max": 70, "min_moisture_threshold": 40, "max_moisture_threshold": 80, "typical_water_requirement": 20, "icon": "🍅", "is_custom": False,
     "growth_stages": [{"name":"Germination","min_moisture":60,"max_moisture":70,"water_requirement":10},{"name":"Vegetative","min_moisture":55,"max_moisture":68,"water_requirement":18},{"name":"Flowering","min_moisture":58,"max_moisture":70,"water_requirement":22},{"name":"Fruiting","min_moisture":55,"max_moisture":68,"water_requirement":25},{"name":"Maturity","min_moisture":45,"max_moisture":60,"water_requirement":15}]},
    {"name": "Cotton",    "optimal_moisture_min": 45, "optimal_moisture_max": 60, "min_moisture_threshold": 30, "max_moisture_threshold": 70, "typical_water_requirement": 22, "icon": "🌸", "is_custom": False,
     "growth_stages": [{"name":"Germination","min_moisture":50,"max_moisture":60,"water_requirement":10},{"name":"Vegetative","min_moisture":45,"max_moisture":58,"water_requirement":18},{"name":"Flowering","min_moisture":48,"max_moisture":60,"water_requirement":25},{"name":"Fruiting","min_moisture":45,"max_moisture":58,"water_requirement":22},{"name":"Maturity","min_moisture":30,"max_moisture":50,"water_requirement":12}]},
    {"name": "Maize",     "optimal_moisture_min": 55, "optimal_moisture_max": 70, "min_moisture_threshold": 40, "max_moisture_threshold": 80, "typical_water_requirement": 20, "icon": "🌽", "is_custom": False,
     "growth_stages": [{"name":"Germination","min_moisture":60,"max_moisture":70,"water_requirement":10},{"name":"Vegetative","min_moisture":55,"max_moisture":68,"water_requirement":18},{"name":"Flowering","min_moisture":58,"max_moisture":70,"water_requirement":22},{"name":"Fruiting","min_moisture":55,"max_moisture":68,"water_requirement":20},{"name":"Maturity","min_moisture":40,"max_moisture":58,"water_requirement":12}]},
    {"name": "Sugarcane", "optimal_moisture_min": 65, "optimal_moisture_max": 80, "min_moisture_threshold": 55, "max_moisture_threshold": 85, "typical_water_requirement": 30, "icon": "🎋", "is_custom": False,
     "growth_stages": [{"name":"Germination","min_moisture":70,"max_moisture":80,"water_requirement":15},{"name":"Vegetative","min_moisture":65,"max_moisture":78,"water_requirement":25},{"name":"Flowering","min_moisture":68,"max_moisture":80,"water_requirement":30},{"name":"Fruiting","min_moisture":65,"max_moisture":78,"water_requirement":28},{"name":"Maturity","min_moisture":55,"max_moisture":70,"water_requirement":18}]},
    {"name": "Groundnut", "optimal_moisture_min": 40, "optimal_moisture_max": 60, "min_moisture_threshold": 30, "max_moisture_threshold": 70, "typical_water_requirement": 16, "icon": "🥜", "is_custom": False,
     "growth_stages": [{"name":"Germination","min_moisture":45,"max_moisture":60,"water_requirement":8},{"name":"Vegetative","min_moisture":40,"max_moisture":58,"water_requirement":14},{"name":"Flowering","min_moisture":42,"max_moisture":60,"water_requirement":18},{"name":"Fruiting","min_moisture":40,"max_moisture":58,"water_requirement":16},{"name":"Maturity","min_moisture":30,"max_moisture":50,"water_requirement":10}]},
]


async def _seed_crops(db):
    count = await db.crops.count_documents({})
    if count == 0:
        docs = [{**c, "created_at": datetime.now(timezone.utc)} for c in DEFAULT_CROPS]
        await db.crops.insert_many(docs)
        print("[OK] Default crops seeded.")


@router.get("/crops")
async def get_crops():
    db = get_db()
    await _seed_crops(db)
    cursor = db.crops.find({})
    docs = await cursor.to_list(length=100)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


@router.post("/crops")
async def create_crop(crop: Crop):
    db = get_db()
    existing = await db.crops.find_one({"name": crop.name})
    if existing:
        raise HTTPException(status_code=400, detail="Crop with this name already exists.")
    doc = crop.model_dump()
    doc["is_custom"] = True
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.crops.insert_one(doc)
    return {"id": str(result.inserted_id), "status": "created"}


@router.get("/crops/{crop_name}")
async def get_crop(crop_name: str):
    db = get_db()
    await _seed_crops(db)
    doc = await db.crops.find_one({"name": {"$regex": f"^{crop_name}$", "$options": "i"}})
    if not doc:
        raise HTTPException(status_code=404, detail="Crop not found")
    doc["id"] = str(doc.pop("_id"))
    return doc
