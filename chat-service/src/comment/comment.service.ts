import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthServiceClient } from 'src/auth/auth-service.client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthServiceClient,
  ) {}

  async createComment(createCommentDto: CreateCommentDto, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: createCommentDto.postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    return this.prisma.comment.create({
      data: {
        postId: createCommentDto.postId,
        content: createCommentDto.content,
        authorId: BigInt(userId),
      },
    });
  }

  async getCommentsByPostId(postId: number) {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });

    if (comments.length === 0) {
      return [];
    }
    const authorIds = [...new Set(comments.map((c) => Number(c.authorId)))];
    const users = await this.authService.getUsersByIds(authorIds);
    const userMap = new Map(users.map((user) => [user.id, user]));

    return comments.map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt,
      authorId: comment.authorId,
      author: userMap.get(Number(comment.authorId)) || null,
    }));
  }

  async updateComment(
    id: number,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== BigInt(userId)) {
      throw new ForbiddenException('You are not the author of this comment');
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        content: updateCommentDto.content,
      },
    });
  }

  async deleteComment(id: number, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== BigInt(userId)) {
      throw new ForbiddenException(
        'You are not authorized to delete this comment',
      );
    }

    return this.prisma.comment.delete({
      where: { id },
    });
  }

  async getCommmentById(id: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const author = await this.authService.getUserById(Number(comment.authorId));

    return {
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt,
      authorId: comment.authorId,
      author: author || null,
    };
  }
}
