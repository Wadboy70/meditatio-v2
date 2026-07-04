import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, radii, shadow } from '@/constants/tokens';

type FloatingTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

const TABS = [
  {
    routeName: 'index',
    label: 'Home',
    icon: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  {
    routeName: 'profile',
    label: 'Profile',
    icon: { ios: 'person.fill', android: 'person', web: 'person' },
  },
] as const;

export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute left-4 right-4 flex-row items-center justify-around bg-surface px-2 py-2"
      style={{
        bottom: insets.bottom + layout.floatingTabBarBottomMargin,
        borderRadius: radii.full,
        ...shadow.floatingNav,
      }}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = TABS.find((t) => t.routeName === route.name);

        if (!tab) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={descriptors[route.key]?.options.title ?? tab.label}
            onPress={onPress}
            onLongPress={onLongPress}
            className="min-w-[88px] flex-1 items-center justify-center rounded-full py-2"
            style={isFocused ? { backgroundColor: colors.accentMuted } : undefined}>
            <SymbolView
              name={tab.icon}
              tintColor={isFocused ? colors.accent : colors.textSecondary}
              size={22}
            />
            <Text
              className="mt-1 text-xs font-semibold"
              style={{ color: isFocused ? colors.accent : colors.textSecondary }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
