from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.utils.query_utils import retrieve_top_chunks
import os, traceback
import google.generativeai as genai



router = APIRouter()

class AIQuery(BaseModel):
    index_name: str
    question: str
    top_k: int = 3

@router.post("/ai_answer")
async def ai_answer(query: AIQuery):
    """
    Retrieve top chunks from FAISS and generate a natural-language answer using Gemini.
    """
    try:
        chunks = retrieve_top_chunks(query.index_name, query.question, query.top_k)
        print("Chunks returned:", chunks)
        if not chunks:
            raise HTTPException(status_code=404, detail="No relevant chunks found")

        context = "\n\n".join([c["chunk"] for c in chunks])

        # Set up Gemini API key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("Missing Gemini API key!")
            raise HTTPException(status_code=500, detail="Gemini API key missing")
        genai.configure(api_key=api_key)

        # DEBUG: List available models (uncomment if needed)
        # print("Available Gemini models:", [m.name for m in genai.list_models()])

        # Choose Gemini model (use gemini-pro, not gemini-1.5-pro)
        model = genai.GenerativeModel("gemini-flash-latest")


        if query.question == "__FIRST_MESSAGE_SUMMARY__":
            prompt = (
                "You are a clear, professional legal assistant explaining documents in plain English. "
                "Never give legal advice. Respond ONLY in clean HTML (no markdown).\n\n"

                "<!-- IMPORTANT: At the very TOP of the response, insert a risk label box -->\n"
                "<!-- Risk box must use EXACTLY one of these classes: risk-high, risk-low, risk-safe -->\n"
                "<!-- Examples: -->\n"
                "<!-- <div class='risk-box risk-high'>High Risk</div> -->\n"
                "<!-- <div class='risk-box risk-low'>Low Risk</div> -->\n"
                "<!-- <div class='risk-box risk-safe'>Safe Document</div> -->\n\n"
                
                "<hr class='section-divider' />"

                "<h3>Document Summary</h3>\n"
                "<p>2–3 sentence plain-English summary explaining what this document is and its primary purpose.</p>\n"

                "<hr class='section-divider' />"

                "<h3>Things to Watch Out For</h3>\n"
                "Briefly highlight 2–4 potentially important or risky clauses (penalties, auto-renewal, liability, deadlines, etc.).\n"

                "<hr class='section-divider' />"

                "<h4>Suggested Questions</h4>\n"
                "Generate EXACTLY 3 useful questions based on the document. "
                "Wrap them inside <ul class='suggested-questions'>. "
                "Each <li> MUST contain a data-q attribute.\n"

                "<p>Example:</p>\n"
                "<li data-q='What is the liability clause?'>What is the liability clause?</li>\n\n"

                "<hr class='section-divider' />"

                "<p style='margin-top:16px; font-size:0.9em;'><strong>Note:</strong> "
                "This is for educational purposes only and is not legal advice. "
                "Always consult a qualified lawyer.</p>\n\n"

                f"Document content:\n{context}\n\n"
                "Generate the response now:"
            )

        else:
            prompt = (
                "You are a helpful legal assistant explaining a document in simple, clear English. "
                "Answer accurately using only the provided context. Never give legal advice.\n\n"

                "Respond ONLY in clean HTML (no markdown). Use <p>, <strong>, <ul>, <li>, <hr>, etc.\n\n"

                "<hr class='section-divider' />"

                f"<p><strong>Question:</strong> {query.question}</p>\n"

                "<hr class='section-divider' />"

                f"Document content:\n{context}\n"

                "<hr class='section-divider' />"

                "<p style='margin-top:16px; font-size:0.9em;'><strong>Note:</strong> "
                "This is not legal advice. Consult a qualified attorney.</p>\n\n"

                "Answer in clean HTML:"
            )




        response = model.generate_content(prompt)
        # Gemini response parsing (see docs for formats)
        answer = ""
        if hasattr(response, "text"):
            answer = response.text.strip()
        elif hasattr(response, "candidates"):
            answer = response.candidates[0].content.parts[0].text.strip()
        else:
            answer = str(response)
        return {"status": "success", "answer": answer, "chunks_used": len(chunks)}

    except Exception as e:
        print("Error in /ai_answer:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))