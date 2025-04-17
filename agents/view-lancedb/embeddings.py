def generate_semantic_bundle(entity: dict) -> str:
    parts = [
        f"Title: {entity['payload'].get('title', '')}",
        f"Content: {entity['payload'].get('content', '')}",
        f"Tags: {entity['payload'].get('section', '')}, {entity['payload'].get('source', '')}",
        f"Agent: {entity['createdById']}"
    ]
    return "\n".join(parts)
