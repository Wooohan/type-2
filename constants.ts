
import { User, UserRole, FacebookPage, Conversation } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'admin-0',
    name: 'Main Admin',
    email: 'wooohan3@gmail.com',
    password: 'Admin@1122',
    role: UserRole.SUPER_ADMIN,
    avatar: 'https://picsum.photos/seed/admin-main/200',
    status: 'online',
    assignedPageIds: [],
  },
  {
    id: 'admin-1',
    name: 'Alex Johnson',
    email: 'admin@messengerflow.io',
    password: 'password123',
    role: UserRole.SUPER_ADMIN,
    avatar: 'https://picsum.photos/seed/admin/200',
    status: 'online',
    assignedPageIds: [],
  }
];

// Clean start: No mock pages or conversations
export const MOCK_PAGES: FacebookPage[] = [];
export const MOCK_CONVERSATIONS: Conversation[] = [];
