import React from 'react';
import { Text, View } from 'react-native';

export function MapCanvas(props: any) {
  return (
    <View style={[props.style, { alignItems: 'center', justifyContent: 'center', padding: 16 }]}> 
      <Text style={{ color: '#9ca3af' }}>Map picker is limited on web preview.</Text>
      <Text style={{ color: '#9ca3af' }}>Search above and tap a suggestion, then use "Use this location".</Text>
    </View>
  );
}
