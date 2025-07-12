#!/usr/bin/env python3
"""
Professional Dependency Manager for Bleu.js
Handles dependency conflicts, security updates, and version compatibility
"""

import argparse
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class DependencyManager:
    def __init__(self):
        self.project_root = Path.cwd()
        self.requirements_files = [
            "requirements.txt",
            "src/quantum_py/requirements.txt",
            "src/api/requirements.txt",
            "python/requirements.txt",
        ]

    def run_command(
        self, cmd: str, capture_output: bool = True
    ) -> Tuple[int, str, str]:
        """Execute a command and return results"""
        try:
            result = subprocess.run(
                cmd.split(), capture_output=capture_output, text=True, check=False
            )
            return result.returncode, result.stdout, result.stderr
        except Exception as e:
            return 1, "", str(e)

    def get_package_info(self, package: str) -> Dict:
        """Get detailed information about a package"""
        code, stdout, _ = self.run_command(f"pip show {package}")
        if code != 0:
            return {}

        info = {}
        for line in stdout.split("\n"):
            if ":" in line:
                key, value = line.split(":", 1)
                info[key.strip()] = value.strip()
        return info

    def check_dependency_conflicts(self) -> List[Dict]:
        """Check for dependency conflicts"""
        code, stdout, stderr = self.run_command("pip check")
        conflicts = []

        if code != 0:
            for line in stderr.split("\n"):
                if "has requirement" in line and "but you have" in line:
                    conflicts.append(
                        {
                            "package": line.split(" has requirement")[0].strip(),
                            "issue": line.strip(),
                        }
                    )

        return conflicts

    def get_outdated_packages(self) -> List[Dict]:
        """Get list of outdated packages"""
        code, stdout, _ = self.run_command("pip list --outdated --format=json")
        if code != 0:
            return []

        try:
            return json.loads(stdout)
        except json.JSONDecodeError:
            return []

    def update_package(self, package: str, version: Optional[str] = None) -> bool:
        """Update a specific package"""
        cmd = f"pip install --upgrade {package}"
        if version:
            cmd = f"pip install {package}=={version}"

        code, _, _ = self.run_command(cmd)
        return code == 0

    def fix_streamlit_conflicts(self) -> bool:
        """Fix streamlit-specific dependency conflicts"""
        print("🔧 Fixing Streamlit dependency conflicts...")

        # Streamlit 1.27.0 has strict version requirements
        # Let's update to a newer version that's more flexible
        streamlit_info = self.get_package_info("streamlit")
        current_version = streamlit_info.get("Version", "")

        if current_version == "1.27.0":
            print("📦 Updating Streamlit to latest version...")
            success = self.update_package("streamlit")
            if success:
                print("✅ Streamlit updated successfully")
                return True
            else:
                print("⚠️ Streamlit update failed, trying alternative approach...")
                return self.fix_streamlit_alternative()

        return True

    def fix_streamlit_alternative(self) -> bool:
        """Alternative approach to fix streamlit conflicts"""
        print("🔄 Trying alternative conflict resolution...")

        # Update conflicting packages to compatible versions
        conflicts_to_fix = [
            ("importlib-metadata", "6.8.0"),
            ("packaging", "23.2"),
            ("pillow", "9.5.0"),
            ("rich", "13.7.0"),
        ]

        for package, version in conflicts_to_fix:
            print(f"📦 Updating {package} to {version}...")
            success = self.update_package(package, version)
            if not success:
                print(f"⚠️ Failed to update {package}")

        return True

    def create_virtual_environment(self) -> bool:
        """Create a clean virtual environment for the project"""
        venv_path = self.project_root / "venv"

        if venv_path.exists():
            print("🗑️ Removing existing virtual environment...")
            import shutil

            shutil.rmtree(venv_path)

        print("🔧 Creating new virtual environment...")
        code, _, _ = self.run_command(f"python -m venv {venv_path}")

        if code == 0:
            print("✅ Virtual environment created successfully")
            print(f"💡 Activate it with: source {venv_path}/bin/activate")
            return True
        else:
            print("❌ Failed to create virtual environment")
            return False

    def install_requirements(self, requirements_file: str) -> bool:
        """Install requirements from a specific file"""
        file_path = self.project_root / requirements_file
        if not file_path.exists():
            print(f"⚠️ Requirements file not found: {requirements_file}")
            return False

        print(f"📦 Installing requirements from {requirements_file}...")
        code, _, _ = self.run_command(f"pip install -r {file_path}")

        if code == 0:
            print(f"✅ Successfully installed requirements from {requirements_file}")
            return True
        else:
            print("❌ Failed to install requirements")
            return False

    def generate_requirements_lock(self) -> bool:
        """Generate a requirements.lock file with exact versions"""
        print("🔒 Generating requirements.lock file...")

        code, stdout, _ = self.run_command("pip freeze")
        if code == 0:
            lock_file = self.project_root / "requirements.lock"
            with open(lock_file, "w") as f:
                f.write(stdout)
            print("✅ requirements.lock generated successfully")
            return True
        else:
            print("❌ Failed to generate lock file")
            return False

    def analyze_dependencies(self) -> Dict:
        """Comprehensive dependency analysis"""
        print("🔍 Analyzing dependencies...")

        analysis = {
            "conflicts": self.check_dependency_conflicts(),
            "outdated": self.get_outdated_packages(),
            "security_issues": [],
            "recommendations": [],
        }

        # Check for known security issues
        security_packages = ["urllib3", "requests", "h11", "cryptography"]
        for package in security_packages:
            info = self.get_package_info(package)
            if info:
                analysis["security_issues"].append(
                    {
                        "package": package,
                        "version": info.get("Version", "unknown"),
                        "status": (
                            "secure"
                            if self.is_secure_version(package, info.get("Version", ""))
                            else "vulnerable"
                        ),
                    }
                )

        return analysis

    def is_secure_version(self, package: str, version: str) -> bool:
        """Check if a package version is secure"""
        security_versions = {
            "urllib3": "2.5.0",
            "requests": "2.32.4",
            "h11": "0.16.0",
            "cryptography": "42.0.5",
        }

        if package in security_versions:
            from packaging import version as pkg_version

            try:
                return pkg_version.parse(version) >= pkg_version.parse(
                    security_versions[package]
                )
            except BaseException:
                return False
        return True

    def print_analysis_report(self, analysis: Dict):
        """Print a comprehensive analysis report"""
        print("\n" + "=" * 60)
        print("📊 DEPENDENCY ANALYSIS REPORT")
        print("=" * 60)

        # Conflicts
        if analysis["conflicts"]:
            print("\n❌ DEPENDENCY CONFLICTS:")
            for conflict in analysis["conflicts"]:
                print(f"  • {conflict['issue']}")
        else:
            print("\n✅ No dependency conflicts found")

        # Outdated packages
        if analysis["outdated"]:
            print(f"\n📦 OUTDATED PACKAGES ({len(analysis['outdated'])}):")
            for pkg in analysis["outdated"][:10]:  # Show first 10
                print(f"  • {pkg['name']}: {pkg['version']} → {pkg['latest_version']}")
        else:
            print("\n✅ All packages are up to date")

        # Security issues
        if analysis["security_issues"]:
            print("\n🔒 SECURITY STATUS:")
            for issue in analysis["security_issues"]:
                status_icon = "✅" if issue["status"] == "secure" else "❌"
                print(
                    f"  {status_icon} {issue['package']}: "
                    f"{issue['version']} ({issue['status']})"
                )

        print("\n" + "=" * 60)

    def run_comprehensive_fix(self):
        """Run comprehensive dependency fix"""
        print("🚀 Starting comprehensive dependency management...")

        # 1. Analyze current state
        analysis = self.analyze_dependencies()
        self.print_analysis_report(analysis)

        # 2. Fix streamlit conflicts
        if analysis["conflicts"]:
            self.fix_streamlit_conflicts()

        # 3. Update critical packages
        critical_updates = [
            ("urllib3", "2.5.0"),
            ("requests", "2.32.4"),
            ("cryptography", "42.0.5"),
        ]

        print("\n🔧 Updating critical packages...")
        for package, version in critical_updates:
            success = self.update_package(package, version)
            status = "✅" if success else "❌"
            print(f"  {status} {package} → {version}")

        # 4. Generate lock file
        self.generate_requirements_lock()

        # 5. Final analysis
        print("\n🔍 Final dependency check...")
        final_analysis = self.analyze_dependencies()
        self.print_analysis_report(final_analysis)

        print("\n🎉 Dependency management completed!")


def main():
    parser = argparse.ArgumentParser(description="Professional Dependency Manager")
    parser.add_argument("--fix", action="store_true", help="Run comprehensive fix")
    parser.add_argument("--analyze", action="store_true", help="Analyze dependencies")
    parser.add_argument(
        "--clean", action="store_true", help="Create clean virtual environment"
    )

    args = parser.parse_args()

    manager = DependencyManager()

    if args.analyze:
        analysis = manager.analyze_dependencies()
        manager.print_analysis_report(analysis)
    elif args.clean:
        manager.create_virtual_environment()
    elif args.fix:
        manager.run_comprehensive_fix()
    else:
        # Default: run comprehensive fix
        manager.run_comprehensive_fix()


if __name__ == "__main__":
    main()
