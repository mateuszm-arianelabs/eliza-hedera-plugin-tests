import { describe, expect, it, beforeEach } from "vitest";
import { ElizaOSApiClient } from "../utils/elizaApiClient";
import { ElizaOSPrompt } from "../types";
import { HederaMirrorNodeClient } from "../utils/hederaMirrorNodeClient";
import * as dotenv from "dotenv";
import { formDisplayToBaseUnit } from "../utils/utils";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("create_fungible_token", () => {
    beforeEach(async () => {
        dotenv.config();
        await wait(3000);
    });
    it("Create token with all possible parameters", async () => {
        const elizaOsApiClient = new ElizaOSApiClient("http://localhost:3000");
        const hederaApiClient = new HederaMirrorNodeClient("testnet");

        const agentId = await elizaOsApiClient.getAgentId();

        const promptText =
            "Create token GameGold with symbol GG, 2 decimal places, and starting supply of 750000. Set memo to 'This is an example memo' and token metadata to 'And that's an example metadata'. Add supply key, admin key. Set metadata key.";
        const prompt: ElizaOSPrompt = {
            user: "user",
            text: promptText,
        };

        const response = await elizaOsApiClient.sendPrompt(agentId, prompt);
        let tokenId: string;

        const regex = /Token ID:\s*(\d+\.\d+\.\d+)/;
        const match = response[response.length - 1].text.match(regex);

        if (match) {
            tokenId = match[1]; // Extracted Token ID
            console.log(`Extracted token id: ${tokenId}`);
        } else {
            throw new Error(
                "No match for token ID was found in ElizaOS response."
            );
        }

        await wait(5000);

        const tokenDetails = await hederaApiClient.getTokenDetails(tokenId);

        expect(tokenDetails.symbol).toEqual("GG");
        expect(tokenDetails.name).toEqual("GameGold");
        expect(tokenDetails.decimals).toEqual("2");
        expect(tokenDetails.initial_supply).toEqual(
            formDisplayToBaseUnit(750000, 2).toString()
        );
        expect(tokenDetails.memo).toEqual("This is an example memo");
        expect(atob(tokenDetails.metadata)).toEqual(
            "And that's an example metadata"
        );
        expect(tokenDetails?.supply_key?.key).not.toBeFalsy();
        expect(tokenDetails?.admin_key?.key).not.toBeFalsy();
        expect(tokenDetails?.metadata_key?.key).not.toBeFalsy();
    });
});
