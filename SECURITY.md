# Secrets & Environment Configuration

## Purpose

This project must never commit sensitive credentials or private configuration to Git/GitHub.

Sensitive values should be stored locally in environment/config files and those files must be excluded through `.gitignore`.

## Files to Keep Out of Git

Add these files/folders to `.gitignore`:

```gitignore
# Environment files
.env
.env.*
!.env.example

# API Keys & Secrets
secrets/
*.secret
*.secrets
secrets.json
credentials.json

# Firebase / Service Account
service-account.json
firebase-service-account.json
google-services.json
GoogleService-Info.plist

# Local configuration
config/local/
config/secrets/
local_config/
local_config.json

# IDE / Local machine
.idea/
.vscode/
*.local

# Build / generated files
build/
.dart_tool/