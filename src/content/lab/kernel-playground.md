---
title: "Kernel Playground"
summary: "Compare how different kernels change covariance structure and prior sample paths before fitting any data."
motivation: "Kernels are often introduced abstractly, but the modeling consequences become clearer once you can see the covariance matrix and sampled functions change together."
concept: "Prior geometry, inductive bias, and sample-path behavior across RBF, periodic, linear, and Matern kernels."
route: "/lab/kernel-playground/"
featured: true
order: 1
---

This explainer focuses on the prior side of Gaussian-process modeling. Before any observations arrive, the kernel already encodes a strong set of assumptions about smoothness, periodicity, and long-range dependence.

Use the controls to compare how different kernels reshape both the covariance surface and the kinds of functions the prior is willing to generate.
