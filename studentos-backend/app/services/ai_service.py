import json
from app.config import settings
from app.services.ai_providers.anthropic_provider import AnthropicProvider
from app.services.ai_providers.openai_provider import OpenAIProvider
from app.services.ai_providers.groq_provider import GroqProvider

class AIService:
    def __init__(self):
        self.provider_name = settings.AI_PROVIDER
        if self.provider_name == "openai":
            self.provider = OpenAIProvider()
        elif self.provider_name == "groq":
            self.provider = GroqProvider()
        else:
            self.provider = AnthropicProvider()

    async def get_chat_response(self, user_message: str, history: list = None) -> str:
        system_prompt = "You are OS Bot, a studious and friendly neubrutalist AI assistant built into StudentOS. Help students with planning, timetables, and academic recall."
        
        # Build history context
        context = ""
        if history:
            for msg in history:
                role = "Student" if msg.get("role") == "user" else "OS Bot"
                context += f"{role}: {msg.get('message')}\n"
        
        prompt = f"{context}Student: {user_message}\nOS Bot:"
        return await self.provider.generate_response(prompt, system_prompt)

    async def generate_quiz(self, notes_text: str) -> list:
        system_prompt = (
            "You are a quiz generation engine. Generate a list of multiple-choice questions based on the provided text. "
            "You MUST respond ONLY with a raw JSON array matching this exact format, with no markdown code blocks or wrapper text:\n"
            '[{"question": "What is ...?", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_index": 0}]'
        )
        prompt = f"Generate 3 MCQ questions based on this study material:\n\n{notes_text}"
        response_text = await self.provider.generate_response(prompt, system_prompt)
        
        # Strip markdown wrappers if any
        stripped = response_text.strip()
        if stripped.startswith("```"):
            lines = stripped.split("\n")
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                lines = lines[1:-1]
            stripped = "\n".join(lines).strip()

        try:
            return json.loads(stripped)
        except Exception:
            # Fallback mock question list in case response JSON is invalid
            return [
                {
                    "question": "What is the formula representing Newton's Second Law of Motion?",
                    "options": ["E = mc²", "F = ma", "v = d/t", "P = W/t"],
                    "correct_index": 1
                },
                {
                    "question": "Which process involves the movement of water across a semipermeable membrane?",
                    "options": ["Active transport", "Facilitated diffusion", "Osmosis", "Endocytosis"],
                    "correct_index": 2
                }
            ]

    async def generate_summary(self, notes_text: str) -> list:
        system_prompt = (
            "You are a summarization bot. Generate exactly 3 key bullet points summarizing the notes. "
            "Respond only with bullet points starting with a hyphen (-) and newlines."
        )
        prompt = f"Summarize this note material:\n\n{notes_text}"
        response_text = await self.provider.generate_response(prompt, system_prompt)
        
        # Split by newline and clean bullets
        bullets = []
        for line in response_text.split("\n"):
            line = line.strip()
            if line.startswith("-") or line.startswith("*"):
                bullets.append(line.lstrip("-* ").strip())
        
        # Fallback if parsing failed
        if not bullets:
            bullets = [
                "Key Concept: Summary notes are compressed to reduce load.",
                "Review Item: Contrast active vs passive cellular transport.",
                "Next Step: Practice active recall on this outline."
            ]
        return bullets

ai_service = AIService()
