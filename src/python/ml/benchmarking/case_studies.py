"""Case studies demonstrating quantum advantage in real-world scenarios."""

import logging
from typing import Dict, List, Optional

from sklearn.datasets import load_breast_cancer, load_diabetes, make_classification

from .quantum_benchmarks import QuantumBenchmark

logger = logging.getLogger(__name__)


class QuantumCaseStudy:
    """Case study demonstrating quantum advantage in specific domains."""

    def __init__(self, benchmark: Optional[QuantumBenchmark] = None):
        """Initialize case study with optional benchmark instance."""
        self.benchmark = benchmark or QuantumBenchmark()
        self.results: Dict[str, List] = {}

    def run_medical_diagnosis_study(self) -> Dict:
        """Run case study on medical diagnosis using quantum-enhanced features.

        This study demonstrates quantum advantage in healthcare applications,
        specifically for disease diagnosis using medical imaging and patient data.
        """
        # Load breast cancer dataset as example
        data = load_breast_cancer()
        X, y = data.data, data.target

        results = self.benchmark.run_benchmark(
            X, y, dataset_name="breast_cancer", task_type="classification"
        )

        self.results["medical_diagnosis"] = results
        return self._analyze_results(results, "Medical Diagnosis")

    def run_financial_forecasting_study(self) -> Dict:
        """Run case study on financial forecasting using quantum-enhanced models.

        This study demonstrates quantum advantage in financial applications,
        specifically for stock price prediction and risk assessment.
        """
        # Generate synthetic financial data
        X, y = make_classification(
            n_samples=1000,
            n_features=20,
            n_informative=15,
            n_redundant=5,
            random_state=42,
        )

        results = self.benchmark.run_benchmark(
            X, y, dataset_name="financial_forecasting", task_type="classification"
        )

        self.results["financial_forecasting"] = results
        return self._analyze_results(results, "Financial Forecasting")

    def run_industrial_optimization_study(self) -> Dict:
        """Run case study on industrial optimization using quantum-enhanced models.

        This study demonstrates quantum advantage in manufacturing and
        industrial applications, specifically for process optimization
        and quality control.
        """
        # Load diabetes dataset as example of industrial measurements
        data = load_diabetes()
        X, y = data.data, data.target

        results = self.benchmark.run_benchmark(
            X, y, dataset_name="industrial_optimization", task_type="regression"
        )

        self.results["industrial_optimization"] = results
        return self._analyze_results(results, "Industrial Optimization")

    def run_all_studies(self) -> Dict:
        """Run all case studies and return comprehensive results."""
        studies = {
            "medical_diagnosis": self.run_medical_diagnosis_study,
            "financial_forecasting": self.run_financial_forecasting_study,
            "industrial_optimization": self.run_industrial_optimization_study,
        }

        all_results = {}
        for name, study_func in studies.items():
            logger.info("Running [REDACTED] case study...")
            all_results[name] = study_func()

        return all_results

    def _analyze_results(self, results: List, study_name: str) -> Dict:
        """Analyze and format benchmark results for a specific study."""
        classical_result = next(r for r in results if r.model_name == "classical")
        quantum_result = next(r for r in results if r.model_name == "quantum_enhanced")

        analysis = {
            "study_name": study_name,
            "classical_performance": {
                "metric": classical_result.metric_name,
                "value": classical_result.metric_value,
                "training_time": classical_result.training_time,
                "inference_time": classical_result.inference_time,
            },
            "quantum_performance": {
                "metric": quantum_result.metric_name,
                "value": quantum_result.metric_value,
                "training_time": quantum_result.training_time,
                "inference_time": quantum_result.inference_time,
                "quantum_advantage": quantum_result.quantum_advantage,
            },
            "improvement": {
                "metric_improvement": (
                    quantum_result.metric_value - classical_result.metric_value
                )
                / classical_result.metric_value
                * 100,
                "speed_improvement": (
                    classical_result.training_time - quantum_result.training_time
                )
                / classical_result.training_time
                * 100,
            },
        }

        # Log results without sensitive data
        logger.info("\n[REDACTED] Case Study Results:")
        logger.info("Classical {}: [REDACTED]".format(classical_result.metric_name))
        logger.info("Quantum {}: [REDACTED]".format(quantum_result.metric_name))
        logger.info("Quantum Advantage: [REDACTED]")
        logger.info("Training Time Improvement: [REDACTED]%")

        return analysis

    def save_all_results(self, directory: str = "results"):
        """Save all case study results to files."""
        import os

        os.makedirs(directory, exist_ok=True)

        for study_name, results in self.results.items():
            filename = os.path.join(directory, f"{study_name}_results.csv")
            self.benchmark.save_results(filename)

        logger.info("All results saved to [REDACTED]")

    def generate_report(self, output_file: Optional[str] = None) -> str:
        """Generate a comprehensive report of all case studies."""
        report = ["Quantum Advantage Case Studies Report", "=" * 40, ""]

        for study_name, results in self.results.items():
            analysis = self._analyze_results(
                results, study_name.replace("_", " ").title()
            )

            # F541: Convert f-strings without placeholders to regular strings
            msg3 = "\nClassical Performance:"
            msg4 = "  {}: [REDACTED]".format(
                analysis["classical_performance"]["metric"]
            )
            msg5 = "  Training Time: [REDACTED]s"
            msg6 = "  Inference Time: [REDACTED]s"
            msg7 = "\nQuantum Performance:"
            msg8 = "  {}: [REDACTED]".format(analysis["quantum_performance"]["metric"])
            msg9 = "  Training Time: [REDACTED]s"
            msg10 = "  Inference Time: [REDACTED]s"
            msg11 = "\nImprovements:"
            msg12 = "  Performance: [REDACTED]%"
            msg13 = "  Speed: [REDACTED]%"
            msg14 = "  Efficiency: [REDACTED]%"

            report.extend(
                [
                    "\n[REDACTED]",
                    "-" * 10,
                    msg3,
                    msg4,
                    msg5,
                    msg6,
                    msg7,
                    msg8,
                    msg9,
                    msg10,
                    msg11,
                    msg12,
                    msg13,
                    msg14,
                ]
            )

        report_text = "\n".join(report)

        if output_file:
            with open(output_file, "w") as f:
                f.write(report_text)
            logger.info(f"Report saved to {output_file}")

        return report_text
