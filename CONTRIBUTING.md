# Contributing to HonoX

This document outlines guidelines for contributing to HonoX. Please take a moment to review it before submitting your contributions.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please open an issue on our [GitHub Issues](https://github.com/honojs/honox/issues) page.

When reporting a bug, please include:

- A clear and concise description of the bug.
- Steps to reproduce the behavior.
- Expected behavior.
- Screenshots or GIFs if applicable.
- Your environment details (OS, dependency versions, etc.).

### Suggesting Enhancements

Got an idea for a new feature or improvement? We'd love to hear it! Please open an issue on our [GitHub Issues](https://github.com/honojs/honox/issues) page.

When suggesting an enhancement, please include:

- A clear and concise description of the enhancement.
- Why you think it would be valuable to the project.
- Any potential alternatives or considerations.

### Pull Request Guidelines

1.  **Fork the repository** and create your branch from `main`.
2.  **Make your changes**.
3.  **Ensure your code adheres to our style guides** (see [Style guides](#style-guides)).
4.  **Write clear, concise commit messages** (see [Git Commit Messages](#git-commit-messages)).
5.  **Test your changes thoroughly.**
6.  **Update documentation** if your changes require it.
7.  **Open a pull request** to the `main` branch.

In your pull request, please:

-   Reference the issue you are addressing (e.g., `Fixes #123`).
-   Provide a clear summary of your changes.
-   Include any relevant screenshots or GIFs.

## Development Setup

To get started with development, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/[your-username]/honox.git
    cd honox 
    ```
2. Install dependencies:
    ```bash
    bun install
    ```
		
We are using bun and strongly recommend it.

## Style guides

### Git Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for our commit messages. This helps us generate consistent and readable commit histories.

Examples:

-   `feat: Add new user authentication`
-   `fix: Correct typo in README`
-   `docs: Update installation guide`
-   `refactor: Improve error handling logic`

### Code Style

We use [Eslint](https://eslint.org/) and [Prettier](https://prettier.io/) for code formatting. Please ensure your code is formatted correctly before submitting a pull request.

You can lint and format your code using:
```bash
bun run lint:fix
bun run format:fix
```
