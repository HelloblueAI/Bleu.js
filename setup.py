from setuptools import find_packages, setup

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [
        line.strip() for line in fh if line.strip() and not line.startswith("#")
    ]

setup(
    name="bleu-js",
    version="1.1.3",
    author="Pejman Haghighatnia",
    author_email="support@helloblue.ai",
    description="A state-of-the-art quantum-enhanced vision system with advanced AI capabilities",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/HelloblueAI/Bleu.js",
    packages=find_packages(where="python"),
    package_dir={"": "python"},
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Science/Research",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Scientific/Engineering :: Quantum Computing",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=[
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "alembic",
        "psycopg2-binary",
        "python-jose[cryptography]",
        "python-multipart",
        "python-dotenv",
        "pydantic",
        "pydantic-settings",
    ],
    entry_points={
        "console_scripts": [
            "bleujs=cli:main",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["models/*", "configs/*", "data/*", "static/*", "templates/*"],
    },
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "isort>=5.0.0",
            "flake8>=4.0.0",
            "mypy>=0.900",
            "pre-commit>=2.0.0",
        ],
        "docs": [
            "sphinx>=4.0.0",
            "sphinx-rtd-theme>=1.0.0",
            "sphinx-autodoc-typehints>=1.0.0",
        ],
    },
)
