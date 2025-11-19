#!/usr/bin/env python3
"""
Check PyPI download statistics for Bleu.js
"""
import json
import requests
from datetime import datetime


def get_pypistats(package_name="bleu-js", stat_type="recent"):
    """Fetch PyPI statistics"""
    url = f"https://pypistats.org/api/packages/{package_name}/{stat_type}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return None


def print_recent_stats():
    """Print recent download statistics"""
    print("=" * 60)
    print("📊 Bleu.js Download Statistics")
    print("=" * 60)
    print()

    # Recent downloads
    recent = get_pypistats("bleu-js", "recent")
    if recent and "data" in recent:
        data = recent["data"]
        print("📅 Recent Downloads:")
        print(f"   Last Day:    {data.get('last_day', 0):,}")
        print(f"   Last Week:   {data.get('last_week', 0):,}")
        print(f"   Last Month:  {data.get('last_month', 0):,}")
        print()

    # Overall stats (last 30 days)
    overall = get_pypistats("bleu-js", "overall")
    if overall and "data" in overall:
        downloads = overall["data"]
        total = sum(d.get("downloads", 0) for d in downloads)
        print(f"📦 Total Downloads (historical): ~{total:,}")
        print()

        # Find peak day
        if downloads:
            peak = max(downloads, key=lambda x: x.get("downloads", 0))
            print(f"🔥 Peak Day: {peak.get('date')} with {peak.get('downloads', 0):,} downloads")
            print()

    # Python versions
    python_major = get_pypistats("bleu-js", "python_major")
    if python_major and "data" in python_major:
        versions = {}
        for entry in python_major["data"]:
            version = entry.get("category", "unknown")
            downloads = entry.get("downloads", 0)
            versions[version] = versions.get(version, 0) + downloads
        
        print("🐍 Python Versions:")
        for version, count in sorted(versions.items(), key=lambda x: x[1], reverse=True):
            print(f"   Python {version}: {count:,} downloads")
        print()

    # Operating systems
    system = get_pypistats("bleu-js", "system")
    if system and "data" in system:
        systems = {}
        for entry in system["data"]:
            os_name = entry.get("category", "unknown")
            downloads = entry.get("downloads", 0)
            systems[os_name] = systems.get(os_name, 0) + downloads
        
        print("💻 Operating Systems:")
        for os_name, count in sorted(systems.items(), key=lambda x: x[1], reverse=True):
            if os_name and os_name != "null":
                print(f"   {os_name}: {count:,} downloads")
        print()

    print("=" * 60)
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)


if __name__ == "__main__":
    print_recent_stats()

