---
layout: ../../../layouts/ProseLayout.astro
number: 905
title: 'T4 fixture — four consecutive code blocks'
lead: 'Four fenced blocks in a row, nothing but their captions between them — §10.10s 24px page-ground gap is the only thing keeping them from reading as one block.'
section: 'Fixtures'
date: 2026-09-14
tags: ['fixture']
draft: true
---

## The four files a new node needs

No prose between these — the four config fragments `roles/base` renders
onto every fresh node, back to back, in the order they're applied.

```jinja title="ansible/roles/base/templates/hostname.j2"
{{ inventory_hostname }}
```

Listing 1 — The hostname template: one line, one Jinja variable.

```yaml title="ansible/roles/base/templates/timezone.yml"
timezone: 'Europe/Vienna'
```

Listing 2 — Timezone, pinned rather than inherited from the base image.

```dockerfile title="ansible/roles/monitoring/files/Dockerfile.exporter-test"
FROM prom/node-exporter:v1.8.2
EXPOSE 9100
```

Listing 3 — The image used to smoke-test a new `node_exporter` version
locally before it's rolled into the role.

```terminal host="pi-04"
$ systemctl is-active node_exporter
active
```

Listing 4 — Terminal blocks share the code counter (§14.2) — this is
"Listing 4", not "Listing 1" again.
