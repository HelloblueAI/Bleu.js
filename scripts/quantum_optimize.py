#!/usr/bin/env python3
"""Quantum optimization script for automatic optimization during development."""

import json
from pathlib import Path
from typing import Dict, List

from qiskit.optimization import QuadraticProgram

from src.quantum_py.optimization.contest_strategy import QuantumContestOptimizer


def get_changed_files() -> List[str]:
    """Get list of changed Python files."""
    # Use absolute path for git command
    git_path = Path("/usr/bin/git")
    if not git_path.exists():
        git_path = Path("/usr/local/bin/git")

    # Use subprocess with absolute path and proper security settings
    import subprocess  # noqa: S404

    result = subprocess.run(  # noqa: S603
        [str(git_path), "diff", "--name-only", "HEAD"],
        capture_output=True,
        text=True,
        check=True,
    )
    return [f for f in result.stdout.splitlines() if f.endswith(".py")]


def create_optimization_problem(files: List[str]) -> QuadraticProgram:
    """Create optimization problem from changed files."""
    qp = QuadraticProgram()
    for file in files:
        qp.binary_var(file)
    return qp


def optimize_files(files: List[str]) -> Dict:
    """Optimize changed files using quantum algorithms."""
    optimizer = QuantumContestOptimizer(shots=4096)
    problem = create_optimization_problem(files)

    # Solve optimization problem
    result = optimizer.solve_optimization_problem(problem, method="qaoa")

    # Optimize for specific contest parameters
    contest_result = optimizer.optimize_for_contest(problem, time_limit=300.0)

    return {
        "files": files,
        "optimization_result": result,
        "contest_result": contest_result,
    }


def main() -> None:
    """Main function."""
    print("🚀 Running Quantum Contest Optimizer...")

    # Get changed files
    changed_files = get_changed_files()
    if not changed_files:
        print("No Python files changed. Nothing to optimize.")
        return

    # Optimize files
    results = optimize_files(changed_files)

    # Save results
    output_file = Path("quantum_optimization_results.json")
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)

    print(f"✅ Quantum optimization completed! Results saved to {output_file}")

    # Print optimization summary
    print("\nOptimization Summary:")
    print(f"Files optimized: {len(changed_files)}")
    print(f"Optimization status: {results['optimization_result']['status']}")
    print(f"Contest optimization status: {results['contest_result']['status']}")


if __name__ == "__main__":
    main()
