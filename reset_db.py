"""
Script to reset the database tables (drops and recreates them).
This is needed because we changed project_id from INT to STRING in the Milestone model.
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlmodel import SQLModel
from src.settings.db import DatabaseSettings
from src.models import BaseTable, Project, Milestone, SponsoredProject


async def reset_db():
    """Drop all tables and recreate them."""
    
    # Create engine
    engine = create_async_engine(DatabaseSettings.get_url, future=True, echo=True)
    
    print("🗑️  Dropping all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    print("✅ All tables dropped!")
    
    print("🏗️  Creating new tables...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    print("✅ All tables created!")
    
    await engine.dispose()
    print("🎉 Database reset complete!")


if __name__ == "__main__":
    asyncio.run(reset_db())
