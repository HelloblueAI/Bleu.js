#!/usr/bin/env python3
"""
Create a placeholder GIF for Bleu.js demo
"""

import os

from PIL import Image, ImageDraw, ImageFont


def create_placeholder_gif():
    """Create a simple placeholder GIF"""

    # Create a dark background image
    width, height = 800, 600
    background_color = (26, 26, 26)  # Dark gray
    text_color = (0, 224, 255)  # Bleu.js blue

    # Create frames for the GIF
    frames = []

    for i in range(30):  # 30 frames for 3 seconds at 10fps
        # Create image
        img = Image.new("RGB", (width, height), background_color)
        draw = ImageDraw.Draw(img)

        # Try to use a monospace font
        try:
            font_large = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36
            )
            font_medium = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24
            )
        except:
            font_large = ImageFont.load_default()
            font_medium = ImageFont.load_default()

        # Add title
        title = "🚀 Bleu.js - Quantum-Enhanced AI Platform"
        title_bbox = draw.textbbox((0, 0), title, font=font_large)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (width - title_width) // 2
        draw.text((title_x, 100), title, fill=text_color, font=font_large)

        # Add subtitle
        subtitle = "✨ Magical Terminal Demo ✨"
        subtitle_bbox = draw.textbbox((0, 0), subtitle, font=font_medium)
        subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
        subtitle_x = (width - subtitle_width) // 2
        draw.text((subtitle_x, 160), subtitle, fill=(255, 255, 255), font=font_medium)

        # Add animated dots
        dots = "Loading" + "." * (i % 4)
        dots_bbox = draw.textbbox((0, 0), dots, font=font_medium)
        dots_width = dots_bbox[2] - dots_bbox[0]
        dots_x = (width - dots_width) // 2
        draw.text((dots_x, 220), dots, fill=(255, 255, 255), font=font_medium)

        # Add status
        status = "Ready for recording!"
        status_bbox = draw.textbbox((0, 0), status, font=font_medium)
        status_width = status_bbox[2] - status_bbox[0]
        status_x = (width - status_width) // 2
        draw.text((status_x, 280), status, fill=(0, 255, 0), font=font_medium)

        # Add instructions
        instructions = [
            "📹 Record the magical demo:",
            "asciinema play magical-bleu-demo.cast",
            "🌐 Or open: magical-demo-player.html",
            "💾 Save as: terminal-demo.gif",
        ]

        for j, instruction in enumerate(instructions):
            y_pos = 350 + j * 30
            draw.text((50, y_pos), instruction, fill=(200, 200, 200), font=font_medium)

        frames.append(img)

    # Save as GIF
    output_file = "terminal-demo.gif"
    frames[0].save(
        output_file,
        save_all=True,
        append_images=frames[1:],
        duration=100,  # 100ms per frame = 10fps
        loop=0,
    )

    print(f"✅ Created placeholder GIF: {output_file}")
    print(f"📁 File size: {os.path.getsize(output_file)} bytes")
    print(f"📤 Upload to: https://github.com/HelloblueAI/Bleu.js/assets/81389644/")


if __name__ == "__main__":
    create_placeholder_gif()
