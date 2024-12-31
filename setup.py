from setuptools import setup, find_packages
from pathlib import Path

current_directory = Path(__file__).parent
long_description = (current_directory / "README.md").read_text(encoding="utf-8")

setup(
    name="bleujs-utils",
    version="1.0.4",  
    description="Utility package for Bleu.js, providing tools to enhance development and integration.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Pejman Haghighatnia",
    author_email="pejmanhnia@gmail.com",
    url="https://github.com/HelloblueAI/Bleu.js",
    packages=find_packages(),
    install_requires=[
        "requests>=2.20",
        "numpy>=1.21",
    ],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
    license="MIT",
    keywords="utility package bleujs tools development",
    project_urls={
        "Bug Tracker": "https://github.com/HelloblueAI/Bleu.js/issues",
        "Documentation": "https://github.com/HelloblueAI/Bleu.js#readme",
        "Source Code": "https://github.com/HelloblueAI/Bleu.js",
    },
    include_package_data=True,
    zip_safe=False,
)
