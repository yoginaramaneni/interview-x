import logging
import socket
import json
import os
import asyncio
from bson import ObjectId
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger(__name__)

# --- Custom In-Memory persistent MongoDB Client ---
class InMemoryInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id

class InMemoryDeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count

class InMemoryUpdateResult:
    def __init__(self, modified_count):
        self.modified_count = modified_count

class InMemoryCursor:
    def __init__(self, docs):
        self._docs = docs
        self._sort_key = None
        self._sort_dir = 1
        self._limit_val = None
        self._idx = 0

    def sort(self, key, direction=1):
        self._sort_key = key
        self._sort_dir = direction
        return self

    def limit(self, n):
        self._limit_val = n
        return self

    def _get_sorted_docs(self):
        docs = list(self._docs)
        if self._sort_key:
            reverse = (self._sort_dir == -1)
            def key_func(doc):
                val = doc.get(self._sort_key)
                if val is None:
                    return ""
                if isinstance(val, datetime):
                    return val.isoformat()
                return val
            docs.sort(key=key_func, reverse=reverse)
        if self._limit_val is not None:
            docs = docs[:self._limit_val]
        return docs

    def __aiter__(self):
        self._sorted_docs = self._get_sorted_docs()
        self._idx = 0
        return self

    async def __anext__(self):
        if self._idx < len(self._sorted_docs):
            doc = self._sorted_docs[self._idx]
            self._idx += 1
            return doc
        else:
            raise StopAsyncIteration

class InMemoryCollection:
    def __init__(self, db, name):
        self.db = db
        self.name = name

    def _get_docs(self):
        return self.db._data.setdefault(self.name, [])

    def _save(self):
        self.db._save_data()

    def _match_doc(self, doc, query):
        if not query:
            return True
        for k, v in query.items():
            if k == "$or":
                matched = False
                for subq in v:
                    if self._match_doc(doc, subq):
                        matched = True
                        break
                if not matched:
                    return False
                continue

            doc_val = doc.get(k)
            if k == "_id" and isinstance(v, ObjectId):
                if str(doc_val) != str(v):
                    return False
                continue

            if doc_val != v:
                if str(doc_val) != str(v):
                    return False
        return True

    async def find_one(self, query=None, sort=None):
        await asyncio.sleep(0.005)
        query = query or {}
        docs = self._get_docs()
        
        if sort:
            docs_to_sort = list(docs)
            for field, direction in reversed(sort):
                reverse = (direction == -1)
                docs_to_sort.sort(key=lambda d: d.get(field) or "", reverse=reverse)
            docs = docs_to_sort

        for doc in docs:
            if self._match_doc(doc, query):
                doc_copy = dict(doc)
                if "_id" in doc_copy and isinstance(doc_copy["_id"], str):
                    doc_copy["_id"] = ObjectId(doc_copy["_id"])
                return doc_copy
        return None

    async def insert_one(self, document):
        await asyncio.sleep(0.005)
        if "_id" not in document:
            document["_id"] = str(ObjectId())
        elif isinstance(document["_id"], ObjectId):
            document["_id"] = str(document["_id"])
        
        doc_copy = dict(document)
        for k, v in doc_copy.items():
            if isinstance(v, datetime):
                doc_copy[k] = v.isoformat()

        self._get_docs().append(doc_copy)
        self._save()
        return InMemoryInsertResult(ObjectId(doc_copy["_id"]))

    async def insert_many(self, documents):
        await asyncio.sleep(0.005)
        inserted_ids = []
        for doc in documents:
            res = await self.insert_one(doc)
            inserted_ids.append(res.inserted_id)
        return inserted_ids

    async def update_one(self, query, update):
        await asyncio.sleep(0.005)
        docs = self._get_docs()
        modified = 0
        for doc in docs:
            if self._match_doc(doc, query):
                set_data = update.get("$set", {})
                for k, v in set_data.items():
                    if isinstance(v, datetime):
                        v = v.isoformat()
                    doc[k] = v
                self._save()
                modified = 1
                break
        return InMemoryUpdateResult(modified)

    async def delete_one(self, query):
        await asyncio.sleep(0.005)
        docs = self._get_docs()
        deleted = 0
        for idx, doc in enumerate(docs):
            if self._match_doc(doc, query):
                docs.pop(idx)
                self._save()
                deleted = 1
                break
        return InMemoryDeleteResult(deleted)

    async def delete_many(self, query):
        await asyncio.sleep(0.005)
        docs = self._get_docs()
        initial_len = len(docs)
        remaining = [doc for doc in docs if not self._match_doc(doc, query)]
        self.db._data[self.name] = remaining
        self._save()
        deleted_count = initial_len - len(remaining)
        return InMemoryDeleteResult(deleted_count)

    def find(self, query=None):
        query = query or {}
        docs = self._get_docs()
        matched_docs = []
        for doc in docs:
            if self._match_doc(doc, query):
                doc_copy = dict(doc)
                if "_id" in doc_copy and isinstance(doc_copy["_id"], str):
                    doc_copy["_id"] = ObjectId(doc_copy["_id"])
                matched_docs.append(doc_copy)
        return InMemoryCursor(matched_docs)

class InMemoryDatabase:
    def __init__(self, client, name):
        self.client = client
        self.name = name

    @property
    def _data(self):
        return self.client._data

    def _save_data(self):
        self.client._save_data()

    def __getitem__(self, name):
        return InMemoryCollection(self, name)

class InMemoryMongoClient:
    def __init__(self, uri=None):
        self._uri = uri
        self._data_filepath = "db_data.json"
        self._data = {}
        self._load_data()

    def _load_data(self):
        if os.path.exists(self._data_filepath):
            try:
                with open(self._data_filepath, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
            except Exception:
                self._data = {}
        else:
            self._data = {}

    def _save_data(self):
        try:
            with open(self._data_filepath, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2)
        except Exception as e:
            print("Failed to save database file:", e)

    def __getitem__(self, name):
        return InMemoryDatabase(self, name)

# --- Database Client Selection ---
class Database:
    client = None
    db = None

db_instance = Database()

def is_mongodb_available(host="localhost", port=27017, timeout=1.0):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False

def connect_db():
    try:
        # Check if local MongoDB is running on port 27017
        if is_mongodb_available():
            db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
            logger.info("Local MongoDB is active. Connecting via AsyncIOMotorClient.")
        else:
            db_instance.client = InMemoryMongoClient(settings.MONGODB_URI)
            logger.warning("Local MongoDB not found. Fallback to file-persistent InMemoryMongoClient.")
            
        # Parse database name from URI or use default
        db_name = "interviewai_x"
        if "/" in settings.MONGODB_URI.split("://")[-1]:
            uri_path = settings.MONGODB_URI.split("/")[-1]
            if "?" in uri_path:
                uri_path = uri_path.split("?")[0]
            if uri_path:
                db_name = uri_path
        
        db_instance.db = db_instance.client[db_name]
        logger.info(f"Successfully connected to MongoDB database: {db_name}")
    except Exception as e:
        logger.critical(f"Could not connect to MongoDB: {e}")
        raise e

def disconnect_db():
    if db_instance.client:
        if hasattr(db_instance.client, "close"):
            db_instance.client.close()
        logger.info("Closed MongoDB connection.")

def get_collection(name: str):
    if db_instance.db is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    return db_instance.db[name]

# Helper getters for required collections
def get_users_collection(): return get_collection("users")
def get_profiles_collection(): return get_collection("profiles")
def get_resumes_collection(): return get_collection("resumes")
def get_jobs_collection(): return get_collection("job_descriptions")
def get_sessions_collection(): return get_collection("interview_sessions")
def get_questions_collection(): return get_collection("interview_questions")
def get_answers_collection(): return get_collection("interview_answers")
def get_coding_submissions_collection(): return get_collection("coding_submissions")
def get_aptitude_results_collection(): return get_collection("aptitude_results")
def get_reports_collection(): return get_collection("reports")
def get_notifications_collection(): return get_collection("notifications")
