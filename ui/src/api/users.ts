// import { MeResponse, toMe, toNewUser, UseResponse } from '@lib/user';
// import type { Client } from './types';

// type CreateUserPayload = { kindeId: string; email: string };

// export async function createUser(client: Client, payload: CreateUserPayload) {
//   return client
//     .post<UseResponse>('/v1/user', payload)
//     .then((res) => toNewUser(res.data));
// }

// export async function getMe(client: Client) {
//   return client.get<MeResponse>('/v1/auth/me').then((res) => toMe(res.data));
// }
