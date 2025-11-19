from setuptools import find_packages, setup

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

requirements = [
    # Core dependencies (minimal, always required)
    "numpy>=1.24.0,<2.0.0",
    "requests>=2.31.0",
]

setup(
    name="bleu-js",
    version="1.2.1",
    author="Bleujs Team",
    author_email="support@helloblue.ai",
    description=(
        "A state-of-the-art quantum-enhanced vision system with "
        "advanced AI capabilities"
    ),
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/HelloblueAI/Bleu.js",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
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
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "bleujs=bleujs.cli:main",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["models/*", "configs/*", "data/*", "static/*", "templates/*"],
    },
        extras_require={
            # API client features
            "api": [
                "httpx>=0.24.0",
                "pydantic>=2.0.0",
            ],
            # Quantum computing features
            "quantum": [
                "qiskit>=0.40.0",
                "pennylane>=0.30.0",
            ],
            # Machine learning features
            "ml": [
                "scikit-learn>=1.2.0",
                "xgboost>=1.7.0",
                "pandas>=2.0.0",
            ],
            # Deep learning features
            "deep": [
                "torch>=2.0.0",
                "tensorflow>=2.10.0,<2.19",
            ],
            # Full installation (all features)
            "all": [
                "httpx>=0.24.0",
                "pydantic>=2.0.0",
                "qiskit>=0.40.0",
                "pennylane>=0.30.0",
                "scikit-learn>=1.2.0",
                "xgboost>=1.7.0",
                "pandas>=2.0.0",
                "torch>=2.0.0",
                "tensorflow>=2.10.0,<2.19",
            ],
            # Development tools
            "dev": [
                "pytest>=7.0.0",
                "pytest-cov>=4.0.0",
                "pytest-asyncio>=0.21.0",
                "black>=22.0.0",
                "isort>=5.0.0",
                "flake8>=4.0.0",
                "mypy>=0.900",
                "pre-commit>=2.0.0",
            ],
            # Documentation
            "docs": [
                "sphinx>=4.0.0",
                "sphinx-rtd-theme>=1.0.0",
                "sphinx-autodoc-typehints>=1.0.0",
            ],
        },
)
