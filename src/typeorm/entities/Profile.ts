import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'user_profiles' })
export class Profile {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

    @Column()
    dob: Date;
}
