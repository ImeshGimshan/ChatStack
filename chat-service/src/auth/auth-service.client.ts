import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface UserDto {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
}

@Injectable()
export class AuthServiceClient {
  private readonly logger = new Logger(AuthServiceClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly authServiceUrl: string;

  constructor() {
    this.authServiceUrl =
      process.env.AUTH_SERVICE_URL || 'http://auth-service:8080';
    this.httpClient = axios.create({
      baseURL: this.authServiceUrl,
      timeout: 5000,
    });
  }

  /**
   * Get a single user by ID
   */
  async getUserById(userId: number): Promise<UserDto | null> {
    try {
      const response = await this.httpClient.get<UserDto>(
        `/api/internal/users/${userId}`,
      );
      return response.data;
    } catch (error) {
      const errorMsg =
        typeof error === 'object' && error && 'message' in error
          ? (error as { message?: string }).message
          : String(error);
      this.logger.error(
        `Failed to fetch user ${userId} from auth-service:`,
        errorMsg,
      );
      return null;
    }
  }

  /**
   * Get multiple users by IDs (batch request)
   */
  async getUsersByIds(userIds: number[]): Promise<UserDto[]> {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    try {
      const response = await this.httpClient.post<UserDto[]>(
        `/api/internal/users/batch`,
        { ids: userIds },
      );
      return response.data;
    } catch (error) {
      const errorMsg =
        typeof error === 'object' && error && 'message' in error
          ? (error as { message?: string }).message
          : String(error);
      this.logger.error(`Failed to fetch users from auth-service:`, errorMsg);
      return [];
    }
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get<{ exists: boolean }>(
        `/api/internal/users/exists/username/${username}`,
      );
      return response.data.exists;
    } catch (error) {
      const errorMsg =
        typeof error === 'object' && error && 'message' in error
          ? (error as { message?: string }).message
          : String(error);
      this.logger.error(`Failed to check username existence:`, errorMsg);
      return false;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get<{ exists: boolean }>(
        `/api/internal/users/exists/email/${email}`,
      );
      return response.data.exists;
    } catch (error) {
      const errorMsg =
        typeof error === 'object' && error && 'message' in error
          ? (error as { message?: string }).message
          : String(error);
      this.logger.error(`Failed to check email existence:`, errorMsg);
      return false;
    }
  }
}
