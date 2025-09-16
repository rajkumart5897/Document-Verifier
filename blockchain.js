const crypto = require("crypto");

class Block {
  constructor(index, timestamp, data, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.timestamp +
          JSON.stringify(this.data) +
          this.previousHash
      )
      .digest("hex");
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    return new Block(0, Date.now().toString(), "Init Block", "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    // Check if block with same data hash already exists
    if (
      newBlock.data &&
      newBlock.data.hash &&
      this.chain.some((b) => b.data && b.data.hash === newBlock.data.hash)
    ) {
      console.warn("Block with this file hash already exists. Skipping.");
      throw new Error("Duplicate file hash");
    }
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = newBlock.calculateHash();
    if (this.isNewBlockValid(newBlock, this.getLatestBlock())) {
      this.chain.push(newBlock);
    } else {
      console.error("Invalid block. Not added.");
    }
  }

  isNewBlockValid(newBlock, previousBlock) {
    if (previousBlock.index + 1 !== newBlock.index) return false;
    if (newBlock.previousHash !== previousBlock.hash) return false;
    if (newBlock.hash !== newBlock.calculateHash()) return false;
    return true;
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (current.hash !== current.calculateHash()) {
        return false;
      }
      if (current.previousHash !== previous.hash) {
        return false;
      }
      if (current.index !== previous.index + 1) {
        return false;
      }
    }
    return true;
  }
}

module.exports = { Block, Blockchain };
