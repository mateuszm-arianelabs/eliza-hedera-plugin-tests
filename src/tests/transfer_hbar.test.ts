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

    it("Should transfer HBAR successfully", async () => {
        const elizaOsApiClient = new ElizaOSApiClient("http://localhost:3000");
        const hederaApiClient = new HederaMirrorNodeClient("testnet");

        const receiversAccountId = "0.0.5532322";
        const agentsAccountId = process.env.HEDERA_ACCOUNT_ID;

        const transferAmount = 1;

        if (!agentsAccountId) {
            throw new Error(
                "Env file must be defined and matching the env of running ElizaOs instance!"
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
            text: "Transfer 1 HBAR to the account 0.0.5532322",
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
        expect(balanceReceiverBefore).toEqual(
            balanceReceiverAfter - transferAmount
        );
    });
});
