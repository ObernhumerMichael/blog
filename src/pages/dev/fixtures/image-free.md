---
layout: ../../../layouts/ProseLayout.astro
number: 904
title: 'T4 fixture — an article with no images'
lead: "Prose, a code block and a table, and not one figure — the case that proves the layout doesn't secretly depend on media to look finished."
section: 'Fixtures'
date: 2026-09-14
tags: ['fixture']
draft: true
---

## Why unattended-upgrades still needs a reboot policy

`unattended-upgrades` patches packages on its own, but a kernel or libc
update doesn't take effect until the next reboot — and a Pi that silently
needs one but never gets it is worse than a Pi that isn't patched at all,
because the dashboard says it's fine.

```ini title="ansible/roles/base/files/50unattended-upgrades"
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "03:30";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
```

Listing 1 — Reboots are scheduled, not disabled — the alternative
(`"false"`) just moves the problem from "the box reboots at `03:30`" to
"the box reboots whenever I happen to notice `/var/run/reboot-required`".

## What actually gets checked

`node_exporter`'s textfile collector reports `reboot_required` as a gauge,
written by a cron job that stats the same file.

| Node    | Reboot required | Last checked |
| ------- | --------------- | ------------ |
| `pi-01` | no              | 2 min ago    |
| `pi-02` | no              | 2 min ago    |
| `pi-03` | yes             | 2 min ago    |

_Table 1 — `pi-03`'s flag is real: a kernel update landed this morning and
its `03:30` reboot window hasn't come around yet._
