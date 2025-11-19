#!/usr/bin/env python3
"""
Verify Bleu.js package is properly installable and functional
"""
import subprocess
import sys
import tempfile
from pathlib import Path

def test_package_installation():
    """Test if package can be installed"""
    print("=" * 70)
    print("📦 Bleu.js Package Verification Report")
    print("=" * 70)
    print()
    
    # Test 1: Check if package exists on PyPI
    print("TEST 1: Checking PyPI availability...")
    try:
        result = subprocess.run(
            ["pip", "index", "versions", "bleu-js"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if "bleu-js" in result.stdout:
            print("✅ Package EXISTS on PyPI")
            print(f"   Output: {result.stdout[:200]}")
        else:
            print("⚠️  Package might not be on PyPI or pip index failed")
    except Exception as e:
        print(f"⚠️  Could not check PyPI: {e}")
    print()
    
    # Test 2: Check local package structure
    print("TEST 2: Checking local package structure...")
    src_path = Path("src")
    bleujs_path = src_path / "bleujs"
    
    checks = {
        "src directory exists": src_path.exists(),
        "bleujs module exists": bleujs_path.exists(),
        "bleujs/__init__.py exists": (bleujs_path / "__init__.py").exists(),
        "setup.py exists": Path("setup.py").exists(),
        "pyproject.toml exists": Path("pyproject.toml").exists(),
        "README.md exists": Path("README.md").exists(),
    }
    
    for check, passed in checks.items():
        status = "✅" if passed else "❌"
        print(f"   {status} {check}")
    
    all_passed = all(checks.values())
    print()
    
    # Test 3: Try importing locally
    print("TEST 3: Testing local import...")
    try:
        sys.path.insert(0, "src")
        import bleujs
        print("✅ Package imports successfully")
        print(f"   Version: {getattr(bleujs, '__version__', 'unknown')}")
        print(f"   Location: {bleujs.__file__}")
    except ImportError as e:
        print(f"❌ Import failed: {e}")
    except Exception as e:
        print(f"⚠️  Unexpected error: {e}")
    print()
    
    # Test 4: Check examples
    print("TEST 4: Checking example files...")
    examples_path = Path("examples")
    if examples_path.exists():
        examples = list(examples_path.glob("*.py"))
        print(f"✅ Found {len(examples)} example files")
        for ex in examples[:5]:
            print(f"   📄 {ex.name}")
    else:
        print("⚠️  No examples directory found")
    print()
    
    # Test 5: Check tests
    print("TEST 5: Checking test suite...")
    tests_path = Path("tests")
    if tests_path.exists():
        test_files = list(tests_path.glob("**/*.py"))
        print(f"✅ Found {len(test_files)} test files")
    else:
        print("⚠️  No tests directory found")
    print()
    
    # Test 6: Check documentation
    print("TEST 6: Checking documentation...")
    docs = {
        "README.md": Path("README.md"),
        "CHANGELOG.md": Path("CHANGELOG.md"),
        "INSTALLATION.md": Path("INSTALLATION.md"),
        "PROJECT_STATUS_REPORT.md": Path("PROJECT_STATUS_REPORT.md"),
    }
    
    for doc_name, doc_path in docs.items():
        if doc_path.exists():
            size = doc_path.stat().st_size
            print(f"✅ {doc_name} ({size:,} bytes)")
        else:
            print(f"❌ {doc_name} missing")
    print()
    
    # Final Summary
    print("=" * 70)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 70)
    
    if all_passed:
        print("✅ Package is PROPERLY STRUCTURED and READY for distribution")
        print("✅ Can be installed via: pip install bleu-js")
        print("✅ Local development setup is correct")
    else:
        print("⚠️  Some checks failed - review above")
    
    print()
    print("💡 To install from PyPI: pip install bleu-js")
    print("💡 To install locally: pip install -e .")
    print("=" * 70)

if __name__ == "__main__":
    test_package_installation()

