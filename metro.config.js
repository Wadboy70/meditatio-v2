const fs = require('fs');
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('sqlite');

/**
 * Bible DBs are gitignored and imported per-machine. Missing `assets/bible/*.sqlite`
 * files resolve to an empty module so Metro can still bundle (provider skips them).
 */
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const bare = moduleName.startsWith('@/') ? moduleName.slice(2) : moduleName;
  if (bare.startsWith('assets/bible/') && bare.endsWith('.sqlite')) {
    const filePath = path.join(__dirname, bare);
    if (!fs.existsSync(filePath)) {
      return { type: 'empty' };
    }
  }

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
