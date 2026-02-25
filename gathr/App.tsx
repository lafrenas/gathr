import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import { supabase } from './lib/supabase';

type EventRow = {
  id: number;
  created_at: string;
  title: string;
  category: string;
  description?: string | null;
  required_people?: number | null;
  area: string;
  exact_location: string;
  exact_lat?: number | null;
  exact_lng?: number | null;
  exact_time: string;
  host_name: string;
};

type JoinRequestRow = {
  id: number;
  event_id: number;
  requester_name: string;
  status: 'pending' | 'approved' | 'rejected';
  invite_source?: 'host' | 'self' | 'member';
  invited_by_name?: string | null;
  invite_response?: 'pending' | 'accepted' | 'declined';
};

type EventRatingRow = {
  id: number;
  event_id: number;
  rater_name: string;
  rated_name: string;
  skill: number;
  friendliness: number;
  reliability: number;
  communication: number;
  boundary_respect: number;
  skill_context: string;
  comment?: string;
};

type UserBlockRow = {
  id: number;
  blocker_name: string;
  blocked_name: string;
};

type UserReportRow = {
  id: number;
  reporter_name: string;
  reported_name: string;
  reason: string;
};

type UserProfileRow = {
  id: number;
  display_name: string;
  about_me?: string | null;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState('Ignas');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [requests, setRequests] = useState<JoinRequestRow[]>([]);
  const [ratings, setRatings] = useState<EventRatingRow[]>([]);
  const [blocks, setBlocks] = useState<UserBlockRow[]>([]);
  const [reports, setReports] = useState<UserReportRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfileRow[]>([]);
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Harassment');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredPeople, setRequiredPeople] = useState('');
  const [category, setCategory] = useState('Sports');
  const [activityType, setActivityType] = useState('');
  const [showActivitySuggestions, setShowActivitySuggestions] = useState(false);
  const [aboutMe, setAboutMe] = useState('');
  const [userArea, setUserArea] = useState('');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [area, setArea] = useState('');
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [remotePostcodeSuggestions, setRemotePostcodeSuggestions] = useState<string[]>([]);
  const [remotePlaceSuggestions, setRemotePlaceSuggestions] = useState<string[]>([]);
  const [googleAreaSuggestions, setGoogleAreaSuggestions] = useState<string[]>([]);
  const [exactLocation, setExactLocation] = useState('');
  const [showExactLocationSuggestions, setShowExactLocationSuggestions] = useState(false);
  const [remoteExactPostcodeSuggestions, setRemoteExactPostcodeSuggestions] = useState<string[]>([]);
  const [remoteExactPlaceSuggestions, setRemoteExactPlaceSuggestions] = useState<string[]>([]);
  const [googleExactSuggestions, setGoogleExactSuggestions] = useState<string[]>([]);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [mapTargetField, setMapTargetField] = useState<'area' | 'exact'>('area');
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchSuggestions, setMapSearchSuggestions] = useState<string[]>([]);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 54.6872,
    longitude: 25.2797,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  });
  const [mapPin, setMapPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pickedExactCoords, setPickedExactCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [exactTime, setExactTime] = useState('');
  const [eventDateTime, setEventDateTime] = useState<Date | null>(null);
  const [dateDraft, setDateDraft] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'All' | 'Sports' | 'Social' | 'Online'>('All');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'tomorrow' | 'week'>('all');
  const [inviteEventId, setInviteEventId] = useState<number | null>(null);
  const [inviteName, setInviteName] = useState('');
  const [ratingEventId, setRatingEventId] = useState<number | null>(null);
  const [ratingTargetName, setRatingTargetName] = useState('');
  const [skillRating, setSkillRating] = useState('5');
  const [friendlinessRating, setFriendlinessRating] = useState('5');
  const [reliabilityRating, setReliabilityRating] = useState('5');
  const [ratingComment, setRatingComment] = useState('');
  const [communicationRating, setCommunicationRating] = useState('5');
  const [boundaryRating, setBoundaryRating] = useState('5');
  const [skillContext, setSkillContext] = useState('General');

  const activityOptions: Record<string, string[]> = {
    Sports: ['Basketball', 'Football', 'Tennis', 'Running', 'Gym'],
    Social: ['Coffee', 'Dinner', 'Walk', 'Board Games', 'Networking'],
    Online: ['CS2', 'League of Legends', 'Valorant', 'Dota 2', 'Fortnite'],
  };

  const activitySuggestions = useMemo(() => {
    const q = activityType.trim().toLowerCase();
    const pool = activityOptions[category] ?? [];
    if (!q) return pool.slice(0, 8);
    return pool.filter((a) => a.toLowerCase().includes(q)).slice(0, 8);
  }, [activityType, category]);

  const loadData = async () => {
    setBusy(true);
    setError(null);

    const [{ data: eventsData, error: eventsError }, { data: reqData, error: reqError }, { data: ratingData, error: ratingError }, { data: blockData, error: blockError }, { data: reportData, error: reportError }] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('join_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('event_ratings').select('*').order('created_at', { ascending: false }),
      supabase.from('user_blocks').select('*').order('id', { ascending: false }),
      supabase.from('user_reports').select('*').order('id', { ascending: false }),
    ]);

    if (eventsError) {
      setBusy(false);
      return setError(eventsError.message);
    }
    if (reqError) {
      setBusy(false);
      return setError(reqError.message);
    }
    if (ratingError) {
      setBusy(false);
      return setError(ratingError.message);
    }
    if (blockError) {
      setBusy(false);
      return setError(blockError.message);
    }
    if (reportError) {
      setBusy(false);
      return setError(reportError.message);
    }

    setEvents((eventsData ?? []) as EventRow[]);
    setRequests((reqData ?? []) as JoinRequestRow[]);
    setRatings((ratingData ?? []) as EventRatingRow[]);
    setBlocks((blockData ?? []) as UserBlockRow[]);
    setReports((reportData ?? []) as UserReportRow[]);

    const { data: profileData, error: profileError } = await supabase.from('user_profiles').select('*').order('id', { ascending: false });
    if (!profileError) {
      setProfiles((profileData ?? []) as UserProfileRow[]);
    }

    setBusy(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const me = currentUser.trim().toLowerCase();
    const p = profiles.find((x) => x.display_name.toLowerCase() === me);
    setAboutMe(p?.about_me ?? '');
  }, [currentUser, profiles]);

  useEffect(() => {
    const q = userArea.trim();
    if (q.length < 2) {
      setUserCoords(null);
      return;
    }

    const timer = setTimeout(async () => {
      const point = await geocodeAddress(q);
      setUserCoords(point ?? null);
    }, 250);

    return () => clearTimeout(timer);
  }, [userArea]);

  useEffect(() => {
    const q = area.trim();
    if (q.length < 2) {
      setRemotePostcodeSuggestions([]);
      setRemotePlaceSuggestions([]);
      setGoogleAreaSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const [postcodeRes, placesRes, cityRes, googleList] = await Promise.all([
          fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(q)}/autocomplete`),
          fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(q)}`, {
            headers: { 'Accept-Language': 'en,lt' },
          }),
          fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`),
          fetchGoogleAutocomplete(q),
        ]);

        const postcodeJson = await postcodeRes.json();
        const postcodeList = Array.isArray(postcodeJson?.result) ? postcodeJson.result : [];
        setRemotePostcodeSuggestions(postcodeList.slice(0, 8));

        const placesJson = await placesRes.json();
        const nominatimList = Array.isArray(placesJson)
          ? placesJson.map((p: { display_name?: string; name?: string }) => (p.display_name ?? p.name ?? '').trim()).filter(Boolean)
          : [];

        const cityJson = await cityRes.json();
        const openMeteoList = Array.isArray(cityJson?.results)
          ? cityJson.results
              .map((r: { name?: string; admin1?: string; country?: string }) => [r.name, r.admin1, r.country].filter(Boolean).join(', '))
              .filter(Boolean)
          : [];

        setRemotePlaceSuggestions(Array.from(new Set([...nominatimList, ...openMeteoList])).slice(0, 8));
        setGoogleAreaSuggestions(Array.isArray(googleList) ? (googleList as string[]) : []);
      } catch {
        setRemotePostcodeSuggestions([]);
        setRemotePlaceSuggestions([]);
        setGoogleAreaSuggestions([]);
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [area]);

  useEffect(() => {
    const q = exactLocation.trim();
    if (q.length < 2) {
      setRemoteExactPostcodeSuggestions([]);
      setRemoteExactPlaceSuggestions([]);
      setGoogleExactSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const [postcodeRes, placesRes, cityRes, googleList] = await Promise.all([
          fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(q)}/autocomplete`),
          fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(q)}`, {
            headers: { 'Accept-Language': 'en,lt' },
          }),
          fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`),
          fetchGoogleAutocomplete(q),
        ]);

        const postcodeJson = await postcodeRes.json();
        const postcodeList = Array.isArray(postcodeJson?.result) ? postcodeJson.result : [];
        setRemoteExactPostcodeSuggestions(postcodeList.slice(0, 8));

        const placesJson = await placesRes.json();
        const nominatimList = Array.isArray(placesJson)
          ? placesJson.map((p: { display_name?: string; name?: string }) => (p.display_name ?? p.name ?? '').trim()).filter(Boolean)
          : [];

        const cityJson = await cityRes.json();
        const openMeteoList = Array.isArray(cityJson?.results)
          ? cityJson.results
              .map((r: { name?: string; admin1?: string; country?: string }) => [r.name, r.admin1, r.country].filter(Boolean).join(', '))
              .filter(Boolean)
          : [];

        setRemoteExactPlaceSuggestions(Array.from(new Set([...nominatimList, ...openMeteoList])).slice(0, 8));
        setGoogleExactSuggestions(Array.isArray(googleList) ? (googleList as string[]) : []);
      } catch {
        setRemoteExactPostcodeSuggestions([]);
        setRemoteExactPlaceSuggestions([]);
        setGoogleExactSuggestions([]);
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [exactLocation]);

  useEffect(() => {
    if (!mapPickerVisible) return;
    const q = mapSearchQuery.trim();
    if (q.length < 2) {
      setMapSearchSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const googleList = await fetchGoogleAutocomplete(q);
      if (googleList.length > 0) {
        setMapSearchSuggestions(googleList);
        return;
      }

      try {
        const [nominatimRes, openMeteoRes] = await Promise.all([
          fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(q)}`),
          fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`),
        ]);

        const nominatimJson = await nominatimRes.json();
        const nominatimList = Array.isArray(nominatimJson)
          ? nominatimJson.map((p: { display_name?: string; name?: string }) => (p.display_name ?? p.name ?? '').trim()).filter(Boolean)
          : [];

        const meteoJson = await openMeteoRes.json();
        const meteoList = Array.isArray(meteoJson?.results)
          ? meteoJson.results
              .map((r: { name?: string; admin1?: string; country?: string }) => [r.name, r.admin1, r.country].filter(Boolean).join(', '))
              .filter(Boolean)
          : [];

        const merged = Array.from(new Set([...nominatimList, ...meteoList])).slice(0, 8);
        setMapSearchSuggestions(merged);
      } catch {
        setMapSearchSuggestions([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [mapSearchQuery, mapPickerVisible]);

  const hasEventEnded = (exactTime: string) => {
    const ts = Date.parse(exactTime);
    if (!Number.isFinite(ts)) return false;
    return Date.now() >= ts;
  };

  const exactTimeDisplay = eventDateTime ? eventDateTime.toLocaleString() : '';

  const onDatePicked = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate) return;
    setDateDraft(selectedDate);
    setShowTimePicker(true);
  };

  const onTimePicked = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (!selectedTime) return;

    const merged = new Date(dateDraft);
    merged.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

    setEventDateTime(merged);
    setExactTime(merged.toISOString());
  };

  const pendingForMyHostedEvents = useMemo(() => {
    const hostedEventIds = new Set(
      events.filter((e) => e.host_name.toLowerCase() === currentUser.trim().toLowerCase()).map((e) => e.id)
    );
    return requests.filter(
      (r) =>
        r.status === 'pending' &&
        hostedEventIds.has(r.event_id) &&
        (r.invite_source === 'self' || r.invite_response === 'accepted')
    );
  }, [events, requests, currentUser]);

  const blockedByMe = useMemo(() => {
    const me = currentUser.trim().toLowerCase();
    return new Set(blocks.filter((b) => b.blocker_name.toLowerCase() === me).map((b) => b.blocked_name.toLowerCase()));
  }, [blocks, currentUser]);

  const blockedList = useMemo(() => {
    const me = currentUser.trim().toLowerCase();
    return blocks.filter((b) => b.blocker_name.toLowerCase() === me);
  }, [blocks, currentUser]);

  const visibleEvents = useMemo(() => {
    return events.filter((e) => !blockedByMe.has(e.host_name.toLowerCase()));
  }, [events, blockedByMe]);

  const matchesTimeFilter = (eventTime: string, mode: 'all' | 'today' | 'tomorrow' | 'week') => {
    if (mode === 'all') return true;
    const ts = Date.parse(eventTime);
    if (!Number.isFinite(ts)) return false;

    const d = new Date(ts);
    const now = new Date();

    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startTomorrow = new Date(startToday);
    startTomorrow.setDate(startTomorrow.getDate() + 1);
    const startDayAfterTomorrow = new Date(startTomorrow);
    startDayAfterTomorrow.setDate(startDayAfterTomorrow.getDate() + 1);
    const endOfWeek = new Date(startToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    if (mode === 'today') return d >= startToday && d < startTomorrow;
    if (mode === 'tomorrow') return d >= startTomorrow && d < startDayAfterTomorrow;
    if (mode === 'week') return d >= startToday && d < endOfWeek;
    return true;
  };

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const categoryFiltered = visibleEvents.filter((e) => {
      const [eventCategory = ''] = e.category.split(':');
      return filterCategory === 'All' || eventCategory.trim().toLowerCase() === filterCategory.toLowerCase();
    });

    const activityPool = categoryFiltered
      .map((e) => (e.category.split(':')[1] ?? '').trim())
      .filter((x) => x.length >= 2);

    const allCatalogActivities = filterCategory === 'All'
      ? Array.from(new Set(Object.values(activityOptions).flat()))
      : (activityOptions[filterCategory] ?? []);

    const candidates: string[] = [];
    for (const e of categoryFiltered) {
      const [cat = '', act = ''] = e.category.split(':').map((x) => x.trim());
      candidates.push(act, e.title, e.area, e.host_name, cat, e.description ?? '');
    }

    const cleaned = candidates
      .map((x) => x.trim())
      .filter((x) => x.length >= 2);

    const unique = Array.from(new Set([...allCatalogActivities, ...activityPool, ...cleaned]));
    const matched = q ? unique.filter((x) => x.toLowerCase().includes(q)) : unique;

    const rank = (s: string) => {
      const v = s.toLowerCase();
      if (!q) return 2;
      if (v.startsWith(q)) return 0;
      if (v.includes(q)) return 1;
      return 2;
    };

    return matched.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)).slice(0, 8);
  }, [visibleEvents, searchQuery, filterCategory]);

  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const fetchGoogleAutocomplete = async (input: string): Promise<string[]> => {
    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || input.trim().length < 2) return [] as string[];

    try {
      const autoRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'suggestions.placePrediction.text.text,suggestions.queryPrediction.text.text',
        },
        body: JSON.stringify({
          input,
          languageCode: 'en',
        }),
      });

      const autoJson = await autoRes.json();
      const autoSuggestions = Array.isArray(autoJson?.suggestions) ? autoJson.suggestions : [];

      const autoList: string[] = autoSuggestions
        .map((s: { placePrediction?: { text?: { text?: string } }; queryPrediction?: { text?: { text?: string } } }) =>
          (s.placePrediction?.text?.text ?? s.queryPrediction?.text?.text ?? '').trim()
        )
        .filter(Boolean);

      if (autoList.length > 0) return Array.from(new Set(autoList)).slice(0, 8);

      const textRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress',
        },
        body: JSON.stringify({
          textQuery: input,
          languageCode: 'en',
          regionCode: 'LT',
        }),
      });

      const textJson = await textRes.json();
      const textPlaces = Array.isArray(textJson?.places) ? textJson.places : [];
      const textList: string[] = textPlaces
        .map((p: { displayName?: { text?: string }; formattedAddress?: string }) =>
          (p.formattedAddress ?? p.displayName?.text ?? '').trim()
        )
        .filter(Boolean);

      return Array.from(new Set(textList)).slice(0, 8);
    } catch {
      return [] as string[];
    }
  };

  const geocodeAddress = async (address: string) => {
    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return null;

    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`);
      const json = await res.json();
      const loc = json?.results?.[0]?.geometry?.location;
      if (!loc) return null;
      return { latitude: Number(loc.lat), longitude: Number(loc.lng) };
    } catch {
      return null;
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return '';

    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`);
      const json = await res.json();
      return (json?.results?.[0]?.formatted_address ?? '').trim();
    } catch {
      return '';
    }
  };

  const openMapPicker = (target: 'area' | 'exact') => {
    setMapTargetField(target);
    const seed = target === 'area' ? area : exactLocation;
    setMapSearchQuery(seed);
    setMapSearchSuggestions([]);
    setMapPickerVisible(true);
  };

  useEffect(() => {
    if (!mapPickerVisible) return;
    const seed = (mapTargetField === 'area' ? area : exactLocation).trim();
    if (!seed) return;

    (async () => {
      const point = await geocodeAddress(seed);
      if (!point) return;
      setMapPin(point);
      setMapRegion({
        latitude: point.latitude,
        longitude: point.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, [mapPickerVisible, mapTargetField]);

  const toBroadArea = (address: string) => {
    const raw = address.trim();
    if (!raw) return raw;

    const first = raw.split(',')[0]?.trim() || raw;
    const withoutNumber = first.replace(/\b\d+[A-Za-z\-/]*\b/g, '').replace(/\s{2,}/g, ' ').trim();
    const label = withoutNumber || first;
    return `${label} area`;
  };

  const zoneLabelFromCoords = (latitude: number, longitude: number) => {
    const latStep = 0.02; // ~2.2km
    const lngStep = 0.03; // ~2km around LT latitudes
    const latBucket = Math.floor((latitude + 90) / latStep);
    const lngBucket = Math.floor((longitude + 180) / lngStep);

    return `Area ${latBucket.toString(36).toUpperCase()}${lngBucket.toString(36).toUpperCase()} (~2km)`;
  };

  const broadAreaFromCoords = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
      const json = await res.json();
      const a = json?.address ?? {};
      const district = (a.borough || a.city_district || a.suburb || a.neighbourhood || a.quarter || '').trim();
      const city = (a.city || a.town || a.municipality || a.county || '').trim();
      if (district) return `${district} (approx)`;
      if (city) return `${city} (approx)`;
      return '';
    } catch {
      return '';
    }
  };

  const distanceKm = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  };

  const applyPickedLocation = (value: string) => {
    if (!value.trim()) return;
    if (mapTargetField === 'area') {
      setArea(toBroadArea(value));
      setShowAreaSuggestions(false);
    } else {
      setExactLocation(value);
      if (mapPin) setPickedExactCoords(mapPin);
      setShowExactLocationSuggestions(false);
    }
    setMapPickerVisible(false);
  };

  const publicAreaForEvent = (e: EventRow) => {
    const saved = (e.area ?? '').trim();
    if (!saved) return toBroadArea(e.exact_location || saved);
    return saved;
  };

  const roughCoordsForEvent = (e: EventRow) => {
    if (typeof e.exact_lat !== 'number' || typeof e.exact_lng !== 'number') return undefined;

    const km = 2.0;
    const angle = ((e.id % 360) * Math.PI) / 180;
    const latOffset = (km / 111) * Math.cos(angle);
    const lngOffset = (km / (111 * Math.cos((e.exact_lat * Math.PI) / 180))) * Math.sin(angle);

    return {
      latitude: e.exact_lat + latOffset,
      longitude: e.exact_lng + lngOffset,
    };
  };

  const areaSuggestions = useMemo(() => {
    const q = area.trim().toLowerCase();

    const postcodeRegex = /\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/gi;
    const source = events.flatMap((e) => [e.area ?? '', e.exact_location ?? '']);

    const postcodes = source.flatMap((s) => {
      const matches = s.match(postcodeRegex) ?? [];
      return matches.map((m) => m.toUpperCase().replace(/\s+/, ' ').trim());
    });

    const places = source
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);

    const balticSeed = [
      'Vilnius, Lithuania', 'Kaunas, Lithuania', 'Klaipėda, Lithuania', 'Šiauliai, Lithuania', 'Panevėžys, Lithuania',
      'Palanga, Lithuania', 'Kretinga, Lithuania',
      'Riga, Latvia', 'Jūrmala, Latvia', 'Liepāja, Latvia',
      'Tallinn, Estonia', 'Tartu, Estonia',
    ];

    const fallback = q
      ? [
          area.trim(),
          `${area.trim()}, Lithuania`,
          `${area.trim()}, Latvia`,
          `${area.trim()}, Estonia`,
        ]
      : [];

    const unique = Array.from(
      new Set([...googleAreaSuggestions, ...remotePostcodeSuggestions, ...remotePlaceSuggestions, ...postcodes, ...places, ...balticSeed, ...fallback])
    );
    const nq = normalize(q);
    const matched = q
      ? unique.filter((x) => {
          const nx = normalize(x);
          return nx.includes(nq) || nx.startsWith(nq);
        })
      : unique;

    const rank = (x: string) => {
      const nx = normalize(x);
      if (!q) return 2;
      if (nx === nq) return 0;
      if (nx.startsWith(nq)) return 1;
      if (nx.includes(nq)) return 2;
      return 3;
    };

    return matched.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)).slice(0, 8);
  }, [events, area, remotePostcodeSuggestions, remotePlaceSuggestions, googleAreaSuggestions]);

  const levenshtein = (a: string, b: string) => {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const temp = dp[j];
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
        prev = temp;
      }
    }
    return dp[n];
  };

  const fuzzyMatch = (query: string, text: string) => {
    const q = query.trim().toLowerCase();
    const t = text.toLowerCase();
    if (!q) return true;
    if (t.includes(q)) return true;

    const qWords = q.split(/\s+/).filter(Boolean);
    const words = t.split(/[^a-z0-9]+/).filter(Boolean);

    return qWords.every((qw) =>
      words.some((w) => w.startsWith(qw) || levenshtein(qw, w) <= (qw.length >= 6 ? 2 : 1))
    );
  };

  const exactLocationSuggestions = useMemo(() => {
    const q = exactLocation.trim().toLowerCase();

    const postcodeRegex = /\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/gi;
    const source = events.flatMap((e) => [e.exact_location ?? '', e.area ?? '']);

    const postcodes = source.flatMap((s) => {
      const matches = s.match(postcodeRegex) ?? [];
      return matches.map((m) => m.toUpperCase().replace(/\s+/, ' ').trim());
    });

    const places = source.map((s) => s.trim()).filter((s) => s.length >= 2);

    const streetSeed = [
      'Landsbergio-Žemkalnio g., Kaunas, Lithuania',
      'Savanorių pr., Kaunas, Lithuania',
      'Gedimino pr., Vilnius, Lithuania',
      'Laisvės al., Kaunas, Lithuania',
      'Maironio g., Kaunas, Lithuania',
      'Kęstučio g., Kaunas, Lithuania',
      'J. Basanavičiaus g., Vilnius, Lithuania',
      'Riga, Latvia',
      'Palanga, Lithuania',
    ];

    const fallback = q
      ? [
          exactLocation.trim(),
          `${exactLocation.trim()}, Kaunas, Lithuania`,
          `${exactLocation.trim()}, Vilnius, Lithuania`,
          `${exactLocation.trim()}, Lithuania`,
        ]
      : [];

    const unique = Array.from(
      new Set([...googleExactSuggestions, ...remoteExactPostcodeSuggestions, ...remoteExactPlaceSuggestions, ...postcodes, ...places, ...streetSeed, ...fallback])
    );
    const nq = normalize(q);
    const matched = q
      ? unique.filter((x) => {
          const nx = normalize(x);
          return nx.includes(nq) || nx.startsWith(nq);
        })
      : unique;

    const rank = (x: string) => {
      const nx = normalize(x);
      if (!q) return 2;
      if (nx === nq) return 0;
      if (nx.startsWith(nq)) return 1;
      if (nx.includes(nq)) return 2;
      return 3;
    };

    return matched.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)).slice(0, 8);
  }, [events, exactLocation, remoteExactPostcodeSuggestions, remoteExactPlaceSuggestions, googleExactSuggestions]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return visibleEvents.filter((e) => {
      const [eventCategory = '', eventActivity = ''] = e.category.split(':');
      const catOk = filterCategory === 'All' || eventCategory.trim().toLowerCase() === filterCategory.toLowerCase();
      const timeOk = matchesTimeFilter(e.exact_time, timeFilter);
      if (!catOk || !timeOk) return false;
      if (!q) return true;

      const haystack = `${e.title} ${e.description ?? ''} ${eventCategory} ${eventActivity} ${e.category} ${e.area} ${e.host_name}`.toLowerCase();
      return fuzzyMatch(q, haystack);
    });
  }, [visibleEvents, searchQuery, filterCategory, timeFilter]);

  const hostRatingStats = useMemo(() => {
    const byHost: Record<string, { trust: number; skill: number; count: number; friendliness: number; reliability: number; communication: number; boundary: number }> = {};

    const grouped: Record<string, EventRatingRow[]> = {};
    for (const r of ratings) {
      const key = r.rated_name.toLowerCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }

    for (const [hostKey, hostRatings] of Object.entries(grouped)) {
      const count = hostRatings.length;
      const skill = hostRatings.reduce((s, r) => s + r.skill, 0) / count;
      const friendliness = hostRatings.reduce((s, r) => s + r.friendliness, 0) / count;
      const reliability = hostRatings.reduce((s, r) => s + r.reliability, 0) / count;
      const communication = hostRatings.reduce((s, r) => s + (r.communication ?? 5), 0) / count;
      const boundary = hostRatings.reduce((s, r) => s + (r.boundary_respect ?? 5), 0) / count;
      const trust = friendliness * 0.35 + reliability * 0.35 + communication * 0.2 + boundary * 0.1;
      byHost[hostKey] = {
        trust,
        skill,
        count,
        friendliness,
        reliability,
        communication,
        boundary,
      };
    }

    return byHost;
  }, [ratings]);

  const createEvent = async () => {
    if (!title.trim() || !exactLocation.trim() || !exactTime.trim()) return;

    const required = Number(requiredPeople);
    if (!Number.isInteger(required) || required < 1 || required > 200) {
      return setError('Required people must be a whole number between 1 and 200.');
    }

    const resolvedCoords = pickedExactCoords ?? (await geocodeAddress(exactLocation.trim()));
    const generatedArea = toBroadArea(exactLocation.trim());

    setError(null);
    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      description: description.trim() || null,
      category: `${category.trim()}:${activityType.trim() || 'General'}`,
      required_people: required,
      area: generatedArea,
      exact_location: exactLocation.trim(),
      exact_lat: resolvedCoords?.latitude ?? null,
      exact_lng: resolvedCoords?.longitude ?? null,
      exact_time: exactTime.trim(),
      host_name: currentUser.trim() || 'Anonymous',
    });

    if (error) return setError(error.message);

    setTitle('');
    setDescription('');
    setRequiredPeople('');
    setCategory('Sports');
    setActivityType('');
    setArea('');
    setExactLocation('');
    setShowAreaSuggestions(false);
    setShowExactLocationSuggestions(false);
    setPickedExactCoords(null);
    setGoogleAreaSuggestions([]);
    setGoogleExactSuggestions([]);
    setExactTime('');
    setEventDateTime(null);
    await loadData();
  };

  const requestJoin = async (eventId: number) => {
    const name = currentUser.trim();
    if (!name) return setError('Set your name first.');

    setError(null);

    const existing = requests.find(
      (r) => r.event_id === eventId && r.requester_name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      if (existing.status !== 'pending') {
        const { error } = await supabase.from('join_requests').update({ status: 'pending' }).eq('id', existing.id);
        if (error) return setError(error.message);
      }
      await loadData();
      return;
    }

    const { error } = await supabase.from('join_requests').insert({
      event_id: eventId,
      requester_name: name,
      status: 'pending',
      invite_source: 'self',
      invite_response: 'accepted',
    });

    if (error) return setError(error.message);
    await loadData();
  };

  const inviteUserToEvent = async () => {
    const inviter = currentUser.trim();
    const target = inviteName.trim();
    const eventId = inviteEventId;
    if (!inviter || !target || !eventId) return;
    if (inviter.toLowerCase() === target.toLowerCase()) return setError('You cannot invite yourself.');

    const ev = events.find((e) => e.id === eventId);
    if (!ev) return setError('Event not found.');

    const isHostInviter = ev.host_name.toLowerCase() === inviter.toLowerCase();
    const isApprovedAttendee = requests.some(
      (r) => r.event_id === eventId && r.requester_name.toLowerCase() === inviter.toLowerCase() && r.status === 'approved'
    );

    if (!isHostInviter && !isApprovedAttendee) {
      return setError('Only host or approved attendee can invite.');
    }

    const required = Number(ev.required_people ?? 0);
    const approvedCount = 1 + requests.filter((r) => r.event_id === eventId && r.status === 'approved').length;
    if (required > 0 && approvedCount >= required) return setError('Event is full.');

    setError(null);

    const source: 'host' | 'member' = isHostInviter ? 'host' : 'member';
    const existing = requests.find(
      (r) => r.event_id === eventId && r.requester_name.toLowerCase() === target.toLowerCase()
    );

    if (existing) {
      const { error } = await supabase
        .from('join_requests')
        .update({ status: 'pending', invite_source: source, invited_by_name: inviter, invite_response: 'pending' })
        .eq('id', existing.id);
      if (error) return setError(error.message);
    } else {
      const { error } = await supabase.from('join_requests').insert({
        event_id: eventId,
        requester_name: target,
        status: 'pending',
        invite_source: source,
        invited_by_name: inviter,
        invite_response: 'pending',
      });
      if (error) return setError(error.message);
    }

    setInviteName('');
    setInviteEventId(null);
    await loadData();
  };

  const respondToInvite = async (requestId: number, accept: boolean) => {
    const payload = accept
      ? { invite_response: 'accepted' as const, status: 'pending' as const }
      : { invite_response: 'declined' as const, status: 'rejected' as const };

    const { error } = await supabase.from('join_requests').update(payload).eq('id', requestId);
    if (error) return setError(error.message);
    await loadData();
  };

  const setRequestStatus = async (requestId: number, status: 'approved' | 'rejected') => {
    setError(null);

    if (status === 'approved') {
      const req = requests.find((r) => r.id === requestId);
      if (req) {
        if (req.invite_source !== 'self' && req.invite_response !== 'accepted') {
          return setError('Invitee must accept invitation before host approval.');
        }
        const event = events.find((e) => e.id === req.event_id);
        const required = Number(event?.required_people ?? 0);
        if (required > 0) {
          const approvedCount = 1 + requests.filter((r) => r.event_id === req.event_id && r.status === 'approved').length;
          if (approvedCount >= required) {
            return setError('Event is full. Increase required people or reject pending requests.');
          }
        }
      }
    }

    const { error } = await supabase.from('join_requests').update({ status }).eq('id', requestId);
    if (error) return setError(error.message);
    await loadData();
  };

  const openRatingForm = (eventId: number, ratedName: string) => {
    setRatingEventId(eventId);
    setRatingTargetName(ratedName);
    const ev = events.find((e) => e.id === eventId);
    setSkillRating('5');
    setFriendlinessRating('5');
    setReliabilityRating('5');
    setCommunicationRating('5');
    setBoundaryRating('5');
    const parsedActivity = ev?.category?.includes(':') ? ev.category.split(':')[1].trim() : ev?.category?.trim();
    setSkillContext(parsedActivity || 'General');
    setRatingComment('');
  };

  const submitRating = async () => {
    const rater = currentUser.trim();
    if (!rater || !ratingEventId || !ratingTargetName) return;
    setError(null);

    const ratingEvent = events.find((e) => e.id === ratingEventId);
    if (!ratingEvent) return setError('Event not found for rating.');
    if (!hasEventEnded(ratingEvent.exact_time)) {
      return setError('Ratings unlock only after the event time has passed.');
    }

    const skill = Number(skillRating);
    const friendliness = Number(friendlinessRating);
    const reliability = Number(reliabilityRating);
    const communication = Number(communicationRating);
    const boundary_respect = Number(boundaryRating);

    if (
      !Number.isInteger(skill) || skill < 1 || skill > 5 ||
      !Number.isInteger(friendliness) || friendliness < 1 || friendliness > 5 ||
      !Number.isInteger(reliability) || reliability < 1 || reliability > 5 ||
      !Number.isInteger(communication) || communication < 1 || communication > 5 ||
      !Number.isInteger(boundary_respect) || boundary_respect < 1 || boundary_respect > 5
    ) {
      return setError('Ratings must be numbers 1 to 5.');
    }

    const { error } = await supabase.from('event_ratings').upsert(
      {
        event_id: ratingEventId,
        rater_name: rater,
        rated_name: ratingTargetName,
        skill,
        friendliness,
        reliability,
        communication,
        boundary_respect,
        skill_context: skillContext.trim() || 'General',
        comment: ratingComment.trim() || null,
      },
      { onConflict: 'event_id,rater_name,rated_name' }
    );

    if (error) return setError(error.message);

    setRatingEventId(null);
    setRatingTargetName('');
    setRatingComment('');
    await loadData();
  };

  const saveProfile = async () => {
    const me = currentUser.trim();
    if (!me) return setError('Set your name first.');
    setError(null);
    const { error } = await supabase.from('user_profiles').upsert(
      {
        display_name: me,
        about_me: aboutMe.trim() || null,
      },
      { onConflict: 'display_name' }
    );
    if (error) return setError(error.message);
    await loadData();
  };

  const reportHost = async (hostName: string, reason: string) => {
    const me = currentUser.trim();
    if (!me || me.toLowerCase() === hostName.toLowerCase()) return;
    setError(null);
    const { error } = await supabase.from('user_reports').insert({
      reporter_name: me,
      reported_name: hostName,
      reason: reason.trim() || 'General safety concern',
    });
    if (error) return setError(error.message);
    await loadData();
  };

  const blockHost = async (hostName: string) => {
    const me = currentUser.trim();
    if (!me || me.toLowerCase() === hostName.toLowerCase()) return;
    setError(null);
    const { error } = await supabase.from('user_blocks').upsert(
      { blocker_name: me, blocked_name: hostName },
      { onConflict: 'blocker_name,blocked_name' }
    );
    if (error) return setError(error.message);
    await loadData();
  };

  const unblockHost = async (hostName: string) => {
    const me = currentUser.trim();
    if (!me) return;
    setError(null);
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_name', me)
      .eq('blocked_name', hostName);
    if (error) return setError(error.message);
    await loadData();
  };

  const clearTestData = async () => {
    setError(null);
    setBusy(true);

    const r0 = await supabase.from('user_reports').delete().neq('id', -1);
    if (r0.error) {
      setBusy(false);
      return setError(r0.error.message);
    }

    const rb = await supabase.from('user_blocks').delete().neq('id', -1);
    if (rb.error) {
      setBusy(false);
      return setError(rb.error.message);
    }

    const r1 = await supabase.from('event_ratings').delete().neq('id', -1);
    if (r1.error) {
      setBusy(false);
      return setError(r1.error.message);
    }

    const r2 = await supabase.from('join_requests').delete().neq('id', -1);
    if (r2.error) {
      setBusy(false);
      return setError(r2.error.message);
    }

    const r3 = await supabase.from('events').delete().neq('id', -1);
    if (r3.error) {
      setBusy(false);
      return setError(r3.error.message);
    }

    await loadData();
    setBusy(false);
  };

  const sanitizeMapQuery = (query: string) => {
    const q = query.trim();
    if (!q) return q;
    return q.replace(/^~\s*\d+\s*km\s*area\s*around\s*/i, '').trim();
  };

  const openMap = async (query: string, coords?: { latitude: number; longitude: number }) => {
    const q = sanitizeMapQuery(query);
    if (!q && !coords) return setError('Location is empty.');

    const googleWeb = coords
      ? `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    const appleWeb = coords
      ? `https://maps.apple.com/?ll=${coords.latitude},${coords.longitude}`
      : `https://maps.apple.com/?q=${encodeURIComponent(q)}`;

    try {
      const canGoogle = await Linking.canOpenURL(googleWeb);
      if (canGoogle) return await Linking.openURL(googleWeb);

      const canApple = await Linking.canOpenURL(appleWeb);
      if (canApple) return await Linking.openURL(appleWeb);

      setError('Could not open maps on this device.');
    } catch {
      setError('Could not open maps on this device.');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>gathr</Text>
      <Text style={styles.subtitle}>Create events. Request to join. Host approves before exact details unlock.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>You are</Text>
        <TextInput
          style={styles.input}
          value={currentUser}
          onChangeText={setCurrentUser}
          placeholder="Your display name"
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={aboutMe}
          onChangeText={setAboutMe}
          placeholder="About me"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <TextInput
          style={styles.input}
          value={userArea}
          onChangeText={setUserArea}
          placeholder="Your area (for distance estimate)"
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity style={styles.mapBtn} onPress={saveProfile}>
          <Text style={styles.mapBtnText}>Save profile</Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.error}>Backend: {error}</Text>}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Debug</Text>
        <Text style={styles.meta}>Status: {busy ? 'Loading…' : 'Ready'}</Text>
        <Text style={styles.meta}>Events: {events.length} • Requests: {requests.length} • Ratings: {ratings.length} • Reports: {reports.length}</Text>
        <View style={styles.rowGap}>
          <TouchableOpacity style={[styles.mapBtn, { flex: 1 }]} onPress={loadData}>
            <Text style={styles.mapBtnText}>Refresh data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rejectBtn, { flex: 1 }]} onPress={clearTestData}>
            <Text style={styles.approveBtnText}>Clear test data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedHost && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Host profile: {selectedHost}</Text>
          {(() => {
            const stat = hostRatingStats[selectedHost.toLowerCase()];
            const hostProfile = profiles.find((p) => p.display_name.toLowerCase() === selectedHost.toLowerCase());
            const reviews = ratings.filter((r) => r.rated_name.toLowerCase() === selectedHost.toLowerCase() && !!r.comment?.trim()).slice(0, 3);
            return (
              <>
                {!!hostProfile?.about_me?.trim() && <Text style={styles.meta}>About: {hostProfile.about_me}</Text>}
                {stat ? (
                  <>
                    <Text style={styles.meta}>Trust ⭐ {stat.trust.toFixed(1)} ({stat.count})</Text>
                    <Text style={styles.meta}>Skill ⭐ {stat.skill.toFixed(1)}</Text>
                  </>
                ) : (
                  <Text style={styles.meta}>No ratings yet.</Text>
                )}
                {reviews.map((r) => (
                  <Text key={r.id} style={styles.reviewSnippet}>• {r.comment}</Text>
                ))}
              </>
            );
          })()}
          <TouchableOpacity style={styles.mapBtn} onPress={() => setSelectedHost(null)}>
            <Text style={styles.mapBtnText}>Close profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {inviteEventId && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invite person</Text>
          <TextInput
            style={styles.input}
            placeholder="Type username to invite"
            placeholderTextColor="#9ca3af"
            value={inviteName}
            onChangeText={setInviteName}
          />
          <View style={styles.rowGap}>
            <TouchableOpacity style={[styles.approveBtn, { flex: 1 }]} onPress={inviteUserToEvent}>
              <Text style={styles.approveBtnText}>Send invite</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rejectBtn, { flex: 1 }]} onPress={() => { setInviteEventId(null); setInviteName(''); }}>
              <Text style={styles.approveBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {reportTarget && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Report host: {reportTarget}</Text>
          <Text style={styles.ratingHelp}>Choose reason</Text>
          <View style={styles.rowGapWrap}>
            {['Harassment', 'No-show', 'Unsafe behavior', 'Spam', 'Other'].map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.chipBtn, reportReason === reason && styles.chipBtnActive]}
                onPress={() => setReportReason(reason)}
              >
                <Text style={styles.chipBtnText}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.rowGap}>
            <TouchableOpacity
              style={[styles.rejectBtn, { flex: 1 }]}
              onPress={async () => {
                await reportHost(reportTarget, reportReason);
                setReportTarget(null);
              }}
            >
              <Text style={styles.approveBtnText}>Submit report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mapBtn, { flex: 1 }]} onPress={() => setReportTarget(null)}>
              <Text style={styles.mapBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {blockedList.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Blocked hosts</Text>
          {blockedList.map((b) => (
            <View key={b.id} style={styles.rowGap}>
              <Text style={[styles.meta, { flex: 1 }]}>{b.blocked_name}</Text>
              <TouchableOpacity style={styles.mapBtn} onPress={() => unblockHost(b.blocked_name)}>
                <Text style={styles.mapBtnText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {ratingEventId && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rate {ratingTargetName}</Text>
          <Text style={styles.ratingGuide}>1 = poor • 3 = okay • 5 = excellent</Text>
          <View style={styles.rowGap}>
            <TouchableOpacity style={[styles.approveBtn, { flex: 1 }]} onPress={submitRating}>
              <Text style={styles.approveBtnText}>Submit rating</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rejectBtn, { flex: 1 }]} onPress={() => setRatingEventId(null)}>
              <Text style={styles.approveBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.ratingLabel}>Skill</Text>
          <Text style={styles.ratingHelp}>How capable were they at the activity?</Text>
          <TextInput style={styles.input} placeholder="1-5" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={skillRating} onChangeText={setSkillRating} />
          <TextInput style={styles.input} placeholder="Skill context (e.g., Basketball)" placeholderTextColor="#9ca3af" value={skillContext} onChangeText={setSkillContext} />

          <Text style={styles.ratingLabel}>Friendliness</Text>
          <Text style={styles.ratingHelp}>Were they respectful, kind, and good to be around?</Text>
          <TextInput style={styles.input} placeholder="1-5" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={friendlinessRating} onChangeText={setFriendlinessRating} />

          <Text style={styles.ratingLabel}>Reliability</Text>
          <Text style={styles.ratingHelp}>Did they show up on time and follow through?</Text>
          <TextInput style={styles.input} placeholder="1-5" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={reliabilityRating} onChangeText={setReliabilityRating} />

          <Text style={styles.ratingLabel}>Communication</Text>
          <Text style={styles.ratingHelp}>Were they clear and responsive before/during event?</Text>
          <TextInput style={styles.input} placeholder="1-5" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={communicationRating} onChangeText={setCommunicationRating} />

          <Text style={styles.ratingLabel}>Boundary respect</Text>
          <Text style={styles.ratingHelp}>Did they respect boundaries and personal comfort?</Text>
          <TextInput style={styles.input} placeholder="1-5" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={boundaryRating} onChangeText={setBoundaryRating} />

          <Text style={styles.ratingLabel}>Comment (optional)</Text>
          <TextInput style={styles.input} placeholder="Short feedback" placeholderTextColor="#9ca3af" value={ratingComment} onChangeText={setRatingComment} />
          <View style={styles.rowGap}>
            <TouchableOpacity style={[styles.approveBtn, { flex: 1 }]} onPress={submitRating}>
              <Text style={styles.approveBtnText}>Submit rating</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rejectBtn, { flex: 1 }]} onPress={() => setRatingEventId(null)}>
              <Text style={styles.approveBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create event</Text>
        <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <Text style={styles.ratingLabel}>Required people</Text>
        <Text style={styles.ratingHelp}>How many people are needed for this activity?</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter number (e.g. 4)"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          value={requiredPeople}
          onChangeText={setRequiredPeople}
        />

        <Text style={styles.ratingLabel}>Category</Text>
        <View style={styles.rowGapWrap}>
          {Object.keys(activityOptions).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chipBtn, category === cat && styles.chipBtnActive]}
              onPress={() => {
                setCategory(cat);
                setActivityType('');
                setShowActivitySuggestions(false);
              }}
            >
              <Text style={styles.chipBtnText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingLabel}>Activity</Text>
        <TextInput
          style={styles.input}
          placeholder="Type activity (e.g., Basketball)"
          placeholderTextColor="#9ca3af"
          value={activityType}
          onFocus={() => setShowActivitySuggestions(true)}
          onChangeText={(t) => {
            setActivityType(t);
            setShowActivitySuggestions(true);
          }}
        />
        {showActivitySuggestions && activitySuggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            {activitySuggestions.map((act) => (
              <TouchableOpacity
                key={act}
                style={styles.suggestionItem}
                onPress={() => {
                  setActivityType(act);
                  setShowActivitySuggestions(false);
                }}
              >
                <Text style={styles.suggestionText}>{act}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.meta}>Public area is auto-generated as approximate district/area (privacy-safe).</Text>
        <TouchableOpacity style={styles.mapBtn} onPress={() => openMapPicker('exact')}>
          <Text style={styles.mapBtnText}>{exactLocation.trim() ? 'Change location on map' : 'Pick location on map'}</Text>
        </TouchableOpacity>
        {!!exactLocation.trim() && <Text style={styles.meta}>Selected location: {exactLocation}</Text>}

        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => {
            const base = eventDateTime ?? new Date();
            setDateDraft(base);
            setShowDatePicker(true);
          }}
        >
          <Text style={styles.mapBtnText}>{eventDateTime ? 'Change date & time' : 'Select date & time'}</Text>
        </TouchableOpacity>
        {!!exactTimeDisplay && <Text style={styles.meta}>Selected: {exactTimeDisplay}</Text>}

        {showDatePicker && (
          <DateTimePicker value={dateDraft} mode="date" display="default" onChange={onDatePicked} />
        )}
        {showTimePicker && (
          <DateTimePicker value={dateDraft} mode="time" display="default" onChange={onTimePicked} />
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={createEvent}>
          <Text style={styles.primaryBtnText}>Create Event</Text>
        </TouchableOpacity>
      </View>

      {pendingForMyHostedEvents.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pending approvals</Text>
          {pendingForMyHostedEvents.map((r) => {
            const event = events.find((e) => e.id === r.event_id);
            const required = Number(event?.required_people ?? 0);
            const approvedCount = 1 + requests.filter((x) => x.event_id === r.event_id && x.status === 'approved').length;
            const isFull = required > 0 && approvedCount >= required;
            return (
              <View key={r.id} style={styles.pendingItem}>
                <Text style={styles.eventTitle}>{event?.title ?? 'Event'} • {r.requester_name}</Text>
                <Text style={styles.meta}>Source: {r.invite_source === 'host' ? 'Host invite' : r.invite_source === 'member' ? `Member invite (${r.invited_by_name || 'member'})` : 'User request'}</Text>
                <Text style={styles.meta}>Capacity: {approvedCount}/{required > 0 ? required : '?'}</Text>
                <View style={styles.rowGap}>
                  {!isFull ? (
                    <TouchableOpacity style={styles.approveBtn} onPress={() => setRequestStatus(r.id, 'approved')}>
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.approveBtn, { opacity: 0.4 }]}>
                      <Text style={styles.approveBtnText}>Full</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => setRequestStatus(r.id, 'rejected')}>
                    <Text style={styles.approveBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Event feed</Text>

        <TextInput
          style={styles.input}
          placeholder="Search by title, activity, area, host..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onFocus={() => setShowSearchSuggestions(true)}
          onChangeText={(t) => {
            setSearchQuery(t);
            setShowSearchSuggestions(true);
          }}
        />
        {showSearchSuggestions && searchSuggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            {searchSuggestions.map((s) => (
              <TouchableOpacity
                key={`search-${s}`}
                style={styles.suggestionItem}
                onPress={() => {
                  setSearchQuery(s);
                  setShowSearchSuggestions(false);
                }}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.ratingLabel}>Category filter</Text>
        <View style={styles.rowGapWrap}>
          {(['All', 'Sports', 'Social', 'Online'] as const).map((c) => (
            <TouchableOpacity key={c} style={[styles.chipBtn, filterCategory === c && styles.chipBtnActive]} onPress={() => setFilterCategory(c)}>
              <Text style={styles.chipBtnText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingLabel}>Time filter</Text>
        <View style={styles.rowGapWrap}>
          {([
            { key: 'all', label: 'All' },
            { key: 'today', label: 'Today' },
            { key: 'tomorrow', label: 'Tomorrow' },
            { key: 'week', label: 'This week' },
          ] as const).map((t) => (
            <TouchableOpacity key={t.key} style={[styles.chipBtn, timeFilter === t.key && styles.chipBtnActive]} onPress={() => setTimeFilter(t.key)}>
              <Text style={styles.chipBtnText}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.meta}>Showing {filteredEvents.length} event(s)</Text>
        <TouchableOpacity style={styles.mapBtn} onPress={() => setShowAllEvents((v) => !v)}>
          <Text style={styles.mapBtnText}>{showAllEvents ? 'Show latest 8 only' : 'Show all events'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {(showAllEvents ? filteredEvents : filteredEvents.slice(0, 8)).map((item) => {
          const isHost = item.host_name.toLowerCase() === currentUser.trim().toLowerCase();
          const myReq = requests.find(
            (r) => r.event_id === item.id && r.requester_name.toLowerCase() === currentUser.trim().toLowerCase()
          );
          const approvedCount = 1 + requests.filter((r) => r.event_id === item.id && r.status === 'approved').length;
          const required = Number(item.required_people ?? 0);
          const isFull = required > 0 && approvedCount >= required;
          const approved = isHost || myReq?.status === 'approved';

          return (
            <View key={item.id} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              {!!item.description?.trim() && <Text style={styles.meta}>{item.description}</Text>}
              <Text style={styles.meta}>{item.category.replace(':', ' • ')} • Host: {item.host_name}</Text>
              <Text style={styles.meta}>Capacity: {approvedCount}/{required > 0 ? required : '?'}</Text>
              {isFull && <Text style={styles.pendingText}>Event is full</Text>}
              {(() => {
                const stat = hostRatingStats[item.host_name.toLowerCase()];
                if (!stat) return <Text style={styles.meta}>Trust: New • Skill: New</Text>;
                const recent = ratings.find((r) => r.rated_name.toLowerCase() === item.host_name.toLowerCase() && !!r.comment?.trim());
                return (
                  <>
                    <Text style={styles.meta}>Trust: ⭐ {stat.trust.toFixed(1)} ({stat.count})</Text>
                    <Text style={styles.meta}>Skill: ⭐ {stat.skill.toFixed(1)} • F {stat.friendliness.toFixed(1)} • R {stat.reliability.toFixed(1)} • C {stat.communication.toFixed(1)} • B {stat.boundary.toFixed(1)}</Text>
                    {stat.reliability < 3.2 && <Text style={styles.warnBadge}>⚠ Low reliability</Text>}
                    {stat.boundary < 3.2 && <Text style={styles.warnBadge}>⚠ Boundary concerns</Text>}
                    {recent?.comment ? <Text style={styles.reviewSnippet}>“{recent.comment}”</Text> : null}
                  </>
                );
              })()}
              <Text style={styles.meta}>Area: {publicAreaForEvent(item)}</Text>
              {(() => {
                if (!userCoords || typeof item.exact_lat !== 'number' || typeof item.exact_lng !== 'number') return null;
                const rough = roughCoordsForEvent(item) ?? { latitude: item.exact_lat, longitude: item.exact_lng };
                const km = distanceKm(userCoords, rough);
                return <Text style={styles.meta}>Approx distance: ~{km.toFixed(1)} km</Text>;
              })()}

              {approved ? (
                <TouchableOpacity
                  style={styles.mapBtn}
                  onPress={() =>
                    openMap(
                      item.exact_location,
                      typeof item.exact_lat === 'number' && typeof item.exact_lng === 'number'
                        ? { latitude: item.exact_lat, longitude: item.exact_lng }
                        : undefined
                    )
                  }
                >
                  <Text style={styles.mapBtnText}>Open exact location in map</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.meta}>Approx area: {publicAreaForEvent(item)}</Text>
              )}

              <View style={styles.rowGap}>
                <TouchableOpacity style={[styles.mapBtn, { flex: 1 }]} onPress={() => setSelectedHost(item.host_name)}>
                  <Text style={styles.mapBtnText}>Host profile</Text>
                </TouchableOpacity>
                {isHost || myReq?.status === 'approved' ? (
                  <TouchableOpacity style={[styles.approveBtn, { flex: 1 }]} onPress={() => setInviteEventId(item.id)}>
                    <Text style={styles.approveBtnText}>Invite people</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.rejectBtn, { flex: 1 }]} onPress={() => setReportTarget(item.host_name)}>
                    <Text style={styles.approveBtnText}>Report</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!isHost && (
                <TouchableOpacity style={styles.rejectBtn} onPress={() => blockHost(item.host_name)}>
                  <Text style={styles.approveBtnText}>Block this host</Text>
                </TouchableOpacity>
              )}

              {approved ? (
                <View style={styles.revealedBox}>
                  <Text style={styles.revealedText}>📍 {item.exact_location}</Text>
                  <Text style={styles.revealedText}>🕒 {item.exact_time}</Text>
                </View>
              ) : (
                <Text style={styles.hiddenText}>🔒 Exact location/time hidden until host approval</Text>
              )}

              {!isHost && !myReq && !isFull && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => requestJoin(item.id)}>
                  <Text style={styles.primaryBtnText}>Request to Join</Text>
                </TouchableOpacity>
              )}
              {!isHost && !myReq && isFull && <Text style={styles.rejectedText}>Event full</Text>}

              {!isHost && myReq?.status === 'pending' && (
                myReq.invite_source !== 'self' && myReq.invite_response === 'pending' ? (
                  <View>
                    <Text style={styles.pendingText}>You were invited by {myReq.invited_by_name || 'a member'}.</Text>
                    <View style={styles.rowGap}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => respondToInvite(myReq.id, true)}>
                        <Text style={styles.approveBtnText}>Accept invite</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => respondToInvite(myReq.id, false)}>
                        <Text style={styles.approveBtnText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.pendingText}>
                    {myReq.invite_source === 'self' ? 'Request pending host approval…' : 'Invite accepted. Awaiting host approval…'}
                  </Text>
                )
              )}
              {!isHost && myReq?.status === 'approved' && <Text style={styles.approvedText}>Approved ✅</Text>}
              {!isHost && myReq?.status === 'rejected' && <Text style={styles.rejectedText}>Request rejected</Text>}

              {approved && !isHost && (() => {
                const alreadyRated = ratings.some(
                  (r) => r.event_id === item.id && r.rater_name.toLowerCase() === currentUser.trim().toLowerCase() && r.rated_name.toLowerCase() === item.host_name.toLowerCase()
                );
                if (alreadyRated) return <Text style={styles.approvedText}>You rated this host ✅</Text>;
                if (!hasEventEnded(item.exact_time)) {
                  return <Text style={styles.pendingText}>Ratings unlock after event end time.</Text>;
                }
                return (
                  <TouchableOpacity style={styles.approveBtn} onPress={() => openRatingForm(item.id, item.host_name)}>
                    <Text style={styles.approveBtnText}>Rate host</Text>
                  </TouchableOpacity>
                );
              })()}

              <Text style={styles.ratingHint}>After event end: rate trust + skill</Text>
            </View>
          );
        })}
      </View>
      </ScrollView>

      <Modal visible={mapPickerVisible} animationType="slide" onRequestClose={() => setMapPickerVisible(false)}>
        <SafeAreaView style={styles.mapModalRoot}>
          <View style={styles.mapModalHeader}>
            <Text style={styles.cardTitle}>{mapTargetField === 'area' ? 'Pick public area' : 'Pick exact location'}</Text>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => setMapPickerVisible(false)}>
              <Text style={styles.approveBtnText}>Close</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Search place or address"
            placeholderTextColor="#9ca3af"
            value={mapSearchQuery}
            onChangeText={setMapSearchQuery}
          />
          {mapSearchSuggestions.length > 0 ? (
            <View style={styles.suggestionBox}>
              {mapSearchSuggestions.slice(0, 5).map((s) => (
                <TouchableOpacity
                  key={`map-s-${s}`}
                  style={styles.suggestionItem}
                  onPress={async () => {
                    setMapSearchQuery(s);
                    const point = await geocodeAddress(s);
                    if (point) {
                      setMapPin(point);
                      setMapRegion({
                        latitude: point.latitude,
                        longitude: point.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      });
                    }
                  }}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            mapSearchQuery.trim().length >= 2 ? <Text style={styles.meta}>No matches yet. Try a fuller address or drop a pin.</Text> : null
          )}

          <MapView
            style={styles.mapView}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            onPress={(e: MapPressEvent) => setMapPin(e.nativeEvent.coordinate)}
          >
            {mapPin && (
              <Marker
                coordinate={mapPin}
                draggable
                onDragEnd={(e) => setMapPin(e.nativeEvent.coordinate)}
              />
            )}
          </MapView>

          <View style={styles.rowGap}>
            <TouchableOpacity
              style={[styles.mapBtn, { flex: 1 }]}
              onPress={async () => {
                if (mapSearchQuery.trim()) {
                  applyPickedLocation(mapSearchQuery.trim());
                } else if (mapPin) {
                  const addr = await reverseGeocode(mapPin.latitude, mapPin.longitude);
                  applyPickedLocation(addr || `${mapPin.latitude.toFixed(5)}, ${mapPin.longitude.toFixed(5)}`);
                } else {
                  setError('Select a place or drop a pin first.');
                }
              }}
            >
              <Text style={styles.mapBtnText}>Use this location</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
  page: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },
  brand: { color: '#f9fafb', fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#9ca3af', marginBottom: 12 },
  error: { color: '#fca5a5', marginBottom: 8 },
  card: {
    backgroundColor: '#111827', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1f2937',
  },
  cardTitle: { color: '#f9fafb', fontWeight: '700', marginBottom: 10 },
  input: {
    backgroundColor: '#1f2937', color: '#f9fafb', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, marginBottom: 8,
  },
  textArea: {
    minHeight: 76,
  },
  suggestionBox: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  suggestionText: { color: '#e2e8f0' },
  list: { paddingBottom: 24 },
  eventCard: {
    backgroundColor: '#111827', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1f2937',
  },
  eventTitle: { color: '#f9fafb', fontWeight: '700', fontSize: 16 },
  meta: { color: '#9ca3af', marginTop: 2 },
  hiddenText: { color: '#fbbf24', marginTop: 8 },
  revealedBox: {
    marginTop: 8, backgroundColor: '#0f172a', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#334155',
  },
  revealedText: { color: '#bfdbfe' },
  primaryBtn: {
    marginTop: 10, backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  pendingText: { marginTop: 10, color: '#fbbf24', fontWeight: '600' },
  approvedText: { marginTop: 10, color: '#4ade80', fontWeight: '700' },
  rejectedText: { marginTop: 10, color: '#f87171', fontWeight: '700' },
  ratingHint: { marginTop: 8, color: '#94a3b8', fontSize: 12 },
  pendingItem: { marginBottom: 8 },
  rowGap: { flexDirection: 'row', gap: 8, marginTop: 8 },
  rowGapWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chipBtn: { backgroundColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  chipBtnActive: { backgroundColor: '#2563eb' },
  chipBtnText: { color: '#fff', fontWeight: '600' },
  approveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  rejectBtn: { backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  approveBtnText: { color: '#fff', fontWeight: '700' },
  mapBtn: {
    marginTop: 10, backgroundColor: '#374151', paddingVertical: 8, borderRadius: 10, alignItems: 'center',
  },
  mapBtnText: { color: '#e5e7eb', fontWeight: '600' },
  ratingGuide: { color: '#cbd5e1', marginBottom: 8 },
  ratingLabel: { color: '#f1f5f9', fontWeight: '700', marginTop: 2 },
  ratingHelp: { color: '#94a3b8', marginBottom: 6, fontSize: 12 },
  warnBadge: { color: '#fca5a5', marginTop: 6, fontWeight: '700' },
  reviewSnippet: { color: '#cbd5e1', marginTop: 6, fontStyle: 'italic' },
  mapModalRoot: { flex: 1, backgroundColor: '#0b1220', padding: 12 },
  mapModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  mapView: { flex: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#334155', marginTop: 8 },
});
