import DataLoader from 'dataloader';

export function createDataLoaders(prisma: any, logger: any) {
  const protocolById = new DataLoader(async (ids: string[]) => {
    logger.debug('DataLoader: Loading protocols', { count: ids.length });

    const protocols = await prisma.protocol.findMany({
      where: { id: { in: ids } },
      include: { metadata: true },
    });

    const protocolMap = new Map(protocols.map((p) => [p.id, p]));

    return ids.map((id) => protocolMap.get(id) || null);
  });

  const protocolHealth = new DataLoader(async (protocolIds: string[]) => {
    logger.debug('DataLoader: Loading protocol health', { count: protocolIds.length });

    const healthRecords = await prisma.protocolHealth.findMany({
      where: { protocolId: { in: protocolIds } },
    });

    const healthMap = new Map(healthRecords.map((h) => [h.protocolId, h]));

    return protocolIds.map((id) => healthMap.get(id) || null);
  });

  const protocolsByChainAndFeature = new DataLoader(
    async (keys: Array<{ chainId: string; feature: string }>) => {
      logger.debug('DataLoader: Loading protocols by chain and feature', { count: keys.length });

      const results = await Promise.all(
        keys.map((key) =>
          prisma.protocol.findMany({
            where: {
              chainId: key.chainId,
              type: key.feature,
              isActive: true,
            },
            include: { metadata: true },
          })
        )
      );

      return results;
    }
  );

  const userProtocolPreferences = new DataLoader(async (userIds: string[]) => {
    logger.debug('DataLoader: Loading user protocol preferences', { count: userIds.length });

    const preferences = await prisma.protocolPreference.findMany({
      where: { userId: { in: userIds } },
    });

    const preferencesMap = new Map<string, any[]>();
    preferences.forEach((pref) => {
      if (!preferencesMap.has(pref.userId)) {
        preferencesMap.set(pref.userId, []);
      }
      preferencesMap.get(pref.userId)!.push(pref);
    });

    return userIds.map((id) => preferencesMap.get(id) || []);
  });

  return {
    protocolById,
    protocolHealth,
    protocolsByChainAndFeature,
    userProtocolPreferences,
  };
}
