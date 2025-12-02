import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import InfoModal from '../../components/InfoModal';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';

const Home = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          <Text style={styles.title}>PetsPal</Text>

          <View style={styles.icons}>
            <Pressable onPress={() => router.push('(main)/notifications')}>
              <Icon name="heart" size={hp(3.2)} color={theme.colors.text} />
            </Pressable>

            {/* Info icon opens modal */}
            <Pressable onPress={() => setInfoVisible(true)}>
              <Icon name="info" size={hp(3.2)} color={theme.colors.text} />
            </Pressable>

            <Pressable onPress={() => router.push('(main)/profile')}>
              <Avatar
                uri={user?.image}
                size={hp(4.3)}
                rounded={theme.radius.sm}
                style={{ borderWidth: 2 }}
              />
            </Pressable>
          </View>
        </View>

        {/* content */}
        <Text style={styles.noPosts}>Welcome to the Home Screen!</Text>
      </View>

      {/* Information Modal */}
      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: wp(4),
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold,
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    justifyContent: 'center',
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.text,
  },
});
