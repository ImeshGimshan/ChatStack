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
        serverId: createPostDto.serverId ? BigInt(createPostDto.serverId) : null,
        title: createPostDto.title,
      },
    });
  }

  async getFeed(currentUserId?: string) {
    let authorIdFilter: bigint[] = [];

    if (currentUserId) {
      const bUserId = BigInt(currentUserId);
      authorIdFilter = [bUserId];
      try {
        const socialServiceUrl = process.env.SOCIAL_SERVICE_URL || 'http://localhost:3334';
        const response = await fetch(`${socialServiceUrl}/connection/user/${currentUserId}`);
        if (response.ok) {
          const connections = await response.json();
          const connectionIds = connections.map((conn: any) =>
            conn.requesterId === Number(currentUserId) ? BigInt(conn.addresseeId) : BigInt(conn.requesterId),
          );
          authorIdFilter = [bUserId, ...connectionIds];
        } else {
          console.warn('Failed to fetch connections from social-service, status:', response.status);
        }
      } catch (err) {
        console.error('Failed to fetch connections from social-service', err);
      }
    }

    // Get posts
    const posts = await this.prisma.post.findMany({
      where: authorIdFilter.length > 0 ? {
        authorId: { in: authorIdFilter }
      } : {},
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        comments: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        }
      }
    });

    if (posts.length === 0) return [];

    // Extract unique author IDs
    const authorIds = [...new Set(posts.map((post) => Number(post.authorId)))];

    // Fetch user details from auth-service — fail gracefully if unavailable
    let userMap = new Map<number, any>();
    try {
      const users = await this.authService.getUsersByIds(authorIds);
      userMap = new Map(users.map((user) => [user.id, user]));
    } catch {
      // Auth service unreachable
    }

    // Merge posts with author data
    return posts.map((post) => ({
      ...post,
      id: post.id.toString(),
      authorId: post.authorId.toString(),
      serverId: post.serverId?.toString(),
      author: userMap.get(Number(post.authorId)) ?? {
        id: post.authorId.toString(),
        username: `user-${post.authorId}`,
      },
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
