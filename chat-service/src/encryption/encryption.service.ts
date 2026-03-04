import { Injectable, OnModuleInit } from '@nestjs/common';
import sodium from 'libsodium-wrappers';

@Injectable()
export class EncryptionService implements OnModuleInit {
    async onModuleInit() {
        await sodium.ready;
    }

    encryptMessage(message: string, recipientPublicKey: string): string {
        const plaintext = sodium.from_string(message);
        const publicKey = sodium.from_base64(recipientPublicKey);

        // crypto_box_seal: anonymous encryption — only needs recipient's public key
        // Client decrypts using crypto_box_seal_open(ciphertext, publicKey, privateKey)
        const ciphertext = sodium.crypto_box_seal(plaintext, publicKey);
        return sodium.to_base64(ciphertext);
    }
}
