#!/usr/bin/env bun

import { describe, test, expect, afterEach, beforeEach } from "bun:test";
import { setupOAuthCredentials, isTokenExpired } from "../src/setup-oauth";
import { readFile, unlink, access } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

describe("setupOAuthCredentials", () => {
  const credentialsPath = join(homedir(), ".claude", ".credentials.json");
  
  beforeEach(() => {
    // Mock fetch to prevent actual API calls
    global.fetch = async () => {
      throw new Error("Mock fetch - should not be called");
    };
  });

  afterEach(async () => {
    // Clean up the credentials file after each test
    try {
      await unlink(credentialsPath);
    } catch (e) {
      // Ignore if file doesn't exist
    }
  });

  test("should create credentials file with correct structure for valid token", async () => {
    // Use a future timestamp to avoid token refresh
    const futureTimestamp = String(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
    
    const credentials = {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiresAt: futureTimestamp,
    };

    await setupOAuthCredentials(credentials);

    // Check file exists
    await access(credentialsPath);

    // Check file contents
    const content = await readFile(credentialsPath, "utf-8");
    const parsed = JSON.parse(content);

    expect(parsed).toEqual({
      claudeAiOauth: {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresAt: parseInt(futureTimestamp),
        scopes: ["user:inference", "user:profile"],
      },
    });
  });

  test("should convert expiresAt string to number", async () => {
    const futureTimestamp = String(Math.floor(Date.now() / 1000) + 3600);
    
    const credentials = {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiresAt: futureTimestamp,
    };

    await setupOAuthCredentials(credentials);

    const content = await readFile(credentialsPath, "utf-8");
    const parsed = JSON.parse(content);

    expect(typeof parsed.claudeAiOauth.expiresAt).toBe("number");
    expect(parsed.claudeAiOauth.expiresAt).toBe(parseInt(futureTimestamp));
  });

  test("should overwrite existing credentials file", async () => {
    const futureTimestamp1 = String(Math.floor(Date.now() / 1000) + 3600);
    const futureTimestamp2 = String(Math.floor(Date.now() / 1000) + 7200);
    
    // Create initial credentials
    await setupOAuthCredentials({
      accessToken: "old-token",
      refreshToken: "old-refresh",
      expiresAt: futureTimestamp1,
    });

    // Overwrite with new credentials
    await setupOAuthCredentials({
      accessToken: "new-token",
      refreshToken: "new-refresh",
      expiresAt: futureTimestamp2,
    });

    const content = await readFile(credentialsPath, "utf-8");
    const parsed = JSON.parse(content);

    expect(parsed.claudeAiOauth.accessToken).toBe("new-token");
    expect(parsed.claudeAiOauth.refreshToken).toBe("new-refresh");
    expect(parsed.claudeAiOauth.expiresAt).toBe(parseInt(futureTimestamp2));
  });

  test("should create .claude directory if it doesn't exist", async () => {
    const futureTimestamp = String(Math.floor(Date.now() / 1000) + 3600);
    
    const credentials = {
      accessToken: "test-token",
      refreshToken: "test-refresh",
      expiresAt: futureTimestamp,
    };

    await setupOAuthCredentials(credentials);

    // Verify file was created
    await access(credentialsPath);
  });

  test("should refresh expired token", async () => {
    const expiredTimestamp = String(Math.floor(Date.now() / 1000) - 3600); // 1 hour ago
    
    // Mock successful token refresh
    global.fetch = async (url: string) => {
      if (url === "https://claude.ai/api/oauth/token") {
        return {
          ok: true,
          json: async () => ({
            access_token: "new-access-token",
            refresh_token: "new-refresh-token", 
            expires_in: 3600,
          }),
        } as Response;
      }
      throw new Error("Unexpected URL");
    };
    
    const credentials = {
      accessToken: "expired-token",
      refreshToken: "test-refresh-token",
      expiresAt: expiredTimestamp,
    };

    await setupOAuthCredentials(credentials);

    const content = await readFile(credentialsPath, "utf-8");
    const parsed = JSON.parse(content);

    expect(parsed.claudeAiOauth.accessToken).toBe("new-access-token");
    expect(parsed.claudeAiOauth.refreshToken).toBe("new-refresh-token");
    expect(parsed.claudeAiOauth.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

describe("isTokenExpired", () => {
  test("should return true for expired token", () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    expect(isTokenExpired(pastTimestamp)).toBe(true);
  });

  test("should return true for token expiring soon (within buffer)", () => {
    const soonTimestamp = Math.floor(Date.now() / 1000) + 60; // 1 minute from now (within 5-minute buffer)
    expect(isTokenExpired(soonTimestamp)).toBe(true);
  });

  test("should return false for valid token", () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    expect(isTokenExpired(futureTimestamp)).toBe(false);
  });
});
