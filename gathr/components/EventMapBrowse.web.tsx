import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

type EventPin = {
  id: number;
  title: string;
  area: string;
  exact_lat: number;
  exact_lng: number;
};

export function EventMapBrowse({
  style,
  events,
  onSelect,
}: {
  style: any;
  events: EventPin[];
  onSelect: (eventId: number) => void;
}) {
  return (
    <View style={[style, { padding: 12 }]}> 
      <Text style={{ color: '#9ca3af', marginBottom: 8 }}>Map browse on web shows location list preview.</Text>
      <ScrollView>
        {events.map((e) => (
          <TouchableOpacity
            key={`ev-web-${e.id}`}
            style={{ backgroundColor: '#1f2937', borderRadius: 10, padding: 10, marginBottom: 8 }}
            onPress={() => onSelect(e.id)}
          >
            <Text style={{ color: '#f9fafb', fontWeight: '700' }}>{e.title}</Text>
            <Text style={{ color: '#cbd5e1' }}>{e.area}</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>{e.exact_lat.toFixed(4)}, {e.exact_lng.toFixed(4)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
