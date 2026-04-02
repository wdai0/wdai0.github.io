---
title: "GP Posterior Explorer"
summary: "Place noisy observations directly on the plot and watch the posterior mean and uncertainty band update in real time."
motivation: "Posterior intuition is easiest to build when the model reacts immediately to new observations and hyperparameter changes."
concept: "Conditioning, uncertainty shrinkage, and observation-noise effects in one-dimensional Gaussian-process regression."
route: "/lab/gp-posterior/"
featured: true
order: 2
---

This page moves from prior beliefs to conditional inference. Add observations, change the kernel, and inspect how uncertainty behaves away from the training points.

The demo is intentionally small and one-dimensional so that the mechanics remain visible: kernel choice, data placement, and noise level all leave recognizable signatures in the posterior.
