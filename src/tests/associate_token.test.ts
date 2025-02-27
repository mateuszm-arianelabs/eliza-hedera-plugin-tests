import { describe, expect, it, beforeAll } from "vitest";
import { ElizaOSApiClient } from "../utils/elizaApiClient";
import { ElizaOSPrompt } from "../types";
import * as dotenv from "dotenv";
import { NetworkClientWrapper } from "../utils/testnetClient";
import { AccountData } from "../utils/testnetUtils";
import { HederaMirrorNodeClient } from "../utils/hederaMirrorNodeClient";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

dotenv.config();
describe("claim_airdrop", () => {
    let tokenCreatorAccount: AccountData;
    let token1: string;
    let token2: string;
    const elizaClientAccountId = process.env.HEDERA_ACCOUNT_ID!;
    let elizaOsApiClient: ElizaOSApiClient;
    let testCases: {
        tokenToAssociateId: string;
        promptText: string;
    }[];
    let hederaMirrorNodeClient: HederaMirrorNodeClient;

    beforeAll(async () => {
        try {
            hederaMirrorNodeClient = new HederaMirrorNodeClient(
                process.env.HEDERA_NETWORK_TYPE as
                    | "testnet"
                    | "mainnet"
                    | "previewnet"
            );

            const accountInfo =
                await hederaMirrorNodeClient.getAccountInfo(
                    elizaClientAccountId
                );

            if (accountInfo.max_automatic_token_associations !== 0) {
                // test will be skipped so setup will not be executed
                return;
            }

            const networkClientWrapper = new NetworkClientWrapper(
                process.env.HEDERA_ACCOUNT_ID!,
                process.env.HEDERA_PRIVATE_KEY!,
                process.env.HEDERA_KEY_TYPE!,
                "testnet"
            );

            tokenCreatorAccount = await networkClientWrapper.createAccount(
                15,
                0
            );

            const tokenCreatorAccountNetworkClientWrapper =
                new NetworkClientWrapper(
                    tokenCreatorAccount.accountId,
                    tokenCreatorAccount.privateKey,
                    "ECDSA",
                    "testnet"
                );

            await Promise.all([
                tokenCreatorAccountNetworkClientWrapper.createFT({
                    name: "TokenToAssociate1",
                    symbol: "TTA1",
                    initialSupply: 1000,
                    decimals: 2,
                }),
                tokenCreatorAccountNetworkClientWrapper.createFT({
                    name: "TokenToAssociate2",
                    symbol: "TTA2",
                    initialSupply: 1000,
                    decimals: 2,
                }),
            ]).then(([_token1, _token2]) => {
                token1 = _token1;
                token2 = _token2;
            });

            elizaOsApiClient = new ElizaOSApiClient(
                `http://${process.env.ELIZAOS_REST_HOSTNAME}:${process.env.ELIZAOS_REST_PORT}`
            );
            await elizaOsApiClient.setup();

            testCases = [
                {
                    tokenToAssociateId: token1,
                    promptText: `Associate token ${token1} to account ${elizaClientAccountId}`,
                },
                {
                    tokenToAssociateId: token2,
                    promptText: `Associate token ${token2} to account ${elizaClientAccountId}`,
                },
            ];
        } catch (error) {
            console.error("Error in setup:", error);
            throw error;
        }
    });

    describe("associate token checks", () => {
        it.runIf(async () => {
            const accountInfo =
                await hederaMirrorNodeClient.getAccountInfo(
                    elizaClientAccountId
                );
            return accountInfo.max_automatic_token_associations === 0;
        })("should associate token", async () => {
            for (const { promptText, tokenToAssociateId } of testCases || []) {
                const prompt: ElizaOSPrompt = {
                    user: "user",
                    text: promptText,
                };

                await elizaOsApiClient.sendPrompt(prompt);
                await wait(15000);

                const token = await hederaMirrorNodeClient.getAccountToken(
                    elizaClientAccountId,
                    tokenToAssociateId
                );

                expect(token).toBeDefined();
            }
        });
    });
});
