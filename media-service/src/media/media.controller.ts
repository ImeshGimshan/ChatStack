import { Controller, Delete, FileTypeValidator, Get, MaxFileSizeValidator, Param, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB limit
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ })
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        const result = await this.mediaService.uploadFile(file);
        return {
            publicId: result.public_id,
            format: result.format,
        }
    }

    @Delete(':publicId')
    async deleteImage(@Param('publicId') publicId: string) {
        await this.mediaService.deleteFile(publicId);
        return {
            message: 'File deleted successfully',
        };
    }

    @Get('access/:publicId')
    async getAccessUrl(@Param('publicId') publicId: string) {
        const signedUrl = await this.mediaService.getPrivateUrl(publicId);
        return {
            url: signedUrl,
        };
    }
}
