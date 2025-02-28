import { describe, expect, it, beforeAll } from "vitest";
import { ElizaOSApiClient } from "../utils/elizaApiClient";
import { ElizaOSPrompt } from "../types";
import * as dotenv from "dotenv";
import { NetworkClientWrapper } from "../utils/testnetClient";
import { HederaMirrorNodeClient } from "../utils/hederaMirrorNodeClient";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

dotenv.config();

describe("mint_fungible_token", () => {
    let networkClientWrapper: NetworkClientWrapper;
    let elizaOsApiClient: ElizaOSApiClient;
    let hederaMirrorNodeClient: HederaMirrorNodeClient;

    beforeAll(async () => {
        try {
            hederaMirrorNodeClient = new HederaMirrorNodeClient(
                process.env.HEDERA_NETWORK_TYPE as
                    | "testnet"
                    | "mainnet"
                    | "previewnet"
            );

            networkClientWrapper = new NetworkClientWrapper(
                process.env.HEDERA_ACCOUNT_ID!,
                process.env.HEDERA_PRIVATE_KEY!,
                process.env.HEDERA_KEY_TYPE!,
                "testnet"
            );

            elizaOsApiClient = new ElizaOSApiClient(
                `http://${process.env.ELIZAOS_REST_HOSTNAME}:${process.env.ELIZAOS_REST_PORT}`
            );
            await elizaOsApiClient.setup();
        } catch (error) {
            console.error("Error in setup:", error);
            throw error;
        }
    });

    describe("mint fungible token", () => {
        it("should mint fungible token if there is supply key", async () => {
            const INITIAL_SUPPLY = 5;
            const AMOUNT_TO_MINT = 10;
            const token = await networkClientWrapper.createFT({
                name: "TokenToMintMore1",
                symbol: "TTMM1",
                initialSupply: INITIAL_SUPPLY,
                decimals: 0,
                isSupplyKey: true,
            });

            const prompt: ElizaOSPrompt = {
                user: "user",
                text: `Mint ${AMOUNT_TO_MINT} of token ${token}`,
            };

            await elizaOsApiClient.sendPrompt(prompt);
            await wait(5000);

            const tokenInfo =
                await hederaMirrorNodeClient.getTokenDetails(token);


            expect(Number(tokenInfo.total_supply)).toBe(INITIAL_SUPPLY + AMOUNT_TO_MINT);
        });
        it("should not mint fungible token if there is no supply key", async () => {
            const INITIAL_SUPPLY = 5;
            const AMOUNT_TO_MINT = 10;
            const token = await networkClientWrapper.createFT({
                name: "TokenToNotMintMore1",
                symbol: "TTNMM1",
                initialSupply: INITIAL_SUPPLY,
                decimals: 2,
            });

            const prompt: ElizaOSPrompt = {
                user: "user",
                text: `Mint ${AMOUNT_TO_MINT} of token ${token}`,
            };

            const response = await elizaOsApiClient.sendPrompt(prompt);

            expect(JSON.stringify(response).includes('TOKEN_HAS_NO_SUPPLY_KEY')).toBeTruthy();
        });
    });
});
