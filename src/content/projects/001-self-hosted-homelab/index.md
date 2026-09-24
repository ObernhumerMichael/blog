---
number: 1
title: 'Self-hosted homelab on Ansible'
description: 'A self-hosted service stack — Caddy, Uptime Kuma, Nextcloud, Immich, SimpleLogin and ntfy, with restic backups to a Raspberry Pi — rebuilt on Ansible instead of configured by hand.'
why: 'Every config in one place, versioned, and tested on a throwaway VM before it reaches production.'
stack: ['Ansible', 'Docker Compose', 'Debian', 'Caddy', 'restic']
status: 'active'
period: { from: 2023-10-28, to: null }
caseStudy: false
links:
  article: '/w/001'
  primaryLabel: 'read the write-up'
sourceAbsence: 'private repo · holds the Ansible Vault'
featured: true
draft: false
---

The full write-up — how the repository is structured, how backups plug into it, and what went wrong on the way — is [article 001](/w/001).

The repository itself stays private. It holds the Ansible Vault, and even encrypted, less exposure is better.
