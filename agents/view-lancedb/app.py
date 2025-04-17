from fastapi import FastAPI, Query
from sentence_transformers import SentenceTransformer
import lancedb, requests, os
from embeddings import generate_semantic_bundle

app = FastAPI()

PRODUCT_API_URL = os.getenv("PRODUCT_API_URL", "http://product-api:3000")
LANCEDB_PATH = os.getenv("LANCEDB_DATA_DIR", "./lancedb_data")
TOP_K = int(os.getenv("TOP_K", 5))

model = SentenceTransformer("all-MiniLM-L6-v2")
db = lancedb.connect(LANCEDB_PATH)
table = db.open_table("entities")

@app.get("/similar")
def find_similar(id: str = Query(...), top_k: int = Query(TOP_K)):
    try:
        url = f"{PRODUCT_API_URL}/api/product/entity?id={id}"
        res = requests.get(url)
        if res.status_code != 200:
            return {"error": "Entity not found"}

        entity = res.json()["entity"]
        bundle = generate_semantic_bundle(entity)
        vec = model.encode(bundle).tolist()

        results = table.search(vec).limit(top_k).to_list()
        return {"results": results}
    except Exception as e:
        return {"error": str(e)}
