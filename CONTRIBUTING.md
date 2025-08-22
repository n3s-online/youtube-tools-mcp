# Contributing to YouTube Tools MCP Server

Thank you for your interest in contributing to the YouTube Tools MCP Server! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- pnpm (recommended) or npm
- Git
- Basic knowledge of TypeScript and the Model Context Protocol

### Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/youtube-tools-mcp.git
   cd youtube-tools-mcp
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Build the project:**
   ```bash
   pnpm run build
   ```

4. **Run tests:**
   ```bash
   pnpm run test
   pnpm run test-mcp
   ```

## 🛠️ Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards below

3. **Test your changes:**
   ```bash
   pnpm run build
   pnpm run test
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a pull request:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Coding Standards

- **TypeScript**: Use strict TypeScript with proper type annotations
- **Code Style**: Follow the existing code style and formatting
- **Error Handling**: Provide comprehensive error handling with clear messages
- **Documentation**: Update documentation for any new features or changes
- **Testing**: Add tests for new functionality

### Commit Message Format

Use conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

## 🐛 Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, etc.)
- Relevant error messages or logs

## 💡 Feature Requests

We welcome feature requests! Please:
- Check existing issues first
- Provide clear use cases
- Explain the expected behavior
- Consider implementation complexity

## 📝 Documentation

- Update README.md for user-facing changes
- Update docs/ folder for detailed documentation
- Include code comments for complex logic
- Update CHANGELOG.md for notable changes

## 🧪 Testing

- Write tests for new features
- Ensure existing tests pass
- Test with actual YouTube videos when possible
- Consider edge cases and error scenarios

## 📋 Pull Request Guidelines

- Keep PRs focused and atomic
- Include clear description of changes
- Reference related issues
- Ensure all tests pass
- Update documentation as needed
- Be responsive to feedback

## 🤝 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a positive environment

## 📞 Getting Help

- Open an issue for questions
- Check existing documentation
- Review the MCP specification
- Look at similar MCP server implementations

Thank you for contributing! 🎉
