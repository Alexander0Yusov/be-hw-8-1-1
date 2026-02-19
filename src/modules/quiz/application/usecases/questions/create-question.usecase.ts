import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionInputDto } from '../../../dto/question/question-input.dto';
import { QuestionsRepository } from '../../../infrastructure/questions.repository';
import { Question } from '../../../domain/question/question.entity';

export class CreateQuestionCommand {
  constructor(public dto: QuestionInputDto) {}
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase
  implements ICommandHandler<CreateQuestionCommand, string>
{
  constructor(private questionsRepository: QuestionsRepository) {}

  async execute({ dto }: CreateQuestionCommand): Promise<string> {
    const newQuestion = Question.createInstance(dto);

    const question = await this.questionsRepository.save(newQuestion);

    return String(question.id);
  }
}
