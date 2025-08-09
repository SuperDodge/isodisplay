import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Request
from .. import schemas

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploaded_files"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/api", tags=["uploads"])

@router.post("/upload", response_model=schemas.FileUploadResponse)
async def upload_file(request: Request, file: UploadFile = File(...)):
    ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4()}{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())
    return {"file_url": f"{request.base_url}uploads/{filename}"}
