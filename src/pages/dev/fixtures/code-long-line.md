---
layout: ../../../layouts/ProseLayout.astro
number: 901
title: 'T4 fixture — a 210-character code line'
lead: 'A single unbroken command line long enough to force the horizontal scroll region on every width in the matrix, instead of wrapping.'
section: 'Fixtures'
date: 2026-09-14
tags: ['fixture']
draft: true
---

## The command

A real `ansible-playbook` invocation against the homelab inventory, with
enough `--extra-vars` to run past any wrap point at 390px — this is the
line §10.11 calls "the single highest-value automated check in the whole
system": the page must not scroll sideways even though this line does.

```bash title="ansible/run-pi-04.sh"
ansible-playbook site.yml --limit pi-04 --extra-vars "monitoring_retention=30 node_exporter_version=1.8.2 firewall_allow_cidrs=10.20.0.0/24,10.30.0.0/24" --diff --check --vault-password-file ~/.vault-pass.txt
```

Listing 1 — The full command, 208 characters on one line: every
`--extra-vars` pair kept on the same line rather than split, since that's
how `ansible-playbook` actually requires it.
