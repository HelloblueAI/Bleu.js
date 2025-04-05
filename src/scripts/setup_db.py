import os
import subprocess

from dotenv import load_dotenv

load_dotenv()


def setup_database():
    """Set up the PostgreSQL database."""
    # Get database configuration
    db_name = os.getenv("DB_NAME", "bleu_js")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "")

    # Create PostgreSQL user if it doesn't exist
    try:
        subprocess.run(["createuser", "-s", db_user], check=True)
        print(f"Created PostgreSQL user: {db_user}")
    except subprocess.CalledProcessError as e:
        if e.returncode != 1:  # Ignore error if user already exists
            print(f"Error creating user: {str(e)}")
            raise

    # Create database if it doesn't exist
    try:
        subprocess.run(["createdb", db_name], check=True)
        print(f"Created database: {db_name}")
    except subprocess.CalledProcessError as e:
        if e.returncode != 1:  # Ignore error if database already exists
            print(f"Error creating database: {str(e)}")
            raise

    # Set password for the user
    if db_password:
        try:
            subprocess.run(
                [
                    "psql",
                    "-d",
                    db_name,
                    "-c",
                    f"ALTER USER {db_user} WITH PASSWORD '{db_password}';",
                ],
                check=True,
            )
            print(f"Set password for user: {db_user}")
        except subprocess.CalledProcessError as e:
            print(f"Error setting password: {str(e)}")
            raise


if __name__ == "__main__":
    setup_database()
