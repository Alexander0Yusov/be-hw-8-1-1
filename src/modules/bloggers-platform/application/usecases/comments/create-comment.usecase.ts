import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentInputDto } from '../../../dto/comment/comment-input.dto';
import { CommentsRepository } from '../../../infrastructure/comments.repository';
import { PostsQueryRepository } from '../../../infrastructure/query/posts-query.repository';
import { Comment } from '../../../domain/comment/comment.entity';

export class CreateCommentCommand {
  constructor(
    public dto: CommentInputDto,
    public postId: string,
    public userId: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand, string>
{
  constructor(
    private commentsRepository: CommentsRepository,
    private postsQueryRepository: PostsQueryRepository,
  ) {}

  async execute({
    dto,
    postId,
    userId,
  }: CreateCommentCommand): Promise<string> {
    await this.postsQueryRepository.findByIdOrNotFoundFail(postId);
    // const user = await this.usersQueryRepository.findByIdOrNotFoundFail(userId);

    const newComment = Comment.createInstance({
      content: dto.content,
      userId: Number(userId),
      postId: Number(postId),
    });

    const comment = await this.commentsRepository.save(newComment);

    return comment.id.toString();
  }
}
