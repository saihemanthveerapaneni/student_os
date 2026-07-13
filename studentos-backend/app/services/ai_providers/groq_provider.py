import httpx
from app.config import settings


class GroqProvider:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY or settings.OPENAI_API_KEY
        self.url = "https://api.groq.com/openai/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def generate_response(self, prompt: str, system_prompt: str = "") -> str:
        if not self.api_key or "mock" in self.api_key or "your-" in self.api_key:
            return self._mock_response(prompt)

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1024,
            "temperature": 0.7,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.url, headers=self.headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                return f"Groq error (status {response.status_code}): {response.text}"
        except Exception as e:
            return f"Groq connection failed: {str(e)}"

    def _mock_response(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "summarize" in prompt_lower or "summary" in prompt_lower:
            return (
                "Here is an AI-generated summary of your notes:\n"
                "- Core Concept: Subject focuses on understanding primary structures.\n"
                "- Formula: Force (F) = mass (m) * acceleration (a).\n"
                "- Action Item: Build flashcards for active recall and self-quizzing."
            )
        if "quiz" in prompt_lower or "mcq" in prompt_lower:
            return (
                '[{"question": "What is the primary function of mitochondria?", "options": ["Protein synthesis", "Energy production (ATP)", "Waste removal", "Cell division"], "correct_index": 1}]'
            )
        return "Groq is ready to help with your studies. What would you like to tackle next?"
