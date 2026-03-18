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
        serverId: createPostDto.serverId
          ? BigInt(createPostDto.serverId)
          : null,
        title: createPostDto.title,
      },
    });
  }

  async getFeed(currentUserId?: string, token?: string) {
    let authorIdFilter: bigint[] = [];

    if (currentUserId && token) {
      const bUserId = BigInt(currentUserId);
      authorIdFilter = [bUserId];
      try {
        const socialServiceUrl =
          process.env.SOCIAL_SERVICE_URL || 'http://localhost:3334';
        const response = await fetch(
          `${socialServiceUrl}/api/connection/user/${currentUserId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (response.ok) {
          const connections = await response.json();
          const connectionIds = connections.map((conn: any) =>
            conn.requesterId === Number(currentUserId)
              ? BigInt(conn.addresseeId)
              : BigInt(conn.requesterId),
          );
          authorIdFilter = [bUserId, ...connectionIds];
        } else {
          console.warn(
            'Failed to fetch connections from social-service, status:',
            response.status,
          );
        }
      } catch (err) {
        console.error('Failed to fetch connections from social-service', err);
      }
    }

    // Get posts
    const posts = await this.prisma.post.findMany({
      where:
        authorIdFilter.length > 0
          ? {
              authorId: { in: authorIdFilter },
            }
          : {},
      include: {
        comments: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { likes: true },
        },
        ...(currentUserId && {
          likes: {
            where: { userId: BigInt(currentUserId) },
            take: 1,
          }
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (posts.length === 0) return [];

    // Extract unique author IDs
    const authorIds = [...new Set(posts.map((post) => Number(post.authorId)))];

    let userMap = new Map<number, any>();
    try {
      const users = await this.authService.getUsersByIds(authorIds);
      userMap = new Map(users.map((user) => [user.id, user]));
    } catch {
      // Auth service unreachable
    }

    // Merge posts with author data
    return posts.map((post: any) => ({
      ...post,
      id: post.id.toString(),
      authorId: post.authorId.toString(),
      serverId: post.serverId?.toString(),
      likeCount: post._count?.likes ?? 0,
      hasLiked: post.likes ? post.likes.length > 0 : false,
      author: userMap.get(Number(post.authorId)) ?? {
        id: post.authorId.toString(),
        username: `user-${post.authorId}`,
      },
      comments: post.comments
        ? post.comments.map((comment: any) => ({
            ...comment,
            id: comment.id.toString(),
            postId: comment.postId.toString(),
            authorId: comment.authorId.toString(),
          }))
        : [],
    }));
  }

  async getPostById(id: number, currentUserId?: string, token?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: BigInt(id) },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { likes: true },
        },
        ...(currentUserId && {
          likes: {
            where: { userId: BigInt(currentUserId) },
            take: 1,
          }
        }),
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    let authorData = {
      id: post.authorId.toString(),
      username: `user-${post.authorId}`,
    };

    try {
      const users = await this.authService.getUsersByIds([
        Number(post.authorId),
      ]);
      if (users.length > 0) {
        authorData = {
          ...users[0],
          id: users[0].id.toString(),
        };
      }
    } catch {
      // Ignore
    }

    return {
      ...post,
      id: post.id.toString(),
      authorId: post.authorId.toString(),
      serverId: post.serverId?.toString(),
      likeCount: (post as any)._count?.likes ?? 0,
      hasLiked: (post as any).likes ? (post as any).likes.length > 0 : false,
      author: authorData,
      comments: post.comments
        ? post.comments.map((comment: any) => ({
            ...comment,
            id: comment.id.toString(),
            postId: comment.postId.toString(),
            authorId: comment.authorId.toString(),
          }))
        : [],
    };
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

  async toggleLike(postId: number, userId: string) {
    const pId = BigInt(postId);
    const uId = BigInt(userId);

    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: pId,
          userId: uId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.postLike.delete({
        where: { id: existingLike.id },
      });
      return { liked: false };
    } else {
      await this.prisma.postLike.create({
        data: {
          postId: pId,
          userId: uId,
        },
      });
      return { liked: true };
    }
  }
}
