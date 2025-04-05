from setuptools import find_packages, setup

setup(
    name="bleu-quantum",
    version="1.0.0",
    description="Advanced quantum computing capabilities for Bleu.js",
    author="Bleu.js Team",
    author_email="team@bleu.js",
    packages=find_packages(),
    install_requires=[
        "numpy>=1.21.0",
        "qiskit>=0.34.0",
        "cirq>=0.12.0",
        "pennylane>=0.19.0",
        "matplotlib>=3.4.3",
        "scipy>=1.7.1",
    ],
    extras_require={
        "dev": [
            "pytest>=6.2.5",
            "pytest-asyncio>=0.15.1",
            "black>=21.7b0",
            "isort>=5.9.3",
            "mypy>=0.910",
            "flake8>=3.9.2",
        ]
    },
    python_requires=">=3.8",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Topic :: Scientific/Engineering :: Physics",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    keywords="quantum-computing, quantum-machine-learning, quantum-ai, bleu.js",
    url="https://github.com/bleu-js/bleu-quantum",
    project_urls={
        "Bug Tracker": "https://github.com/bleu-js/bleu-quantum/issues",
        "Documentation": "https://bleu-js.github.io/bleu-quantum",
        "Source Code": "https://github.com/bleu-js/bleu-quantum",
    },
)
