---
number: 1
title: 'Self-hosted homelab & infrastructure automation'
description: 'Eleven services across a VPS and two Raspberry Pis, provisioned and configured entirely from code. The hard part was never Ansible — it was migrating running services onto it without downtime and proving the result was genuinely reproducible by destroying a host on purpose.'
why: 'A single SD-card failure used to mean a weekend of archaeology. Now it means twelve minutes.'
stack: ['ansible', 'debian', 'wireguard', 'postgres', 'prometheus', 'caddy']
status: 'active'
period:
  from: 2024-02-01
  to: null
caseStudy: true
links:
  article: '/w/001'
  source: 'https://github.com/mo/homelab'
featured: true
draft: false
---

## 01 · Problem & motivation

Three years of incremental self-hosting had produced eleven services and
about forty undocumented decisions. Everything worked, and nothing could be
rebuilt. The motivation was not elegance — it was that a failed SD card cost
a weekend, and I wanted it to cost twelve minutes.

## 02 · Architecture

Five roles, one inventory, no per-host special cases. Secrets live in an
age-encrypted store checked into the same repository; the private key is
the only thing that is not reproducible, and it lives in two physical
places.

## 03 · Implementation

Every host runs `ansible-playbook` against the same inventory, whether it's
a fresh SD card or a five-node re-converge. Grafana watches service health
across all three machines from a single dashboard on `pi-01`, so a slow
leak on `pi-03` shows up before it becomes a page.

## 04 · Technical decisions

| Decision  | Alternative | Why                                                      |
| --------- | ----------- | -------------------------------------------------------- |
| Ansible   | NixOS       | Existing Debian hosts; migration cost beat purity        |
| age + git | Vault       | One operator does not need a secrets service with an SLA |
| Caddy     | nginx       | Automatic certs removed the last manual annual task      |

Table 1 — the three that mattered; the rest are in the repository's ADR
folder.

## 05 · Results & lessons

Full rebuild of any host: under twelve minutes, verified monthly. Total
downtime during the migration: 41 seconds, all of it DNS. The lesson that
transferred: the inventory pass is worth more than the automation, because
most of what you find should be deleted rather than encoded.
