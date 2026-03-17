import { View, Text, Image, StyleSheet, Pressable } from 'react-native';

export default function FytroHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Fytro AI</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
    backgroundColor: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginRight: 10,
    marginLeft: -25,
    marginBottom: -20,
    marginTop: -20,
  },
  title: {
    color: 'black',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 0,
    fontFamily: 'Anton',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    backgroundColor: '#25232a',
    padding: 6,
    borderRadius: 10,
  },
  fireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  icon: {
    height: 16,
    width: 16,
    tintColor: '#fff',
    marginRight: 4,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
