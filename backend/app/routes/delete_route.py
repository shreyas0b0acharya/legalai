import os
import shutil
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/delete_file")
async def delete_file(data: dict):
    saved_filename = data.get("saved_filename")
    index_name = data.get("index_name")

    if not saved_filename:
        raise HTTPException(status_code=400, detail="saved_filename required")

    if not index_name:
        raise HTTPException(status_code=400, detail="index_name required")

    deleted_items = []

    # ─────────────────────────────────────
    # 1️⃣ Delete PDF
    # ─────────────────────────────────────
    pdf_path = f"uploads/{saved_filename}"
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
        deleted_items.append(pdf_path)

    # ─────────────────────────────────────
    # 2️⃣ Delete FAISS index files (.faiss + _meta.pkl)
    # ─────────────────────────────────────
    faiss_file = f"indexes/{index_name}.faiss"
    meta_file = f"indexes/{index_name}_meta.pkl"

    if os.path.exists(faiss_file):
        os.remove(faiss_file)
        deleted_items.append(faiss_file)

    if os.path.exists(meta_file):
        os.remove(meta_file)
        deleted_items.append(meta_file)

    # ─────────────────────────────────────
    # 3️⃣ Delete processed chunks JSON
    # ─────────────────────────────────────
    chunks_file = f"processed/{index_name}_chunks.json"

    if os.path.exists(chunks_file):
        os.remove(chunks_file)
        deleted_items.append(chunks_file)

    return {
        "status": "success",
        "deleted": deleted_items
    }
