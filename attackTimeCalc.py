'''
Example: python attackTimeCalc.py --arrival-time 08:05:00 --travel-duration 16:00:28 --convert-to-local

'''

import argparse
from datetime import datetime, timedelta
import sys

try:
    from zoneinfo import ZoneInfo  # Python 3.9+
except ImportError:
    from pytz import timezone as ZoneInfo  # fallback for older Python with pytz

def parse_duration(duration_str):
    parts = list(map(int, duration_str.split(":")))
    while len(parts) < 3:
        parts.append(0)
    return timedelta(hours=parts[0], minutes=parts[1], seconds=parts[2])

def main():
    parser = argparse.ArgumentParser(description="Calculate send time for an attack based on arrival time and travel duration.")
    parser.add_argument(
        "--arrival-time",
        type=str,
        required=True,
        help="Target arrival time in HH:MM:SS format (e.g., 08:05:00)"
    )
    parser.add_argument(
        "--travel-duration",
        type=str,
        required=True,
        help="Travel duration in H:M:S format (e.g., 16:0:28)"
    )
    parser.add_argument(
        "--server-timezone",
        type=str,
        default="UTC",
        help="Timezone of the game server (default: UTC)"
    )
    parser.add_argument(
        "--local-timezone",
        type=str,
        default="America/New_York",
        help="Your local timezone (default: America/New_York)"
    )
    parser.add_argument(
        "--convert-to-local",
        action="store_true",
        help="Convert calculated server send time to your local time (with AM/PM format)"
    )

    args = parser.parse_args()

    try:
        server_tz = ZoneInfo(args.server_timezone)
        local_tz = ZoneInfo(args.local_timezone)
    except Exception as e:
        print(f"Invalid timezone specified: {e}")
        sys.exit(1)

    # Use today's date for calculation
    now = datetime.now(server_tz)
    arrival_time = datetime.strptime(args.arrival_time, "%H:%M:%S").replace(
        year=now.year, month=now.month, day=now.day, tzinfo=server_tz
    )
    travel_time = parse_duration(args.travel_duration)

    send_time = arrival_time - travel_time

    # Adjust if send time is on the previous day
    if send_time > arrival_time:
        send_time -= timedelta(days=1)

    print("Send time (server time):", send_time.strftime("%Y-%m-%d %H:%M:%S %Z"))

    if args.convert_to_local:
        local_send_time = send_time.astimezone(local_tz)
        print("Send time (local time): ", local_send_time.strftime("%Y-%m-%d %I:%M:%S %p %Z"))

if __name__ == "__main__":
    main()
