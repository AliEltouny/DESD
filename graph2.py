import matplotlib.pyplot as plt
import numpy as np

# Sprint Duration
total_sprint_days = 87  # Total duration of the sprint
start_day = 0  # Start tracking from Day 0
work_start_day = 11  # Work actually began on Day 11
current_day = 25  # We are at Day 25

# Work Distribution Across Phases
total_work = 100  # 100% total work
phase_work = 20  # Each phase is 20% of total work

# Phase 1 Breakdown (0-20% of total work)
phase_1_start = 100  # Project starts at 100%
phase_1_end = 80  # Phase 1 takes the project to 80%

# Work Progress Data (Manually input actual progress within Phase 1)
actual_days = [0, 11, 14, 15, 17, 25]  # Days where work was tracked
actual_work_remaining = [100, 100, 98, 88, 84, 84]  # No progress until day 11, then work starts

# Ideal Burndown (Linear decrease over 87 days)
ideal_days = np.linspace(0, total_sprint_days, total_sprint_days + 1)
ideal_work_remaining = np.linspace(100, 0, total_sprint_days + 1)

# Create the plot
plt.figure(figsize=(12, 6))

# Plot Ideal Burndown (Blue Dashed Line)
plt.plot(ideal_days, ideal_work_remaining, linestyle="dashed", color="blue", label="Ideal Burndown")

# Plot Actual Burndown (Red Line with Markers)
plt.plot(actual_days, actual_work_remaining, marker="o", linestyle="-", color="red", markersize=6, label="Actual Burndown")

# Mark Phase Boundaries (Show only Phase 1 for now)
plt.axhline(phase_1_end, linestyle="dotted", color="gray", label="Phase 1 End")
plt.text(current_day + 2, phase_1_end + 2, "Phase 1 End", fontsize=10, color="black")

# 📌 Ensure Key Days Are Visible
important_days = [0, 11, 14, 15, 17, 25, total_sprint_days]  # Key days to display
plt.xticks(important_days)  # Set x-axis ticks to important days

# 📌 Ensure Important Work Progress Points Are Labeled
for day, work in zip(actual_days, actual_work_remaining):
    plt.annotate(f"{work-80}%", (day, work), textcoords="offset points", xytext=(-10,5), ha='center', fontsize=9, color="red")

# Labels and Title
plt.xlabel("Days in Sprint (Started Day 0, Work Began Day 11)")
plt.ylabel("Remaining Work (%)")
plt.title("Sprint Burndown Chart - Phase 1 Focused")
plt.legend()
plt.grid(axis="y", linestyle="dotted", color="gray")

# Show the chart
plt.show()
