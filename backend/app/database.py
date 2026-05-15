from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

connect_args = {}
if "pooler.supabase.com" in settings.DATABASE_URL:
    connect_args["prepared_statement_cache_size"] = 0

engine = create_async_engine(settings.DATABASE_URL, echo=False, connect_args=connect_args)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session