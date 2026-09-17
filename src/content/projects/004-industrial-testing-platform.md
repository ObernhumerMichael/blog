---
number: 4
title: 'Industrial production testing & data visualisation'
description: "A platform that makes an entire production line's test procedure legible: per-line overviews, per-step results, and the metrics that surface drift before it becomes scrap. Built for a real factory floor, with the constraints that implies — intermittent network, operators who cannot stop to read documentation."
why: 'Test results existed but nobody could see a trend until a batch had already failed.'
stack: ['time-series ingest', 'aggregation', 'dashboards']
status: 'maintained'
period:
  from: 2025-01-01
  to: 2025-06-01
caseStudy: true
links:
  article: '/projects/industrial-production-testing-data-visualisation'
sourceAbsence: 'client work · no source'
draft: true
---

## 01 · Problem & motivation

A production line generated per-step test results all day, on machines
with no reliable way to see them as a trend. A drifting step showed up as a
failed batch, hours after the drift started, because nobody had a legible
view of the intermediate results — only pass/fail at the end of the line.

## 02 · Architecture

Time-series ingest from the line's own test rigs, aggregated per-step and
per-line, surfaced on dashboards built for a factory floor rather than an
office: high contrast, no interaction required to read the current state,
resilient to an intermittent network between the rig and the server.

## 03 · Implementation

Operators read the dashboards without stopping the line, which set the
actual constraint: nothing on screen may require a click to understand.
Everything else about this section is client-confidential.

## 04 · Technical decisions

Withheld pending the client's publication sign-off (OD-04). The real
Decision/Alternative/Why table exists internally; it isn't published here
until that boundary is countersigned.

## 05 · Results & lessons

Withheld for the same reason as the technical decisions above — the
measured numbers are the client's data, not this site's to publish ahead
of sign-off.
