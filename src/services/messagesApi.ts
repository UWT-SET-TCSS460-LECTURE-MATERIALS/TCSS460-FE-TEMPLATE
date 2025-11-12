import { messagesService } from 'utils/axios';

export const messagesApi = {
  getAllPaginated: (offset: number, limit: number) =>
    messagesService.get(`/protected/message/all/paginated?offset=${offset}&limit=${limit}`),

  create: (data: { name: string; message: string; priority: number }) => messagesService.post('/protected/message', data),

  delete: (name: string) => messagesService.delete(`/protected/message/${name}`)
};
