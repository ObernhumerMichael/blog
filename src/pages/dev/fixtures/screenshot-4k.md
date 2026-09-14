---
layout: ../../../layouts/ProseLayout.astro
number: 903
title: 'T4 fixture — a 3840×2160 screenshot'
lead: 'A real 4K dashboard capture, sourced next to this file so astro:assets actually optimizes it, instead of a public/ path Astro passes through untouched.'
section: 'Fixtures'
date: 2026-09-14
tags: ['fixture']
draft: true
---

## The dashboard

Six panels, captured at native 4K — the Grafana board this site's own
`node_exporter` setup would produce. `kind="screenshot"` (§14.1): sits on
`--c-sunken` with a rule border, and stays undimmed in dark mode, unlike a
diagram or a photo.

:::figure{kind="screenshot"}
![Grafana dashboard for the homelab, showing six panels of CPU load, disk free, node_exporter scrape latency and Prometheus samples per second across three Raspberry Pi nodes](./screenshot-4k-dashboard.png)

Fig. 1 — The board `pi-01`'s Grafana serves, captured at its native
3840×2160 — `astro:assets` is what turns this into a 780w source for the
measure column rather than shipping the 4K file itself.
:::
