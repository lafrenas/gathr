import React from 'react';
import MapView, { Marker } from 'react-native-maps';

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
  const first = events[0];
  const region = first
    ? {
        latitude: first.exact_lat,
        longitude: first.exact_lng,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      }
    : {
        latitude: 54.6872,
        longitude: 25.2797,
        latitudeDelta: 2,
        longitudeDelta: 2,
      };

  return (
    <MapView style={style} initialRegion={region}>
      {events.map((e) => (
        <Marker
          key={`ev-${e.id}`}
          coordinate={{ latitude: e.exact_lat, longitude: e.exact_lng }}
          title={e.title}
          description={e.area}
          onPress={() => onSelect(e.id)}
        />
      ))}
    </MapView>
  );
}
