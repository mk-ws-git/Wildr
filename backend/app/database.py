from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

connect_args = {}
url = settings.DATABASE_URL

if "supabase.co" in url or "pooler.supabase.com" in url:
    connect_args["ssl"] = "require"
if "pooler.supabase.com" in url:
    connect_args["statement_cache_size"] = 0

engine = create_async_engine(url, echo=False, connect_args=connect_args)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session