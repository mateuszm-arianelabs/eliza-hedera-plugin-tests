import { describe, expect, it, beforeEach } from "vitest";
import { ElizaOSApiClient } from "../utils/elizaApiClient";
import { ElizaOSPrompt } from "../types";
import { HederaMirrorNodeClient } from "../utils/hederaMirrorNodeClient";
import * as dotenv from "dotenv";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("get_hbar_balance", () => {
    beforeEach(async () => {
        dotenv.config();
        await wait(3000);
    });
    it.each([
        [
            "0.0.5392887",
            "0.0.5441429",
            "What's balance of token 0.0.5532159 for 0.0.5392887.",
        ],
        [
            "0.0.5532256",
            "0.0.5441429",
            "How many tokens with id 0.0.5532159 account 0.0.5532256 has.",
        ],
    ])(
        "balance of %s for %s should be equal to data from Mirror Node API",
        async (accountId, tokenId, promptText) => {
            const elizaOsApiClient = new ElizaOSApiClient(
                "http://localhost:3000"
            );
            const hederaApiClient = new HederaMirrorNodeClient("testnet");

            const agentId = await elizaOsApiClient.getAgentId();
            const prompt: ElizaOSPrompt = {
                user: "user",
                text: promptText,
            };
            const response = await elizaOsApiClient.sendPrompt(agentId, prompt);
            let hederaActionBalance: number;

            const match =
                response[response.length - 1].text.match(/equal (\d+(\.\d+)?)/);

            if (match) {
                hederaActionBalance = parseFloat(match[1]);
            } else {
                throw new Error(
                    "No match for HTS token balance found in response from ElizaOs Agent."
                );
            }

            const mirrorNodeBalance = await hederaApiClient.getTokenBalance(
                accountId,
                tokenId
            );

            expect(hederaActionBalance).toEqual(mirrorNodeBalance);
        }
    );
});
