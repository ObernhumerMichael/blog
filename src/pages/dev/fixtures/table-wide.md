---
layout: ../../../layouts/ProseLayout.astro
number: 902
title: 'T4 fixture — a seven-column table'
lead: 'Fleet resource utilization across all three nodes, wide enough that no width in the matrix can show it without a scroll region.'
section: 'Fixtures'
date: 2026-09-14
tags: ['fixture']
draft: true
---

## Fleet utilization

Seven columns: an identifying column, two numeric columns (right-aligned),
a kernel-version column, and an explanatory prose column (left-aligned by
the same marker GFM uses for the numeric columns, per §15.1's convention).

| Host    | Role                   | Load (1m) | Mem free | Uptime | Kernel            | Notes                                                     |
| ------- | ---------------------- | --------: | -------- | -----: | ----------------- | :-------------------------------------------------------- |
| `pi-01` | monitoring, firewall   |      0.42 | 612 MB   | 41d 3h | 6.6.31+rpt-rpi-v8 | Runs Prometheus and Grafana; first node provisioned.      |
| `pi-02` | firewall, dns          |      0.11 | 780 MB   | 41d 3h | 6.6.31+rpt-rpi-v8 | nftables plus unbound; no local storage of its own.       |
| `pi-03` | storage, backup target |      0.68 | 340 MB   | 38d 9h | 6.6.31+rpt-rpi-v8 | Holds the restic repo backing up the other two.           |
| `pi-04` | nodes                  |      0.07 | 890 MB   |  2d 6h | 6.6.31+rpt-rpi-v8 | Newest node; provisioned two days ago, not yet re-tasked. |

_Table 1 — Kernel is identical across the fleet on purpose: `roles/base`
pins the same `raspberrypi-kernel` package version everywhere, so a drift
here would itself be a bug._
