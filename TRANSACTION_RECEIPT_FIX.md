# TransactionReceipt Type Conversion Fix

## Problem
When saving a sponsored project to Arkiv, the `create_entity()` method returns a tuple:
- `entity_key` (string)
- `tx_hash` (TransactionReceipt object, NOT a string)

The code was directly passing the `TransactionReceipt` object to the database, causing:
```
TypeError: expected str, got TransactionReceipt
```

## Root Cause
```python
# BEFORE (Wrong)
entity_key, tx_hash = client.arkiv.create_entity(...)
# tx_hash here is a TransactionReceipt object, not a string
```

The database expects a VARCHAR (string), but received a Python object:
```
TransactionReceipt(
    block_number=156405,
    tx_hash='0x4b5cc913743c6ce9a2e2b1cb070b783959541c57a6fa02f8d1558003d940607c',
    creates=[...],
    ...
)
```

## Solution
Extract the `tx_hash` field from the TransactionReceipt object:

```python
# AFTER (Fixed)
if isinstance(result, tuple):
    entity_key = result[0]
    tx_hash_obj = result[1] if len(result) > 1 else None
    
    if tx_hash_obj is not None:
        # Extract tx_hash from TransactionReceipt object
        if hasattr(tx_hash_obj, 'tx_hash'):
            tx_hash = tx_hash_obj.tx_hash  # Get the string field
        else:
            tx_hash = str(tx_hash_obj)     # Fallback to string conversion
    else:
        tx_hash = None
```

## Result
Now the database receives a proper string value:
```python
tx_hash = '0x4b5cc913743c6ce9a2e2b1cb070b783959541c57a6fa02f8d1558003d940607c'
# ✅ String, ready for VARCHAR column
```

## Error Scenario (Before Fix)
```
POST /api/v1/arkiv/sponsor
→ Arkiv creates entity ✅
→ Returns TransactionReceipt object ✅
→ Try to save to DB ❌
→ Database.INSERT fails: "expected str, got TransactionReceipt"
→ 500 Internal Server Error
```

## Success Scenario (After Fix)
```
POST /api/v1/arkiv/sponsor
→ Arkiv creates entity ✅
→ Returns TransactionReceipt object ✅
→ Extract tx_hash field ✅
→ Convert to string ✅
→ Save to DB ✅
→ 200 OK
```

## File Modified
- `src/services/arkiv.py` - ArkivService.save_sponsored_project()

## Commit
See git log for the fix commit

## Testing
Retry the POST /api/v1/arkiv/sponsor request - should now work! ✅
