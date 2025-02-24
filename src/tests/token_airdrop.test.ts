import { describe, expect, it, beforeEach } from "vitest";
import { ElizaOSApiClient } from "../utils/elizaApiClient";
import { ElizaOSPrompt } from "../types";
import { HederaMirrorNodeClient } from "../utils/hederaMirrorNodeClient";
import * as dotenv from "dotenv";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Test HBAR transfer", async () => {
    beforeEach(async () => {
        dotenv.config();
        await wait(3000);
    });

    it.each([
        [
            ["0.0.5616309", "0.0.5616322", "0.0.5616291"],
            10,
            "0.0.5445171",
            "Airdrop 10 tokens 0.0.5445171 to accounts 0.0.5616309, 0.0.5616322, 0.0.5616291",
        ],
    ])(
        "should process airdrop for receiversAccountId: %s, transferAmount: %d, tokenId: %s, prompt: %s",
        async (receiversAccountsIds, transferAmount, tokenId, promptText) => {
            const elizaOsApiClient = new ElizaOSApiClient(
                "http://localhost:3000"
            );
            const agentId = await elizaOsApiClient.getAgentId();
            const hederaApiClient = new HederaMirrorNodeClient("testnet");

            const agentsAccountId = process.env.HEDERA_ACCOUNT_ID;

            if (
                !agentsAccountId ||
                receiversAccountsIds.find((id) => id === agentsAccountId)
            ) {
                throw new Error(
                    "Env file must be defined and matching the env of running ElizaOs instance! Note that airdrops cannot be done to the operator account address."
                );
            }

            // Get balances before
            const balanceAgentBefore = await hederaApiClient.getTokenBalance(
                agentsAccountId,
                tokenId
            );

            const balancesOfReceiversBefore = new Map<string, number>();
            for (const id of receiversAccountsIds) {
                const balance = await hederaApiClient.getTokenBalance(
                    id,
                    tokenId
                );
                balancesOfReceiversBefore.set(id, balance);
            }

            const tokenDetials = await hederaApiClient.getTokenDetails(tokenId);

            const prompt: ElizaOSPrompt = {
                user: "user",
                text: promptText,
            };
            const response = await elizaOsApiClient.sendPrompt(agentId, prompt);
            let txHash: string;

            const match = response[response.length - 1].text.match(
                /https:\/\/hashscan\.io\/[^/]+\/tx\/([\d.]+)@([\d.]+)/
            );

            if (match) {
                txHash = `${match[1]}-${match[2].replace(".", "-")}`;
                console.log(`Extracted tx hash: ${txHash}`);
            } else {
                throw new Error(
                    "No match for transaction hash found in response from ElizaOs Agent."
                );
            }

            // Get balances after transaction being successfully processed by mirror node
            await wait(10000);

            const balanceAgentAfter = await hederaApiClient.getTokenBalance(
                agentsAccountId,
                tokenId
            );

            const balancesOfReceiversAfter = new Map<string, number>();
            for (const id of receiversAccountsIds) {
                const balance = await hederaApiClient.getTokenBalance(
                    id,
                    tokenId
                );
                balancesOfReceiversAfter.set(id, balance);
            }

            const txReport = await hederaApiClient.getTransactionReport(
                txHash,
                agentsAccountId,
                receiversAccountsIds
            );

            // Compare before and after including the difference due to paid fees
            expect(txReport.status).toEqual("SUCCESS");
            expect(balanceAgentBefore).toBeCloseTo(
                balanceAgentAfter +
                    transferAmount * receiversAccountsIds.length,
                Number(tokenDetials.decimals)
            );
            receiversAccountsIds.forEach((id) =>
                expect(balancesOfReceiversBefore.get(id)).toBeCloseTo(
                    balancesOfReceiversAfter.get(id)! - transferAmount,
                    Number(tokenDetials.decimals)
                )
            );
        }
    );
});
