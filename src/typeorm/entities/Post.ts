import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "./User.js";

@Entity({ name: 'user_posts' })
export class Post {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column()
    title: string

    @Column()
    content: string

    @ManyToOne(() => User, (user) => user.posts)
    user: Relation<User>;
}