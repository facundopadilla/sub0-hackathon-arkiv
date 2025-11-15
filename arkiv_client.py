import json
from typing import List, Optional
from arkiv import Arkiv
from arkiv.types import Attributes, QueryOptions
from arkiv.account import NamedAccount
from web3 import HTTPProvider

PRIVATE_KEY = "0xdda5db659d91167685a27e2e1ebd23a1fe394b794504ffa7fc8dfc84c2cc3b35"


def create_client() -> Arkiv:
    provider = HTTPProvider("https://mendoza.hoodi.arkiv.network/rpc")
    account = NamedAccount.from_private_key("hacka-dev", PRIVATE_KEY)
    client = Arkiv(provider, account=account)

    print("Conectado a Arkiv:", client.is_connected())
    print("Cuenta:", client.eth.default_account)
    balance_wei = client.eth.get_balance(client.eth.default_account)
    balance = client.from_wei(balance_wei, "ether")
    print("Balance:", balance, "ETH")

    return client


def save_sponsored_project(client: Arkiv, data: dict) -> str:
    """
    data = {
      "project_id": "demo-1",
      "name": "Mi proyecto",
      "repo": "https://github.com/...",
      "ai_score": 0.9,
      "status": "approved",
      "contract_address": "0x1234...",
      "chain": "asset_hub",
      "budget": 1000,
      "description": "...",
      "milestones": [...],
    }
    """
    payload = json.dumps(data).encode("utf-8")

    attrs = Attributes({
        "type": "sponsored_project",
        "projectId": data["project_id"],
        "status": data["status"],
        "aiScore": str(data.get("ai_score", "")),
        "contractAddress": data.get("contract_address", ""),
        "chain": data.get("chain", "asset_hub"),
    })

    entity_key, _ = client.arkiv.create_entity(
        payload=payload,
        content_type="application/json",
        attributes=attrs,
    )

    print("Project saved in Arkiv:", entity_key)
    return entity_key


def list_sponsored_projects(
    client: Arkiv,
    status: Optional[str] = None,
) -> List[dict]:
    query = 'type = "sponsored_project"'
    if status:
        query += f' and status = "{status}"'

    entities = client.arkiv.query_entities(
        query,
        QueryOptions(),  
    )

    results: List[dict] = []
    for ent in entities:
        if ent.payload:
            try:
                data = json.loads(ent.payload.decode("utf-8"))
                data["_entity_key"] = ent.entity_key
                results.append(data)
            except Exception:
                pass

    return results
