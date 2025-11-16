"""
LangChain Service - AI-powered queries on Arkiv entities
Provides easy-to-use interface for asking questions about projects stored in Arkiv
"""

import json
import os
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from loguru import logger


class LangChainService:
    """Service for AI-powered queries using LangChain and Google Gemini"""

    # Singleton instance
    _instance: Optional["LangChainService"] = None
    _llm: Optional[ChatGoogleGenerativeAI] = None

    def __init__(self):
        """Initialize LangChain service with Gemini"""
        # Get Google API Key from environment
        google_api_key = os.getenv("GOOGLE_API_KEY")
        
        if not google_api_key:
            raise ValueError(
                "GOOGLE_API_KEY not found in environment variables. "
                "Please set it in .env.local"
            )

        self._llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=google_api_key,
            temperature=0.7,
        )
        logger.info("✅ LangChain service initialized with Gemini")

    @classmethod
    def get_instance(cls) -> "LangChainService":
        """Get or create singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def query_entity(
        self,
        entity_data: dict,
        question: str,
        entity_type: str = "project",
    ) -> str:
        """
        Ask a question about a specific Arkiv entity.

        Args:
            entity_data: Dictionary containing entity information
            question: Question to ask about the entity
            entity_type: Type of entity (e.g., 'project', 'milestone')

        Returns:
            Answer from Gemini based on entity data
        """
        try:
            # Prepare context
            entity_json = json.dumps(entity_data, indent=2)

            system_prompt = f"""You are a helpful assistant analyzing blockchain project data.
You have access to a {entity_type} entity stored in Arkiv blockchain.

Entity Data:
{entity_json}

Please answer questions about this {entity_type} clearly and concisely.
Use the provided data to give accurate answers."""

            # Create message
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=question),
            ]

            # Get response
            response = self._llm.invoke(messages)

            logger.info(
                f"✅ LangChain query successful - Entity: {entity_type}, Question: {question[:50]}..."
            )

            return response.content

        except Exception as e:
            logger.error(f"❌ Error in LangChain query: {str(e)}")
            raise

    def summarize_entity(
        self,
        entity_data: dict,
        entity_type: str = "project",
    ) -> str:
        """
        Generate a summary of an Arkiv entity.

        Args:
            entity_data: Dictionary containing entity information
            entity_type: Type of entity

        Returns:
            Summary of the entity
        """
        try:
            entity_json = json.dumps(entity_data, indent=2)

            system_prompt = f"""You are a blockchain data analyst.
Analyze this {entity_type} and provide a concise summary highlighting key information.

Entity Data:
{entity_json}

Provide a clear, professional summary."""

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content="Please summarize this entity."),
            ]

            response = self._llm.invoke(messages)

            logger.info(f"✅ Entity summary generated for {entity_type}")

            return response.content

        except Exception as e:
            logger.error(f"❌ Error generating summary: {str(e)}")
            raise

    def analyze_entities(
        self,
        entities: list[dict],
        analysis_type: str = "general",
    ) -> str:
        """
        Analyze multiple entities and provide insights.

        Args:
            entities: List of entity dictionaries
            analysis_type: Type of analysis (e.g., 'comparison', 'trends', 'risk')

        Returns:
            Analysis result
        """
        try:
            entities_json = json.dumps(entities, indent=2)

            analysis_prompts = {
                "comparison": "Compare these entities and highlight similarities and differences.",
                "trends": "Identify trends across these entities.",
                "risk": "Assess potential risks based on these entities.",
                "performance": "Analyze the performance metrics across these entities.",
                "general": "Provide a general analysis of these entities.",
            }

            user_prompt = analysis_prompts.get(
                analysis_type, analysis_prompts["general"]
            )

            system_prompt = f"""You are a blockchain data analyst specializing in project funding.
Analyze the following {len(entities)} entities and provide insights.

Entities:
{entities_json}

{user_prompt}"""

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content="Please proceed with the analysis."),
            ]

            response = self._llm.invoke(messages)

            logger.info(
                f"✅ Analysis completed - Type: {analysis_type}, Entities: {len(entities)}"
            )

            return response.content

        except Exception as e:
            logger.error(f"❌ Error in entity analysis: {str(e)}")
            raise

    def generate_report(
        self,
        entity_data: dict,
        report_type: str = "detailed",
    ) -> str:
        """
        Generate a detailed report for an entity.

        Args:
            entity_data: Entity dictionary
            report_type: Type of report ('summary', 'detailed', 'technical')

        Returns:
            Generated report
        """
        try:
            entity_json = json.dumps(entity_data, indent=2)

            report_instructions = {
                "summary": "Create a one-page executive summary.",
                "detailed": "Create a comprehensive detailed report with all relevant sections.",
                "technical": "Create a technical report with deep analysis and metrics.",
            }

            instruction = report_instructions.get(
                report_type, report_instructions["detailed"]
            )

            system_prompt = f"""You are a professional report writer for blockchain projects.
{instruction}

Entity Data:
{entity_json}

Format the report professionally with clear sections and bullet points."""

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Generate a {report_type} report for this entity."),
            ]

            response = self._llm.invoke(messages)

            logger.info(f"✅ Report generated - Type: {report_type}")

            return response.content

        except Exception as e:
            logger.error(f"❌ Error generating report: {str(e)}")
            raise


# Convenient functions for easy usage

def get_langchain_service() -> LangChainService:
    """Get LangChain service instance"""
    return LangChainService.get_instance()


def query_project_ai(entity_data: dict, question: str) -> str:
    """
    Simple function to ask a question about a project entity.

    Usage:
        answer = query_project_ai(project_data, "What is the budget?")
    """
    service = get_langchain_service()
    return service.query_entity(entity_data, question, "project")


def summarize_project(entity_data: dict) -> str:
    """
    Simple function to summarize a project.

    Usage:
        summary = summarize_project(project_data)
    """
    service = get_langchain_service()
    return service.summarize_entity(entity_data, "project")


def analyze_projects(projects: list[dict], analysis_type: str = "general") -> str:
    """
    Simple function to analyze multiple projects.

    Usage:
        analysis = analyze_projects(projects, "comparison")
    """
    service = get_langchain_service()
    return service.analyze_entities(projects, analysis_type)
