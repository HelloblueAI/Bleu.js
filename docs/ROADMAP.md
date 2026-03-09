# Bleu.js Development Roadmap

## Project Overview

Bleu.js is a quantum-enhanced AI platform: cloud API, CLI, and Python SDK. This roadmap tracks status and planned work.

## Current Status (v1.4.x)

### Core Features Status

| Category           | Status           | Notes                                                                                                                             |
| ------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Cloud API & SDK    | ✅ Complete      | REST API, sync/async clients, [bleujs.org](https://bleujs.org)                                                                    |
| Bleu CLI           | ✅ Complete      | `bleu chat`, `generate`, `embed`, `models`, config, health                                                                        |
| Quantum            | ✅ In place      | Teleportation, IBM runtime, quantum-enhanced features                                                                             |
| ML Pipeline        | ✅ Complete      | XGBoost, LLaMA, model management, hybrid training                                                                                 |
| Development & docs | ✅ In place      | Testing, API reference, [API Client Guide](API_CLIENT_GUIDE.md), [Open source standards](OPEN_SOURCE_STANDARDS.md)                |
| Backend            | ✅ Separate repo | Node/Express backend in [Bleujs.-backend](https://github.com/HelloblueAI/Bleujs.-backend); see [BACKEND_REPO.md](BACKEND_REPO.md) |

### Recent additions (2025–2026)

- API playground ([api_playground.html](../api_playground.html)), live demo, CLI extensions
- Quantum teleportation and IBM runtime integration
- Security: auth/JWT fix, optional CSRF, secret validation, Safety Scan in CI, hardened Docker/CSP
- Repo hygiene: backend moved to separate repo, Dependabot scope tightened, CONTRIBUTING/SUPPORT/CODEOWNERS

## Development Roadmap

### Phase 1: Core features (ongoing)

- [ ] NLP: Named Entity Recognition, sentiment, text classification
- [ ] Vision: Face recognition, scene understanding, object detection
- [ ] Speech: Real-time transcription, language detection, diarization

### Phase 2: Performance & scale

- [ ] Distributed: Ray, Dask, Kubernetes
- [ ] Model optimization: quantization, pruning, distillation
- [ ] Caching: Redis, model/result caching

### Phase 3: Developer experience

- [ ] Docs: API reference, tutorials, examples (see [API_CLIENT_GUIDE.md](API_CLIENT_GUIDE.md))
- [ ] Testing: unit, integration, performance
- [ ] Tooling: CLI enhancements, debug, profiling

## Future considerations

- Federated learning, AutoML, edge support
- Visualization, model marketplace, collaborative tools
- Automated deployment pipeline

## Release schedule

Releases follow [semantic versioning](https://semver.org/). Patch releases are automated; see [CHANGELOG.md](../CHANGELOG.md) for history.

| Focus       | Notes                                                                                  |
| ----------- | -------------------------------------------------------------------------------------- |
| Patch       | Auto-bump on merge to main (see `.github/workflows/auto-release.yml`)                  |
| Minor/Major | Manual; update [CHANGELOG.md](../CHANGELOG.md) and version in `src/bleujs/__init__.py` |

## Contributing

We welcome contributions. See:

- [Contributing Guidelines](../CONTRIBUTING.md)
- [Contributor Guide](CONTRIBUTOR_GUIDE.md)
- [Good first issues](https://github.com/HelloblueAI/Bleu.js/issues?q=is%3Aopen+label%3A%22good+first+issue%22)

## Feedback & support

- **Issues:** [GitHub Issues](https://github.com/HelloblueAI/Bleu.js/issues)
- **Discussions:** [GitHub Discussions](https://github.com/HelloblueAI/Bleu.js/discussions)
- **Security:** [SECURITY.md](../SECURITY.md) · [Security advisories](https://github.com/HelloblueAI/Bleu.js/security/advisories/new)
- **Docs:** [README](../README.md) · [docs/](.)

---

_Last updated: March 2026. Roadmap may change with community feedback and priorities._
