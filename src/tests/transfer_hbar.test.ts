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
        ["0.0.5532322", 1, "Transfer 1 HBAR to the account 0.0.5532322"],
        ["0.0.5611287", 0.5, "Send 0.5 HBAR to account 0.0.5611287."],
        ["0.0.5611266", 3, "Transfer exactly 3 HBAR to 0.0.5611266."],
    ])(
        "should process transfer for receiversAccountId: %s, transferAmount: %d, prompt: %s",
        async (receiversAccountId, transferAmount, promptText) => {
            const elizaOsApiClient = new ElizaOSApiClient(
                "http://localhost:3000"
            );
            const hederaApiClient = new HederaMirrorNodeClient("testnet");

            const agentsAccountId = process.env.HEDERA_ACCOUNT_ID;

            if (!agentsAccountId || receiversAccountId === agentsAccountId) {
                throw new Error(
                    "Env file must be defined and matching the env of running ElizaOs instance! Note that transfers can be done to the operator account address."
                );
            }

            // Get balances before
            const balanceAgentBefore =
                await hederaApiClient.getHbarBalance(agentsAccountId);
            const balanceReceiverBefore =
                await hederaApiClient.getHbarBalance(receiversAccountId);

            // Perform transfer action
            const agentId = await elizaOsApiClient.getAgentId();
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
            await wait(5000);

            const balanceAgentAfter =
                await hederaApiClient.getHbarBalance(agentsAccountId);
            const balanceReceiverAfter =
                await hederaApiClient.getHbarBalance(receiversAccountId);
            const txReport = await hederaApiClient.getTransactionReport(
                txHash,
                agentsAccountId,
                receiversAccountId
            );

            // Compare before and after including the difference due to paid fees
            expect(txReport.status).toEqual("SUCCESS");
            expect(balanceAgentBefore).toEqual(
                balanceAgentAfter + transferAmount + txReport.totalPaidFees
            );
            expect(balanceReceiverBefore).toBeCloseTo(
                balanceReceiverAfter - transferAmount,
                8
            );
        }
    );
});
