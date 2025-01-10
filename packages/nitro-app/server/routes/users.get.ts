import { User } from "~/types";

const storage = useStorage<User>('users');

export default eventHandler(async (event) => {
    const keys = await storage.getKeys()
    const users = await Promise.all(keys.map(async (id) => {
        const user = await storage.getItem(id);
        return { id, ...user };
    }));

    return users;
});
  