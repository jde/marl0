from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import lancedb
import os

app = FastAPI()

LANCEDB_PATH = os.environ.get("LANCEDB_DATA_DIR", "/data")
db = lancedb.connect(LANCEDB_PATH)

# Request models
class Document(BaseModel):
    vector: List[float]
    metadata: Dict[str, str]

class QueryRequest(BaseModel):
    query_vector: List[float]
    limit: int = 10

# Routes
@app.post("/insert/{collection_name}")
def insert_documents(collection_name: str, documents: List[Document]):
    table = db.create_table(collection_name, data=[doc.dict() for doc in documents], mode="create_if_not_exists")
    table.add([doc.dict() for doc in documents])
    return {"status": "success", "collection": collection_name, "inserted": len(documents)}

@app.post("/query/{collection_name}")
def query_documents(collection_name: str, query: QueryRequest):
    if collection_name not in db.table_names():
        raise HTTPException(status_code=404, detail="Collection not found")
    table = db.open_table(collection_name)
    results = table.search(query.query_vector).limit(query.limit).to_list()
    return {"results": results}

@app.delete("/drop/{collection_name}")
def drop_collection(collection_name: str):
    db.drop_table(collection_name)
    return {"status": "dropped", "collection": collection_name}
