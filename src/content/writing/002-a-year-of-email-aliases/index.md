---
number: 2
title: 'Email aliases for a year: small cost, no payoff yet'
lead: 'Every account I have now uses its own SimpleLogin alias. A year in, the daily cost turned out small, the fear of silent mail loss didn’t go away, and none of the 37 aliases has needed disabling.'
section: 'Security'
date: 2026-09-23
tags: ['privacy', 'security']
featured: false
draft: false
---

## 01 · What it costs

A year ago I started giving every service its own email address. I run SimpleLogin myself (it's one of the services from [the Ansible move](/w/001)) on a custom domain, and every account I have now has its own alias: the existing ones switched over, and every new sign-up created with one. That's 37 aliases today.

The day-to-day cost is smaller than I expected. Signing up somewhere means creating an alias first, which takes a few seconds. Replying is the part that felt strange at first: to answer a mail that came in through an alias, you write to a reverse alias that SimpleLogin generates, so the other side never sees your real address. After a while it stops feeling like anything. No service has rejected an alias yet, which I put down to the custom domain, since nothing about the addresses says "alias service".

The custom domain is the one thing I'd tell anyone to get right from the start, self-hosted or not. The aliases belong to the domain, not to the provider. If I ever move to a different alias service, I point the domain at it and every address keeps working. Without one, every alias lives on the provider's domain, and leaving means changing the address at every single service by hand. That's possible, but tedious enough that you'd probably just stay.

The real costs are elsewhere. Thirty-seven addresses only work with a password manager, because nobody remembers which address belongs to which account. You should use one anyway, but aliases make it non-optional. And all of my mail now depends on one piece of software I operate. If an update breaks SimpleLogin internally, mail stops arriving. In the worst case it stops arriving without an error anywhere, and that's the failure mode I worry about most.

## 02 · What it caught

Nothing, so far. None of the 37 aliases has received spam, and none has been disabled. The only spam I get still arrives at the address I used before any of this, which is the one thing aliases can't fix: an address that's already out there stays out there.

That's a less satisfying result than catching a company selling my address, but it's the honest one, and it isn't really the point. The point is what happens the day spam does show up on an alias. One click in SimpleLogin turns that alias off, I give the affected service a new one, and I know exactly which service leaked it. Without aliases, the same spam lands on the address every account shares, and the only fix is changing it everywhere.

So I'm keeping it. The cost is a few seconds per sign-up and a password manager I'd use anyway. The payoff hasn't arrived yet, but when it does, it's one click instead of an afternoon.
