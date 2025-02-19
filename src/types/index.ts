export type ElizaOSPrompt = {
    user: string;
    text: string;
};

export type ElizaOSPromptResponse = {
    user?: string;
    text: string;
    action?: string;
    content?: {
        success: boolean;
        topicId?: string;
    };
};
export type ElizaOSAgentsResponse = {
    agents: ElizaOSAgent[];
};

export type ElizaOSAgent = {
    id: string;
    name: string;
    clients: any[];
};

export type NetworkType = "mainnet" | "testnet" | "previewnet";

export type TokenBalance = {
    token_id: string;
    balance: number;
};

export type AccountBalance = {
    balance: number;
    timestamp: string;
    tokens: TokenBalance[];
};

export type Key = {
    _type: string;
    key: string;
};

export type Account = {
    account: string;
    alias: string;
    auto_renew_period: number;
    balance: AccountBalance;
    created_timestamp: string;
    decline_reward: boolean;
    deleted: boolean;
    ethereum_nonce: number;
    evm_address: string;
    expiry_timestamp: string;
    key: Key;
    max_automatic_token_associations: number;
    memo: string;
    pending_reward: number;
    receiver_sig_required: boolean;
    staked_account_id: string | null;
    staked_node_id: string | null;
    stake_period_start: string | null;
};

export type AccountsResponse = {
    accounts: Account[];
    links: {
        next: string;
    };
};

export type Balance = {
    account: string;
    balance: number;
    decimals: number;
};

export type Links = {
    next: string;
};

export type HTSBalanceResponse = {
    timestamp: string;
    balances: Balance[];
    links: Links;
};

export type txReport = {
    status: string;
    totalPaidFees: number;
};

type Transfer = {
    account: string;
    amount: number;
    is_approval: boolean;
};

export type Transaction = {
    bytes: null;
    charged_tx_fee: number;
    consensus_timestamp: string;
    entity_id: null;
    max_fee: string;
    memo_base64: string;
    name: string;
    nft_transfers: any[];
    node: string;
    nonce: number;
    parent_consensus_timestamp: null | string;
    result: string;
    scheduled: boolean;
    staking_reward_transfers: any[];
    token_transfers: any[];
    transaction_hash: string;
    transaction_id: string;
    transfers: Transfer[];
    valid_duration_seconds: string;
    valid_start_timestamp: string;
};

export type TransactionsResponse = {
    transactions: Transaction[];
};

type ProtobufEncodedKey = {
    _type: "ProtobufEncoded";
    key: string;
};

type CustomFees = {
    created_timestamp: string;
    fixed_fees: any[];
    fractional_fees: any[];
};

export type HtsTokenDetails = {
    admin_key: ProtobufEncodedKey | null;
    auto_renew_account: string;
    auto_renew_period: number;
    created_timestamp: string;
    custom_fees: CustomFees;
    decimals: string;
    deleted: boolean;
    expiry_timestamp: number;
    fee_schedule_key: ProtobufEncodedKey | null;
    freeze_default: boolean;
    freeze_key: ProtobufEncodedKey | null;
    initial_supply: string;
    kyc_key: ProtobufEncodedKey;
    max_supply: string;
    memo: string;
    metadata: string;
    metadata_key: ProtobufEncodedKey | null;
    modified_timestamp: string;
    name: string;
    pause_key: ProtobufEncodedKey | null;
    pause_status: "PAUSED" | "UNPAUSED";
    supply_key: ProtobufEncodedKey | null;
    supply_type: "FINITE" | "INFINITE";
    symbol: string;
    token_id: string;
    total_supply: string;
    treasury_account_id: string;
    type: "FUNGIBLE_COMMON" | "NON_FUNGIBLE_UNIQUE";
    wipe_key: ProtobufEncodedKey;
};
