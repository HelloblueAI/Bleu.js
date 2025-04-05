#!/usr/bin/env python3
"""
Bleujs Award Submission Automation Script
Automates the submission process for various awards
"""

import json
import logging
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

import requests

logger = logging.getLogger(__name__)


class AwardSubmitter:
    def __init__(self, base_dir: str = "submission"):
        self.base_dir = Path(base_dir).resolve()
        self.package_dir = self.base_dir / "package"
        self.awards = {
            "ICML_2025": {
                "name": "ICML 2025 Best Paper Award",
                "deadline": "2025-02-15",
                "status": "ready",
                "submission_url": "https://icml.cc/Conferences/2025/PaperSubmission",
                "package": "icml_2025_submission.zip",
                "requirements": ["paper.pdf", "code/", "README.md"],
            },
            "NeurIPS_2024": {
                "name": "NeurIPS 2024 Outstanding Paper Award",
                "deadline": "2024-05-15",
                "status": "preparing",
                "submission_url": "https://neurips.cc/Conferences/2024/PaperSubmission",
                "package": "neurips_2024_submission.zip",
            },
            "CVPR_2024": {
                "name": "CVPR 2024 Best Paper Award",
                "deadline": "2024-11-15",
                "status": "preparing",
                "submission_url": "https://cvpr.thecvf.com/",
                "package": "cvpr_2024_submission.zip",
            },
            "ECCV_2024": {
                "name": "ECCV 2024 Best Paper Award",
                "deadline": "2024-03-15",
                "status": "preparing",
                "submission_url": "https://eccv2024.ecva.net/",
                "package": "eccv_2024_submission.zip",
            },
        }

    def check_deadlines(self) -> List[str]:
        """Check which awards are approaching their deadlines."""
        today = datetime.now().date()
        upcoming = []

        for award_id, award in self.awards.items():
            deadline = datetime.strptime(award["deadline"], "%Y-%m-%d").date()
            days_remaining = (deadline - today).days

            if days_remaining <= 30:
                upcoming.append(f"{award['name']} ({days_remaining} days remaining)")

        return upcoming

    def _prepare_submission(self, award_id: str) -> None:
        """Prepare submission package for a specific award."""
        if award_id not in self.awards:
            raise ValueError(f"Invalid award ID: {award_id}")

        try:
            # Create submission directory
            submission_dir = self.base_dir / award_id
            submission_dir.mkdir(parents=True, exist_ok=True)

            # Copy files from package directory
            for item in self.package_dir.iterdir():
                if item.is_file():
                    shutil.copy2(item, submission_dir / item.name)
                elif item.is_dir():
                    shutil.copytree(
                        item, submission_dir / item.name, dirs_exist_ok=True
                    )

            # Create zip archive
            zip_path = self.base_dir / self.awards[award_id]["package"]
            shutil.make_archive(
                str(zip_path.parent / zip_path.stem), "zip", str(submission_dir)
            )

            logger.info(f"Successfully prepared submission package for {award_id}")
        except Exception as e:
            logger.error(f"Error preparing submission package: {str(e)}")
            raise

    def submit(self, award_id: str) -> None:
        """Submit package for a specific award."""
        try:
            self._prepare_submission(award_id)
            logger.info(f"Successfully submitted package for {award_id}")
        except Exception as e:
            logger.error(f"Error submitting package: {str(e)}")
            raise

    def submit_award(self, award_id: str) -> bool:
        """Submit to a specific award."""
        award = self.awards.get(award_id)
        if not award:
            print(f"Error: Award {award_id} not found")
            return False

        try:
            # Here you would implement the actual submission logic
            # This is a placeholder for the actual submission process
            print(f"Submitting to {award['name']}...")
            print(f"Package: {award['package']}")
            print(f"URL: {award['submission_url']}")

            # Update status
            self.awards[award_id]["status"] = "submitted"
            self._update_tracker()

            return True

        except Exception as e:
            print(f"Error submitting to award: {str(e)}")
            return False

    def _create_award_submission(self, award_id: str):
        """Create award-specific submission content."""
        award = self.awards[award_id]

        # Create submission file
        with open(f"submission/{award_id}/submission.md", "w") as f:
            f.write(f"# {award['name']} Submission\n\n")
            f.write("## Bleujs: Quantum-Enhanced Computer Vision\n\n")
            f.write("### Abstract\n")
            f.write(
                "Bleujs represents a groundbreaking advancement in quantum-enhanced computer vision...\n"
            )

    def _update_tracker(self):
        """Update the award tracker file."""
        with open("submission/AWARD_TRACKER.md", "w") as f:
            f.write("# Bleujs Award Submission Tracker\n\n")

            for award_id, award in self.awards.items():
                f.write(f"## {award['name']}\n")
                f.write(f"- Status: {award['status'].title()}\n")
                f.write(f"- Deadline: {award['deadline']}\n")
                f.write(f"- Package: {award['package']}\n\n")


def main():
    try:
        submitter = AwardSubmitter()
        submitter.submit("ICML_2025")
    except Exception as e:
        logger.error(f"Error in main: {str(e)}")
        raise


if __name__ == "__main__":
    main()
