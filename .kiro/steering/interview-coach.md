---
inclusion: auto
description: AI Interview Coach project constraints, technical standards, and implementation guidelines
---

# AI Interview Coach - Project Steering

## Workshop Constraints

**DO NOT IMPLEMENT:**
- Unit tests or test infrastructure
- User authentication
- Database or data persistence
- Deployment configurations
- Advanced error recovery
- Performance optimizations
- Multi-user support

## Technical Standards

### AWS Configuration
- **Bedrock Model**: `amazon.nova-pro-v1:0`
- **Region**: `us-east-1`
- **Credentials**: Load from environment variables

### Architecture
- Lightweight, local-only application
- Single-user, ephemeral sessions
- No database required

### Technology Stack
- Frontend: React (use Vite)
- Backend: Node.js with Express
- Real-time: WebSocket for transcription

## Code Standards

- Write clean, readable code
- Use async/await for async operations
- Implement basic error handling only
- Keep functions small and focused

## UI Requirements

- Black and white color scheme
- Minimalist design with white space
- Simple click-based interactions
- Optimize for laptop screens only

## Prompt Engineering

**Question Generation**: Behavioral questions for college students/entry-level roles

**Response Analysis**: Encouraging coach-like tone, identify STAR components, provide 2-3 actionable tips