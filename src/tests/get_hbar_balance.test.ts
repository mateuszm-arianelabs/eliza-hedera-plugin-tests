import { describe, expect, it, beforeEach } from "vitest";
import { ElizaOSApiClient } from "../utils/elizaApiClient";
import { ElizaOSPrompt } from "../types";
import { HederaMirrorNodeClient } from "../utils/hederaMirrorNodeClient";
import * as dotenv from "dotenv";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("get_hbar_balance", () => {
    beforeEach(async () => {
        dotenv.config();
        await wait(1000);
    });
    it.each([
        ["0.0.5392887", "What's HBAR balance for 0.0.5392887"],
        ["0.0.5532256", "How much HBARs has 0.0.5532256"],
        ["0.0.4515756", "Check HBAR balance of wallet 0.0.4515756"],
        ["0.0.5533781", "What’s the current HBAR balance of 0.0.5533781?"],
        ["0.0.5533487", "Please check the balance for 0.0.5533487 account"],
    ])(
        "balance for %s should be equal to data from Mirror Node API",
        async (accountId, promptText) => {
            const elizaOsApiClient = new ElizaOSApiClient(
                `http://${process.env.ELIZAOS_REST_HOSTNAME}:${process.env.ELIZAOS_REST_PORT}`
            );
            await elizaOsApiClient.setup();
            const hederaApiClient = new HederaMirrorNodeClient("testnet");

            const prompt: ElizaOSPrompt = {
                user: "user",
                text: promptText,
            };
            const response = await elizaOsApiClient.sendPrompt(prompt);
            let hederaActionBalance: number;

            const match = response[response.length - 1].text.match(
                /(\d+\.\d+|\d+)\s*HBAR/
            );

            if (match) {
                hederaActionBalance = parseFloat(match[1]);
            } else {
                throw new Error(
                    "No match for HBAR balance found in response from ElizaOs Agent."
                );
            }

            const mirrorNodeBalance =
                await hederaApiClient.getHbarBalance(accountId);

            expect(hederaActionBalance).toEqual(mirrorNodeBalance);
        }
    );
});
