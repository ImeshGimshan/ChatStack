import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthServiceClient } from '../auth/auth-service.client';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthServiceClient,
  ) {}

  async createPost(createPostDto: CreatePostDto, userIdFromToken: string) {
    return this.prisma.post.create({
      data: {
        content: createPostDto.content,
        imageUrl: createPostDto.imageId,
        authorId: BigInt(userIdFromToken),
        title: createPostDto.title,
      },
    });
  }

  async getFeed() {
    // Get all posts
    const posts = await this.prisma.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Extract unique author IDs
    const authorIds = [...new Set(posts.map((post) => Number(post.authorId)))];

    // Fetch user details from auth-service
    const users = await this.authService.getUsersByIds(authorIds);

    // Create a map for quick lookup
    const userMap = new Map(users.map((user) => [user.id, user]));

    // Merge posts with author data
    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      authorId: post.authorId.toString(),
      author: userMap.get(Number(post.authorId)) || null,
    }));
  }

  async updatePost(
    id: number,
    updatePostDto: UpdatePostDto,
    userIdFromToken: string,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: Number(id) },
    });
    if (!post || post.authorId !== BigInt(userIdFromToken)) {
      throw new ForbiddenException(
        'You are not authorized to update this post',
      );
    }
    return this.prisma.post.update({
      where: { id: Number(id) },
      data: {
        content: updatePostDto.content,
        title: updatePostDto.title,
        imageUrl: updatePostDto.imageId,
      },
    });
  }

  async deletePost(id: number, userIdFromToken: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: Number(id) },
    });
    if (!post || post.authorId !== BigInt(userIdFromToken)) {
      throw new ForbiddenException(
        'You are not authorized to delete this post',
      );
    }
    return this.prisma.post.delete({
      where: { id: Number(id) },
    });
  }
}
