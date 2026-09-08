---
layout: ../../../layouts/BaseLayout.astro
number: 1
title: 'A reproducible homelab: what ansible-playbook actually guarantees'
lead: "Three Raspberry Pis, one playbook, and the gap between idempotent and reproducible — the difference showed up six weeks later, when the monitoring stack that was supposed to catch it didn't."
section: 'Infrastructure'
date: 2026-08-19
tags: ['ansible', 'infrastructure', 'homelab']
draft: true
---

## 01 · The problem with the old way

Before any of this existed, provisioning a new Raspberry Pi meant SSHing in
and typing commands until the box looked right. It worked. It also meant
that `pi-02` and `pi-03` diverged from `pi-01` within a month, in ways
nobody had written down. When `pi-01`'s SD card failed in March, rebuilding
it wasn't a twelve-minute job — it was a weekend of `history | grep` and
trying to remember which of the three nodes was the one with `iptables`
rules that actually worked.

That weekend is the reason this exists. Not because hand-configuring three
machines is hard — it isn't — but because hand-configuring three machines
produces three machines that only one person can explain, and only for as
long as they remember doing it.

## 02 · What "reproducible" actually means here

"Reproducible" gets used loosely enough that it's worth being specific.
`ansible-playbook` is **idempotent**: running it twice against a converged
node changes nothing on the second run. That is not the same claim as
**reproducible**, which is: given only the playbook and an empty SD card, a
different person — or the same person, eighteen months later — arrives at
the identical node.

Idempotence is a property of a single run against a single machine.
Reproducibility is a property of the repository, and it has to survive
things idempotence never has to think about: a role that assumes a package
is already installed, a task that reads a fact the base image happens to
set, a handler that only fires because a previous manual `apt upgrade`
left a service already running.

> Idempotent means it doesn't break what's already there. Reproducible
> means I can tell you, in advance, exactly what will be there.
>
> — a note I left myself after the March rebuild, which took four hours
> instead of twelve minutes because two of those assumptions were wrong

## 03 · The Ansible layout

The repository is a standard `roles/` layout, deliberately boring:

- `inventory.ini` — the three nodes, grouped by function (`monitoring`,
  `nodes`)
- `site.yml` — the entry playbook, one `import_playbook` per concern
- `roles/base/` — users, SSH hardening, unattended-upgrades, timezone
- `roles/monitoring/` — Prometheus server (on `pi-01` only) and
  `node_exporter` (on all three)
- `roles/firewall/` — `nftables` rules, applied last so a broken rule
  never locks out the run that would have fixed it

`roles/base` runs first on every host, everywhere, with no exceptions —
that ordering constraint is the one place reproducibility actually costs
something: it would be faster to special-case `pi-01`'s extra packages
inline in `site.yml`, but then the base role stops being a true
description of "every node in this fleet," which is the entire point of
having one.

```yaml title="ansible/roles/monitoring/tasks/main.yml" {14-16}
---
- name: Install node_exporter
  ansible.builtin.apt:
    name: prometheus-node-exporter
    state: present
  notify: restart node_exporter

- name: Install Prometheus server
  ansible.builtin.apt:
    name: prometheus
    state: present
  when: "'monitoring' in group_names"

- name: Deploy scrape config
  ansible.builtin.template:
    src: prometheus.yml.j2
    dest: /etc/prometheus/prometheus.yml
    owner: prometheus
    mode: '0640'
  when: "'monitoring' in group_names"
  notify: restart prometheus
```

## 04 · Provisioning a new node

Bringing up a fresh Pi is meant to be four steps, in this order, because
each one depends on the last:

1. Flash Raspberry Pi OS Lite to the SD card and drop an empty `ssh` file
   and a `wpa_supplicant.conf` (or a wired connection) onto the boot
   partition.
2. Boot it, find its DHCP lease, and add it to `inventory.ini` under the
   right group.
3. Run `ansible-playbook site.yml --limit pi-04 --check --diff` and read
   the diff before doing anything for real — this is the step that's
   skipped most often and regretted most often.
4. Run it for real: `ansible-playbook site.yml --limit pi-04`.

:::note
`--check --diff` against a brand-new node produces an enormous diff — that's
expected, everything is "changed" on a box that's never seen the playbook.
The useful signal isn't the size of the diff, it's whether anything in it
looks like a task that shouldn't apply to this node at all.
:::

```terminal host="pi-04"
$ ansible-playbook site.yml --limit pi-04
PLAY [all] *********************************************************
TASK [base : Install baseline packages] ****************************
changed: [pi-04]
TASK [base : Configure unattended-upgrades] ************************
changed: [pi-04]
TASK [monitoring : Install node_exporter] ***************************
changed: [pi-04]
TASK [firewall : Apply nftables ruleset] *****************************
changed: [pi-04]
PLAY RECAP **********************************************************
pi-04                      : ok=14   changed=14   unreachable=0    failed=0
```

Fourteen tasks, four minutes, one command. That's the twelve-minute rebuild
this whole setup exists to buy back.

## 05 · Monitoring, and where it broke

`node_exporter` runs on all three nodes and reports to a single Prometheus
instance on `pi-01`. The scrape config is templated so that adding a fourth
node is an inventory change, not a config change.

### 5.1 · Reading the [textfile collector](https://github.com/prometheus/node_exporter#textfile-collector) the hard way

`node_exporter`'s textfile collector reads `.prom` files from a fixed
directory and republishes whatever's in them — it's how a cron job or an
Ansible handler can expose a custom metric without writing a Prometheus
exporter from scratch.[^3] I used it for `ansible_last_run_timestamp`, written
by a handler after every successful playbook run, specifically so the
dashboard could answer "when did each node last actually converge" instead
of just "is it up right now."

```jinja2 title="ansible/roles/monitoring/templates/prometheus.yml.j2"
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets:
{% for host in groups['nodes'] %}
          - '{{ hostvars[host].ansible_host }}:9100'
{% endfor %}
```

```ini title="ansible/inventory.ini"
[monitoring]
pi-01 ansible_host=10.20.0.11

[nodes]
pi-01 ansible_host=10.20.0.11
pi-02 ansible_host=10.20.0.12
pi-03 ansible_host=10.20.0.13
```

:::warning
The textfile collector silently ignores a `.prom` file with a stale mtime
older than its configured staleness threshold — it doesn't error, it just
stops reporting that metric, and Prometheus shows the target as `up` the
whole time because the _scrape_ is still succeeding. I lost most of a
morning to a dashboard that looked healthy while `ansible_last_run_timestamp`
had been silently frozen for two weeks. The fix was a second, boring
metric: `node_textfile_mtime_seconds`, alerted on directly.
:::

## 06 · What it costs

Reproducibility isn't free. Every node runs slightly more than it strictly
needs, and every playbook run costs real time even when nothing changes.

| Node    | Full run (cold) | Converged run | Roles applied              |
| ------- | --------------: | ------------: | -------------------------- |
| `pi-01` |          3m 40s |        0m 22s | base, monitoring, firewall |
| `pi-02` |          2m 55s |        0m 18s | base, monitoring, firewall |
| `pi-03` |          2m 51s |        0m 17s | base, monitoring, firewall |

_Table 1 — "Converged run" is `ansible-playbook site.yml` against a node
already at the desired state; it omits the SSH connection and fact-gathering
overhead paid on every run regardless of what changes._

### 6.1 · The diff that mattered

The `firewall` role used to run before `monitoring`. Reordering it cost one
line:

```diff title="ansible/site.yml"
 - import_playbook: playbooks/base.yml
 - import_playbook: playbooks/firewall.yml
+- import_playbook: playbooks/monitoring.yml
+- import_playbook: playbooks/firewall.yml
```

Applying the firewall rules before Prometheus was configured meant a
freshly-provisioned node briefly blocked its own scrape port, and the
first metrics point for any new node was a five-minute gap that looked
exactly like an outage. Reordering two lines was the whole fix — the kind
of change that's easy to make and easy to lose track of, which is the
entire argument for keeping it in one file instead of three people's shell
history.

## 07 · A diagram of the whole thing

<!-- Phase 3.3: remark-directives.ts fails the build on ":::figure" on
     purpose — figures are Phase 4's directive, not yet implemented, and
     the plugin errors loudly rather than silently dropping the block for
     a phase and a half. Plain img + caption stands in until then; this
     becomes a real :::figure{kind="diagram"} directive in Phase 4. -->

![Diagram of the homelab: a laptop pushing an Ansible playbook to three Raspberry Pi nodes, which each run node_exporter and forward metrics to a Prometheus instance on pi-01](/dev/homelab-architecture.svg)

Fig. 1 — Everything reaches a node through the same playbook, including the
Prometheus server itself, which is `pi-01` with one extra role rather than
a separate machine.

## 08 · What's still not reproducible

Two things this doesn't cover, on purpose. The SD card image itself is
hand-flashed — there's no `packer` build producing a golden image, so
"empty SD card" still means "official Raspberry Pi OS Lite," and if that
image's defaults ever change, the playbook's assumptions about it change
with them, silently. And secrets — the WireGuard keys, the Prometheus
basic-auth password — live in an `ansible-vault`-encrypted file[^1] that
isn't itself under any reproducibility guarantee beyond "don't lose the
vault password," which is a single point of failure this whole exercise
otherwise tries to eliminate.

The relevant `community.general` module for the one piece of this I still
do by hand — setting the timezone — is documented at
[https://github.com/ansible-collections/community.general/blob/main/plugins/modules/system/timezone.py](https://github.com/ansible-collections/community.general/blob/main/plugins/modules/system/timezone.py),
and folding it into `roles/base` is the next thing on the list.

None of this makes the setup finished. It makes the gaps in it specific
and nameable, which is a more honest goal than "finished" was ever going
to be for three Raspberry Pis on a shelf.[^2]

[^1]:
    `group_vars/all/vault.yml`, decrypted at run time with
    `--ask-vault-pass`. Not committed in plaintext anywhere, including in
    this article.

[^2]:
    With thanks to the Prometheus documentation for the textfile
    collector's staleness semantics, which are correct and clearly stated
    — I just read them after the outage rather than before.

[^3]:
    Full scrape and alerting configuration:
    `ansible/roles/monitoring/templates/prometheus.yml.j2`.
