"""Compatibility shim: OpenAI settings now map to Gemini settings.

This file keeps the old import path `src.settings.openai.OpenAISettings`
working by aliasing to `GeminiSettings` from `src.settings.gemini`.
"""
from src.settings.gemini import GeminiSettings as OpenAISettings  # type: ignore
