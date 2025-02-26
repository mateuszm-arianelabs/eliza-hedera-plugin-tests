import {
    AccountsResponse,
    AllTokensBalancesApiResponse,
    DetailedTokenBalance,
    HTSBalanceResponse,
    HtsTokenDetails,
    NetworkType,
    TransactionsResponse,
    txReport,
} from "../types";
import BigNumber from "bignumber.js";
import { fromBaseToDisplayUnit, fromTinybarToHbar } from "./utils";

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
            ? fromBaseToDisplayUnit(rawBalance, decimals)
            : 0;

        console.log(
            `Parsed balance for ${accountId}: ${balanceInDisplayUnit} of ${tokenId} (from Mirror Node)`
        );

        return balanceInDisplayUnit;
    }

    async getTransactionReport(
        transactionId: string,
        senderId: string,
        receiversId: string[]
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
            .filter(
                (t) =>
                    t.account !== senderId &&
                    !receiversId.find((r) => r === t.account)
            )
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

    async getTokenDetails(tokenId: string): Promise<HtsTokenDetails> {
        const url = `${this.baseUrl}/tokens/${tokenId}`;

        console.log(`URL: ${url}`);

        const response = await fetch(url, { method: "GET" });
        return response.json();
    }

    async getAllTokensBalances(
        accountId: string
    ): Promise<Array<DetailedTokenBalance>> {
        let url: string | null =
            `${this.baseUrl}/balances?account.id=${accountId}`;
        const array = new Array<DetailedTokenBalance>();

        console.log(`URL: ${url}`);

        try {
            while (url) {
                // Results are paginated
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: AllTokensBalancesApiResponse = await response.json();

                const tokenBalances = await Promise.all(
                    (data.balances[0]?.tokens || []).map(async (token) => {
                        const tokenDetails: HtsTokenDetails = await this.getTokenDetails(token.token_id);
                        return {
                            balance: token.balance,
                            tokenDecimals: tokenDetails.decimals,
                            tokenId: token.token_id,
                            tokenName: tokenDetails.name,
                            tokenSymbol: tokenDetails.symbol,
                            balanceInDisplayUnit: BigNumber(
                                fromBaseToDisplayUnit(
                                    token.balance,
                                    +tokenDetails.decimals
                                )
                            ),
                        };
                    })
                );

                array.push(...tokenBalances);

                // Update URL for pagination
                url = data.links.next;
            }

            return array;
        } catch (error) {
            console.error("Failed to fetch token balances. Error:", error);
            throw error;
        }
    }
}
