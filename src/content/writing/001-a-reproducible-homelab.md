---
number: 1
title: 'A reproducible homelab: what ansible-playbook actually guarantees'
lead: 'Three Raspberry Pis, one playbook, and the gap between idempotent and reproducible — the difference showed up six weeks later, when the monitoring stack that was supposed to catch it did not.'
section: 'Infrastructure'
date: 2026-08-19
tags: ['ansible', 'infrastructure', 'homelab']
featured: true
draft: false
---

## 01 · The problem with the old way

Before any of this existed, provisioning a new Raspberry Pi meant SSHing in
and typing commands until the box looked right. It worked. It also meant
that `pi-02` and `pi-03` diverged from `pi-01` within a month, in ways
nobody had written down.

## 02 · What "reproducible" actually means here

`ansible-playbook` is **idempotent**: running it twice against a converged
node changes nothing on the second run. That is not the same claim as
**reproducible**, which is: given only the playbook and an empty SD card, a
different person arrives at the identical node.

## 03 · What it costs

Reproducibility isn't free. Every node runs slightly more than it strictly
needs, and every playbook run costs real time even when nothing changes —
a trade this setup makes on purpose, and would make again.
