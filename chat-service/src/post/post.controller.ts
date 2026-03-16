import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';
import { JwtAuthGuard } from 'src/auth/Jwt.Auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  async createPost(@Request() req: any, @Body() createPostDto: CreatePostDto) {
    const userId = req.user.userId;
    return this.postService.createPost(createPostDto, userId);
  }

  @Get()
  async getAllPosts(@Request() req: any) {
    // Optional auth: if token is valid, use userId for personalized feed
    // If no token or invalid, show a generic feed (currently handled by service as empty filter)
    // Actually, JwtAuthGuard is not used here, so we might need a custom check if we want optional auth
    // For now, let's just make it handle the case where req.user might be populated by other means or if we add a guard.
    return this.postService.getFeed(req.user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  async updatePost(
    @Param('id', ParseIntPipe) postId: number,
    @Request() req: any,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    const userId = req.user.userId;
    return this.postService.updatePost(postId, updatePostDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  async deletePost(
    @Param('id', ParseIntPipe) postId: number,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.postService.deletePost(postId, userId);
  }
}
