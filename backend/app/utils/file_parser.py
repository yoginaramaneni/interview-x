import os
try:
    import fitz  # PyMuPDF
    pymupdf_available = True
except ImportError:
    pymupdf_available = False
import pdfplumber
import docx
from fastapi import UploadFile, HTTPException, status
from app.config import settings

def validate_file(file: UploadFile):
    # Validate extension
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Only PDF and DOCX files are allowed."
        )

    # Validate file size
    # We need to seek to find size or read a chunk
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)  # Reset to start of file

    if size > settings.MAX_UPLOAD_SIZE:
        max_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum limit of {max_mb:.1f} MB."
        )

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    # Try using PyMuPDF (fitz) first if available
    if pymupdf_available:
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
            if text.strip():
                return text
        except Exception as e:
            pass  # Fallback to pdfplumber below
            
    # Fallback to pdfplumber
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as ex:
        raise ValueError(f"Failed to parse PDF document: {ex}")
    
    if not text.strip():
        raise ValueError("Extracted text is empty. PDF might be scanned or corrupted.")
    return text

def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX document: {e}")

def parse_uploaded_file(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file extension {ext}")
