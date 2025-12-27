import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import toStream from 'buffer-to-stream';
import { v2 as cloudinary } from 'cloudinary';
import { error } from 'console';

@Injectable()
export class MediaService {
    constructor(private configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
        });
    }

    // Method to upload file to Cloudinary
    async uploadFile(file: Express.Multer.File): Promise<any> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    type: 'private',
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });
            toStream(file.buffer).pipe(upload);
        })
    }

    // delete file from Cloudinary
    async deleteFile(publicId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, { type: 'private' }, (error, result) => {
                if (error) return reject(error);
                if (result.result !== 'ok') {
                    return reject(new Error(`Cloudinary deletion failed: ${result.result}`));
                }
                resolve(result);
            });
        });
    }

    // New method to generate a signed URL for private media
    async getPrivateUrl(publicId: string) {
        return cloudinary.url(publicId, {
            type: 'private',
            sign_url: true,
            expire_at: Math.floor(Date.now() / 1000) + (60 * 60)
        });
    }
}
