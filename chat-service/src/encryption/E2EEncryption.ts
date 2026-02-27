import sodium from 'libsodium-wrappers';

export class E2EEncryption {
  static async initialize() {
    await sodium.ready;
  }

  static generateKeyPair() {
    const keyPair = sodium.crypto_box_keypair();
    return {
      publicKey: sodium.to_base64(keyPair.publicKey),
      privateKey: sodium.to_base64(keyPair.privateKey),
    };
  }

  /**
   * Encrypt a message for a specific recipient
   * @param message - Plain text message
   * @param recipientPublicKey - Recipient's public key (base64)
   * @param senderPrivateKey - Sender's private key (base64)
   * @returns Encrypted message as JSON string
   */

  static encryptMessage(
    message: string,
    recipientPublicKey: string,
    senderPrivateKey: string,
  ): string {
    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    const encrypted = sodium.crypto_box_easy(
      message,
      nonce,
      sodium.from_base64(recipientPublicKey),
      sodium.from_base64(senderPrivateKey),
    );

    return JSON.stringify({
      nonce: sodium.to_base64(nonce),
      ciphertext: sodium.to_base64(encrypted),
    });
  }

  /**
   * Decrypt a message from a specific sender
   * @param encryptedData - Encrypted message (JSON string)
   * @param senderPublicKey - Sender's public key (base64)
   * @param recipientPrivateKey - Recipient's private key (base64)
   * @returns Decrypted plain text message
   */

  static decryptMessage(
    encryptedData: string,
    senderPublicKey: string,
    recipientPrivateKey: string,
  ): string {
    const { nonce, ciphertext } = JSON.parse(encryptedData);
    const decrypted = sodium.crypto_box_open_easy(
      sodium.from_base64(ciphertext),
      sodium.from_base64(nonce),
      sodium.from_base64(senderPublicKey),
      sodium.from_base64(recipientPrivateKey),
    );

    return sodium.to_string(decrypted);
  }
}
