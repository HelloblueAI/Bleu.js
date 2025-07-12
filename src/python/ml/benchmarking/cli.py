"""Command-line interface for quantum benchmarking and case studies."""

import argparse
import logging
from pathlib import Path

from .case_studies import QuantumCaseStudy

logger = logging.getLogger(__name__)


def setup_logging(verbose: bool = False):
    """Setup logging configuration."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )


def main():
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        description="Quantum ML Benchmarking and Case Studies"
    )

    # General options
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Enable verbose logging"
    )
    parser.add_argument(
        "-o",
        "--output-dir",
        type=str,
        default="results",
        help="Output directory for results (default: results)",
    )

    # Study selection
    parser.add_argument(
        "--medical", action="store_true", help="Run medical diagnosis case study"
    )
    parser.add_argument(
        "--financial", action="store_true", help="Run financial forecasting case study"
    )
    parser.add_argument(
        "--industrial",
        action="store_true",
        help="Run industrial optimization case study",
    )
    parser.add_argument("--all", action="store_true", help="Run all case studies")

    args = parser.parse_args()
    setup_logging(args.verbose)

    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Initialize case study
    case_study = QuantumCaseStudy()

    # Run selected studies
    if args.all or not any([args.medical, args.financial, args.industrial]):
        logger.info("Running all case studies...")
        case_study.run_all_studies()
    else:
        if args.medical:
            logger.info("Running medical diagnosis case study...")
            case_study.run_medical_diagnosis_study()
        if args.financial:
            logger.info("Running financial forecasting case study...")
            case_study.run_financial_forecasting_study()
        if args.industrial:
            logger.info("Running industrial optimization case study...")
            case_study.run_industrial_optimization_study()

    # Save results and generate report
    case_study.save_all_results(str(output_dir))
    report_file = output_dir / "quantum_advantage_report.txt"
    case_study.generate_report(str(report_file))

    logger.info(f"Results saved to {output_dir}")
    logger.info(f"Report generated at {report_file}")


if __name__ == "__main__":
    main()
