// components/ExpandableBar.jsx
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '../assets/icons';
import { theme } from '../constants/theme';

const ExpandableBar = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(0);

  // 0 = closed, 1 = open
  const progress = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  // animate when "open" changes
  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [open]);

  // rotate chevron
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // animate to the *measured* content height
  const height = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.bar} onPress={() => setOpen(v => !v)}>
        <Text style={styles.title}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Icon name="chevron-down" size={18} color={theme.colors.text} />
        </Animated.View>
      </Pressable>

      {/* We measure once; then animate height to that exact size */}
      <Animated.View style={{ height, opacity, overflow: 'hidden' }}>
        <View
          style={styles.content}
          onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

export default ExpandableBar;

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    backgroundColor: theme.colors.light,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: theme.fonts.bold,
  },
  content: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
});
