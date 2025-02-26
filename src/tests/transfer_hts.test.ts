import { describe, expect, it, beforeAll } from "vitest";
import { ElizaOSApiClient } from "../utils/elizaApiClient";
import { ElizaOSPrompt } from "../types";
import { HederaMirrorNodeClient } from "../utils/hederaMirrorNodeClient";
import * as dotenv from "dotenv";
import { NetworkClientWrapper } from "../utils/testnetClient";
import { AccountData } from "../utils/testnetUtils";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Test Token transfer", async () => {
    let acc1: AccountData;
    let acc2: AccountData;
    let acc3: AccountData;
    let token1: string;
    let token2: string;
    let elizaOsApiClient: ElizaOSApiClient;
    let hederaApiClient: HederaMirrorNodeClient;
    let networkClientWrapper: NetworkClientWrapper;
    let testCases: [string, number, string, string][];

    beforeAll(async () => {
        dotenv.config();
        try {
            networkClientWrapper = new NetworkClientWrapper(
                process.env.HEDERA_ACCOUNT_ID!,
                process.env.HEDERA_PRIVATE_KEY!,
                process.env.HEDERA_KEY_TYPE!,
                "testnet"
            );

            // Create test accounts
            acc1 = await networkClientWrapper.createAccount(0, -1);
            acc2 = await networkClientWrapper.createAccount(0, -1);
            acc3 = await networkClientWrapper.createAccount(0, -1);

            // Create test tokens
            token1 = await networkClientWrapper.createFT({
                name: "TestToken1",
                symbol: "TT1",
                initialSupply: 1000000,
                decimals: 2,
            });
            token2 = await networkClientWrapper.createFT({
                name: "TestToken2",
                symbol: "TT2",
                initialSupply: 2000,
                decimals: 0,
            });

            // Initialize API clients
            elizaOsApiClient = new ElizaOSApiClient(
                `http://${process.env.ELIZAOS_REST_HOSTNAME}:${process.env.ELIZAOS_REST_PORT}`
            );
            await elizaOsApiClient.setup();
            hederaApiClient = new HederaMirrorNodeClient("testnet");

            // Define test cases using created accounts and tokens
            testCases = [
                [
                    acc1.accountId,
                    12.5,
                    token1,
                    `Transfer 12.5 tokens ${token1} to the account ${acc1.accountId}`,
                ],
                [
                    acc2.accountId,
                    10,
                    token2,
                    `Send 10 tokens ${token2} to account ${acc2.accountId}.`,
                ],
                [
                    acc3.accountId,
                    3,
                    token1,
                    `Transfer exactly 3 of token ${token1} to ${acc3.accountId}.`,
                ],
            ];
        } catch (error) {
            console.error("Error in setup:", error);
            throw error;
        }
    });

    describe("token transfers", () => {
        it("should process token transfers for dynamically created accounts", async () => {
            await testCases.reduce(async (promise, [receiversAccountId, transferAmount, tokenId, promptText]) => {
                await promise;

                const agentsAccountId = process.env.HEDERA_ACCOUNT_ID;

                if (!agentsAccountId || receiversAccountId === agentsAccountId) {
                    throw new Error(
                        "Env file must be defined and matching the env of running ElizaOs instance! Note that transfers cant be done to the operator account address."
                    );
                }

                // Get balances before
                const [balanceAgentBefore, balanceReceiverBefore] = await Promise.all([
                    hederaApiClient.getTokenBalance(agentsAccountId, tokenId),
                    hederaApiClient.getTokenBalance(receiversAccountId, tokenId)
                ]);

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

                const [balanceAgentAfter, balanceReceiverAfter] = await Promise.all([
                    hederaApiClient.getTokenBalance(agentsAccountId, tokenId),
                    hederaApiClient.getTokenBalance(receiversAccountId, tokenId)
                ]);

                const txReport = await hederaApiClient.getTransactionReport(
                    txHash,
                    agentsAccountId,
                    [receiversAccountId]
                );

                // Compare before and after including the difference due to paid fees
                expect(txReport.status).toEqual("SUCCESS");
                expect(balanceAgentBefore).toEqual(
                    Number(balanceAgentAfter) + transferAmount
                );
                expect(balanceReceiverBefore).toEqual(
                    Number(balanceReceiverAfter) - transferAmount
                );

                await wait(1000);
            }, Promise.resolve());
        });
    });
});
