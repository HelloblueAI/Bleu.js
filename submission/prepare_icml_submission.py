#!/usr/bin/env python3
"""
ICML 2025 Submission Preparation Script
Automates the process of preparing materials for ICML 2025 submission.
"""

import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Optional


class ICMLSubmissionPreparator:
    def __init__(self):
        self.base_dir = Path("submission/icml_2025")
        self.output_dir = self.base_dir / "final_submission"
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    def setup_directories(self):
        """Create necessary directories for submission."""
        print("Setting up submission directories...")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def convert_to_latex(self):
        """Convert markdown to LaTeX using pandoc."""
        print("Converting paper to LaTeX format...")
        input_file = self.base_dir / "icml_2025_submission.md"
        output_file = self.output_dir / "paper.tex"
        template_file = Path("submission/icml2025.tex")

        try:
            subprocess.run(
                [
                    "pandoc",
                    str(input_file),
                    "-o",
                    str(output_file),
                    f"--template={template_file}",
                ],
                check=True,
            )
            print("✓ Paper converted to LaTeX")
        except subprocess.CalledProcessError as e:
            print(f"Error converting to LaTeX: {e}")
            raise

    def prepare_supplementary(self):
        """Prepare supplementary materials package."""
        print("Preparing supplementary materials...")
        supp_dir = self.output_dir / "supplementary"
        supp_dir.mkdir(exist_ok=True)

        # Copy supplementary markdown
        shutil.copy(
            self.base_dir / "icml_2025_supplementary.md", supp_dir / "supplementary.md"
        )

        # Copy package and test images
        shutil.copytree(
            self.base_dir / "package", supp_dir / "package", dirs_exist_ok=True
        )
        shutil.copytree(
            self.base_dir / "test_images", supp_dir / "test_images", dirs_exist_ok=True
        )

        # Create ZIP archive
        shutil.make_archive(str(self.output_dir / "supplementary"), "zip", supp_dir)
        print("✓ Supplementary materials prepared")

    def prepare_code(self):
        """Prepare code package."""
        print("Preparing code package...")
        code_dir = self.output_dir / "code"
        code_dir.mkdir(exist_ok=True)

        # Copy relevant code files
        code_files = [
            "src/python/ml/computer_vision/quantum_attention.py",
            "src/python/ml/computer_vision/quantum_fusion.py",
            "src/quantum_py/optimization/contest_strategy.py",
        ]

        for file in code_files:
            src = Path(file)
            dst = code_dir / src.name
            shutil.copy(src, dst)

        # Create ZIP archive
        shutil.make_archive(str(self.output_dir / "code"), "zip", code_dir)
        print("✓ Code package prepared")

    def create_readme(self):
        """Create README for submission package."""
        print("Creating submission README...")
        readme_content = f"""# ICML 2025 Submission Package

## Contents
1. paper.tex - Main paper in ICML LaTeX format
2. supplementary.zip - Supplementary materials
3. code.zip - Implementation code

## Submission Details
- Submission ID: {self.timestamp}
- Prepared on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## Instructions
1. Upload paper.tex to the ICML submission system
2. Upload supplementary.zip as supplementary materials
3. Upload code.zip as code submission

## Contact
For any questions about this submission, please contact:
- Primary Contact: [Your Email]
- Backup Contact: [Team Member Email]
"""

        with open(self.output_dir / "README.md", "w") as f:
            f.write(readme_content)
        print("✓ README created")

    def prepare_submission(self):
        """Run all preparation steps."""
        try:
            self.setup_directories()
            self.convert_to_latex()
            self.prepare_supplementary()
            self.prepare_code()
            self.create_readme()

            print("\nSubmission package prepared successfully!")
            print(f"Location: {self.output_dir}")
            print("\nNext steps:")
            print("1. Review the prepared materials")
            print("2. Register on ICML platform")
            print("3. Submit before February 15, 2025")

        except Exception as e:
            print(f"\nError preparing submission: {e}")
            raise


def prepare_paper(input_file: Path, output_file: Path, template_file: Path) -> None:
    """Convert paper from Markdown to LaTeX format."""
    try:
        subprocess.run(
            [
                "pandoc",
                str(input_file),
                "-o",
                str(output_file),
                f"--template={template_file}",
            ],
            check=True,
        )
        print("✓ Paper converted to LaTeX")
    except subprocess.CalledProcessError as e:
        print(f"Error converting paper: {e}")


def prepare_code(code_dir: Path, output_dir: Path) -> None:
    """Prepare code for submission."""
    try:
        if not output_dir.exists():
            output_dir.mkdir(parents=True)

        # Copy code files
        for file in code_dir.glob("**/*.py"):
            relative_path = file.relative_to(code_dir)
            dest_file = output_dir / relative_path
            dest_file.parent.mkdir(parents=True, exist_ok=True)
            dest_file.write_text(file.read_text())

        print("✓ Code prepared for submission")
    except Exception as e:
        print(f"Error preparing code: {e}")


def prepare_supplementary(supp_dir: Path, output_dir: Path) -> None:
    """Prepare supplementary materials."""
    try:
        if not output_dir.exists():
            output_dir.mkdir(parents=True)

        # Copy supplementary files
        for file in supp_dir.glob("**/*"):
            if file.is_file():
                relative_path = file.relative_to(supp_dir)
                dest_file = output_dir / relative_path
                dest_file.parent.mkdir(parents=True, exist_ok=True)
                dest_file.write_bytes(file.read_bytes())

        print("✓ Supplementary materials prepared")
    except Exception as e:
        print(f"Error preparing supplementary materials: {e}")


def main() -> None:
    """Prepare ICML submission."""
    # Define paths
    paper_path = Path("paper/main.md")
    template_path = Path("paper/template.tex")
    output_paper_path = Path("submission/paper.tex")

    code_dir = Path("src/quantum")
    output_code_dir = Path("submission/code")

    supp_dir = Path("supplementary")
    output_supp_dir = Path("submission/supplementary")

    # Prepare each component
    prepare_paper(paper_path, output_paper_path, template_path)
    prepare_code(code_dir, output_code_dir)
    prepare_supplementary(supp_dir, output_supp_dir)


if __name__ == "__main__":
    main()
