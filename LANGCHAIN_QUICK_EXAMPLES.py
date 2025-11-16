"""
Quick Example - How to use LangChain AI in your FastAPI backend
Este es un ejemplo práctico para copiar y pegar
"""

# ============================================================================
# EJEMPLO 1: Usar la función helper simple
# ============================================================================

from src.services.langchain_service import query_project_ai, summarize_project

# Datos del proyecto (como vendrían de la BD)
project_data = {
    "id": 1,
    "project_id": "proj_001",
    "name": "Decentralized Funding Platform",
    "description": "A blockchain-based platform for progressive fund release",
    "sponsor": "Polkadot Foundation",
    "budget": 5000.0,
    "status": "approved",
    "chain": "rococo",
    "entity_key": "0x2993b0c032c9f5ab94b807751f5c4cf84bfe8d81ec37ae75ea3e975ba8ef5e43",
}

# PREGUNTA simple
answer = query_project_ai(
    project_data,
    "¿Cuál es el presupuesto total del proyecto?"
)
print(f"Respuesta: {answer}\n")

# RESUMEN automático
summary = summarize_project(project_data)
print(f"Resumen:\n{summary}\n")


# ============================================================================
# EJEMPLO 2: Usar el servicio directamente
# ============================================================================

from src.services.langchain_service import get_langchain_service

service = get_langchain_service()

# PREGUNTA con más contexto
detailed_answer = service.query_entity(
    entity_data=project_data,
    question="¿Cuáles son los puntos clave de este proyecto?",
    entity_type="project"
)
print(f"Análisis detallado:\n{detailed_answer}\n")


# ============================================================================
# EJEMPLO 3: Usar en un endpoint FastAPI
# ============================================================================

from fastapi import APIRouter, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.models.sponsor import SponsoredProject
from src.services.langchain_service import get_langchain_service

router = APIRouter(prefix="/my-ai", tags=["my-ai"])

@router.get("/my-custom-query/{project_id}")
async def my_custom_query(
    project_id: int,
    custom_question: str,
    db: AsyncSession,
):
    """
    Ejemplo de endpoint personalizado que usa LangChain
    """
    try:
        # Obtener proyecto de la BD
        query = select(SponsoredProject).where(SponsoredProject.id == project_id)
        result = await db.execute(query)
        project = result.scalars().first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Convertir a diccionario
        project_data = {
            "id": project.id,
            "name": project.name,
            "budget": project.budget,
            "status": project.status,
            "sponsor": project.sponsor,
        }

        # Usar LangChain
        service = get_langchain_service()
        answer = service.query_entity(project_data, custom_question, "project")

        return {
            "project_id": project_id,
            "question": custom_question,
            "answer": answer,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# EJEMPLO 4: Analizar múltiples proyectos
# ============================================================================

from src.services.langchain_service import analyze_projects

projects_list = [
    {"id": 1, "name": "Project A", "budget": 5000, "status": "approved"},
    {"id": 2, "name": "Project B", "budget": 3000, "status": "approved"},
    {"id": 3, "name": "Project C", "budget": 10000, "status": "pending"},
]

# Comparar proyectos
comparison = analyze_projects(projects_list, "comparison")
print(f"Comparación:\n{comparison}\n")

# Análisis de riesgo
risk_analysis = analyze_projects(projects_list, "risk")
print(f"Análisis de riesgo:\n{risk_analysis}\n")


# ============================================================================
# EJEMPLO 5: Generar reporte
# ============================================================================

service = get_langchain_service()

report = service.generate_report(
    entity_data=project_data,
    report_type="detailed"  # o "summary" o "technical"
)
print(f"Reporte:\n{report}\n")


# ============================================================================
# NOTAS
# ============================================================================

"""
✅ Lo bonito de esta implementación:

1. FÁCIL DE USAR
   - Solo importar y llamar funciones
   - Sin configuración adicional

2. FLEXIBLE
   - Úsalo en endpoints
   - Úsalo en servicios
   - Úsalo en el backend donde lo necesites

3. POTENTE
   - Usa Gemini 2.0 Flash (rápido + potente)
   - Manejo de errores automático
   - Logging detallado

4. EJEMPLOS READY-TO-USE
   - Copiar y pegar funciona
   - No necesita modificaciones

5. DOCUMENTACIÓN
   - Ver LANGCHAIN_INTEGRATION.md para más detalles
"""
