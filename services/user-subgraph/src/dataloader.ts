import DataLoader from 'dataloader';
import { Logger } from 'pino';

export function createDataLoaders(prisma: any, logger: Logger) {
  const userByIdLoader = new DataLoader(async (userIds: string[]) => {
    logger.debug('DataLoader: fetching users by id', { count: userIds.length });
    
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        preferences: {
          include: {
            autoSigning: true,
          },
        },
        protocolPreferences: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    return userIds.map(id => userMap.get(id) || null);
  });

  const userByEmailLoader = new DataLoader(async (emails: string[]) => {
    logger.debug('DataLoader: fetching users by email', { count: emails.length });
    
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      include: {
        preferences: {
          include: {
            autoSigning: true,
          },
        },
        protocolPreferences: true,
      },
    });

    const userMap = new Map(users.map(u => [u.email, u]));
    return emails.map(email => userMap.get(email) || null);
  });

  const userPreferencesLoader = new DataLoader(async (userIds: string[]) => {
    logger.debug('DataLoader: fetching user preferences', { count: userIds.length });
    
    const prefs = await prisma.userPreferences.findMany({
      where: { userId: { in: userIds } },
      include: {
        autoSigning: true,
      },
    });

    const prefsMap = new Map(prefs.map(p => [p.userId, p]));
    return userIds.map(id => prefsMap.get(id) || null);
  });

  return {
    userById: userByIdLoader,
    userByEmail: userByEmailLoader,
    userPreferences: userPreferencesLoader,
  };
}
