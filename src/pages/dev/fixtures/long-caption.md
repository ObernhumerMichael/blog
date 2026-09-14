---
layout: ../../../layouts/ProseLayout.astro
number: 906
title: 'T4 fixture — a caption with no length limit'
lead: 'A single code block with a caption several sentences long — §14.2 sets no length limit, and the block-goes-full-bleed-while-the-caption-stays-inside-the-text-margin rule is the one that has to survive it.'
section: 'Fixtures'
date: 2026-09-14
tags: ['fixture']
draft: true
---

## The rule this fixture is for

At 390px a code block escapes to full-bleed (§7.3), but its caption does
not — it stays inside the 20px text margin. A short caption never tests
that boundary; this one is long enough that it would visibly break the
layout if the caption ever inherited the block's own width instead of the
prose column's.

```yaml title="ansible/roles/monitoring/tasks/rollback.yml"
- name: Roll back node_exporter to the last known-good version
  ansible.builtin.apt:
    name: prometheus-node-exporter=1.7.0-1
    state: present
    allow_downgrade: true
  when: node_exporter_version_check.stat.exists
```

Listing 1 — The rollback task that got written the week `node_exporter`
1.8.0 shipped a breaking change to its `--collector.textfile.directory`
flag parsing: every node's textfile metrics silently stopped scraping for
about six hours before anyone noticed, because the scrape itself still
succeeded and only the collector inside it was failing, which is exactly
the kind of "up but wrong" failure the whole monitoring setup exists to
catch and, in this one case, didn't — this task is the fix, and the
caption is deliberately this long to prove the layout survives it.
