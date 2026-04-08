from typing import Any, Dict, List

from bson import ObjectId


def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    result = dict(doc)
    if "_id" in result:
        result["id"] = str(result.pop("_id"))
    return result


def serialize_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [serialize_doc(doc) for doc in docs]


def to_object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise ValueError("Invalid ObjectId")
    return ObjectId(value)
