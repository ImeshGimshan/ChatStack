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

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@Request() req: any, @Body() createPostDto: CreatePostDto) {
    const userId = req.user.userId;
    return this.postService.createPost(createPostDto, userId);
  }

  @Get()
  async getAllPosts() {
    return this.postService.getFeed();
  }

  @UseGuards(JwtAuthGuard)
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
  @Delete(':id')
  async deletePost(
    @Param('id', ParseIntPipe) postId: number,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.postService.deletePost(postId, userId);
  }
}
