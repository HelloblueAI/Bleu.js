#!/usr/bin/env python3
"""
Bleu.js CI/CD Integration Demo
==============================

This example demonstrates how to integrate Bleu.js with CI/CD pipelines,
automated testing, and deployment workflows.

Author: Pejman Haghighatnia
Company: Helloblue, Inc.
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from bleujs import BleuJS
    from bleujs.deployment import DeploymentManager
    from bleujs.testing import QuantumTestSuite
except ImportError:
    print("⚠️  Bleu.js not installed. Installing dependencies...")
    os.system("pip install -r requirements.txt")
    from bleujs import BleuJS
    from bleujs.deployment import DeploymentManager
    from bleujs.testing import QuantumTestSuite

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class BleuJSCICDDemo:
    """
    CI/CD integration demonstration for Bleu.js.

    This class showcases:
    - Automated testing with quantum components
    - Performance benchmarking
    - Security scanning
    - Deployment automation
    - Quality gates
    """

    def __init__(self):
        """Initialize the CI/CD demonstration."""
        self.setup_ci_environment()
        self.initialize_components()

    def setup_ci_environment(self):
        """Setup CI/CD environment variables and configurations."""
        logger.info("🔧 Setting up CI/CD environment...")

        # CI/CD environment variables
        os.environ["CI"] = "true"
        os.environ["BLEUJS_TEST_MODE"] = "true"
        os.environ["BLEUJS_DEPLOYMENT_MODE"] = "staging"

        # Create CI directories
        self.ci_dir = Path("ci")
        self.test_results_dir = Path("test_results")
        self.deployment_dir = Path("deployment")

        for directory in [self.ci_dir, self.test_results_dir, self.deployment_dir]:
            directory.mkdir(exist_ok=True)

        logger.info("✅ CI/CD environment setup complete")

    def initialize_components(self):
        """Initialize Bleu.js components for CI/CD."""
        logger.info("🔧 Initializing CI/CD components...")

        # Initialize Bleu.js for testing
        self.bleu = BleuJS(
            quantum_mode=True,
            test_mode=True,
            device="cpu",  # Use CPU for CI consistency
        )

        # Initialize test suite
        self.test_suite = QuantumTestSuite(
            test_types=["unit", "integration", "performance", "security"],
            quantum_enhanced=True,
        )

        # Initialize deployment manager
        self.deployment_manager = DeploymentManager(
            environment="staging", auto_deploy=True
        )

        logger.info("✅ CI/CD components initialized")

    async def run_automated_tests(self):
        """Run comprehensive automated tests."""
        logger.info("🧪 Running automated tests...")

        test_results = {
            "unit_tests": await self.run_unit_tests(),
            "integration_tests": await self.run_integration_tests(),
            "performance_tests": await self.run_performance_tests(),
            "security_tests": await self.run_security_tests(),
            "quantum_tests": await self.run_quantum_tests(),
        }

        # Save test results
        self.save_test_results(test_results)

        # Generate test report
        test_report = self.generate_test_report(test_results)

        logger.info("✅ Automated tests complete")
        return {"test_results": test_results, "test_report": test_report}

    async def run_unit_tests(self):
        """Run unit tests for Bleu.js components."""
        logger.info("🔬 Running unit tests...")

        unit_tests = [
            "test_quantum_feature_extraction",
            "test_quantum_attention",
            "test_hybrid_training",
            "test_security_encryption",
            "test_performance_monitoring",
        ]

        results = {}
        for test in unit_tests:
            try:
                result = await self.test_suite.run_unit_test(test)
                results[test] = {
                    "status": "passed" if result["success"] else "failed",
                    "duration": result.get("duration", 0),
                    "coverage": result.get("coverage", 0),
                }
            except Exception as e:
                results[test] = {"status": "error", "error": str(e)}

        return results

    async def run_integration_tests(self):
        """Run integration tests for Bleu.js workflows."""
        logger.info("🔗 Running integration tests...")

        integration_tests = [
            "test_end_to_end_processing",
            "test_quantum_classical_integration",
            "test_security_monitoring_integration",
            "test_performance_optimization",
        ]

        results = {}
        for test in integration_tests:
            try:
                result = await self.test_suite.run_integration_test(test)
                results[test] = {
                    "status": "passed" if result["success"] else "failed",
                    "duration": result.get("duration", 0),
                    "quantum_advantage": result.get("quantum_advantage", 0),
                }
            except Exception as e:
                results[test] = {"status": "error", "error": str(e)}

        return results

    async def run_performance_tests(self):
        """Run performance benchmarks."""
        logger.info("⚡ Running performance tests...")

        performance_tests = [
            "benchmark_quantum_processing",
            "benchmark_classical_processing",
            "benchmark_memory_usage",
            "benchmark_scalability",
        ]

        results = {}
        for test in performance_tests:
            try:
                result = await self.test_suite.run_performance_test(test)
                results[test] = {
                    "status": "passed" if result["success"] else "failed",
                    "speedup": result.get("speedup", 1.0),
                    "memory_usage": result.get("memory_usage", 0),
                    "quantum_advantage": result.get("quantum_advantage", 0),
                }
            except Exception as e:
                results[test] = {"status": "error", "error": str(e)}

        return results

    async def run_security_tests(self):
        """Run security vulnerability scans."""
        logger.info("🔒 Running security tests...")

        security_tests = [
            "vulnerability_scan",
            "quantum_resistance_test",
            "encryption_strength_test",
            "data_integrity_test",
        ]

        results = {}
        for test in security_tests:
            try:
                result = await self.test_suite.run_security_test(test)
                results[test] = {
                    "status": "passed" if result["success"] else "failed",
                    "vulnerabilities": result.get("vulnerabilities", []),
                    "security_score": result.get("security_score", 0),
                }
            except Exception as e:
                results[test] = {"status": "error", "error": str(e)}

        return results

    async def run_quantum_tests(self):
        """Run quantum-specific tests."""
        logger.info("🔬 Running quantum tests...")

        quantum_tests = [
            "test_quantum_entanglement",
            "test_quantum_superposition",
            "test_quantum_interference",
            "test_quantum_error_correction",
        ]

        results = {}
        for test in quantum_tests:
            try:
                result = await self.test_suite.run_quantum_test(test)
                results[test] = {
                    "status": "passed" if result["success"] else "failed",
                    "quantum_fidelity": result.get("quantum_fidelity", 0),
                    "error_rate": result.get("error_rate", 0),
                }
            except Exception as e:
                results[test] = {"status": "error", "error": str(e)}

        return results

    def save_test_results(self, test_results: Dict[str, Any]):
        """Save test results to files."""
        import json

        # Save detailed test results
        results_file = self.test_results_dir / "test_results.json"
        with open(results_file, "w") as f:
            json.dump(test_results, f, indent=2, default=str)

        # Save summary for CI/CD
        summary_file = self.test_results_dir / "test_summary.json"
        summary = self.generate_test_summary(test_results)
        with open(summary_file, "w") as f:
            json.dump(summary, f, indent=2)

        logger.info(f"✅ Test results saved to {self.test_results_dir}")

    def generate_test_summary(self, test_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary of test results for CI/CD."""
        total_tests = 0
        passed_tests = 0
        failed_tests = 0

        for category, tests in test_results.items():
            for test_name, result in tests.items():
                total_tests += 1
                if result["status"] == "passed":
                    passed_tests += 1
                else:
                    failed_tests += 1

        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": (
                (passed_tests / total_tests * 100) if total_tests > 0 else 0
            ),
            "overall_status": "passed" if failed_tests == 0 else "failed",
        }

    def generate_test_report(self, test_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a comprehensive test report."""
        summary = self.generate_test_summary(test_results)

        report = {
            "summary": summary,
            "details": test_results,
            "recommendations": self.generate_test_recommendations(test_results),
            "performance_metrics": self.extract_performance_metrics(test_results),
        }

        # Save report
        report_file = self.test_results_dir / "test_report.json"
        import json

        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)

        logger.info(f"✅ Test report saved to {report_file}")
        return report

    def generate_test_recommendations(self, test_results: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on test results."""
        recommendations = []

        # Check for failed tests
        failed_tests = []
        for category, tests in test_results.items():
            for test_name, result in tests.items():
                if result["status"] != "passed":
                    failed_tests.append(f"{category}.{test_name}")

        if failed_tests:
            recommendations.append(
                f"Fix {len(failed_tests)} failed tests: {', '.join(failed_tests)}"
            )

        # Check performance
        performance_tests = test_results.get("performance_tests", {})
        for test_name, result in performance_tests.items():
            if result.get("speedup", 1.0) < 1.5:
                recommendations.append(f"Optimize {test_name} for better performance")

        # Check security
        security_tests = test_results.get("security_tests", {})
        for test_name, result in security_tests.items():
            if result.get("security_score", 100) < 90:
                recommendations.append(f"Improve security in {test_name}")

        return recommendations

    def extract_performance_metrics(
        self, test_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract performance metrics from test results."""
        metrics = {
            "average_speedup": 0,
            "quantum_advantage": 0,
            "memory_efficiency": 0,
            "security_score": 0,
        }

        # Calculate average speedup
        speedups = []
        performance_tests = test_results.get("performance_tests", {})
        for test_result in performance_tests.values():
            if "speedup" in test_result:
                speedups.append(test_result["speedup"])

        if speedups:
            metrics["average_speedup"] = sum(speedups) / len(speedups)

        # Calculate quantum advantage
        quantum_advantages = []
        for test_result in performance_tests.values():
            if "quantum_advantage" in test_result:
                quantum_advantages.append(test_result["quantum_advantage"])

        if quantum_advantages:
            metrics["quantum_advantage"] = sum(quantum_advantages) / len(
                quantum_advantages
            )

        # Calculate security score
        security_scores = []
        security_tests = test_results.get("security_tests", {})
        for test_result in security_tests.values():
            if "security_score" in test_result:
                security_scores.append(test_result["security_score"])

        if security_scores:
            metrics["security_score"] = sum(security_scores) / len(security_scores)

        return metrics

    async def run_deployment(self, test_results: Dict[str, Any]):
        """Run automated deployment if tests pass."""
        logger.info("🚀 Running automated deployment...")

        # Check if tests passed
        summary = self.generate_test_summary(test_results)
        if summary["overall_status"] != "passed":
            logger.warning("❌ Tests failed. Skipping deployment.")
            return {"deployment_status": "skipped", "reason": "Tests failed"}

        # Run deployment
        try:
            deployment_result = await self.deployment_manager.deploy(
                environment="staging", test_results=test_results
            )

            logger.info("✅ Deployment completed successfully")
            return {
                "deployment_status": "success",
                "deployment_result": deployment_result,
            }

        except Exception as e:
            logger.error(f"❌ Deployment failed: {e}")
            return {"deployment_status": "failed", "error": str(e)}

    async def run_ci_cd_pipeline(self):
        """Run the complete CI/CD pipeline."""
        logger.info("🔄 Starting CI/CD pipeline...")

        try:
            # Run automated tests
            test_results = await self.run_automated_tests()

            # Run deployment if tests pass
            deployment_result = await self.run_deployment(test_results["test_results"])

            # Generate final CI/CD report
            final_report = {
                "pipeline_status": (
                    "success"
                    if deployment_result["deployment_status"] == "success"
                    else "failed"
                ),
                "test_results": test_results,
                "deployment_result": deployment_result,
                "timestamp": str(datetime.now()),
            }

            # Save final report
            report_file = self.ci_dir / "ci_cd_report.json"
            import json

            with open(report_file, "w") as f:
                json.dump(final_report, f, indent=2)

            logger.info("✅ CI/CD pipeline completed")
            return final_report

        except Exception as e:
            logger.error(f"❌ CI/CD pipeline failed: {e}")
            return {"pipeline_status": "failed", "error": str(e)}


async def main():
    """Main function to run the CI/CD demonstration."""
    print("🔄 Bleu.js CI/CD Pipeline Demo")
    print("=" * 40)

    # Initialize the CI/CD demo
    ci_cd_demo = BleuJSCICDDemo()

    # Run the CI/CD pipeline
    result = await ci_cd_demo.run_ci_cd_pipeline()

    if result["pipeline_status"] == "success":
        print("\n🎉 CI/CD pipeline completed successfully!")
        print("✅ All tests passed")
        print("🚀 Deployment successful")
        print("📊 Check 'ci' and 'test_results' directories for reports")
    else:
        print(f"\n❌ CI/CD pipeline failed: {result.get('error', 'Unknown error')}")

    return result


if __name__ == "__main__":
    # Run the CI/CD demonstration
    asyncio.run(main())
