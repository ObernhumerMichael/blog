---
number: 1
title: 'What moving my homelab to Ansible actually took'
lead: "Almost three years of Docker Compose set up by hand over SSH, moved into an Ansible repository in a week, and the bugs that showed idempotent and reproducible aren’t the same claim."
section: 'Infrastructure'
date: 2026-09-23
tags: ['ansible', 'homelab', 'infrastructure']
featured: true
leadFigure:
  src: '/figures/001-backup-chain.svg'
  alt: 'Diagram of the backup chain: production VPS to a Raspberry Pi backup server, mirrored across two drives'
draft: false
---

## 01 · The problem with the old way

My homelab has run on a VPS since October 2023: Caddy in front of Uptime Kuma, Nextcloud, Immich and SimpleLogin, each one a `docker compose` project I had set up by hand over SSH. It worked. It also meant the real configuration of that server existed in two places — spread across files on the server itself, and in my head.

My head was the weak part. Setting something up on a new host meant keeping a long list of manual steps in mind and doing them in the right order: the firewall rule, the directory with the right owner, the one setting that had made it work last time. No single place described the whole server, so there was nothing to read when I forgot a step. And there was no history. When a change broke something, I couldn't look at what the config had been the day before, because the only copy was the one I had just edited.

In August 2026 I moved all of it into an Ansible repository: every config in one place, versioned in Git, with a test inventory of throwaway VMs in front of production. From the first commit to the first production deploy took a week.

## 02 · Idempotent isn't reproducible

The property Ansible is known for is idempotence: run the playbook against a host that's already configured, and nothing changes. This is what a second run against the production VPS looks like now:

```terminal host="vps"
$ make prod-site
PLAY RECAP **********************************************************************************************************************
vps                        : ok=107  changed=0    unreachable=0    failed=0    skipped=9    rescued=0    ignored=0
```

Listing 1 — A second run against production: 107 tasks checked, none changed.

That's a real guarantee, but it's a guarantee about the _second_ run. What I actually wanted from the repository is a different claim: reproducibility. Given only the repository and the vault, a fresh machine should end up in the same state as the one it replaces. Idempotence doesn't imply that. A task can converge perfectly and still depend on something that isn't in the repository.

I found one of those in review. The backup client adds the backup server to its `known_hosts`, and the first version fetched the key at run time:

```diff title="roles/backup_client/tasks/ssh.yml"
   ansible.builtin.known_hosts:
     path: "/home/{{ backup_client_user }}/.ssh/known_hosts"
     name: "{{ backup_client_repository_host }}"
-    key: "{{ lookup('pipe', 'ssh-keyscan -t ed25519 ' ~ backup_client_repository_host) }}"
+    key: "{{ backup_client_repository_host_key }}"
     state: present
```

Listing 2 — The host key used to be whatever answered `ssh-keyscan` during the run; now it's a value in the inventory.

The old task was idempotent: once the key was in `known_hosts`, later runs changed nothing. But on a fresh host, the network decided the result, not the repository. Whatever machine answered at that address during the first run became trusted, silently. That's trust-on-first-use, automated. Pinning the key moves the trust decision into a reviewed line in Git. I checked the key once, and every rebuild uses that one.

The rest of the repository is built around the same idea. Test and production use the same roles and playbooks and differ only in their inventories, and a change reaches production only after it has run on a test VM.

## 03 · Structuring the playbook for backups

The part of the old setup I trusted least was backups, so it's the part the repository is most deliberate about. The rule is that the backup system knows nothing about any application. Each application role describes what needs saving, and one generic role, `backup_client`, turns that description into a scheduled job.

For Immich the description is a variable in the role's defaults:

```yaml title="roles/immich/defaults/main.yml"
immich_backup_job:
  name: immich
  paths:
    - "{{ immich_base_dir }}/files"
    - "{{ immich_base_dir }}/library"
    - "{{ immich_base_dir }}/immich_backup.sql.gz"
```

Listing 3 — A backup job is a name and a list of paths. The database dump on the last line doesn't exist until the pre-backup hook creates it.

The role also installs two hooks. Before a backup, `immich-pre` stops the Immich server and dumps its Postgres database into that file. Afterwards, `immich-post` starts the server again and deletes the dump. Stopping the server is the price of a consistent backup: the photo library and the database that describes it are saved from the same moment, instead of the database pointing at files that changed halfway through the run. For a few instances used by me, my family and friends, a daily offline window is an acceptable trade.

Which jobs a host actually runs is decided in the inventory, not in the roles:

```yaml title="inventory/production/group_vars/app_servers.yml"
backup_client_jobs:
  - "{{ uptime_kuma_backup_job }}"
  - "{{ immich_backup_job }}"
  - "{{ simple_login_backup_job }}"
  - "{{ ntfy_backup_job }}"
```

Listing 4 — The production VPS registers four jobs. Nextcloud isn't one of them.

Nextcloud is the one exception. It runs as Nextcloud All-in-One, which ships its own Borg-based backup. With that much moving inside one image, I'd rather use the backup its maintainers keep working than rebuild it out of hooks. Its archives land on the same backup server as everything else.

From each entry, `backup_client` generates everything else. For Immich, with the systemd units named `restic-backup-immich`:

| Generated          | What it is                                                            |
| ------------------ | :-------------------------------------------------------------------- |
| `immich.env`       | Under `/etc/restic/jobs`: the restic repository and the paths to save |
| `.service`         | A oneshot unit that runs the wrapper as the backup user               |
| `.timer`           | Daily, with `Persistent=true` so a missed run catches up              |
| `repos/vps/immich` | Its own restic repository on the backup server, reached over SFTP     |

Table 1 — What one job entry turns into.

Every job runs through the same wrapper script, and its most important line is the `trap`:

```bash title="roles/backup_client/templates/restic-backup.j2"
cleanup() {
    local exit_code=$?

    if [[ -x "$POST" ]]; then
        if ! "$POST"; then
            echo "POST hook failed" >&2
            exit_code=1
        fi
    fi

    if (( exit_code != 0 )); then
        notify \
            "FAILED" \
            "Backup job '${JOB}' failed on $(hostname) with exit code ${exit_code}."
    fi

    return "$exit_code"
}

trap cleanup EXIT

if [[ -x "$PRE" ]]; then
    "$PRE"
fi

restic --repo "$REPOSITORY" backup "${PATHS[@]}"
```

Listing 5 — An excerpt of the wrapper. Whatever happens after the pre hook, `cleanup` runs: the post hook restarts the service, and a failure becomes an ntfy notification.

Without the trap, a failed `restic backup` would end the script with Immich still stopped and nobody told. With it, the post hook runs on every exit path, and a non-zero exit code becomes a push notification rather than a line in a journal I'd only read after something went wrong.

Because every application gets its own restic repository, restoring Immich never touches SimpleLogin's snapshots, and the retention policy (7 daily, 4 weekly, 12 monthly) applies per application. The cost is deduplication: restic only deduplicates within a repository, so nothing is shared between applications. For these services the space that would save isn't large, and I'd make the same trade again. Adding an application to backups comes down to one variable and two hook scripts in its own role, plus one line in the inventory.

## 04 · What went wrong

None of these reached me as an outage. They all showed up on the test VMs, which is what the test VMs are for. But each one is a way the repository could have looked finished while being wrong.

### 4.1 · Two tasks fighting over one file

Some tasks reported `changed` on every run, even when nothing had changed. The cause was one line in SimpleLogin's directory task:

```diff title="roles/simple_login/tasks/configure.yml"
     group: "{{ backup_client_user }}"
     state: directory
     mode: "0755"
-    recurse: true
   loop:
     - "{{ simple_login_base_dir }}"
     - "{{ simple_login_base_dir }}/sl"
```

Listing 6 — `recurse: true` applies owner, group and mode to everything inside the directory, not just the directory.

Inside that directory is the DKIM private key, which a later task writes with mode `0600`. On every run, the directory task set it to `0755`, and then the key task set it back to `0600`. Both reported `changed`, and for the seconds in between the private key was world-readable. The recap looked busy, not broken, which is why it was easy to wave through. The fix was part of one commit that went through every role for exactly this kind of thing. Since then, a second run that reports anything other than `changed=0` counts as a bug, and Listing 1 is the test for it.

### 4.2 · A backup that succeeded without backing anything up

I found this one by watching the logs during a backup run on the test system. SimpleLogin's pre-backup hook was supposed to dump its database:

```diff title="roles/simple_login/templates/backup-pre.j2"
-set -e
+set -euo pipefail

 echo "Running pre-backup script for simple login"
-docker exec sl-db pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > "{{ simple_login_base_dir }}/simple_login_backup.sql.gz"
+
+docker exec sl-db sh -c \
+  'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
+  | gzip > "{{ simple_login_base_dir }}/simple_login_backup.sql.gz"
```

Listing 7 — The variables are now expanded inside the container, and a failure anywhere in the pipeline fails the script.

The old line had two bugs that hid each other. `$POSTGRES_USER` and `$POSTGRES_DB` only exist inside the database container, but without quotes the host's shell expanded them before `docker exec` ever ran. On the host they're empty, so `pg_dump` was called with no user and no database, and failed. `set -e` didn't catch it, because a pipeline's exit status is its last command's, and `gzip` compressing nothing succeeds. Watching the run was what gave it away. The exit code alone said the backup was fine. Either `-u` (fail on unset variables) or `pipefail` alone would have caught it, and every hook in the repository now starts with both. The `trap` in Listing 5 only helps if failures actually reach it.

### 4.3 · A container that needed a real restart

After a config change, SimpleLogin would get stuck in an invalid state unless its containers were brought down and started fresh. Updating the files in place wasn't enough. The role now has a handler that recreates the whole stack, notified by every task that writes one of its config files: both env files, the two DKIM keys and the compose file. The cost is that any change to SimpleLogin's configuration restarts all of it. I'll take that over a service that is half-reconfigured.

## 05 · Where it stands now

Everything the old server ran now comes out of the repository: Caddy, Uptime Kuma, Nextcloud, Immich and SimpleLogin, plus ntfy, which I added during the move so the backups had somewhere to report to. Seventeen roles cover the base system (SSH, firewall, fail2ban, automatic security updates, Docker) and the applications on top of it. The production VPS backs up to a Raspberry Pi with two external drives, and a second playbook configures the Pi itself.

:::figure{kind="diagram"}
![Diagram of the backup chain: the production VPS sends restic backups over SFTP, plus Nextcloud's Borg archives, to a Raspberry Pi backup server, which stores them on a primary drive that is mirrored to a second drive with rsync --delete](/figures/001-backup-chain.svg)

Fig. 1 — The backup chain. The second drive is a copy of the first, not a second backup.
:::

The test that matters most has happened once: a restore from backup onto a test VM. It worked, but I did it by hand, and the steps aren't written down yet. Until they are, the recovery half of "reproducible" lives in my head again, which is the exact failure mode this repository exists to remove. Streamlining and documenting that restore is next.

Two other gaps are known and written down:

- Docker publishes container ports through its own iptables rules, which bypass ufw. The firewall role describes the host, not what is actually reachable. Replacing ufw is on the list.
- The two drives on the backup server are a mirror, not two backups. `rsync --delete` copies the first to the second, so a dead disk is covered, but a deleted or corrupted backup on the first drive reaches the second on the next run.

What it cost: roughly 2,700 lines of YAML and Jinja across 17 roles to replace a handful of compose files, and every change now takes a detour through a test VM before it reaches production. I'd make that trade again. The old setup worked right up until I needed to know exactly what it was.
