import { User } from "~/types";

const storage = useStorage<User>('users');

export default eventHandler(async (event) => {
    const user = await readBody<User>(event);
    const id = crypto.randomUUID();
    storage.setItem(id, user);
    
    return { id, ...user };
});
  