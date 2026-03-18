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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  async getAllPosts(@Request() req: any) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.postService.getFeed(req.user?.userId, token);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  async getPostById(
    @Param('id', ParseIntPipe) postId: number,
    @Request() req: any,
  ) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.postService.getPostById(postId, req.user?.userId, token);
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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/like')
  async toggleLike(
    @Param('id', ParseIntPipe) postId: number,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.postService.toggleLike(postId, userId);
  }
}
