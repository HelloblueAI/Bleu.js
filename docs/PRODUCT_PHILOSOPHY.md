# Bleu.js product philosophy

**Efficient by default. Powerful by choice. Built to scale.**

---

## Core principles

1. **One command, zero friction**
   `pip install bleu-js` gives you the full API client and CLI. No torch, shap, or numba in the default install—so it works everywhere, installs in seconds, and doesn’t fail on missing compilers or heavy build steps.

2. **Power when you need it**
   Optional extras (`[ml]`, `[quantum]`, `[deep]`, `[all]`) add heavy stacks only for users who need them. The product stays a game changer for the majority (API + CLI) while remaining fully capable for researchers and advanced users.

3. **Cloud-first, local-optional**
   The primary experience is the cloud API at bleujs.org. Local quantum/ML are opt-in. That keeps the company focused on a single, scalable surface (API + SDK + CLI) while still offering cutting-edge local capabilities.

4. **Honest positioning**
   We document what’s quantum (e.g. QuantumFeatureExtractor with Qiskit/PennyLane) and what’s classical simulation (e.g. QuantumAttention). Security claims match implementation (e.g. “quantum-resistant” hashing clarified as multi-round SHA-512). Trust through clarity.

5. **Standards and security**
   One API contract (openapi.yaml), two repos (Bleu.js + backend), no secrets in tree, dependency hygiene (Dependabot, Trivy, policy exceptions documented). So we can scale as a company without technical debt or security theater.

---

## Why this makes Bleu.js a success bet

- **Conversion:** Light default install means more users complete setup and hit their first API call in under two minutes.
- **Support:** Fewer “pip install failed” and “numba/LLVM error” tickets; heavy stacks are opt-in and documented.
- **Positioning:** “Efficient by default, powerful by choice” is a clear story for developers, investors, and partners.
- **Roadmap:** We can keep improving the core (API, CLI, SDK) and add optional modules (ML, quantum, server) without breaking the default path.

---

## For the team

Use this doc when making product or positioning decisions: default = lean and reliable; power = explicit extras; claims = accurate; security and structure = non-negotiable. Keep improving and enhancing within these principles.
