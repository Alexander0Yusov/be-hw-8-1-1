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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
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
import { QuestionInputDto } from '../dto/question/question-input.dto';
import { CreateQuestionCommand } from '../application/usecases/questions/create-question.usecase';
import { QuestionViewDto } from '../dto/question/question-view.dto';
import { GetQuestionQuery } from '../application/usecases/questions/get-question.query-handler';
import { UpdateQuestionCommand } from '../application/usecases/questions/update-question.usecase';
import { QuestionUpdateStatusDto } from '../dto/question/question-update-status.dto';
import { UpdateQuestionStatusCommand } from '../application/usecases/questions/update-question-status.usecase';
import { DeleteQuestionCommand } from '../application/usecases/questions/delete-question.usecase';
import { QuestionsQueryRepository } from '../infrastructure/query/questions-query.repository';
import { GetQuestionsQueryParams } from '../dto/question/get-questions-query-params.input-dto';
import { BasicAuthGuard } from '../../user-accounts/guards/basic/basi-auth.guard';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';

@Controller('sa/quiz/questions')
@ApiBasicAuth()
@ApiTags('SA Quiz Questions')
export class SaQuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  @Post()
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Create quiz question (SA)' })
  @ApiResponse({ status: 201, description: 'Question created', type: QuestionViewDto })
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
  async createQuestion(
    @Body() body: QuestionInputDto,
  ): Promise<QuestionViewDto> {
    const questionId = await this.commandBus.execute(
      new CreateQuestionCommand(body),
    );

    return await this.queryBus.execute(new GetQuestionQuery(questionId));
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update quiz question (SA)' })
  @ApiParam({ name: 'id', type: String, description: 'Question id' })
  @ApiResponse({ status: 204, description: 'Question updated' })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Question not found' } },
      example: { message: 'Question not found' },
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
  async updateQuestion(
    @Param('id') id: string,
    @Body() body: QuestionInputDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateQuestionCommand(body, id));
  }

  @Put(':id/publish')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Publish/unpublish quiz question (SA)' })
  @ApiParam({ name: 'id', type: String, description: 'Question id' })
  @ApiResponse({ status: 204, description: 'Question status updated' })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Question not found' } },
      example: { message: 'Question not found' },
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
  async updateQuestionStatus(
    @Param('id') id: string,
    @Body() body: QuestionUpdateStatusDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateQuestionStatusCommand(body, id));
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete quiz question (SA)' })
  @ApiParam({ name: 'id', type: String, description: 'Question id' })
  @ApiResponse({ status: 204, description: 'Question deleted' })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Question not found' } },
      example: { message: 'Question not found' },
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
  async deleteQuestion(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteQuestionCommand(id));
  }

  @Get()
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Get all quiz questions (SA)' })
  @ApiQuery({ name: 'bodySearchTerm', required: false, type: String })
  @ApiQuery({ name: 'publishedStatus', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortDirection', required: false, type: String })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiExtraModels(PaginatedViewDto, QuestionViewDto)
  @ApiResponse({
    status: 200,
    description: 'Questions returned',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedViewDto) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(QuestionViewDto) },
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
  async getAllQuestions(
    @Query() query: GetQuestionsQueryParams,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    return await this.questionsQueryRepository.getAll(query);
  }
}

