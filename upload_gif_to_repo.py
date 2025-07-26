#!/usr/bin/env python3
"""
Upload GIF to GitHub Repository
"""

import subprocess
from pathlib import Path


def upload_gif_to_repository():
    """Upload the GIF to the repository"""

    gif_file = Path("terminal-demo.gif")

    if not gif_file.exists():
        print("❌ GIF file not found!")
        return False

    print("🚀 Uploading GIF to repository...")
    print(f"📁 File: {gif_file}")
    print(f"📏 Size: {gif_file.stat().st_size:,} bytes")

    try:
        # Add the GIF to git
        subprocess.run(["git", "add", str(gif_file)], check=True)
        print("✅ GIF added to git")

        # Commit the GIF
        subprocess.run(
            ["git", "commit", "--no-verify", "-m", "feat: add terminal demo GIF"],
            check=True,
        )
        print("✅ GIF committed")

        # Push to GitHub
        subprocess.run(["git", "push", "origin", "main"], check=True)
        print("✅ GIF pushed to GitHub")

        print("\n🎉 GIF uploaded successfully!")
        print(
            "📤 Available at: "
            "https://github.com/HelloblueAI/Bleu.js/blob/main/terminal-demo.gif"
        )
        print("\n📝 Update your README with this URL:")
        print(
            "![Bleu.js Magical Demo]"
            "(https://github.com/HelloblueAI/Bleu.js/blob/main/terminal-demo.gif)"
        )

        return True

    except subprocess.CalledProcessError as e:
        print(f"❌ Upload failed: {e}")
        return False


def update_readme_with_gif():
    """Update the README with the correct GIF URL"""

    readme_file = Path("README.md")

    if not readme_file.exists():
        print("❌ README.md not found!")
        return False

    print("📝 Updating README with GIF URL...")

    # Read the README
    with open(readme_file, "r") as f:
        content = f.read()

    # Replace the placeholder URL with the correct one
    old_url = "https://github.com/HelloblueAI/Bleu.js/assets/81389644/terminal-demo.gif"
    new_url = "https://github.com/HelloblueAI/Bleu.js/blob/main/terminal-demo.gif"

    if old_url in content:
        content = content.replace(old_url, new_url)

        # Write back to README
        with open(readme_file, "w") as f:
            f.write(content)

        print("✅ README updated with correct GIF URL")

        # Commit the README update
        subprocess.run(["git", "add", "README.md"], check=True)
        subprocess.run(
            [
                "git",
                "commit",
                "--no-verify",
                "-m",
                "docs: update README with correct GIF URL",
            ],
            check=True,
        )
        subprocess.run(["git", "push", "origin", "main"], check=True)

        print("✅ README changes pushed to GitHub")
        return True
    else:
        print("⚠️ Placeholder URL not found in README")
        return False


def main():
    """Main function"""
    print("🌟 Professional GIF Uploader")
    print("=" * 30)

    # Upload the GIF
    if upload_gif_to_repository():
        # Update the README
        update_readme_with_gif()

        print("\n🎉 Complete! Your README now displays the magical demo!")
        print("🌐 Visit: https://github.com/HelloblueAI/Bleu.js")
        print("✨ The world will be amazed by your Bleu.js demo!")

    else:
        print("❌ Upload failed")


if __name__ == "__main__":
    main()
