import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth-guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get the authenticated user's own profile
  @Get('me')
  @UseGuards(AuthGuard)
  async getOwnProfile(@CurrentUser() user: User) {
    return this.usersService.getUserProfile(user.id);
  }

  // Update the authenticated user's own profile
  @Put('me')
  @UseGuards(AuthGuard)
  async updateOwnProfile(
    @CurrentUser() user: User,
    @Body() updateData: Partial<User>,
  ) {
    return this.usersService.updateUserProfile(user.id, updateData);
  }

  // Get all users (admin only)
  @Get()
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  // Get a specific user by ID (admin, or users with appropriate role)
  @Get(':id')
  @UseGuards(AuthGuard)
  async getUserById(@Param('id') id: string, @CurrentUser() currentUser: User) {
    // Check if user is requesting their own profile or has admin role
    if (id === currentUser.id || currentUser.role === UserRole.ADMIN) {
      return this.usersService.getUserProfile(id);
    }

    // For landlords, check if user is their caretaker or agent
    if (currentUser.role === UserRole.LANDLORD) {
      const canAccess = await this.usersService.canLandlordAccessUser(
        currentUser.id,
        id,
      );
      if (canAccess) {
        return this.usersService.getUserProfile(id);
      }
    }

    throw new BadRequestException(
      'You do not have permission to access this user',
    );
  }

  // Create a new user (admin only)
  @Post()
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  async createUser(@Body() userData: any) {
    return this.usersService.createUser(userData);
  }
}
