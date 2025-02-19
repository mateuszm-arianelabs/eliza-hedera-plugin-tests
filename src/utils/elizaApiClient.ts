import {
    ElizaOSAgentsResponse,
    ElizaOSPrompt,
    ElizaOSPromptResponse,
} from "../types";

export class ElizaOSApiClient {
    constructor(private baseUrl: string) {}

    async sendPrompt(
        agentId: string,
        prompt: ElizaOSPrompt
    ): Promise<ElizaOSPromptResponse[]> {
        try {
            const response = await fetch(`${this.baseUrl}/${agentId}/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(prompt),
            });

            if (!response.ok) {
                throw new Error(`ElizaOS API error: ${response.statusText}`);
            }

            const content = await response.json();
            console.log(
                `ElizaOS responses: ${JSON.stringify(content, null, 2)}`
            );

            return await content;
        } catch (error) {
            console.error("Request failed:", error);
            throw error;
        }
    }

    async getAgentId(): Promise<string> {
        const response = await fetch(`${this.baseUrl}/agents`, {
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`ElizaOS API error: ${response.statusText}`);
        }
        const agentsResponse: ElizaOSAgentsResponse = await response.json();
        const agentsList = agentsResponse.agents;

        if (!agentsList || agentsList.length === 0) {
            throw new Error("No agents found in the response");
        }

        // Assuming that only one agent is connected
        const agent = agentsList[0];
        return agent.id;
    }

    async getHello(): Promise<any> {
        const response = await fetch(`${this.baseUrl}/hello`);

        if (!response.ok) {
            throw new Error(`ElizaOS API error: ${response.statusText}`);
        }

        return await response.json();
    }
}
