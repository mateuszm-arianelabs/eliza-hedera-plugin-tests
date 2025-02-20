import { describe, expect, it, beforeEach } from "vitest";
import { ElizaOSApiClient } from "../utils/elizaApiClient";
import { ElizaOSPrompt } from "../types";
import { HederaMirrorNodeClient } from "../utils/hederaMirrorNodeClient";
import * as dotenv from "dotenv";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("get_all_balances", () => {
    dotenv.config();
    const agentsWalletId = `${process.env.HEDERA_ACCOUNT_ID!}`;

    beforeEach(async () => {
        await wait(1000);
    });
    it.each([
        [
            "0.0.4515756",
            "Show me the balances of all HTS tokens for wallet 0.0.4515756",
        ],
        [
            "0.0.5133523",
            "What are the HTS token balances for wallet 0.0.5133523",
        ],
        ["0.0.5462428", "Show me all token balances for account 0.0.5462428"],
        [agentsWalletId, "Show me all your token balances."],
        [agentsWalletId, "Show me all my token balances."],
    ])(
        "balance of all tokens for %s should be equal to data from Mirror Node API",
        async (accountId, promptText) => {
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

            const allTokensBalances =
                await hederaApiClient.getAllTokensBalances(accountId);

            let parsedAllTokensBalances: string = "";

            for (const balance of allTokensBalances) {
                parsedAllTokensBalances += `${balance.tokenName}: ${balance.balanceInDisplayUnit} ${balance.tokenSymbol} (${balance.tokenId})\n`;
            }

            expect(response[1].text).toContain(parsedAllTokensBalances);
        }
    );
});
