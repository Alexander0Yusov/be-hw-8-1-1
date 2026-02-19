import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Post } from '../post/post.entity';
import { BlogInputDto } from '../../dto/blog/blog-input.dto';
import { BaseDomainEntity } from '../../../../core/base-domain-entity/base-domain-entity';
import { User } from '../../../user-accounts/domain/user/user.entity';

@Entity()
export class Blog extends BaseDomainEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  websiteUrl: string;

  @Column({ type: 'boolean', default: false })
  isMembership: boolean;

  @ManyToOne(() => User, (u) => u.blogs, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ nullable: true })
  userId?: number | null;

  @OneToMany(() => Post, (p) => p.blog, {
    cascade: true,
  })
  posts: Post[];

  static createInstance(dto: BlogInputDto, userId?: number): Blog {
    const blog = new this();

    blog.userId = userId || null;
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;

    return blog;
  }

  update(dto: BlogInputDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }

  bindingWithUser(userId: number) {
    this.userId = userId;
  }
}
