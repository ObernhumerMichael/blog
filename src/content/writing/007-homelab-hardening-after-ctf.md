---
number: 7
title: 'What CTF pwn challenges taught me about my own SSH config'
lead: 'Every challenge box that fell to a service only ever meant to be reachable from localhost eventually made me go check my own — the boring hardening step was always the one that mattered.'
section: 'Security'
date: 2026-09-16
tags:
  [
    'ansible',
    'infrastructure',
    'homelab',
    'ctf',
    'security',
    'notes',
    'linux',
    'networking',
  ]
draft: false
---

Enough CTF pwn boxes fall to a service that was only ever meant to be
reachable from `localhost` that I went back and audited my own homelab
against the same pattern. The Ansible role bound Postgres and the
Prometheus exporters to `0.0.0.0` because that was the path of least
resistance during the original migration, not because anything needed WAN
access — WireGuard already puts every admin surface on one interface.
Re-running the role with `listen_addresses` pinned to the WireGuard IP,
plus a `ufw` rule denying the public interface by default, took ten
minutes and closed exactly the class of bug I keep writing up from the
other side of the table.
