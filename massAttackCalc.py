'''
Mass Attack Calculator - Calculates launch times for multiple coordinated attacks

Example CSV format (attacks.csv):
Village A, Target 1, 2:30:15, 2025-08-12 08:05:00
Village B, Target 2, 1:45:30, 2025-08-12 08:05:00
Village C, Target 1, 3:12:45, 2025-08-12 08:05:00

Usage: python massAttackCalc.py attacks.csv

Note: Arrival times should be in format: YYYY-MM-DD HH:MM:SS
      Travel durations should be in format: H:MM:SS (e.g., 2:30:15 for 2 hours 30 minutes 15 seconds)
'''

import argparse
import csv
from datetime import datetime, timedelta
import sys
import re

def parse_duration(duration_str):
    """Parse duration string in H:MM:SS format"""
    parts = list(map(int, duration_str.split(":")))
    while len(parts) < 3:
        parts.append(0)
    return timedelta(hours=parts[0], minutes=parts[1], seconds=parts[2])

def parse_arrival_time(arrival_str):
    """Parse arrival time string in YYYY-MM-DD HH:MM:SS format"""
    try:
        # Try full datetime format first
        arrival_time = datetime.strptime(arrival_str.strip(), "%Y-%m-%d %H:%M:%S")
        return arrival_time
    except ValueError:
        try:
            # Try just time format, use today's date
            now = datetime.now()
            time_part = datetime.strptime(arrival_str.strip(), "%H:%M:%S").time()
            return datetime.combine(now.date(), time_part)
        except ValueError:
            raise ValueError(f"Invalid arrival time format: {arrival_str}. Expected YYYY-MM-DD HH:MM:SS or HH:MM:SS")

def parse_csv_data(file_path):
    """Parse CSV data handling both comma and newline separated values"""
    attacks = []
    
    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
    
    for line_num, line in enumerate(lines, 1):
        line = line.strip()
        if not line:  # Skip empty lines
            continue
            
        # Split by comma and clean up values
        values = [v.strip() for v in line.split(',') if v.strip()]
        
        if len(values) == 4:
            attacks.append({
                'attacking_villa': values[0],
                'target_villa': values[1],
                'travel_duration': values[2],
                'arrival_time': values[3]
            })
        elif len(values) > 0:
            print(f"Warning: Line {line_num} has {len(values)} values, expected 4. Skipping: {line}")
    
    return attacks

def calculate_launch_time(attack_data):
    """Calculate launch time for a single attack"""
    try:
        arrival_time = parse_arrival_time(attack_data['arrival_time'])
        travel_time = parse_duration(attack_data['travel_duration'])
        
        send_time = arrival_time - travel_time
        
        return send_time
        
    except Exception as e:
        raise ValueError(f"Error calculating launch time for {attack_data['attacking_villa']} -> {attack_data['target_villa']}: {e}")

def main():
    parser = argparse.ArgumentParser(
        description="Calculate launch times for multiple coordinated attacks from CSV file.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
CSV Format Examples:
  Village A, Target 1, 2:30:15, 2025-08-12 08:05:00
  Village B, Target 2, 1:45:30, 2025-08-12 08:05:00
  
  Or with newlines:
  Village A
  Target 1
  2:30:15
  2025-08-12 08:05:00
  Village B
  Target 2
  1:45:30
  2025-08-12 08:05:00
        """
    )
    
    parser.add_argument(
        "csv_file",
        type=str,
        help="Path to CSV file containing attack data"
    )

    args = parser.parse_args()

    try:
        attacks = parse_csv_data(args.csv_file)
    except FileNotFoundError:
        print(f"Error: CSV file '{args.csv_file}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        sys.exit(1)

    if not attacks:
        print("No attack data found in the CSV file.")
        sys.exit(1)

    print(f"Processing {len(attacks)} attacks...")
    print()

    # Calculate launch times and store with attack data
    attacks_with_launch_times = []
    for attack in attacks:
        try:
            launch_time = calculate_launch_time(attack)
            attacks_with_launch_times.append({
                'attack': attack,
                'launch_time': launch_time
            })
        except Exception as e:
            print(f"Error: {e}")

    # Sort attacks by launch time (earliest first)
    attacks_with_launch_times.sort(key=lambda x: x['launch_time'])

    # Output results sorted by launch time
    for item in attacks_with_launch_times:
        attack = item['attack']
        launch_time = item['launch_time']
        
        # Output in requested format: attacking villa, target villa, launch time with full date
        print(f"{attack['attacking_villa']}, {attack['target_villa']}, {launch_time.strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
