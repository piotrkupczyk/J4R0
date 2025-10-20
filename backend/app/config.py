import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    host = os.getenv("DB_HOST", "127.0.0.1")
    port = os.getenv("DB_PORT", "5432")
    user = os.getenv("DB_USER", "postgres")
    pwd  = os.getenv("DB_PASSWORD", "")
    name = os.getenv("DB_NAME", "postgres")
    DATABASE_URL = (
        f"postgresql+psycopg2://{user}:{quote_plus(pwd)}@{host}:{port}/{name}"
    )

SSL_MODE = os.getenv("DB_SSLMODE", "prefer") 
