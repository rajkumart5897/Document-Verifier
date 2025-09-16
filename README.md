# Doc Verifier

A simple blockchain-based document verification system.

## Features

- Upload documents to the blockchain (admin).
- View the blockchain and its structure (admin).
- Verify documents (public).

## Setup

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/doc-verifier.git
   cd doc-verifier
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the server:

   ```
   npm start
   ```

4. Open your browser and go to `http://localhost:3000` (default port is 3000).

## Usage

- **Admin Panel (`/admin.html`):**

  - Upload Document: Use the upload form to add a document to the blockchain.
  - View Blockchain: The blockchain is displayed, including a Mermaid diagram.
  - View uploaded documents and chain.

- **Public Verification (`/`):**
  - Verify Document: Use the verify form to check if a document exists in the blockchain.

## License

MIT
