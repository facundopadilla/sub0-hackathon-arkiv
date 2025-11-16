import json
from typing import List, Optional

from loguru import logger

from arkiv import Arkiv
from arkiv.types import Attributes, PAYLOAD, ATTRIBUTES as ATTRIBUTES_FIELD, QueryOptions



class ArkivService:

    @staticmethod
    def save_sponsored_project(client: Arkiv, data: dict) -> str:
        """Save a sponsored project to Arkiv."""
        payload = json.dumps(data).encode("utf-8")

        attrs = Attributes(
            {
                "type": "sponsored_project",
                "projectId": data["project_id"],
                "status": data["status"],
                "aiScore": str(data.get("ai_score", "")),
                "contractAddress": data.get("contract_address", ""),
                "chain": data.get("chain", "asset_hub"),
            }
        )

        result = client.arkiv.create_entity(
            payload=payload,
            content_type="application/json",
            attributes=attrs,
        )
        
        # Capture both entity_key and hash/transaction hash
        if isinstance(result, tuple):
            entity_key = result[0]
            tx_hash = result[1] if len(result) > 1 else None
        else:
            entity_key = result
            tx_hash = None

        logger.info("Project saved in Arkiv - Entity Key: {}, TX Hash: {}", entity_key, tx_hash)
        return {
            "entity_key": entity_key,
            "tx_hash": tx_hash
        }
    
    @staticmethod
    def list_sponsored_projects(client: Arkiv, status: Optional[str] = None) -> List[dict]:
        # Use SELECT * WHERE syntax for Arkiv queries
        query = "SELECT * WHERE type = 'sponsored_project'"
        if status:
            query += f" AND status = '{status}'"
        
        # Request payload and attributes
        options = QueryOptions(attributes=PAYLOAD | ATTRIBUTES_FIELD)
        query_result = client.arkiv.query_entities_page(query, options=options)

        projects = []
        for entity in query_result.entities:
            payload = entity.payload.decode("utf-8")
            data = json.loads(payload)
            data["entity_key"] = entity.entity_key
            projects.append(data)

        logger.info("Found {} sponsored projects in Arkiv", len(projects))
        return projects