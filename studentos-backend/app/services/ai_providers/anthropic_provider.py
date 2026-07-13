import httpx
from app.config import settings

class AnthropicProvider:
    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.url = "https://api.anthropic.com/v1/messages"
        self.headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

    async def generate_response(self, prompt: str, system_prompt: str = "") -> str:
        if not self.api_key or "mock" in self.api_key or "your-" in self.api_key:
            # Fallback mock response generator
            return self._mock_response(prompt)

        payload = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 1024,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.url, headers=self.headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return data["content"][0]["text"]
                else:
                    return f"Anthropic error (status {response.status_code}): {response.text}"
        except Exception as e:
            return f"Anthropic connection failed: {str(e)}"

    def _mock_response(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "summarize" in prompt_lower or "summary" in prompt_lower:
            return (
                "Here is an AI-generated summary of your notes:\n"
                "- Core Concept: Subject focuses on understanding primary structures.\n"
                "- Formula: Force (F) = mass (m) * acceleration (a).\n"
                "- Action Item: Build flashcards for active recall and self-quizzing."
            )
        elif "quiz" in prompt_lower or "mcq" in prompt_lower:
            return (
                '[{"question": "What is the primary function of mitochondria?", "options": ["Protein synthesis", "Energy production (ATP)", "Waste removal", "Cell division"], "correct_index": 1}]'
            )
        else:
            return "Yo! Ready to crush some study goals today? What course are we conquering next?"
