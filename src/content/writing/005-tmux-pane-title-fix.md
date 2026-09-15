---
number: 5
title: 'A four-line fix for tmux losing pane titles over SSH'
lead: 'A shell function, not a config file — the whole fix fits on one line and has outlived every dotfile framework I tried before it.'
section: 'Infrastructure'
date: 2026-09-05
tags: ['notes']
draft: false
---

Every terminal multiplexer config I tried for renaming tmux panes after an
SSH session drops ended up heavier than the problem deserved — hooks,
plugins, a background process watching pty state. The actual fix is one
shell function bound to `PROMPT_COMMAND`: it reads the current host from
`$SSH_CONNECTION` and calls `tmux rename-window` directly, no plugin, no
config file, nothing to go stale. It has survived three terminal emulators
and two shells unmodified since. Not every problem needs infrastructure —
some of them just need four lines in `.bashrc` and the discipline to stop
there.
