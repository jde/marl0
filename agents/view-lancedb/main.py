import traceback
from confluent_kafka import Consumer
from sentence_transformers import SentenceTransformer
import lancedb, requests, os, json
from embeddings import generate_semantic_bundle

print("🔧 PRODUCT_API_URL =", os.getenv("PRODUCT_API_URL"))


model = SentenceTransformer("all-MiniLM-L6-v2")
print("✅ Model loaded.")

db = lancedb.connect(os.getenv("LANCEDB_DATA_DIR", "./lancedb_data"))
table = db.open_table("entities")

consumer = Consumer({
    "bootstrap.servers": os.getenv("KAFKA_BROKERS", "localhost:9092"),
    "group.id": os.getenv("GROUP_ID", "view-lancedb"),
    "auto.offset.reset": "earliest"
})
consumer.subscribe(["marl0.firehose"])
print("📡 Listening to firehose...")

def fetch_entity(entity_id):
    url = f"{os.getenv('PRODUCT_API_URL', 'http://localhost:3000')}/api/product/entity?id={entity_id}"
    res = requests.get(url)
    return res.json()["entity"] if res.status_code == 200 else None

while True:
    msg = consumer.poll(1.0)
    if msg is None:
        continue

    try:
        event = json.loads(msg.value().decode("utf-8"))
        if event.get("event_type") != "entity.created":
            continue

        entity_id = event.get("entity_id")
        if not entity_id:
            continue

        entity = fetch_entity(entity_id)
        if not entity:
            continue

        bundle = generate_semantic_bundle(entity)
        vector = model.encode(bundle).tolist()

        table.add([{
            "entity_id": entity_id,
            "vector": vector,
            "agent": entity["createdById"],
            "bundle_version": "v1"
        }])
        print(f"✅ Indexed: {entity_id}")

    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
