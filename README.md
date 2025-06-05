# Claude Max Code Base Action

> **🎉 Use Your Claude Max Subscription in GitHub Actions!**
>
> This is a fork of [anthropics/claude-code-base-action](https://github.com/anthropics/claude-code-base-action) that adds OAuth authentication support, enabling you to use your **Claude Max subscription** with GitHub Actions workflows.
>
> **Key Feature:** Authenticate with your Claude Max subscription credentials instead of requiring API keys, making it accessible to all Claude Max subscribers.

This GitHub Action allows you to run [Claude Code](https://www.anthropic.com/claude-code) within your GitHub Actions workflows. You can use this to build any custom workflow on top of Claude Code.

For simply tagging @claude in issues and PRs out of the box, [check out the Claude Code action and GitHub app](https://github.com/anthropics/claude-code-action).

## Usage

Add the following to your workflow file:

```yaml
# Using a direct prompt
- name: Run Claude Code with direct prompt
  uses: wim-web/claude-code-base-action@main
  with:
    prompt: "Your prompt here"
    allowed_tools: "Bash(git:*),View,GlobTool,GrepTool,BatchTool"
    use_oauth: "true"
    claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
    claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
    claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}

# Or using a prompt from a file
- name: Run Claude Code with prompt file
  uses: wim-web/claude-code-base-action@main
  with:
    prompt_file: "/path/to/prompt.txt"
    allowed_tools: "Bash(git:*),View,GlobTool,GrepTool,BatchTool"
    use_oauth: "true"
    claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
    claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
    claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}

# Or limiting the conversation turns
- name: Run Claude Code with limited turns
  uses: wim-web/claude-code-base-action@main
  with:
    prompt: "Your prompt here"
    allowed_tools: "Bash(git:*),View,GlobTool,GrepTool,BatchTool"
    max_turns: "5" # Limit conversation to 5 turns
    use_oauth: "true"
    claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
    claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
    claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}
```

## Inputs

| Input                  | Description                                                                                       | Required | Default                      |
| ---------------------- | ------------------------------------------------------------------------------------------------- | -------- | ---------------------------- |
| `prompt`               | The prompt to send to Claude Code                                                                 | No\*     | ''                           |
| `prompt_file`          | Path to a file containing the prompt to send to Claude Code                                       | No\*     | ''                           |
| `allowed_tools`        | Comma-separated list of allowed tools for Claude Code to use                                      | No       | ''                           |
| `disallowed_tools`     | Comma-separated list of disallowed tools that Claude Code cannot use                              | No       | ''                           |
| `max_turns`            | Maximum number of conversation turns (default: no limit)                                          | No       | ''                           |
| `mcp_config`           | Path to the MCP configuration JSON file                                                           | No       | ''                           |
| `model`                | Model to use (provider-specific format required for Bedrock/Vertex)                               | No       | 'claude-3-7-sonnet-20250219' |
| `anthropic_model`      | DEPRECATED: Use 'model' instead                                                                   | No       | 'claude-3-7-sonnet-20250219' |
| `timeout_minutes`      | Timeout in minutes for Claude Code execution                                                      | No       | '10'                         |
| `anthropic_api_key`    | Anthropic API key (required for direct Anthropic API)                                             | No       | ''                           |
| `use_bedrock`          | Use Amazon Bedrock with OIDC authentication instead of direct Anthropic API                       | No       | 'false'                      |
| `use_vertex`           | Use Google Vertex AI with OIDC authentication instead of direct Anthropic API                     | No       | 'false'                      |
| `use_oauth`            | Use Claude AI OAuth authentication instead of API key                                             | No       | 'false'                      |
| `claude_access_token`  | Claude AI OAuth access token (required when use_oauth is true)                                    | No       | ''                           |
| `claude_refresh_token` | Claude AI OAuth refresh token (required when use_oauth is true)                                   | No       | ''                           |
| `claude_expires_at`    | Claude AI OAuth token expiration timestamp (required when use_oauth is true)                      | No       | ''                           |
| `use_node_cache`       | Whether to use Node.js dependency caching (set to true only for Node.js projects with lock files) | No       | 'false'                      |

\*Either `prompt` or `prompt_file` must be provided, but not both.

## Outputs

| Output           | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `conclusion`     | Execution status of Claude Code ('success' or 'failure')   |
| `execution_file` | Path to the JSON file containing Claude Code execution log |

## Using MCP Config

You can provide a custom MCP configuration file to dynamically load MCP servers:

```yaml
- name: Run Claude Code with MCP config
  uses: wim-web/claude-code-base-action@main
  with:
    prompt: "Your prompt here"
    mcp_config: "path/to/mcp-config.json"
    allowed_tools: "Bash(git:*),View,GlobTool,GrepTool,BatchTool"
    use_oauth: "true"
    claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
    claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
    claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}
```

The MCP config file should follow this format:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["./server.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

You can combine MCP config with other inputs like allowed tools:

```yaml
# Using multiple inputs together
- name: Run Claude Code with MCP and custom tools
  uses: wim-web/claude-code-base-action@main
  with:
    prompt: "Access the custom MCP server and use its tools"
    mcp_config: "mcp-config.json"
    allowed_tools: "Bash(git:*),View,mcp__server-name__custom_tool"
    timeout_minutes: "15"
    use_oauth: "true"
    claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
    claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
    claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}
```

## Example: PR Code Review

```yaml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Code Review with Claude
        id: code-review
        uses: wim-web/claude-code-base-action@main
        with:
          prompt: "Review the PR changes. Focus on code quality, potential bugs, and performance issues. Suggest improvements where appropriate. Write your review as markdown text."
          allowed_tools: "Bash(git diff --name-only HEAD~1),Bash(git diff HEAD~1),View,GlobTool,GrepTool,Write"
          use_oauth: "true"
          claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
          claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
          claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}

      - name: Extract and Comment PR Review
        if: steps.code-review.outputs.conclusion == 'success'
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const fs = require('fs');
            const executionFile = '${{ steps.code-review.outputs.execution_file }}';
            const executionLog = JSON.parse(fs.readFileSync(executionFile, 'utf8'));

            // Extract the review content from the execution log
            // The execution log contains the full conversation including Claude's responses
            let review = '';

            // Find the last assistant message which should contain the review
            for (let i = executionLog.length - 1; i >= 0; i--) {
              if (executionLog[i].role === 'assistant') {
                review = executionLog[i].content;
                break;
              }
            }

            if (review) {
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: "## Claude Code Review\n\n" + review + "\n\n*Generated by Claude Code*"
              });
            }
```

Check out additional examples in [`./examples`](./examples).

## Using Cloud Providers

You can authenticate with Claude using any of these four methods:

1. Direct Anthropic API (default) - requires API key
2. Claude AI OAuth authentication - requires OAuth tokens
3. Amazon Bedrock - requires OIDC authentication and automatically uses cross-region inference profiles
4. Google Vertex AI - requires OIDC authentication

**Note**:

- Bedrock and Vertex use OIDC authentication exclusively
- AWS Bedrock automatically uses cross-region inference profiles for certain models
- For cross-region inference profile models, you need to request and be granted access to the Claude models in all regions that the inference profile uses
- The Bedrock API endpoint URL is automatically constructed using the AWS_REGION environment variable (e.g., `https://bedrock-runtime.us-west-2.amazonaws.com`)
- You can override the Bedrock API endpoint URL by setting the `ANTHROPIC_BEDROCK_BASE_URL` environment variable

### Model Configuration

Use provider-specific model names based on your chosen provider:

```yaml
# For direct Anthropic API (default)
- name: Run Claude Code with Anthropic API
  uses: wim-web/claude-code-base-action@main
  with:
    prompt: "Your prompt here"
    model: "claude-3-7-sonnet-20250219"
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

# For Claude AI OAuth authentication
- name: Run Claude Code with OAuth
  uses: wim-web/claude-code-base-action@main
  with:
    prompt: "Your prompt here"
    model: "claude-3-7-sonnet-20250219"
    use_oauth: "true"
    claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
    claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
    claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}

# For Amazon Bedrock (requires OIDC authentication)
- name: Configure AWS Credentials (OIDC)
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
    aws-region: us-west-2

- name: Run Claude Code with Bedrock
  uses: wim-web/claude-code-base-action@main
  with:
    prompt: "Your prompt here"
    model: "anthropic.claude-3-7-sonnet-20250219-v1:0"
    use_bedrock: "true"

# For Google Vertex AI (requires OIDC authentication)
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

- name: Run Claude Code with Vertex AI
  uses: wim-web/claude-code-base-action@main
  with:
    prompt: "Your prompt here"
    model: "claude-3-7-sonnet@20250219"
    use_vertex: "true"
```

## Example: Using OIDC Authentication for AWS Bedrock

This example shows how to use OIDC authentication with AWS Bedrock:

```yaml
- name: Configure AWS Credentials (OIDC)
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
    aws-region: us-west-2

- name: Run Claude Code with AWS OIDC
  uses: wim-web/claude-code-base-action@main
  with:
    prompt: "Your prompt here"
    use_bedrock: "true"
    model: "anthropic.claude-3-7-sonnet-20250219-v1:0"
    allowed_tools: "Bash(git:*),View,GlobTool,GrepTool,BatchTool"
```

## Example: Using OIDC Authentication for GCP Vertex AI

This example shows how to use OIDC authentication with GCP Vertex AI:

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

- name: Run Claude Code with GCP OIDC
  uses: wim-web/claude-code-base-action@main
  with:
    prompt: "Your prompt here"
    use_vertex: "true"
    model: "claude-3-7-sonnet@20250219"
    allowed_tools: "Bash(git:*),View,GlobTool,GrepTool,BatchTool"
```

## Security Best Practices

**⚠️ IMPORTANT: Never commit API keys or OAuth tokens directly to your repository! Always use GitHub Actions secrets.**

### OAuth Authentication Setup

To use OAuth authentication with your Claude Max Subscription Plan:

0. Login into Claude Code with your Claude Max Subscription with `/login`:

   - Lookup your access token, refresh token and expires at values: `cat ~/.claude/.credentials.json`

1. Add your OAuth credentials as repository secrets:

   - Go to your repository's Settings
   - Navigate to "Secrets and variables" → "Actions"
   - Add the following secrets:
     - `CLAUDE_ACCESS_TOKEN` - Your Claude AI OAuth access token
     - `CLAUDE_REFRESH_TOKEN` - Your Claude AI OAuth refresh token
     - `CLAUDE_EXPIRES_AT` - Token expiration timestamp (Unix timestamp in seconds)

2. Reference the secrets in your workflow:
   ```yaml
   use_oauth: "true"
   claude_access_token: ${{ secrets.CLAUDE_ACCESS_TOKEN }}
   claude_refresh_token: ${{ secrets.CLAUDE_REFRESH_TOKEN }}
   claude_expires_at: ${{ secrets.CLAUDE_EXPIRES_AT }}
   ```

### API Key Authentication Setup (Legacy)

To use API key authentication:

1. Add your API key as a repository secret:

   - Go to your repository's Settings
   - Navigate to "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Name it `ANTHROPIC_API_KEY`
   - Paste your API key as the value

2. Reference the secret in your workflow:
   ```yaml
   anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
   ```

**Never do this:**

```yaml
# ❌ WRONG - Exposes your API key
anthropic_api_key: "sk-ant-..."
```

**Always do this:**

```yaml
# ✅ CORRECT - Uses GitHub secrets
anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

This applies to all sensitive values including API keys, access tokens, and credentials.
We also reccomend that you always use short-lived tokens when possible

## License

This project is licensed under the MIT License—see the LICENSE file for details.
