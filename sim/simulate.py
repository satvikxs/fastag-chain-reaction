"""
FASTag Chain Reaction simulator.

Models a single-lane highway approaching a toll plaza using the
Nagel-Schreckenberg cellular automaton. Each cell ~= 7.5 m, each
step ~= 1 s, so vmax=5 cells/step corresponds to ~135 km/h.

Two scenarios are run:
  A) No app: one car at the toll has an inactive FASTag and stops
     for 90 s of manual payment -> shockwave propagates upstream.
  B) With app: 4% of drivers received a 5 km pre-warning, recharged,
     no stop occurs. Toll passes through at full speed.

Outputs (next to this file):
  - scenario_a_no_app.gif
  - scenario_b_with_app.gif
  - comparison.png
  - console summary
"""

from __future__ import annotations

import os
from dataclasses import dataclass

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.animation import FuncAnimation, PillowWriter

# ---------------------------------------------------------------------------
# Model parameters
# ---------------------------------------------------------------------------
ROAD_LENGTH = 1800          # cells, 7.5 m each -> ~13.5 km of approach road
CELL_METERS = 7.5
STEP_SECONDS = 1.0
VMAX = 5                    # ~135 km/h free flow
P_SLOW = 0.15               # random braking probability (driver imperfection)
N_VEHICLES = 200
TOLL_CELL = ROAD_LENGTH - 5 # toll plaza near the end of the road
STOP_DURATION = 90          # seconds the stalled car blocks the toll
SIM_STEPS = 900             # 15 minutes of simulated time
WARNED_FRACTION = 0.04      # 4% of drivers used the app

OUT_DIR = os.path.dirname(os.path.abspath(__file__))


# ---------------------------------------------------------------------------
# Nagel-Schreckenberg core
# ---------------------------------------------------------------------------
@dataclass
class SimState:
    positions: np.ndarray   # sorted ascending
    velocities: np.ndarray
    blocked_until: int = -1 # step index until which the toll is blocked


def init_state(rng: np.random.Generator) -> SimState:
    # Space vehicles so steady-state free flow is reached quickly: at vmax=5
    # and p=0.2 the equilibrium gap is well above 5 cells, so we use ~7.
    spacing = 7
    positions = np.arange(N_VEHICLES) * spacing
    velocities = np.full(N_VEHICLES, VMAX, dtype=int)
    return SimState(positions=positions, velocities=velocities)


def step(state: SimState, t: int, rng: np.random.Generator,
         toll_blocks: bool) -> SimState:
    """One Nagel-Schreckenberg update with an optional blocking toll cell."""
    pos = state.positions
    vel = state.velocities
    n = len(pos)
    if n == 0:
        return state

    # Gap to the car ahead (or to the toll if it's blocking).
    # Vehicles are kept sorted ascending; the leader has "infinite" road.
    gaps = np.empty(n, dtype=int)
    gaps[:-1] = pos[1:] - pos[:-1] - 1
    gaps[-1] = ROAD_LENGTH * 2  # leader: open road past the end

    if toll_blocks and t <= state.blocked_until:
        # Treat the toll cell as an immovable obstacle for any car behind it.
        for i in range(n):
            if pos[i] < TOLL_CELL:
                gaps[i] = min(gaps[i], TOLL_CELL - pos[i] - 1)

    # 1. accelerate
    vel = np.minimum(vel + 1, VMAX)
    # 2. brake to avoid collision
    vel = np.minimum(vel, gaps)
    # 3. random slowdown
    slow = (rng.random(n) < P_SLOW) & (vel > 0)
    vel[slow] -= 1
    # 4. move
    pos = pos + vel

    # Remove cars that drove past the end of the road (through the toll).
    keep = pos < ROAD_LENGTH
    pos = pos[keep]
    vel = vel[keep]

    state.positions = pos
    state.velocities = vel
    return state


# ---------------------------------------------------------------------------
# Scenario runners
# ---------------------------------------------------------------------------
def run_scenario(label: str, with_app: bool, seed: int = 7):
    rng = np.random.default_rng(seed)
    state = init_state(rng)

    # In scenario A, the first car to reach the toll has a bad FASTag and
    # blocks the lane for STOP_DURATION seconds. In scenario B nobody stops
    # (the warned driver recharged in advance).
    stall_triggered = False
    history_positions = []
    history_velocities = []
    queue_lengths = []
    avg_speeds = []

    for t in range(SIM_STEPS):
        # Decide whether to trigger a stall this step.
        if not with_app and not stall_triggered:
            # The lead car reaches the toll cell.
            if state.positions.size and state.positions[-1] >= TOLL_CELL - 1:
                state.blocked_until = t + STOP_DURATION
                stall_triggered = True

        state = step(state, t, rng, toll_blocks=not with_app)

        # Snapshot for the animation.
        history_positions.append(state.positions.copy())
        history_velocities.append(state.velocities.copy())

        # Queue = vehicles that are (a) within 2 km upstream of the toll AND
        # (b) crawling at <= 1 cell/step. This isolates toll-induced backup
        # from random phantom braking far away.
        near_toll = (state.positions >= TOLL_CELL - 270) & \
                    (state.positions < TOLL_CELL)
        slow_mask = state.velocities <= 1
        queue_lengths.append(int((near_toll & slow_mask).sum()))
        avg_speeds.append(
            float(state.velocities.mean()) if state.velocities.size else VMAX
        )

    summary = summarize(label, with_app, queue_lengths, avg_speeds,
                        stall_triggered)
    return {
        "label": label,
        "with_app": with_app,
        "positions": history_positions,
        "velocities": history_velocities,
        "queue_lengths": queue_lengths,
        "avg_speeds": avg_speeds,
        "summary": summary,
    }


def summarize(label, with_app, queue_lengths, avg_speeds, stall_triggered):
    peak_queue = max(queue_lengths)
    # "Residual slowdown" = how long average speed stays well below free flow.
    free_flow = VMAX * (1 - P_SLOW)  # ~4 cells/step in steady state
    slow_steps = sum(1 for v in avg_speeds if v < 0.6 * free_flow)
    slow_minutes = slow_steps * STEP_SECONDS / 60.0
    return {
        "peak_queue": peak_queue,
        "residual_min": slow_minutes,
        "stall_triggered": stall_triggered,
    }


# ---------------------------------------------------------------------------
# Visualisation
# ---------------------------------------------------------------------------
def animate(result, out_path: str):
    fig, (ax_road, ax_q) = plt.subplots(
        2, 1, figsize=(11, 4.5),
        gridspec_kw={"height_ratios": [1, 1.2]},
    )
    fig.suptitle(result["label"], fontsize=13, fontweight="bold")

    # Top: cars on the road (color = speed).
    scat = ax_road.scatter([], [], c=[], cmap="RdYlGn", vmin=0, vmax=VMAX,
                           s=14)
    ax_road.axvline(TOLL_CELL * CELL_METERS / 1000, color="black",
                    linestyle="--", linewidth=1)
    ax_road.text(TOLL_CELL * CELL_METERS / 1000, 0.6, " toll",
                 fontsize=9, va="center")
    ax_road.set_xlim(0, ROAD_LENGTH * CELL_METERS / 1000)
    ax_road.set_ylim(-1, 1)
    ax_road.set_yticks([])
    ax_road.set_xlabel("Distance along highway (km)")

    # Bottom: queue length over time.
    qline, = ax_q.plot([], [], color="crimson", linewidth=1.5)
    ax_q.set_xlim(0, SIM_STEPS * STEP_SECONDS / 60.0)
    ax_q.set_ylim(0, max(50, max(result["queue_lengths"]) * 1.1 + 1))
    ax_q.set_xlabel("Time (min)")
    ax_q.set_ylabel("Vehicles queued within 2 km of toll")
    ax_q.grid(alpha=0.3)

    time_text = ax_road.text(0.01, 0.92, "", transform=ax_road.transAxes,
                             fontsize=10)

    qs_minutes = np.arange(SIM_STEPS) * STEP_SECONDS / 60.0
    qs = np.array(result["queue_lengths"])

    def update(frame):
        pos = result["positions"][frame]
        vel = result["velocities"][frame]
        xs = pos * CELL_METERS / 1000
        ys = np.zeros_like(xs)
        scat.set_offsets(np.column_stack([xs, ys]))
        scat.set_array(vel)
        qline.set_data(qs_minutes[: frame + 1], qs[: frame + 1])
        time_text.set_text(f"t = {frame} s   |   queue = {qs[frame]}")
        return scat, qline, time_text

    # Subsample frames to keep the gif small.
    frames = range(0, SIM_STEPS, 3)
    anim = FuncAnimation(fig, update, frames=frames, interval=60, blit=False)
    anim.save(out_path, writer=PillowWriter(fps=20))
    plt.close(fig)


def comparison_png(result_a, result_b, out_path: str):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5), sharey=True)
    mins = np.arange(SIM_STEPS) * STEP_SECONDS / 60.0
    for ax, res, color in (
        (axes[0], result_a, "crimson"),
        (axes[1], result_b, "seagreen"),
    ):
        ax.plot(mins, res["queue_lengths"], color=color, linewidth=1.8)
        ax.fill_between(mins, res["queue_lengths"], alpha=0.2, color=color)
        ax.set_title(res["label"], fontsize=12, fontweight="bold")
        ax.set_xlabel("Time (min)")
        ax.grid(alpha=0.3)
        ax.set_ylim(
            0,
            max(50, max(result_a["queue_lengths"]) * 1.1 + 1),
        )
        s = res["summary"]
        ax.text(
            0.97, 0.95,
            f"peak queue: {s['peak_queue']} vehicles\n"
            f"slowdown: {s['residual_min']:.1f} min",
            transform=ax.transAxes, ha="right", va="top", fontsize=10,
            bbox=dict(boxstyle="round,pad=0.4", facecolor="white", alpha=0.85),
        )
    axes[0].set_ylabel("Vehicles in queue")
    fig.suptitle("FASTag Chain Reaction: with vs without pre-warning app",
                 fontsize=13, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out_path, dpi=140)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("Running scenario A (no app)...")
    a = run_scenario("Scenario A — No app (one stalled FASTag)",
                     with_app=False, seed=7)
    print("Running scenario B (with app, 4% warned)...")
    b = run_scenario(
        f"Scenario B — With app ({int(WARNED_FRACTION * 100)}% pre-warned)",
        with_app=True, seed=7,
    )

    print("Rendering animations...")
    animate(a, os.path.join(OUT_DIR, "scenario_a_no_app.gif"))
    animate(b, os.path.join(OUT_DIR, "scenario_b_with_app.gif"))

    print("Rendering comparison PNG...")
    comparison_png(a, b, os.path.join(OUT_DIR, "comparison.png"))

    sa, sb = a["summary"], b["summary"]
    print()
    print("=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"Without app: {sa['peak_queue']} vehicles backed up, "
          f"{sa['residual_min']:.1f} min residual slowdown.")
    if sb["peak_queue"] <= 5:
        print("With app:    zero backup.")
    else:
        print(f"With app:    {sb['peak_queue']} vehicles backed up, "
              f"{sb['residual_min']:.1f} min residual slowdown.")
    print("=" * 60)


if __name__ == "__main__":
    main()
