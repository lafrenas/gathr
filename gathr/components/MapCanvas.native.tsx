import React from 'react';
import MapView, { Marker } from 'react-native-maps';

type Coord = { latitude: number; longitude: number };
type Region = Coord & { latitudeDelta: number; longitudeDelta: number };

export function MapCanvas({
  style,
  region,
  onRegionChangeComplete,
  onPress,
  mapPin,
  onPinChange,
}: {
  style: any;
  region: Region;
  onRegionChangeComplete: (r: Region) => void;
  onPress: (e: any) => void;
  mapPin: Coord | null;
  onPinChange: (c: Coord) => void;
}) {
  return (
    <MapView style={style} region={region} onRegionChangeComplete={onRegionChangeComplete} onPress={onPress}>
      {mapPin ? <Marker coordinate={mapPin} draggable onDragEnd={(e: any) => onPinChange(e.nativeEvent.coordinate)} /> : null}
    </MapView>
  );
}
