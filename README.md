<img src="assets/logo.svg" alt="Agent Marketplace logo, a coral shopping bag carrying a cream puzzle piece" width="160">

# Agent Marketplace

[![Lint](https://github.com/dblock/agent-marketplace/actions/workflows/lint.yml/badge.svg)](https://github.com/dblock/agent-marketplace/actions/workflows/lint.yml) [![Validate](https://github.com/dblock/agent-marketplace/actions/workflows/validate.yml/badge.svg)](https://github.com/dblock/agent-marketplace/actions/workflows/validate.yml)

A plugin marketplace for Claude Code and GitHub Copilot CLI, named `dblock`. Each plugin lives in its own repository; this one lists them, so you add it once and install any of them.

## Installation

### Claude Code

```sh
claude plugin marketplace add dblock/agent-marketplace
```

### GitHub Copilot CLI

```sh
copilot plugin marketplace add dblock/agent-marketplace
```

## Usage

Install a plugin by its name and the `dblock` marketplace, such as:

```sh
claude plugin install agent-baby-names@dblock
copilot plugin install agent-baby-names@dblock
```

## Plugins

| Plugin                                                         | Description                                                                                                     |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [agent-baby-names](https://github.com/dblock/agent-baby-names) | Names each new session after the project it works on, using a naming strategy you can choose or write yourself. |

## Contributing

See [AGENTS](AGENTS.md) and [DESIGN](DESIGN.md).

## License

MIT, see the [license](LICENSE).
