import Colors from '../../shared/Colors'
import React from 'react'
import { Text, TouchableOpacity } from 'react-native'

export default function Button({title, onPress }) {
  return (
    <TouchableOpacity
    onPress={onPress}
    style={{
        padding: 15,
        backgroundColor: Colors.PRIMARY,
        width: '80%',
        alignSelf: 'center',
        borderRadius: 40,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
    }}>
      <Text style={{
        fontSize: 20,
        color: Colors.WHITE,
        textAlign: 'center',
        fontWeight: "800"
      }}>{title} </Text>
    </TouchableOpacity>
  )
}