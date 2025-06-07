import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

interface OAuthCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export async function setupOAuthCredentials(credentials: OAuthCredentials) {
  const claudeDir = join(homedir(), ".claude");
  const credentialsPath = join(claudeDir, ".credentials.json");

  // Create the .claude directory if it doesn't exist
  await mkdir(claudeDir, { recursive: true });

  // Check if we need to refresh existing credentials
  const refreshedCredentials = await refreshTokenIfNeeded(credentials);

  // Create the credentials JSON structure
  const credentialsData = {
    claudeAiOauth: {
      accessToken: refreshedCredentials.accessToken,
      refreshToken: refreshedCredentials.refreshToken,
      expiresAt: parseInt(refreshedCredentials.expiresAt),
      scopes: ["user:inference", "user:profile"],
    },
  };

  // Write the credentials file
  await writeFile(credentialsPath, JSON.stringify(credentialsData, null, 2));

  process.stdout.write(`OAuth credentials written to ${credentialsPath}\n`);
}

export function isTokenExpired(expiresAt: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const bufferTime = 300; // 5 minutes buffer
  return now >= (expiresAt - bufferTime);
}

export async function refreshTokenIfNeeded(credentials: OAuthCredentials): Promise<OAuthCredentials> {
  const expiresAtTimestamp = parseInt(credentials.expiresAt);
  
  if (!isTokenExpired(expiresAtTimestamp)) {
    process.stdout.write("Token is still valid, no refresh needed\n");
    return credentials;
  }

  process.stdout.write("Token is expired or about to expire, refreshing...\n");
  
  try {
    const refreshResponse = await fetch("https://claude.ai/api/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: credentials.refreshToken,
      }),
    });

    if (!refreshResponse.ok) {
      throw new Error(`Token refresh failed: ${refreshResponse.status} ${refreshResponse.statusText}`);
    }

    const refreshData = await refreshResponse.json();
    
    const newCredentials: OAuthCredentials = {
      accessToken: refreshData.access_token,
      refreshToken: refreshData.refresh_token || credentials.refreshToken,
      expiresAt: String(Math.floor(Date.now() / 1000) + refreshData.expires_in),
    };

    process.stdout.write("Token refreshed successfully\n");
    return newCredentials;
  } catch (error) {
    process.stderr.write(`Failed to refresh token: ${error}\n`);
    throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
