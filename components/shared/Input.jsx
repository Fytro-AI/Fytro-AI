import { Text, TextInput, View } from 'react-native';

export default function Input({
  placeholder,
  password = false,
  onChangeText,
  label = '',
  keyboardType = 'default',
  value,
  style,
}) {
  return (
    <View style={{ marginTop: 15 }}>
      {label ? (
        <Text style={{ fontWeight: '600', fontSize: 18 }}>{label}</Text>
      ) : null}

      <TextInput
        placeholder={placeholder}
        secureTextEntry={password}
        onChangeText={onChangeText}
        value={value}
        keyboardType={keyboardType}
        placeholderTextColor="#000"
        style={[
          {
            padding: 15,
            borderWidth: 1,
            borderRadius: 10,
            fontSize: 18,
            paddingVertical: 20,
            width: '100%',
            marginTop: 2,
          },
          style,
        ]}
      />
    </View>
  );
}
