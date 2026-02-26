import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../application/users.service';
import { UserInputDto } from '../dto/user/user-input.dto';
import { UserViewDto } from '../dto/user/user-view.dto';
import { UsersQueryRepository } from '../infrastructure/query/users-query.repository';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { GetUsersQueryParams } from '../dto/user/get-users-query-params.input-dto';
import { UpdateUserDto } from '../dto/user/create-user-domain.dto';
import { BasicAuthGuard } from '../guards/basic/basi-auth.guard';
import { UsersRepository } from '../infrastructure/users.repository';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../application/usecases/users/create-user.usecase';
import { DeleteUserCommand } from '../application/usecases/users/delete-user.usecase';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBasicAuth,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

@SkipThrottle()
@ApiTags('Users')
@Controller()
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private usersService: UsersService,
    private usersRepository: UsersRepository,
    private usersQueryRepository: UsersQueryRepository,
  ) {}

  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth()
  @Post('users')
  @ApiOperation({ summary: 'Create user (legacy route)' })
  @ApiResponse({ status: 201, description: 'User created', type: UserViewDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async create(@Body() dto: UserInputDto): Promise<UserViewDto | null> {
    // const userId = await this.usersService.createUser(dto);

    return null;
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by id (legacy route)' })
  @ApiParam({ name: 'id', type: String, description: 'User id' })
  @ApiResponse({ status: 200, description: 'User found', type: UserViewDto })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'User not found' } },
      example: { message: 'User not found' },
    },
  })
  async getById(@Param('id') id: string): Promise<UserViewDto | null> {
    // return this.usersQueryRepository.findByIdOrNotFoundFail(id);
    return null;
  }

  @Get('users')
  // @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Get users (legacy route)' })
  @ApiQuery({ name: 'searchLoginTerm', required: false, type: String })
  @ApiQuery({ name: 'searchEmailTerm', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortDirection', required: false, type: String })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiExtraModels(PaginatedViewDto, UserViewDto)
  @ApiResponse({
    status: 200,
    description: 'Users returned',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedViewDto) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(UserViewDto) },
            },
          },
        },
      ],
    },
  })
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]> | string> {
    // return await this.usersQueryRepository.getAll(query);

    return '';
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user (legacy route)' })
  @ApiParam({ name: 'id', type: String, description: 'User id' })
  @ApiResponse({ status: 200, description: 'User updated', type: UserViewDto })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'User not found' } },
      example: { message: 'User not found' },
    },
  })
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ): Promise<UserViewDto | null> {
    // const userId = await this.usersService.update(id, body);
    // return this.usersQueryRepository.findByIdOrNotFoundFail('userId');
    return null;
  }

  @Delete('users/:id')
  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (legacy route)' })
  @ApiParam({ name: 'id', type: String, description: 'User id' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async deleteUser(@Param('id') id: string): Promise<void> {
    // return this.usersService.deleteUser(id);
  }

  //
  @Post('sa/users')
  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth()
  @ApiOperation({ summary: 'Create user (SA)' })
  @ApiResponse({ status: 201, description: 'User created', type: UserViewDto })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        errorsMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Validation error' },
              field: { type: 'string', example: 'email' },
            },
          },
        },
      },
      example: {
        errorsMessages: [{ message: 'Validation error', field: 'email' }],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async createBySa(@Body() dto: UserInputDto): Promise<UserViewDto | null> {
    // const userId = await this.usersService.createUser(dto);

    const userId = await this.commandBus.execute(new CreateUserCommand(dto));
    return await this.usersQueryRepository.findUserByIdOrNotFindFail(userId);
  }

  @Get('sa/users')
  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users (SA)' })
  @ApiQuery({ name: 'searchLoginTerm', required: false, type: String })
  @ApiQuery({ name: 'searchEmailTerm', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortDirection', required: false, type: String })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiExtraModels(PaginatedViewDto, UserViewDto)
  @ApiResponse({
    status: 200,
    description: 'Users returned',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedViewDto) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(UserViewDto) },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async getAllBySa(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    // return await this.usersQueryRepository.getAll(query);
    return await this.usersQueryRepository.findAll(query);
  }

  @Delete('sa/users/:id')
  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by id (SA)' })
  @ApiParam({ name: 'id', type: String, description: 'User id' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'User not found' } },
      example: { message: 'User not found' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Unauthorized' } },
      example: { message: 'Unauthorized' },
    },
  })
  async deleteBySa(@Param('id') id: string): Promise<void> {
    // return this.usersService.deleteUser(id);
    await this.commandBus.execute(new DeleteUserCommand({ id }));
  }
}

