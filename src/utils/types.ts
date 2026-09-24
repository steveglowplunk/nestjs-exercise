export type CreateUserData = {
    username: string;
    password: string;
}

export type UpdateUserData = {
    username?: string;
    password?: string;
}

export type CreateUserProfileData = {
    firstName: string;
    lastName: string;
    age: number;
    dob: Date;
}

export type CreateUserPostData = {
    title: string;
    content: string;
}