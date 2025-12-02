// components/InfoModal.jsx
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../assets/icons';
import { theme } from '../constants/theme';
import ExpandableBar from './ExpandableBar';

// Optional blur (falls back to dim overlay if expo-blur isn’t installed)
let BlurView = View;
try {
  BlurView = require('expo-blur').BlurView;
} catch (_) {
  BlurView = ({ style, children }) => (
    <View style={[{ backgroundColor: 'rgba(0,0,0,0.35)' }, style]}>{children}</View>
  );
}

const Bullet = ({ children }) => (
  <Text style={styles.bullet}>• {children}</Text>
);

const LinkText = ({ href, children }) => (
  <Text
    accessibilityRole="link"
    onPress={() => { try { require('expo-linking').openURL(href); } catch {} }}
    style={styles.link}
  >
    {children}
  </Text>
);

const InfoModal = ({ visible, onClose }) => {
  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <BlurView intensity={40} tint="dark" style={styles.backdrop}>
        {/* Tap outside to close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Center Card (not full screen, proportionate) */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ width: 24 }} />
            <Text style={styles.title}>Information</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Icon name="x" size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {/* Pet License - concise pointers for Petaling Jaya */}
            <ExpandableBar title="Pet License (Malaysia)" defaultOpen={false}>
              <Bullet>Licences are handled by your local council (PBT). For PJ → <Text style={styles.bold}>MBPJ</Text>.</Bullet>
              <Bullet>Have ready: owner IC, address proof, <Text style={styles.bold}>rabies vaccination card</Text>, and pet photo.</Bullet>
              <Bullet>Typical fee: about <Text style={styles.bold}>RM10/year</Text> for one dog (cats usually not licensed).</Bullet>
              <Bullet>Apply/renew and collect tag at MBPJ; check latest rules online.</Bullet>
              <Bullet>
                Links: <LinkText href="https://www.mbpj.gov.my/en/services/licensing">MBPJ Licensing</LinkText>  |  <LinkText href="https://edog.dbkl.gov.my/">DBKL e-DOG</LinkText>
              </Bullet>
            </ExpandableBar>

            {/* Pet Passport - concise pointers (DVS) */}
            <ExpandableBar title="Pet Passport (Malaysia)" defaultOpen={false}>
              <Bullet>Managed by the <Text style={styles.bold}>Department of Veterinary Services (DVS)</Text>.</Bullet>
              <Bullet>Your pet should have an <Text style={styles.bold}>ISO microchip</Text> and current <Text style={styles.bold}>vaccinations</Text> (incl. rabies).</Bullet>
              <Bullet>Register/update via DVS offices or approved veterinary clinics.</Bullet>
              <Bullet>
                Portal: <LinkText href="https://animalpassport.dvs.gov.my/">DVS Animal Passport</LinkText>
              </Bullet>
              <Bullet>Flying overseas? Check destination rules and apply early for a DVS export permit.</Bullet>
            </ExpandableBar>

            {/* Emergency section - larger text, still compact */}
            <View style={styles.emergencyBox}>
              <Text style={styles.emergencyTitle}>🚨 Emergency (Petaling Jaya / Selangor)</Text>
              <Text style={styles.emergencyLine}>24/7 Veterinary Hospitals (near PJ):</Text>
              <Text style={styles.emergencyLine}>• Subang / PJ animal ERs (call ahead)</Text>
              <Text style={styles.emergencyLine}>• SPCA Helpline (Selangor): search “SPCA Selangor hotline”</Text>
              <Text style={styles.emergencyNote}>
                Tip: Keep your vet’s number, vaccination card, and microchip number handy.
              </Text>
            </View>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
};

export default InfoModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '92%',
    maxHeight: '78%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    // subtle shadow for separation
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fonts.bold,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 18,
  },
  bullet: {
    fontSize: 14.5,
    lineHeight: 21,
    color: theme.colors.text,
    marginLeft: 4,
    marginBottom: 6,
  },
  bold: {
    fontWeight: theme.fonts.bold,
  },
  link: {
    textDecorationLine: 'underline',
    color: theme.colors.primary ?? '#007AFF',
  },
  emergencyBox: {
    backgroundColor: theme.colors.roseLight,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  emergencyTitle: {
    fontSize: 16.5,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  emergencyLine: {
    fontSize: 16,
    marginTop: 6,
    color: theme.colors.text,
  },
  emergencyNote: {
    fontSize: 13.5,
    marginTop: 10,
    color: theme.colors.text,
    opacity: 0.85,
  },
});
