import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./Post.js";
import { Profile } from "./Profile.js";

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    authStrategy: string;

    @OneToOne(() => Profile)
    @JoinColumn()
    profile: Profile;

    @OneToMany(() => Post, (post) => post.user)
    posts: Post[];
}
