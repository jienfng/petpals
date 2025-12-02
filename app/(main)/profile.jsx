// app/(main)/profile.jsx
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';
import { getUserImageSrc } from '../../services/imageService';
import { listPetsByOwner } from '../../services/petsService';

const TABS = ['Pets', 'My posts', 'Likes'];
const READABLE = {
  text: '#111827',
  gray: '#6B7280',
  line: '#E5E7EB',
  light: '#F3F4F6',
  primary: '#22C55E',
};

export default function Profile() {
  const router = useRouter();
  const { user, setAuthUser } = useAuth();

  const [activeTab, setActiveTab] = useState('Pets');
  const [pets, setPets] = useState([]);
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Drawer
  const [settingsOpen, setSettingsOpen] = useState(false);
  const slideX = useRef(new Animated.Value(wp(100))).current;
  const openSettings = () => {
    setSettingsOpen(true);
    Animated.timing(slideX, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };
  const closeSettings = () => {
    Animated.timing(slideX, { toValue: wp(100), duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => setSettingsOpen(false));
  };

  // Data
  const loadProfile = useCallback(async () => {
    if (!user?.id) return setProfile(null);
    const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (error) { console.log('profile error:', error.message); setProfile(null); }
    else setProfile(data || null);
  }, [user?.id]);

  const loadPets = useCallback(async () => {
   if (!user?.id) { setPets([]); return; }
  try {
    const { data, error } = await listPetsByOwner(user.id);
    if (error) throw error;
    setPets(data || []);
  } catch (e) {
     console.log('listPetsByOwner error:', e?.message || e);
     setPets([]);
   }
 }, [user?.id]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadPets()]);
    setRefreshing(false);
  }, [loadProfile, loadPets]);

  useEffect(() => { if (user?.id) refreshAll(); }, [user?.id, refreshAll]);
  useFocusEffect(useCallback(() => { if (user?.id) refreshAll(); }, [user?.id, refreshAll]));

  // Derived
  const displayName = profile?.name || user?.user_metadata?.full_name || user?.email || 'Your Name';
  const city = profile?.city?.trim() || '';
  const followers = profile?.followersCount ?? 0;
  const following = profile?.followingCount ?? 0;
  const bio = profile?.bio || 'Body text for whatever you’d like to say. Add main takeaway points, quotes, anecdotes, or even a very short story.';
  const stats = useMemo(() => [
    { label: 'Following', value: following },
    { label: 'Followers', value: followers },
  ], [following, followers]);

  // Actions
  const onLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    setAuthUser?.(null);
    closeSettings();
    router.replace('welcome');
  };
  const openPet = (pet) => router.push({ pathname: '(main)/pet/[id]', params: { id: pet.id || pet.pet_id } });
  const openCreatePet = () => router.push('(main)/pet/create');

  // Header (shared)
  const Header = (
    <View>
      {/* topbar */}
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Icon name="chevron-left" size={hp(3)} color={READABLE.text} />
        </Pressable>
        <Text style={styles.topTitle}>Profile</Text>
        <Pressable onPress={openSettings} hitSlop={10}>
          <Icon name="settings" size={hp(2.6)} color={READABLE.text} />
        </Pressable>
      </View>

      {/* banner + avatar */}
      <View style={styles.bannerWrap}>
        <Image source={{ uri: profile?.banner_url || 'https://picsum.photos/1200/400' }} style={styles.banner} />
        <View style={styles.avatarCenterRow}>
          <View style={styles.avatarStack}>
            <Avatar
              uri={getUserImageSrc(profile?.image || user?.user_metadata?.avatar_url).uri}
              size={hp(13)}
              rounded={theme.radius.full || 999}
              style={{ borderWidth: 2 }}
            />
          </View>
        </View>
      </View>

      {/* name + optional city + stats line + bio */}
      <View style={styles.meta}>
        <Text style={styles.displayName}>{displayName}</Text>
        {city ? <Text style={styles.city}>{city}</Text> : null}
        <Text style={styles.subMeta}>{following} following  •  {followers} followers</Text>
        {!!bio && <Text style={styles.bio} numberOfLines={4}>{bio}</Text>}
      </View>

      {/* centered Edit Profile */}
      <View style={styles.centerAction}>
        <Pressable style={styles.actionBtn} onPress={() => router.push('(main)/editProfile')}>
          <Icon name="user" size={hp(2)} color="white" />
          <Text style={styles.actionBtnText}>Edit Profile</Text>
        </Pressable>
      </View>

      {/* tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = t === activeTab;
          return (
            <Pressable key={t} onPress={() => setActiveTab(t)} style={styles.tabBtn}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t}</Text>
              {active ? <View style={styles.tabUnderline} /> : <View style={{ height: 2 }} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  // Pets grid (non-virtualized; consistent height everywhere)
  const PetsSection = (
    <View style={styles.gridWrap}>
      {/* Add pet card */}
      <Pressable style={[styles.card, styles.addCard]} onPress={openCreatePet}>
        <View style={styles.addInner}>
          <View style={styles.addCircle}><Icon name="plus" size={hp(2.2)} color="white" /></View>
          <Text style={styles.addText}>Add pet</Text>
        </View>
      </Pressable>

      {/* Pet cards */}
      {pets.map((item, idx) => (
        <Pressable key={item.id || item.pet_id || idx} style={styles.card} onPress={() => openPet(item)}>
          <Image
            source={{ uri: item.avatar_url || 'https://picsum.photos/400' }}
            style={styles.cardImage}
          />
          <View style={styles.cardLabel}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          </View>
        </Pressable>
      ))}

      {/* Empty hint (only when truly empty) */}
      {!pets.length && (
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderTitle}>No pets yet</Text>
          <Text style={styles.placeholderSub}>Add your first pet to get started.</Text>
        </View>
      )}
    </View>
  );

  const PostsSection = (
    <View style={{ paddingHorizontal: wp(4), paddingTop: 12, paddingBottom: hp(3) }}>
      {posts?.length ? null : (
        <View style={styles.placeholderBox}>
          <Icon name="image" size={hp(3)} color={READABLE.text} />
          <Text style={styles.placeholderTitle}>No posts yet</Text>
          <Text style={styles.placeholderSub}>Share something about your pets.</Text>
        </View>
      )}
    </View>
  );

  const LikesSection = (
    <View style={{ paddingHorizontal: wp(4), paddingTop: 12, paddingBottom: hp(3) }}>
      {likes?.length ? null : (
        <View style={styles.placeholderBox}>
          <Icon name="heart" size={hp(3)} color={READABLE.text} />
          <Text style={styles.placeholderTitle}>No likes yet</Text>
          <Text style={styles.placeholderSub}>Posts you like will appear here.</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScreenWrapper bg="white">
      {/* Single scroll container for every tab -> consistent ratios */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
        contentContainerStyle={{ paddingBottom: hp(4) }}
        showsVerticalScrollIndicator={false}
      >
        {Header}
        {activeTab === 'Pets' && PetsSection}
        {activeTab === 'My posts' && PostsSection}
        {activeTab === 'Likes' && LikesSection}
      </ScrollView>

      {/* SETTINGS DRAWER */}
      <Modal visible={settingsOpen} transparent animationType="none" onRequestClose={closeSettings}>
        <Pressable style={styles.backdrop} onPress={closeSettings} />
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideX }] }]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Settings</Text>
            <Pressable onPress={closeSettings} hitSlop={10}><Icon name="x" size={hp(2.4)} color={READABLE.text} /></Pressable>
          </View>

          <Pressable style={styles.drawerItem} onPress={() => { closeSettings(); router.push('(main)/editProfile'); }}>
            <Icon name="user" size={hp(2.2)} color={READABLE.text} />
            <Text style={styles.drawerItemText}>Edit Profile</Text>
          </Pressable>

          <View style={styles.drawerDivider} />

          <Pressable style={[styles.drawerItem, { marginTop: 4 }]} onPress={onLogout}>
            <Icon name="log-out" size={hp(2.2)} color="#EF4444" />
            <Text style={[styles.drawerItemText, { color: '#EF4444' }]}>Logout</Text>
          </Pressable>
        </Animated.View>
      </Modal>
    </ScreenWrapper>
  );
}

const CARD_W = (wp(100) - wp(4) * 2 - 10) / 2;

const styles = StyleSheet.create({
  // Layout
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: wp(4), paddingTop: hp(1), paddingBottom: hp(0.5),
  },
  topTitle: { fontSize: hp(2.6), color: READABLE.text, fontWeight: theme.fonts.bold },

  bannerWrap: { marginTop: hp(0.5) },
  banner: { width: '100%', height: hp(18), backgroundColor: READABLE.light },

  avatarCenterRow: { alignItems: 'center', justifyContent: 'center', marginTop: -hp(7) },
  avatarStack: { width: hp(13), height: hp(13), alignItems: 'center', justifyContent: 'center' },

  meta: { alignItems: 'center', marginTop: hp(1.5), paddingHorizontal: wp(6) },
  displayName: { fontSize: hp(2.7), fontWeight: theme.fonts.bold, color: READABLE.text, textAlign: 'center' },
  city: { marginTop: 2, color: READABLE.gray, fontSize: hp(1.9), textAlign: 'center' },
  subMeta: { marginTop: 6, color: READABLE.gray, fontSize: hp(1.9), textAlign: 'center' },
  bio: { marginTop: 8, color: READABLE.text, fontSize: hp(2.1), textAlign: 'center', lineHeight: hp(2.8) },

  centerAction: { alignItems: 'center', marginTop: hp(1.2), marginBottom: hp(0.5) },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: READABLE.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { color: 'white', fontSize: hp(1.95), fontWeight: theme.fonts.bold },

  tabs: { flexDirection: 'row', justifyContent: 'space-around', marginTop: hp(1.6), borderBottomWidth: 1, borderBottomColor: READABLE.line },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: hp(2.0), color: READABLE.text },
  tabTextActive: { fontWeight: theme.fonts.bold },
  tabUnderline: { height: 2, backgroundColor: READABLE.text, width: '40%', marginTop: 6, borderRadius: 2 },

  // Pets grid
  gridWrap: {
    paddingHorizontal: wp(4),
    paddingTop: 12,
    paddingBottom: hp(3),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: CARD_W,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: READABLE.light,
    borderWidth: 1,
    borderColor: READABLE.line,
  },
  cardImage: { width: '100%', height: CARD_W, backgroundColor: 'white' },
  cardLabel: { paddingHorizontal: 10, paddingVertical: 10, backgroundColor: 'white' },
  cardName: { fontSize: hp(2.0), color: READABLE.text, fontWeight: theme.fonts.bold },

  addCard: { borderStyle: 'dashed', borderColor: READABLE.gray, backgroundColor: 'transparent' },
  addInner: { height: CARD_W, alignItems: 'center', justifyContent: 'center', gap: 10 },
  addCircle: { width: hp(4.2), height: hp(4.2), borderRadius: hp(2.1), backgroundColor: READABLE.primary, alignItems: 'center', justifyContent: 'center' },
  addText: { color: READABLE.text, fontSize: hp(2.0), fontWeight: theme.fonts.bold },

  // Empty placeholders
  placeholderBox: { width: '100%', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: hp(2) },
  placeholderTitle: { fontSize: hp(2.1), fontWeight: theme.fonts.bold, color: READABLE.text },
  placeholderSub: { fontSize: hp(1.95), color: READABLE.gray },

  // Drawer
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  drawer: { position: 'absolute', right: 0, top: 0, bottom: 0, width: wp(82), backgroundColor: 'white', paddingTop: hp(1), paddingHorizontal: wp(4), borderLeftWidth: 1, borderLeftColor: READABLE.line },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: hp(1) },
  drawerTitle: { color: READABLE.text, fontWeight: theme.fonts.bold, fontSize: hp(2.2) },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  drawerItemText: { color: READABLE.text, fontSize: hp(1.95), fontWeight: theme.fonts.bold },
  drawerDivider: { height: 1, backgroundColor: READABLE.line, marginVertical: 4 },
});
