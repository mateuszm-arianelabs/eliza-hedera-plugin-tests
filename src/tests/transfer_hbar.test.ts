import { describe, expect, it, beforeAll } from "vitest";
import { ElizaOSApiClient } from "../utils/elizaApiClient";
import { ElizaOSPrompt } from "../types";
import { HederaMirrorNodeClient } from "../utils/hederaMirrorNodeClient";
import * as dotenv from "dotenv";
import { NetworkClientWrapper } from "../utils/testnetClient";
import { AccountData } from "../utils/testnetUtils";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Test HBAR transfer", async () => {
    let acc1: AccountData;
    let acc2: AccountData;
    let acc3: AccountData;
    let elizaOsApiClient: ElizaOSApiClient;
    let hederaApiClient: HederaMirrorNodeClient;
    let testCases: [string, number, string][];

    beforeAll(async () => {
        dotenv.config();
        try {
            const wrapper = new NetworkClientWrapper(
                process.env.HEDERA_ACCOUNT_ID!,
                process.env.HEDERA_PRIVATE_KEY!,
                process.env.HEDERA_KEY_TYPE!,
                "testnet"
            );
            acc1 = await wrapper.createAccount(0);
            acc2 = await wrapper.createAccount(0);
            acc3 = await wrapper.createAccount(0);

            elizaOsApiClient = new ElizaOSApiClient(
                `http://${process.env.ELIZAOS_REST_HOSTNAME}:${process.env.ELIZAOS_REST_PORT}`
            );
            await elizaOsApiClient.setup();
            hederaApiClient = new HederaMirrorNodeClient("testnet");

            testCases = [
                [
                    acc1.accountId,
                    1,
                    `Transfer 1 HBAR to the account ${acc1.accountId}`,
                ],
                [
                    acc2.accountId,
                    0.5,
                    `Send 0.5 HBAR to account ${acc2.accountId}.`,
                ],
                [
                    acc3.accountId,
                    3,
                    `Transfer exactly 3 HBAR to ${acc3.accountId}.`,
                ],
            ];
        } catch (error) {
            console.error("Error in setup:", error);
            throw error;
        }
    });

    describe("balance checks", () => {
        it("should test dynamic HBAR transfers", async () => {
            for (const [
                receiversAccountId,
                transferAmount,
                promptText,
            ] of testCases) {
                const agentsAccountId = process.env.HEDERA_ACCOUNT_ID;

                if (
                    !agentsAccountId ||
                    receiversAccountId === agentsAccountId
                ) {
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
                const prompt: ElizaOSPrompt = {
                    user: "user",
                    text: promptText,
                };
                const response = await elizaOsApiClient.sendPrompt(prompt);
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
                expect(balanceAgentBefore).toBeCloseTo(
                    balanceAgentAfter + transferAmount + txReport.totalPaidFees,
                    8
                );
                expect(balanceReceiverBefore).toBeCloseTo(
                    balanceReceiverAfter - transferAmount,
                    8
                );

                await wait(1000);
            }
        });
    });
});
