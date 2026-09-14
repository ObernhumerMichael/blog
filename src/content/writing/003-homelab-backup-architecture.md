---
number: 3
title: 'The homelab backup architecture: one restic repo, three trust boundaries'
lead: 'Backups that only exist on the machine they protect are not backups — the design here assumes any single node, including the one holding the repo, can disappear without warning.'
section: 'Infrastructure'
date: 2026-09-02
tags: ['infrastructure', 'homelab']
draft: false
---

## 01 · Why one repo, not three

A separate restic repository per node sounds safer until you have to
restore during an incident and discover the retention policy was only ever
applied consistently on two of them. One shared repo, one policy, checked
in one place.

## 02 · What actually gets backed up

Not everything. Container images rebuild from source in minutes; the
things that do not reconstruct themselves — configuration, application
state, the Prometheus TSDB — are the only things restic ever touches.

## 03 · The restore that proved it

A disk failure on the storage node was the first real test of the whole
design, not a drill. The restore finished before the replacement disk had
even fully partitioned, which was the point of building it this way.
