import { User } from 'src/modules/user-accounts/domain/user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Game } from '../game/game.entity';
import { Answer } from '../answer/answer.entity';
import { BaseDomainEntity } from 'src/core/base-domain-entity/base-domain-entity';

export enum VictoryStatus {
  Loss = 'Loss',
  Win = 'Win',
  Draw = 'Draw',
}

@Entity()
export class PlayerProgress extends BaseDomainEntity {
  // много прогрессов у одного юзера
  @ManyToOne(() => User, (user) => user.playerProgresses)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  // в одной игре один прогресс
  @OneToOne(() => Game)
  game: Game;

  // одна игра имеет много ответов
  @OneToMany(() => Answer, (a) => a.playerProgress, { cascade: true })
  answers: Answer[];

  @Column({
    type: 'enum',
    enum: VictoryStatus,
    nullable: true,
    default: null,
  })
  victoryStatus: VictoryStatus | null;

  @Column({ type: 'int', default: 0 })
  score: number;

  makeWin() {
    this.victoryStatus = VictoryStatus.Win;
  }

  makeLoss() {
    this.victoryStatus = VictoryStatus.Loss;
  }

  makeDraw() {
    this.victoryStatus = VictoryStatus.Draw;
  }

  incrementScore() {
    this.score += 1;
  }
}
