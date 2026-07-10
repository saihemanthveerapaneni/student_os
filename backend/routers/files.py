from fastapi import APIRouter, UploadFile, File, HTTPException
import pypdf
import io
import logging

logger = logging.getLogger("studentos.files")
router = APIRouter(prefix="/api/files", tags=["Files"])

@router.post("/extract-text")
async def extract_text_from_pdf(file: UploadFile = File(...)):
    """
    Accepts a PDF file upload, extracts all text pages, and returns the raw text content.
    Used for importing PDF notes or syllabus files into StudentOS Notes.
    """
    filename = file.filename or "uploaded_file.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400, 
            detail="Unsupported file format. Only PDF files are supported for automated text extraction."
        )

    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        
        # Load PDF reader
        reader = pypdf.PdfReader(pdf_file)
        text_pages = []
        
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_pages.append(page_text)
                
        extracted_text = "\n\n".join(text_pages)
        
        if not extracted_text.strip():
            extracted_text = "[Notice: This PDF seems to contain scanned images only. No machine-readable text was found.]"

        return {
            "filename": filename,
            "page_count": len(reader.pages),
            "text": extracted_text
        }
    except Exception as e:
        logger.error(f"Error processing PDF upload: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process and read PDF: {str(e)}")
