# ElizaOS Hedera Plugin – Automated Test Repository

This repository contains automated tests for verifying actions implemented in the **Hedera Plugin** for the **ElizaOS AI agent framework**.

## How to Run the Tests?

Since the ElizaOS framework and its plugins are in separate repositories, tests must be executed externally. Follow these steps:

1. **Clone the ElizaOS repository:**
   ```sh
   git clone https://github.com/elizaos/eliza.git
   ```
2. **Set up `.env` and start the ElizaOS project** according to the guide in the `elizaOS-hedera-plugin` repository.  
   *(TODO: Add a link to the repository guide.)*
3. **Configure `.env` in this project.** See the **Environment Setup** section.
4. **Run the tests:**
   ```sh
   pnpm test
   ```

## How It Works

This project communicates with an **ElizaOS instance** via REST API on the default port **`localhost:3000`**.

- Test cases **send messages to the AI agent**, which triggers relevant actions and returns responses.
- The responses are **parsed**, and important data is extracted.
- Based on this extracted data, tests perform **validations** using the **Hedera Mirror Node API** as the source of truth.

### Important Information
- **Mirror Node delay:** The Hedera Mirror Node has a slight delay, so additional waiting time is required between performing an action and checking the results.
- **Sequential execution only:**
    - Tests **cannot** run in parallel because requests and responses from the agent **must be processed in chronological order**.
    - Concurrent testing is **disabled**, and additional timeouts are introduced before each test to improve reliability.

## Environment Setup

The `.env` file should contain the **same wallet information** as the running ElizaOS instance.  
Use the `.env.example` file as a reference.
