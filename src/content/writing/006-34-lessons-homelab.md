---
number: 6
title: '34 lessons from three years of running a homelab'
lead: 'Every one of these was learned the expensive way — by having the shortcut fail first and the fix arrive after, not before.'
section: 'Infrastructure'
date: 2026-09-14
tags: ['infrastructure', 'homelab']
draft: false
---

## 01 · Idempotent is not the same as reproducible

It is easy to mistake idempotent runs for reproducible builds right up until the moment a postmortem asks which one you actually had. By then the honest answer is usually neither, quite. What actually helps is treating idempotent runs as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once reproducible builds is finally in place.

A useful test is to imagine explaining the current setup to someone joining cold. If the honest explanation of idempotent runs takes more than one sentence and ends with "but it works," that sentence is the backlog item, and reproducible builds is what closes it.

The lab does not need to be perfect to be honest about this — a single comment noting that reproducible builds is a stand-in for idempotent runs saves the next debugging session an hour of rediscovering the same thing. The practical version of this lesson fits in a single Ansible task or a single line in a runbook — not a redesign. Small, named, and checked off is worth more than a big plan for reproducible builds that never gets scheduled.

The scale is smaller than a real production environment, but the failure mode is identical, and pretending otherwise is how idempotent runs quietly becomes load-bearing infrastructure. Small scale is not the same as low stakes once something actually depends on it.

## 02 · Write the runbook before the incident, not after

Nothing in the initial setup forces you to tell a runbook apart from an incident, which is exactly why so many labs never do — the first version works, and "works" is a low bar that hides a lot. A short checklist beats a long memory here: confirm a runbook still matches what is running, and if it does not, that gap is the next task, not a footnote for later.

The homelab context makes this easy to excuse — nobody is paging you at 3 a.m. over a runbook, so it stays unfixed. The excuse works right up until the one weekend a real project depends on an incident actually holding, and by then there is no slack left to fix it under pressure.

The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what an incident was standing in for, and replace it with a runbook before the next change lands on top of it. Concretely: a single markdown file per host, checked into the same repo as the playbooks, noting where a runbook still applies and when it was last reviewed. That file is the entire mechanism, and it is enough.

Fixing it once is cheap. Fixing it after a runbook has been relied on for six months is not, and that is the whole argument for doing it now instead of after the next incident. Cheap now is the only version of cheap this lesson offers.

## 03 · A single Raspberry Pi is not a cluster

Every homelab eventually runs into the difference between one node and a real cluster, usually at the worst possible time — mid-migration, mid-outage, or mid-explanation to someone who assumed the two were interchangeable. The lab does not need to be perfect to be honest about this — a single comment noting that one node is a stand-in for a real cluster saves the next debugging session an hour of rediscovering the same thing.

Worth naming plainly: this is not a hypothetical risk. One node has caused a real outage in this lab before, and the fix at the time was the fast, local one — not a real cluster, which would have prevented the next occurrence instead of just the last one.

What actually helps is treating a real cluster as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once one node is finally in place. The smallest version that actually works is a comment and a date — not a ticket, not a project, just a note next to one node saying what a real cluster should look like and why it is not there yet.

Writing this down is most of the fix — a real cluster does not need to be perfect, it needs to be the thing that is actually true when someone else (including future you) goes looking. That bar is lower than it sounds and still gets skipped most of the time.

## 04 · Backups you have not restored do not exist

The gap between an untested backup and a proven restore only shows up once something actually breaks, and by then it is too expensive to pretend the distinction was academic. It is the kind of gap that looks theoretical right up until it is not. The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what an untested backup was standing in for, and replace it with a proven restore before the next change lands on top of it.

This is also the kind of thing that only becomes visible in hindsight. At the time an untested backup felt like a reasonable shortcut — the lab was small, the stakes were low, and a proven restore was always going to be "next weekend's project." Next weekend arrived with a different fire to put out, and the shortcut quietly became the default.

A short checklist beats a long memory here: confirm a proven restore still matches what is running, and if it does not, that gap is the next task, not a footnote for later. In practice this shows up as a short, boring task: audit where an untested backup is currently assumed, write one line per instance, and replace them one at a time rather than in a single sweeping rewrite that risks breaking something else that quietly depended on the old behaviour.

None of this is exotic advice. It is the same discipline a production team would apply, scaled down to three machines and one person on call — which, in a homelab, is also the only person who will ever read the postmortem. That person is worth writing for.

## 05 · Monitoring that pages you for everything pages you for nothing

It is easy to mistake noisy alerts for a real page right up until the moment a postmortem asks which one you actually had. By then the honest answer is usually neither, quite. What actually helps is treating noisy alerts as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a real page is finally in place.

A useful test is to imagine explaining the current setup to someone joining cold. If the honest explanation of noisy alerts takes more than one sentence and ends with "but it works," that sentence is the backlog item, and a real page is what closes it.

The lab does not need to be perfect to be honest about this — a single comment noting that a real page is a stand-in for noisy alerts saves the next debugging session an hour of rediscovering the same thing. The practical version of this lesson fits in a single Ansible task or a single line in a runbook — not a redesign. Small, named, and checked off is worth more than a big plan for a real page that never gets scheduled.

The scale is smaller than a real production environment, but the failure mode is identical, and pretending otherwise is how noisy alerts quietly becomes load-bearing infrastructure. Small scale is not the same as low stakes once something actually depends on it.

## 06 · DNS is still the first thing to check

Nothing in the initial setup forces you to tell a DNS record apart from the resolver, which is exactly why so many labs never do — the first version works, and "works" is a low bar that hides a lot. A short checklist beats a long memory here: confirm a DNS record still matches what is running, and if it does not, that gap is the next task, not a footnote for later.

The homelab context makes this easy to excuse — nobody is paging you at 3 a.m. over a DNS record, so it stays unfixed. The excuse works right up until the one weekend a real project depends on the resolver actually holding, and by then there is no slack left to fix it under pressure.

The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what the resolver was standing in for, and replace it with a DNS record before the next change lands on top of it. Concretely: a single markdown file per host, checked into the same repo as the playbooks, noting where a DNS record still applies and when it was last reviewed. That file is the entire mechanism, and it is enough.

Fixing it once is cheap. Fixing it after a DNS record has been relied on for six months is not, and that is the whole argument for doing it now instead of after the next incident. Cheap now is the only version of cheap this lesson offers.

## 07 · Secrets belong in a vault, not a git history

Every homelab eventually runs into the difference between a committed secret and a vaulted one, usually at the worst possible time — mid-migration, mid-outage, or mid-explanation to someone who assumed the two were interchangeable. The lab does not need to be perfect to be honest about this — a single comment noting that a committed secret is a stand-in for a vaulted one saves the next debugging session an hour of rediscovering the same thing.

Worth naming plainly: this is not a hypothetical risk. A committed secret has caused a real outage in this lab before, and the fix at the time was the fast, local one — not a vaulted one, which would have prevented the next occurrence instead of just the last one.

What actually helps is treating a vaulted one as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a committed secret is finally in place. The smallest version that actually works is a comment and a date — not a ticket, not a project, just a note next to a committed secret saying what a vaulted one should look like and why it is not there yet.

Writing this down is most of the fix — a vaulted one does not need to be perfect, it needs to be the thing that is actually true when someone else (including future you) goes looking. That bar is lower than it sounds and still gets skipped most of the time.

## 08 · Every cron job needs an owner

The gap between an orphaned job and a named owner only shows up once something actually breaks, and by then it is too expensive to pretend the distinction was academic. It is the kind of gap that looks theoretical right up until it is not. The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what an orphaned job was standing in for, and replace it with a named owner before the next change lands on top of it.

This is also the kind of thing that only becomes visible in hindsight. At the time an orphaned job felt like a reasonable shortcut — the lab was small, the stakes were low, and a named owner was always going to be "next weekend's project." Next weekend arrived with a different fire to put out, and the shortcut quietly became the default.

A short checklist beats a long memory here: confirm a named owner still matches what is running, and if it does not, that gap is the next task, not a footnote for later. In practice this shows up as a short, boring task: audit where an orphaned job is currently assumed, write one line per instance, and replace them one at a time rather than in a single sweeping rewrite that risks breaking something else that quietly depended on the old behaviour.

None of this is exotic advice. It is the same discipline a production team would apply, scaled down to three machines and one person on call — which, in a homelab, is also the only person who will ever read the postmortem. That person is worth writing for.

## 09 · Cable labels outlive your memory of the wiring

It is easy to mistake an unlabeled run for a labeled one right up until the moment a postmortem asks which one you actually had. By then the honest answer is usually neither, quite. What actually helps is treating an unlabeled run as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a labeled one is finally in place.

A useful test is to imagine explaining the current setup to someone joining cold. If the honest explanation of an unlabeled run takes more than one sentence and ends with "but it works," that sentence is the backlog item, and a labeled one is what closes it.

The lab does not need to be perfect to be honest about this — a single comment noting that a labeled one is a stand-in for an unlabeled run saves the next debugging session an hour of rediscovering the same thing. The practical version of this lesson fits in a single Ansible task or a single line in a runbook — not a redesign. Small, named, and checked off is worth more than a big plan for a labeled one that never gets scheduled.

The scale is smaller than a real production environment, but the failure mode is identical, and pretending otherwise is how an unlabeled run quietly becomes load-bearing infrastructure. Small scale is not the same as low stakes once something actually depends on it.

## 10 · A UPS buys you time, not immunity

Nothing in the initial setup forces you to tell a brief outage apart from a real failure, which is exactly why so many labs never do — the first version works, and "works" is a low bar that hides a lot. A short checklist beats a long memory here: confirm a brief outage still matches what is running, and if it does not, that gap is the next task, not a footnote for later.

The homelab context makes this easy to excuse — nobody is paging you at 3 a.m. over a brief outage, so it stays unfixed. The excuse works right up until the one weekend a real project depends on a real failure actually holding, and by then there is no slack left to fix it under pressure.

The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what a real failure was standing in for, and replace it with a brief outage before the next change lands on top of it. Concretely: a single markdown file per host, checked into the same repo as the playbooks, noting where a brief outage still applies and when it was last reviewed. That file is the entire mechanism, and it is enough.

Fixing it once is cheap. Fixing it after a brief outage has been relied on for six months is not, and that is the whole argument for doing it now instead of after the next incident. Cheap now is the only version of cheap this lesson offers.

## 11 · Version-pin everything or inherit someone else’s Tuesday

Every homelab eventually runs into the difference between a floating tag and a pinned version, usually at the worst possible time — mid-migration, mid-outage, or mid-explanation to someone who assumed the two were interchangeable. The lab does not need to be perfect to be honest about this — a single comment noting that a floating tag is a stand-in for a pinned version saves the next debugging session an hour of rediscovering the same thing.

Worth naming plainly: this is not a hypothetical risk. A floating tag has caused a real outage in this lab before, and the fix at the time was the fast, local one — not a pinned version, which would have prevented the next occurrence instead of just the last one.

What actually helps is treating a pinned version as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a floating tag is finally in place. The smallest version that actually works is a comment and a date — not a ticket, not a project, just a note next to a floating tag saying what a pinned version should look like and why it is not there yet.

Writing this down is most of the fix — a pinned version does not need to be perfect, it needs to be the thing that is actually true when someone else (including future you) goes looking. That bar is lower than it sounds and still gets skipped most of the time.

## 12 · The staging environment that never staged anything

The gap between a stale staging box and a real rehearsal only shows up once something actually breaks, and by then it is too expensive to pretend the distinction was academic. It is the kind of gap that looks theoretical right up until it is not. The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what a stale staging box was standing in for, and replace it with a real rehearsal before the next change lands on top of it.

This is also the kind of thing that only becomes visible in hindsight. At the time a stale staging box felt like a reasonable shortcut — the lab was small, the stakes were low, and a real rehearsal was always going to be "next weekend's project." Next weekend arrived with a different fire to put out, and the shortcut quietly became the default.

A short checklist beats a long memory here: confirm a real rehearsal still matches what is running, and if it does not, that gap is the next task, not a footnote for later. In practice this shows up as a short, boring task: audit where a stale staging box is currently assumed, write one line per instance, and replace them one at a time rather than in a single sweeping rewrite that risks breaking something else that quietly depended on the old behaviour.

None of this is exotic advice. It is the same discipline a production team would apply, scaled down to three machines and one person on call — which, in a homelab, is also the only person who will ever read the postmortem. That person is worth writing for.

## 13 · Reboots are a test, not a chore

It is easy to mistake an untested reboot for a rehearsed one right up until the moment a postmortem asks which one you actually had. By then the honest answer is usually neither, quite. What actually helps is treating an untested reboot as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a rehearsed one is finally in place.

A useful test is to imagine explaining the current setup to someone joining cold. If the honest explanation of an untested reboot takes more than one sentence and ends with "but it works," that sentence is the backlog item, and a rehearsed one is what closes it.

The lab does not need to be perfect to be honest about this — a single comment noting that a rehearsed one is a stand-in for an untested reboot saves the next debugging session an hour of rediscovering the same thing. The practical version of this lesson fits in a single Ansible task or a single line in a runbook — not a redesign. Small, named, and checked off is worth more than a big plan for a rehearsed one that never gets scheduled.

The scale is smaller than a real production environment, but the failure mode is identical, and pretending otherwise is how an untested reboot quietly becomes load-bearing infrastructure. Small scale is not the same as low stakes once something actually depends on it.

## 14 · Documentation rots faster than hardware

Nothing in the initial setup forces you to tell a stale doc apart from a maintained one, which is exactly why so many labs never do — the first version works, and "works" is a low bar that hides a lot. A short checklist beats a long memory here: confirm a stale doc still matches what is running, and if it does not, that gap is the next task, not a footnote for later.

The homelab context makes this easy to excuse — nobody is paging you at 3 a.m. over a stale doc, so it stays unfixed. The excuse works right up until the one weekend a real project depends on a maintained one actually holding, and by then there is no slack left to fix it under pressure.

The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what a maintained one was standing in for, and replace it with a stale doc before the next change lands on top of it. Concretely: a single markdown file per host, checked into the same repo as the playbooks, noting where a stale doc still applies and when it was last reviewed. That file is the entire mechanism, and it is enough.

Fixing it once is cheap. Fixing it after a stale doc has been relied on for six months is not, and that is the whole argument for doing it now instead of after the next incident. Cheap now is the only version of cheap this lesson offers.

## 15 · One playbook, many inventories

Every homelab eventually runs into the difference between a hardcoded host and a real inventory, usually at the worst possible time — mid-migration, mid-outage, or mid-explanation to someone who assumed the two were interchangeable. The lab does not need to be perfect to be honest about this — a single comment noting that a hardcoded host is a stand-in for a real inventory saves the next debugging session an hour of rediscovering the same thing.

Worth naming plainly: this is not a hypothetical risk. A hardcoded host has caused a real outage in this lab before, and the fix at the time was the fast, local one — not a real inventory, which would have prevented the next occurrence instead of just the last one.

What actually helps is treating a real inventory as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a hardcoded host is finally in place. The smallest version that actually works is a comment and a date — not a ticket, not a project, just a note next to a hardcoded host saying what a real inventory should look like and why it is not there yet.

Writing this down is most of the fix — a real inventory does not need to be perfect, it needs to be the thing that is actually true when someone else (including future you) goes looking. That bar is lower than it sounds and still gets skipped most of the time.

## 16 · The switch is the single point of failure nobody diagrams

The gap between an undocumented switch and a drawn topology only shows up once something actually breaks, and by then it is too expensive to pretend the distinction was academic. It is the kind of gap that looks theoretical right up until it is not. The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what an undocumented switch was standing in for, and replace it with a drawn topology before the next change lands on top of it.

This is also the kind of thing that only becomes visible in hindsight. At the time an undocumented switch felt like a reasonable shortcut — the lab was small, the stakes were low, and a drawn topology was always going to be "next weekend's project." Next weekend arrived with a different fire to put out, and the shortcut quietly became the default.

A short checklist beats a long memory here: confirm a drawn topology still matches what is running, and if it does not, that gap is the next task, not a footnote for later. In practice this shows up as a short, boring task: audit where an undocumented switch is currently assumed, write one line per instance, and replace them one at a time rather than in a single sweeping rewrite that risks breaking something else that quietly depended on the old behaviour.

None of this is exotic advice. It is the same discipline a production team would apply, scaled down to three machines and one person on call — which, in a homelab, is also the only person who will ever read the postmortem. That person is worth writing for.

## 17 · Logs you never read are logs you never needed

It is easy to mistake an unread log for a useful one right up until the moment a postmortem asks which one you actually had. By then the honest answer is usually neither, quite. What actually helps is treating an unread log as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a useful one is finally in place.

A useful test is to imagine explaining the current setup to someone joining cold. If the honest explanation of an unread log takes more than one sentence and ends with "but it works," that sentence is the backlog item, and a useful one is what closes it.

The lab does not need to be perfect to be honest about this — a single comment noting that a useful one is a stand-in for an unread log saves the next debugging session an hour of rediscovering the same thing. The practical version of this lesson fits in a single Ansible task or a single line in a runbook — not a redesign. Small, named, and checked off is worth more than a big plan for a useful one that never gets scheduled.

The scale is smaller than a real production environment, but the failure mode is identical, and pretending otherwise is how an unread log quietly becomes load-bearing infrastructure. Small scale is not the same as low stakes once something actually depends on it.

## 18 · Firmware updates are maintenance, not an emergency

Nothing in the initial setup forces you to tell a deferred update apart from a scheduled one, which is exactly why so many labs never do — the first version works, and "works" is a low bar that hides a lot. A short checklist beats a long memory here: confirm a deferred update still matches what is running, and if it does not, that gap is the next task, not a footnote for later.

The homelab context makes this easy to excuse — nobody is paging you at 3 a.m. over a deferred update, so it stays unfixed. The excuse works right up until the one weekend a real project depends on a scheduled one actually holding, and by then there is no slack left to fix it under pressure.

The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what a scheduled one was standing in for, and replace it with a deferred update before the next change lands on top of it. Concretely: a single markdown file per host, checked into the same repo as the playbooks, noting where a deferred update still applies and when it was last reviewed. That file is the entire mechanism, and it is enough.

Fixing it once is cheap. Fixing it after a deferred update has been relied on for six months is not, and that is the whole argument for doing it now instead of after the next incident. Cheap now is the only version of cheap this lesson offers.

## 19 · A homelab budget is a lie you tell yourself in year one

Every homelab eventually runs into the difference between a first estimate and the real total, usually at the worst possible time — mid-migration, mid-outage, or mid-explanation to someone who assumed the two were interchangeable. The lab does not need to be perfect to be honest about this — a single comment noting that a first estimate is a stand-in for the real total saves the next debugging session an hour of rediscovering the same thing.

Worth naming plainly: this is not a hypothetical risk. A first estimate has caused a real outage in this lab before, and the fix at the time was the fast, local one — not the real total, which would have prevented the next occurrence instead of just the last one.

What actually helps is treating the real total as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a first estimate is finally in place. The smallest version that actually works is a comment and a date — not a ticket, not a project, just a note next to a first estimate saying what the real total should look like and why it is not there yet.

Writing this down is most of the fix — the real total does not need to be perfect, it needs to be the thing that is actually true when someone else (including future you) goes looking. That bar is lower than it sounds and still gets skipped most of the time.

## 20 · Naming conventions are a contract with future you

The gap between an inconsistent name and a stable one only shows up once something actually breaks, and by then it is too expensive to pretend the distinction was academic. It is the kind of gap that looks theoretical right up until it is not. The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what an inconsistent name was standing in for, and replace it with a stable one before the next change lands on top of it.

This is also the kind of thing that only becomes visible in hindsight. At the time an inconsistent name felt like a reasonable shortcut — the lab was small, the stakes were low, and a stable one was always going to be "next weekend's project." Next weekend arrived with a different fire to put out, and the shortcut quietly became the default.

A short checklist beats a long memory here: confirm a stable one still matches what is running, and if it does not, that gap is the next task, not a footnote for later. In practice this shows up as a short, boring task: audit where an inconsistent name is currently assumed, write one line per instance, and replace them one at a time rather than in a single sweeping rewrite that risks breaking something else that quietly depended on the old behaviour.

None of this is exotic advice. It is the same discipline a production team would apply, scaled down to three machines and one person on call — which, in a homelab, is also the only person who will ever read the postmortem. That person is worth writing for.

## 21 · The router is not a good place to store state

It is easy to mistake router-local state for a real datastore right up until the moment a postmortem asks which one you actually had. By then the honest answer is usually neither, quite. What actually helps is treating router-local state as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a real datastore is finally in place.

A useful test is to imagine explaining the current setup to someone joining cold. If the honest explanation of router-local state takes more than one sentence and ends with "but it works," that sentence is the backlog item, and a real datastore is what closes it.

The lab does not need to be perfect to be honest about this — a single comment noting that a real datastore is a stand-in for router-local state saves the next debugging session an hour of rediscovering the same thing. The practical version of this lesson fits in a single Ansible task or a single line in a runbook — not a redesign. Small, named, and checked off is worth more than a big plan for a real datastore that never gets scheduled.

The scale is smaller than a real production environment, but the failure mode is identical, and pretending otherwise is how router-local state quietly becomes load-bearing infrastructure. Small scale is not the same as low stakes once something actually depends on it.

## 22 · Automate the boring restore, not just the boring deploy

Nothing in the initial setup forces you to tell a manual restore apart from a scripted one, which is exactly why so many labs never do — the first version works, and "works" is a low bar that hides a lot. A short checklist beats a long memory here: confirm a manual restore still matches what is running, and if it does not, that gap is the next task, not a footnote for later.

The homelab context makes this easy to excuse — nobody is paging you at 3 a.m. over a manual restore, so it stays unfixed. The excuse works right up until the one weekend a real project depends on a scripted one actually holding, and by then there is no slack left to fix it under pressure.

The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what a scripted one was standing in for, and replace it with a manual restore before the next change lands on top of it. Concretely: a single markdown file per host, checked into the same repo as the playbooks, noting where a manual restore still applies and when it was last reviewed. That file is the entire mechanism, and it is enough.

Fixing it once is cheap. Fixing it after a manual restore has been relied on for six months is not, and that is the whole argument for doing it now instead of after the next incident. Cheap now is the only version of cheap this lesson offers.

## 23 · Temperature is a metric, not a vibe

Every homelab eventually runs into the difference between a guessed temperature and a logged one, usually at the worst possible time — mid-migration, mid-outage, or mid-explanation to someone who assumed the two were interchangeable. The lab does not need to be perfect to be honest about this — a single comment noting that a guessed temperature is a stand-in for a logged one saves the next debugging session an hour of rediscovering the same thing.

Worth naming plainly: this is not a hypothetical risk. A guessed temperature has caused a real outage in this lab before, and the fix at the time was the fast, local one — not a logged one, which would have prevented the next occurrence instead of just the last one.

What actually helps is treating a logged one as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a guessed temperature is finally in place. The smallest version that actually works is a comment and a date — not a ticket, not a project, just a note next to a guessed temperature saying what a logged one should look like and why it is not there yet.

Writing this down is most of the fix — a logged one does not need to be perfect, it needs to be the thing that is actually true when someone else (including future you) goes looking. That bar is lower than it sounds and still gets skipped most of the time.

## 24 · Every service needs a health check that actually checks health

The gap between a fake health check and a real one only shows up once something actually breaks, and by then it is too expensive to pretend the distinction was academic. It is the kind of gap that looks theoretical right up until it is not. The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what a fake health check was standing in for, and replace it with a real one before the next change lands on top of it.

This is also the kind of thing that only becomes visible in hindsight. At the time a fake health check felt like a reasonable shortcut — the lab was small, the stakes were low, and a real one was always going to be "next weekend's project." Next weekend arrived with a different fire to put out, and the shortcut quietly became the default.

A short checklist beats a long memory here: confirm a real one still matches what is running, and if it does not, that gap is the next task, not a footnote for later. In practice this shows up as a short, boring task: audit where a fake health check is currently assumed, write one line per instance, and replace them one at a time rather than in a single sweeping rewrite that risks breaking something else that quietly depended on the old behaviour.

None of this is exotic advice. It is the same discipline a production team would apply, scaled down to three machines and one person on call — which, in a homelab, is also the only person who will ever read the postmortem. That person is worth writing for.

## 25 · The NAS is not a backup destination by default

It is easy to mistake a single copy for a second location right up until the moment a postmortem asks which one you actually had. By then the honest answer is usually neither, quite. What actually helps is treating a single copy as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a second location is finally in place.

A useful test is to imagine explaining the current setup to someone joining cold. If the honest explanation of a single copy takes more than one sentence and ends with "but it works," that sentence is the backlog item, and a second location is what closes it.

The lab does not need to be perfect to be honest about this — a single comment noting that a second location is a stand-in for a single copy saves the next debugging session an hour of rediscovering the same thing. The practical version of this lesson fits in a single Ansible task or a single line in a runbook — not a redesign. Small, named, and checked off is worth more than a big plan for a second location that never gets scheduled.

The scale is smaller than a real production environment, but the failure mode is identical, and pretending otherwise is how a single copy quietly becomes load-bearing infrastructure. Small scale is not the same as low stakes once something actually depends on it.

## 26 · Ansible facts are not a substitute for a real inventory

Nothing in the initial setup forces you to tell a gathered fact apart from a declared host, which is exactly why so many labs never do — the first version works, and "works" is a low bar that hides a lot. A short checklist beats a long memory here: confirm a gathered fact still matches what is running, and if it does not, that gap is the next task, not a footnote for later.

The homelab context makes this easy to excuse — nobody is paging you at 3 a.m. over a gathered fact, so it stays unfixed. The excuse works right up until the one weekend a real project depends on a declared host actually holding, and by then there is no slack left to fix it under pressure.

The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what a declared host was standing in for, and replace it with a gathered fact before the next change lands on top of it. Concretely: a single markdown file per host, checked into the same repo as the playbooks, noting where a gathered fact still applies and when it was last reviewed. That file is the entire mechanism, and it is enough.

Fixing it once is cheap. Fixing it after a gathered fact has been relied on for six months is not, and that is the whole argument for doing it now instead of after the next incident. Cheap now is the only version of cheap this lesson offers.

## 27 · A test restore schedule beats a test restore intention

Every homelab eventually runs into the difference between a vague intention and a calendar entry, usually at the worst possible time — mid-migration, mid-outage, or mid-explanation to someone who assumed the two were interchangeable. The lab does not need to be perfect to be honest about this — a single comment noting that a vague intention is a stand-in for a calendar entry saves the next debugging session an hour of rediscovering the same thing.

Worth naming plainly: this is not a hypothetical risk. A vague intention has caused a real outage in this lab before, and the fix at the time was the fast, local one — not a calendar entry, which would have prevented the next occurrence instead of just the last one.

What actually helps is treating a calendar entry as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a vague intention is finally in place. The smallest version that actually works is a comment and a date — not a ticket, not a project, just a note next to a vague intention saying what a calendar entry should look like and why it is not there yet.

Writing this down is most of the fix — a calendar entry does not need to be perfect, it needs to be the thing that is actually true when someone else (including future you) goes looking. That bar is lower than it sounds and still gets skipped most of the time.

## 28 · Power budgets matter more once you own the breaker panel

The gap between an assumed circuit and a measured one only shows up once something actually breaks, and by then it is too expensive to pretend the distinction was academic. It is the kind of gap that looks theoretical right up until it is not. The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what an assumed circuit was standing in for, and replace it with a measured one before the next change lands on top of it.

This is also the kind of thing that only becomes visible in hindsight. At the time an assumed circuit felt like a reasonable shortcut — the lab was small, the stakes were low, and a measured one was always going to be "next weekend's project." Next weekend arrived with a different fire to put out, and the shortcut quietly became the default.

A short checklist beats a long memory here: confirm a measured one still matches what is running, and if it does not, that gap is the next task, not a footnote for later. In practice this shows up as a short, boring task: audit where an assumed circuit is currently assumed, write one line per instance, and replace them one at a time rather than in a single sweeping rewrite that risks breaking something else that quietly depended on the old behaviour.

None of this is exotic advice. It is the same discipline a production team would apply, scaled down to three machines and one person on call — which, in a homelab, is also the only person who will ever read the postmortem. That person is worth writing for.

## 29 · The homelab wiki nobody updates is worse than no wiki

It is easy to mistake a stale wiki page for a deleted one right up until the moment a postmortem asks which one you actually had. By then the honest answer is usually neither, quite. What actually helps is treating a stale wiki page as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a deleted one is finally in place.

A useful test is to imagine explaining the current setup to someone joining cold. If the honest explanation of a stale wiki page takes more than one sentence and ends with "but it works," that sentence is the backlog item, and a deleted one is what closes it.

The lab does not need to be perfect to be honest about this — a single comment noting that a deleted one is a stand-in for a stale wiki page saves the next debugging session an hour of rediscovering the same thing. The practical version of this lesson fits in a single Ansible task or a single line in a runbook — not a redesign. Small, named, and checked off is worth more than a big plan for a deleted one that never gets scheduled.

The scale is smaller than a real production environment, but the failure mode is identical, and pretending otherwise is how a stale wiki page quietly becomes load-bearing infrastructure. Small scale is not the same as low stakes once something actually depends on it.

## 30 · Alerting thresholds inherited from a tutorial are not your thresholds

Nothing in the initial setup forces you to tell a copied threshold apart from a tuned one, which is exactly why so many labs never do — the first version works, and "works" is a low bar that hides a lot. A short checklist beats a long memory here: confirm a copied threshold still matches what is running, and if it does not, that gap is the next task, not a footnote for later.

The homelab context makes this easy to excuse — nobody is paging you at 3 a.m. over a copied threshold, so it stays unfixed. The excuse works right up until the one weekend a real project depends on a tuned one actually holding, and by then there is no slack left to fix it under pressure.

The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what a tuned one was standing in for, and replace it with a copied threshold before the next change lands on top of it. Concretely: a single markdown file per host, checked into the same repo as the playbooks, noting where a copied threshold still applies and when it was last reviewed. That file is the entire mechanism, and it is enough.

Fixing it once is cheap. Fixing it after a copied threshold has been relied on for six months is not, and that is the whole argument for doing it now instead of after the next incident. Cheap now is the only version of cheap this lesson offers.

## 31 · A second internet connection solves a problem you may not have

Every homelab eventually runs into the difference between a second uplink and the actual bottleneck, usually at the worst possible time — mid-migration, mid-outage, or mid-explanation to someone who assumed the two were interchangeable. The lab does not need to be perfect to be honest about this — a single comment noting that a second uplink is a stand-in for the actual bottleneck saves the next debugging session an hour of rediscovering the same thing.

Worth naming plainly: this is not a hypothetical risk. A second uplink has caused a real outage in this lab before, and the fix at the time was the fast, local one — not the actual bottleneck, which would have prevented the next occurrence instead of just the last one.

What actually helps is treating the actual bottleneck as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a second uplink is finally in place. The smallest version that actually works is a comment and a date — not a ticket, not a project, just a note next to a second uplink saying what the actual bottleneck should look like and why it is not there yet.

Writing this down is most of the fix — the actual bottleneck does not need to be perfect, it needs to be the thing that is actually true when someone else (including future you) goes looking. That bar is lower than it sounds and still gets skipped most of the time.

## 32 · Container sprawl happens one just-for-now at a time

The gap between a throwaway container and a forgotten one only shows up once something actually breaks, and by then it is too expensive to pretend the distinction was academic. It is the kind of gap that looks theoretical right up until it is not. The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what a throwaway container was standing in for, and replace it with a forgotten one before the next change lands on top of it.

This is also the kind of thing that only becomes visible in hindsight. At the time a throwaway container felt like a reasonable shortcut — the lab was small, the stakes were low, and a forgotten one was always going to be "next weekend's project." Next weekend arrived with a different fire to put out, and the shortcut quietly became the default.

A short checklist beats a long memory here: confirm a forgotten one still matches what is running, and if it does not, that gap is the next task, not a footnote for later. In practice this shows up as a short, boring task: audit where a throwaway container is currently assumed, write one line per instance, and replace them one at a time rather than in a single sweeping rewrite that risks breaking something else that quietly depended on the old behaviour.

None of this is exotic advice. It is the same discipline a production team would apply, scaled down to three machines and one person on call — which, in a homelab, is also the only person who will ever read the postmortem. That person is worth writing for.

## 33 · The lab network and the home network should not share a VLAN

It is easy to mistake a flat network for a segmented one right up until the moment a postmortem asks which one you actually had. By then the honest answer is usually neither, quite. What actually helps is treating a flat network as a known liability rather than a temporary one — tracked, dated, and revisited on purpose instead of rediscovered by accident once a segmented one is finally in place.

A useful test is to imagine explaining the current setup to someone joining cold. If the honest explanation of a flat network takes more than one sentence and ends with "but it works," that sentence is the backlog item, and a segmented one is what closes it.

The lab does not need to be perfect to be honest about this — a single comment noting that a segmented one is a stand-in for a flat network saves the next debugging session an hour of rediscovering the same thing. The practical version of this lesson fits in a single Ansible task or a single line in a runbook — not a redesign. Small, named, and checked off is worth more than a big plan for a segmented one that never gets scheduled.

The scale is smaller than a real production environment, but the failure mode is identical, and pretending otherwise is how a flat network quietly becomes load-bearing infrastructure. Small scale is not the same as low stakes once something actually depends on it.

## 34 · None of this matters if you never write it down

Nothing in the initial setup forces you to tell an unwritten lesson apart from a recorded one, which is exactly why so many labs never do — the first version works, and "works" is a low bar that hides a lot. A short checklist beats a long memory here: confirm an unwritten lesson still matches what is running, and if it does not, that gap is the next task, not a footnote for later.

The homelab context makes this easy to excuse — nobody is paging you at 3 a.m. over an unwritten lesson, so it stays unfixed. The excuse works right up until the one weekend a real project depends on a recorded one actually holding, and by then there is no slack left to fix it under pressure.

The fix is rarely more tooling. It is usually a smaller, more honest scope: name the assumption, write down what a recorded one was standing in for, and replace it with an unwritten lesson before the next change lands on top of it. Concretely: a single markdown file per host, checked into the same repo as the playbooks, noting where an unwritten lesson still applies and when it was last reviewed. That file is the entire mechanism, and it is enough.

Fixing it once is cheap. Fixing it after an unwritten lesson has been relied on for six months is not, and that is the whole argument for doing it now instead of after the next incident. Cheap now is the only version of cheap this lesson offers.
