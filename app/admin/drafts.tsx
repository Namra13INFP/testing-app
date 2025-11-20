import { StyleSheet, Text, View } from 'react-native';
export default function Drafts() {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      color: '#fff',
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#111" }}>
      <Text style={styles.container}>This is Drafts Screen</Text>
    </View>
  );
}
