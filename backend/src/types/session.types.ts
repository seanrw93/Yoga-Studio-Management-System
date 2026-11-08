export interface SessionResponse {
  id: number;
  name: string;
  date: Date;
  description: string;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
  };
  users: number[];
  createdAt: Date;
  updatedAt: Date;
}
