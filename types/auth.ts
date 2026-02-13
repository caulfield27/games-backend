
interface LoginPayload{
    username: string;
    password: string;
}

interface RegisterPayload extends LoginPayload{
    email: string;
}

interface User{
    id: number;
    username: string;
    email: string;
    password: string;
    created_at: string;
    updated_at: string;
    avatar: string | null;
}

export {LoginPayload, RegisterPayload, User};