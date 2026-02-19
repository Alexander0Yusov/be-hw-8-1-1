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
import { ApiBasicAuth, ApiResponse } from '@nestjs/swagger';
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
export class SaQuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  @Post()
  @UseGuards(BasicAuthGuard)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateQuestion(
    @Param('id') id: string,
    @Body() body: QuestionInputDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateQuestionCommand(body, id));
  }

  @Put(':id/publish')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateQuestionStatus(
    @Param('id') id: string,
    @Body() body: QuestionUpdateStatusDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateQuestionStatusCommand(body, id));
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteQuestion(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteQuestionCommand(id));
  }

  @Get()
  @UseGuards(BasicAuthGuard)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllQuestions(
    @Query() query: GetQuestionsQueryParams,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    return await this.questionsQueryRepository.getAll(query);
  }
}
