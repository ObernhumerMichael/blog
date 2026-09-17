---
number: 3
title: 'Evolutionary pixel-to-SVG conversion'
description: 'Evolve a population of candidate SVGs against a raster target and measure how compact a vector approximation can get before it stops looking like the original. Mostly a study in fitness functions and in knowing when to stop.'
stack: ['rust', 'genetic algorithms', 'image processing']
status: 'archived'
period:
  from: 2024-02-01
  to: 2024-05-01
caseStudy: true
links:
  article: '/projects/evolutionary-pixel-to-svg-conversion'
  source: 'https://github.com/mo/pixevo'
featured: true
draft: false
---

## 01 · Problem & motivation

Vector tracers built on edge detection produce paths that are geometrically
close to a raster source and visually wrong — a face redrawn from gradients
rather than features. The question worth asking instead: what is the
smallest population of shapes a genetic search can find that a human still
reads as the same image?

## 02 · Architecture

A population of candidate SVGs — each a fixed-size list of translucent
polygons — scored against the raster target by per-pixel colour distance.
Selection, crossover and mutation run each generation; the population size
and mutation rate are the only two knobs, because a third one never earned
its keep in practice.

## 03 · Implementation

Fitness is the expensive part: every candidate has to be rasterised and
diffed against the target once per generation, so the whole loop is written
in Rust rather than the Python prototype it started as — an order of
magnitude difference that mattered at population sizes above a few hundred.

## 04 · Technical decisions

| Decision           | Alternative        | Why                                                                      |
| ------------------ | ------------------ | ------------------------------------------------------------------------ |
| Polygon primitives | Bezier paths       | Cheaper to mutate and rasterise; paths added detail no faster            |
| Fixed shape count  | Growing population | A growing genome made fitness comparisons across generations meaningless |

Table 1 — the two decisions that shaped the search space; parameter tuning
isn't included, it never stopped moving.

## 05 · Results & lessons

A 200-polygon candidate gets recognisably close to a 128×128 source in
under two minutes on a laptop CPU; past roughly 400 polygons, additional
generations bought less improvement than a larger initial population would
have. The lesson: convergence speed came from population diversity, not
from mutation rate, and every hour spent tuning mutation would have been
better spent doubling the population.
