---
number: 2
title: 'A padding-oracle writeup: turning 256 decryption oracles into a plaintext'
lead: 'The challenge server would only say "bad padding" or nothing at all — that one bit of signal was enough to decrypt every block without the key.'
section: 'Security'
date: 2026-08-27
tags: ['ctf', 'security']
draft: false
---

## 01 · What the server actually told us

The service decrypted a cookie on every request and returned one of two
responses: a generic error for bad padding, and a different generic error
for everything else. No stack trace, no timing difference worth trusting —
just that one bit, but it was enough.

## 02 · Recovering a byte at a time

Padding-oracle attacks work backward from the last byte of a block,
brute-forcing a manipulated previous block until the padding validates,
then reading off what that implies about the real plaintext underneath.

## 03 · What made this one slow

Rate limiting capped the oracle at roughly four requests a second, so the
naive per-byte brute force would have taken most of a day. Parallelizing
across blocks — each one independent once its neighbour is known — brought
the whole plaintext back in under twenty minutes.
