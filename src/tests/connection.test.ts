import { describe, expect, it, beforeEach } from "vitest";
import { ElizaOSApiClient } from "../utils/elizaApiClient";
import { ElizaOSPrompt } from "../types";
import * as dotenv from "dotenv";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Test connection with ElizaOS instance", () => {
    beforeEach(async () => {
        dotenv.config();
        await wait(3000);
    });
    it("should receive 'Welcome, this is the REST API!'", async () => {
        const client = new ElizaOSApiClient("http://localhost:3000");
        const response = await client.getHello();

        expect(response.message).toEqual("Hello World!");
    });
    it("should post message to ElizaOs and receive response", async () => {
        const elizaOsApiClient = new ElizaOSApiClient("http://localhost:3000");
        const agentId = await elizaOsApiClient.getAgentId();
        const prompt: ElizaOSPrompt = {
            user: "user",
            text: "Whats your name?",
        };
        const response = await elizaOsApiClient.sendPrompt(agentId, prompt);
        console.log(JSON.stringify(response, null, 2));
    });
});
