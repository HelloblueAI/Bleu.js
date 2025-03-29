#!/usr/bin/env python3
"""
Bleu.js CLI - Command-line interface for the quantum-enhanced vision system
"""

import argparse
import logging
from pathlib import Path

from .quantum_detector import AdvancedQuantumDetector
from .utils import setup_logging


def main():
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        description="Bleu.js - Quantum-Enhanced Vision System"
    )
    parser.add_argument("--input", "-i", required=True, help="Input image path")
    parser.add_argument("--output", "-o", help="Output directory for results")
    parser.add_argument(
        "--confidence", "-c", type=float, default=0.1, help="Confidence threshold"
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable verbose logging"
    )

    args = parser.parse_args()

    # Setup logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    setup_logging(log_level)

    # Initialize detector
    detector = AdvancedQuantumDetector(confidence_threshold=args.confidence)

    # Process image
    input_path = Path(args.input)
    if not input_path.exists():
        logging.error(f"Input file not found: {input_path}")
        return 1

    try:
        results = detector.detect_objects(str(input_path))
        logging.info(f"Detection results: {results}")

        # Save results if output directory specified
        if args.output:
            output_dir = Path(args.output)
            output_dir.mkdir(parents=True, exist_ok=True)
            results_file = output_dir / f"{input_path.stem}_results.json"
            results.save_to_json(str(results_file))
            logging.info(f"Results saved to: {results_file}")

        return 0
    except Exception as e:
        logging.error(f"Error processing image: {e}")
        return 1


if __name__ == "__main__":
    exit(main())
