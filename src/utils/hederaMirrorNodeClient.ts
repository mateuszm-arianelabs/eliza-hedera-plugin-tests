import {
    AccountsResponse,
    HTSBalanceResponse,
    NetworkType,
    TransactionsResponse,
    txReport,
} from "../types";
import { formBaseToDisplayUnit, fromTinybarToHbar } from "./utils";

export class HederaMirrorNodeClient {
    private baseUrl: string;

    constructor(networkType: NetworkType) {
        const networkBase =
            networkType === "mainnet" ? `${networkType}-public` : networkType;
        this.baseUrl = `https://${networkBase}.mirrornode.hedera.com/api/v1`;
    }

    async getHbarBalance(accountId: string): Promise<number> {
        const url = `${this.baseUrl}/accounts?account.id=${accountId}&balance=true&limit=1&order=desc`;

        console.log(`URL: ${url}`);

        const response = await fetch(url, { method: "GET" });
        const parsedResponse: AccountsResponse = await response.json();
        const rawBalance = parsedResponse.accounts[0].balance.balance;

        console.log(
            `Raw balance for ${accountId}: ${rawBalance} (from Mirror Node)`
        );

        return fromTinybarToHbar(rawBalance);
    }

    async getTokenBalance(accountId: string, tokenId: string): Promise<number> {
        const url = `${this.baseUrl}/tokens/${tokenId}/balances?account.id=${accountId}&limit=1&order=asc`;

        console.log(`URL: ${url}`);

        const response = await fetch(url, { method: "GET" });
        const parsedResponse: HTSBalanceResponse = await response.json();

        const rawBalance = parsedResponse?.balances[0]?.balance;
        const decimals = parsedResponse?.balances[0]?.decimals;

        const balanceInDisplayUnit = parsedResponse?.balances[0]
            ? formBaseToDisplayUnit(rawBalance, decimals)
            : 0;

        console.log(
            `Parsed balance for ${accountId}: ${balanceInDisplayUnit} of ${tokenId} (from Mirror Node)`
        );

        return balanceInDisplayUnit;
    }

    async getTransactionReport(
        transactionId: string,
        senderId: string,
        receiverId: string
    ): Promise<txReport> {
        const url = `${this.baseUrl}/transactions/${transactionId}`;
        console.log(`URL: ${url}`);

        const response = await fetch(
            `${this.baseUrl}/transactions/${transactionId}`
        );
        if (!response.ok) {
            throw new Error(
                `Hedera Mirror Node API error: ${response.statusText}`
            );
        }
        const result: TransactionsResponse = await response.json();

        const totalFees = result.transactions[0].transfers
            .filter((t) => t.account !== senderId && t.account !== receiverId)
            .reduce((sum, t) => sum + t.amount, 0);

        const status = result.transactions[0].result;

        const txReport = {
            status,
            totalPaidFees: fromTinybarToHbar(totalFees),
        };

        console.log(
            `Parsed transaction report: ${JSON.stringify(txReport, null, 2)}`
        );

        return txReport;
    }
}
