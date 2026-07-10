import time
import logging
from typing import List, Dict, Any, Generator
from groq import Groq
from backend.config import settings

# Configure logger
logger = logging.getLogger("studentos.ai_service")
logging.basicConfig(level=logging.INFO)

class AIService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        if not self.api_key:
            logger.warning("GROQ_API_KEY is not set in config/environment.")
        
        self.is_xai = self.api_key.startswith("xai-") if self.api_key else False
        
        if self.api_key:
            if self.is_xai:
                logger.info("xAI API key detected. Setting base_url to https://api.x.ai/v1")
                self.client = Groq(api_key=self.api_key, base_url="https://api.x.ai/v1")
                self.models = {
                    "llama3.3": "grok-2-1212",
                    "llama3.1": "grok-2-latest",
                    "qwen": "grok-2-latest",
                    "deepseek": "grok-2-latest"
                }
                self.default_model = "grok-2-1212"
            else:
                self.client = Groq(api_key=self.api_key)
                self.models = {
                    "llama3.3": "llama-3.3-70b-specdec",
                    "llama3.1": "llama-3.1-8b-instant",
                    "qwen": "qwen-2.5-32b",
                    "deepseek": "deepseek-r1-distill-llama-70b"
                }
                self.default_model = self.models["llama3.3"]
        else:
            self.client = None
            self.models = {}
            self.default_model = ""

    def _get_model_name(self, model_key: str) -> str:
        return self.models.get(model_key.lower(), self.default_model)

    def _get_system_prompt(self, feature: str) -> str:
        prompts = {
            "study_chat": (
                "You are StudentOS AI, an empathetic, highly structured, and knowledgeable college study assistant. "
                "Help the student learn key concepts, resolve doubts, and organize thoughts. Use markdown extensively, "
                "bold key phrases, and keep your explanations clear, concise, and academically rigorous."
            ),
            "explain_concepts": (
                "You are an expert university professor. Explain the requested concept with clarity. "
                "Structure your response with: 1) High-level Summary, 2) Simple Analogy, 3) Detailed Breakdown, "
                "4) Common Pitfalls/Misconceptions, and 5) A Quick Check Question. Use clean formatting."
            ),
            "summarize_notes": (
                "You are an expert academic editor. Take the user's raw notes and produce a clean, comprehensive summary. "
                "Structure it into: Key Objectives, Core Concepts Explained, Action Items, and a list of Technical Terms "
                "with simple definitions."
            ),
            "generate_quiz": (
                "You are an academic examiner. Generate a quiz based on the text or notes provided. "
                "Format: Return 5 Multiple-Choice Questions. Each question must have 4 options (A, B, C, D), "
                "the correct answer, and a detailed explanation of why it is correct. Use JSON or clean Markdown."
            ),
            "generate_flashcards": (
                "Create a set of 8 flashcards from the provided notes. "
                "Format: Return them as an itemized list. Each card should have 'Front: [Question/Concept]' "
                "and 'Back: [Answer/Explanation]'."
            ),
            "study_plan": (
                "You are a professional study strategist. Based on the user's courses, tasks, and deadlines, "
                "create a structured study schedule. Define specific daily objectives, estimate session duration, "
                "and allocate time for rest to prevent burnout. Focus on 'Cognitive Calm' and organization."
            ),
            "assignment_help": (
                "You are an academic coach. Help the student with their assignment by explaining the concepts and "
                "showing step-by-step methods to solve similar problems. DO NOT just write out the final answer directly "
                "if it is a homework question. Guide them to find the answer themselves."
            ),
            "code_help": (
                "You are a senior software engineer. Review, debug, or write the requested code. "
                "Explain the code block, point out time/space complexity using Big O notation, "
                "and suggest improvements or modern practices."
            ),
            "learning_recommendations": (
                "You are a dashboard advisor. Analyze the student's current status: low attendance alerts or pending assignments. "
                "Provide 3-4 highly actionable recommendations (e.g. which notes to review, which study sessions to schedule) "
                "to improve grades and attendance."
            )
        }
        return prompts.get(feature, prompts["study_chat"])

    def generate_response_stream(
        self, 
        messages: List[Dict[str, str]], 
        feature: str = "study_chat", 
        model_key: str = "llama3.3",
        temperature: float = 0.7,
        max_retries: int = 3
    ) -> Generator[str, None, None]:
        """
        Generates a streaming completion from Groq API with error handling and retry logic.
        """
        if not self.client:
            yield "Error: Groq API key is missing. Please set the GROQ_API_KEY environment variable."
            return

        model_name = self._get_model_name(model_key)
        system_prompt = self._get_system_prompt(feature)

        # Inject system prompt at the beginning of the messages list
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages

        attempt = 0
        while attempt < max_retries:
            try:
                logger.info(f"Connecting to Groq API using model={model_name}, attempt={attempt + 1}")
                completion = self.client.chat.completions.create(
                    model=model_name,
                    messages=formatted_messages,
                    temperature=temperature,
                    stream=True
                )
                for chunk in completion:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
                return  # Successful request, exit generator
            except Exception as e:
                attempt += 1
                logger.error(f"Error calling Groq API: {e}. Attempt {attempt} of {max_retries}")
                if attempt >= max_retries:
                    yield f"\n\n[Error: Failed to connect to AI Service after {max_retries} attempts: {str(e)}]"
                else:
                    time.sleep(2 ** attempt)  # Exponential backoff
