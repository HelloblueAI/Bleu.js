#!/usr/bin/env python3
"""
Create an animated GIF from the interactive demo for embedding in README.
"""

import os
import subprocess
import sys
import time


def check_dependencies():
    """Check if required tools are available."""
    missing = []

    try:
        import playwright  # noqa: F401
    except ImportError:
        missing.append("playwright")

    # Check ffmpeg
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        missing.append("ffmpeg")

    if missing:
        print(f"Missing dependencies: {', '.join(missing)}")
        print("Install with: pip install playwright && playwright install")
        return False
    return True


def create_demo_gif():
    """Create an animated GIF from the interactive demo."""

    if not check_dependencies():
        return False

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Installing playwright...")
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "playwright"], check=True
        )
        subprocess.run([sys.executable, "-m", "playwright", "install"], check=True)
        from playwright.sync_api import sync_playwright

    # Demo HTML file path
    demo_html = "simple_animated_demo.html"

    if not os.path.exists(demo_html):
        print(f"Demo HTML file not found: {demo_html}")
        return False

    print("Creating animated GIF from interactive demo...")

    try:
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 800, "height": 600})

            # Load the demo
            page.goto(f"file://{os.path.abspath(demo_html)}")

            # Wait for demo to load
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Create frames directory
            frames_dir = "demo_frames"
            os.makedirs(frames_dir, exist_ok=True)

            # Capture frames during demo
            frames = []
            for i in range(30):  # 30 frames for 3 seconds at 10fps
                frame_path = os.path.join(frames_dir, f"frame_{i:03d}.png")
                page.screenshot(path=frame_path, full_page=True)
                frames.append(frame_path)
                time.sleep(0.1)  # 100ms between frames

            browser.close()

            # Convert frames to GIF using ffmpeg
            output_gif = "interactive_demo.gif"
            cmd = [
                "ffmpeg",
                "-y",  # Overwrite output
                "-framerate",
                "10",  # 10 fps
                "-i",
                os.path.join(frames_dir, "frame_%03d.png"),
                "-vf",
                "scale=800:-1:flags=lanczos",  # Scale to 800px width
                "-f",
                "gif",
                output_gif,
            ]

            subprocess.run(cmd, check=True)

            # Clean up frames
            for frame in frames:
                os.remove(frame)
            os.rmdir(frames_dir)

            print(f"✅ Created animated GIF: {output_gif}")
            return True
    except Exception as e:
        print(f"❌ Error creating GIF: {e}")
        return False


def update_readme_with_gif():
    """Update README to include the animated GIF."""
    gif_path = "interactive_demo.gif"

    if not os.path.exists(gif_path):
        print(f"GIF not found: {gif_path}")
        return False

    readme_path = "README.md"

    # Read current README
    with open(readme_path, "r") as f:
        content = f.read()

    # Find the demo section and add GIF
    demo_section = "**📺 [Interactive Demo Player]"

    if demo_section in content:
        # Add GIF before the link
        gif_markdown = f"""
![Interactive Demo]({gif_path})

**📺 [Interactive Demo Player]"""

        content = content.replace(demo_section, gif_markdown)

        # Write updated README
        with open(readme_path, "w") as f:
            f.write(content)

        print("✅ Updated README with animated GIF")
        return True
    else:
        print("❌ Demo section not found in README")
        return False


def main():
    """Main function."""
    print("🎬 Creating animated GIF from interactive demo...")

    if create_demo_gif():
        if update_readme_with_gif():
            print("🎉 Success! Animated GIF created and README updated.")
            print("📝 Don't forget to commit and push the changes!")
        else:
            print("⚠️  GIF created but README update failed.")
    else:
        print("❌ Failed to create animated GIF.")


if __name__ == "__main__":
    main()
