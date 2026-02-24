import { StatusBar } from 'expo-status-bar';
import { Session } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from './lib/supabase';

type EventRow = {
  id: number;
  created_at: string;
  title: string;
  category: string;
  area: string;
  exact_location: string;
  exact_time: string;
  host_name: string;
  host_user_id: string;
};

type JoinRequestRow = {
  id: number;
  event_id: number;
  requester_name: string;
  requester_user_id: string;
  status: 'pending' | 'approved' | 'rejected';
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [requests, setRequests] = useState<JoinRequestRow[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Sports');
  const [area, setArea] = useState('');
  const [exactLocation, setExactLocation] = useState('');
  const [exactTime, setExactTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id ?? null;
  const userEmail = session?.user?.email ?? '';
  const displayName = userEmail.split('@')[0] || 'user';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    setError(null);
    const [{ data: eventsData, error: eventsError }, { data: reqData, error: reqError }] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('join_requests').select('*').order('created_at', { ascending: false }),
    ]);

    if (eventsError) return setError(eventsError.message);
    if (reqError) return setError(reqError.message);

    setEvents((eventsData ?? []) as EventRow[]);
    setRequests((reqData ?? []) as JoinRequestRow[]);
  };

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  const pendingForMyHostedEvents = useMemo(() => {
    if (!userId) return [];
    const hostedEventIds = new Set(events.filter((e) => e.host_user_id === userId).map((e) => e.id));
    return requests.filter((r) => r.status === 'pending' && hostedEventIds.has(r.event_id));
  }, [events, requests, userId]);

  const signUp = async () => {
    setAuthMsg(null);
    setError(null);
    const clean = email.trim();
    if (!clean || !password) return;
    const { error } = await supabase.auth.signUp({ email: clean, password });
    if (error) return setError(error.message);
    setAuthMsg('Account created. If email confirmation is enabled, confirm once then sign in.');
  };

  const signIn = async () => {
    setAuthMsg(null);
    setError(null);
    const clean = email.trim();
    if (!clean || !password) return;
    const { error } = await supabase.auth.signInWithPassword({ email: clean, password });
    if (error) return setError(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setEvents([]);
    setRequests([]);
  };

  const createEvent = async () => {
    if (!userId) return;
    if (!title.trim() || !area.trim() || !exactLocation.trim() || !exactTime.trim()) return;

    setError(null);
    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      category: category.trim(),
      area: area.trim(),
      exact_location: exactLocation.trim(),
      exact_time: exactTime.trim(),
      host_name: displayName,
      host_user_id: userId,
    });

    if (error) return setError(error.message);

    setTitle('');
    setCategory('Sports');
    setArea('');
    setExactLocation('');
    setExactTime('');
    await loadData();
  };

  const requestJoin = async (eventId: number) => {
    if (!userId) return;

    setError(null);
    const { error } = await supabase.from('join_requests').upsert(
      { event_id: eventId, requester_name: displayName, requester_user_id: userId, status: 'pending' },
      { onConflict: 'event_id,requester_user_id' }
    );

    if (error) return setError(error.message);
    await loadData();
  };

  const setRequestStatus = async (requestId: number, status: 'approved' | 'rejected') => {
    setError(null);
    const { error } = await supabase.from('join_requests').update({ status }).eq('id', requestId);
    if (error) return setError(error.message);
    await loadData();
  };

  const openMap = (query: string) => {
    const encoded = encodeURIComponent(query);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <Text style={styles.brand}>gathr</Text>
        <Text style={styles.subtitle}>Sign in to create, join, and approve events securely.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Email + password</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 chars)"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <View style={styles.rowGap}>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]} onPress={signIn}>
              <Text style={styles.primaryBtnText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.approveBtn, { flex: 1 }]} onPress={signUp}>
              <Text style={styles.approveBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
          {!!authMsg && <Text style={styles.approvedText}>{authMsg}</Text>}
          {!!error && <Text style={styles.error}>Auth: {error}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <Text style={styles.brand}>gathr</Text>
      <Text style={styles.subtitle}>Logged in as {userEmail}</Text>
      <TouchableOpacity style={styles.rejectBtn} onPress={signOut}>
        <Text style={styles.approveBtnText}>Log out</Text>
      </TouchableOpacity>

      {!!error && <Text style={styles.error}>Backend: {error}</Text>}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create event</Text>
        <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Category" placeholderTextColor="#9ca3af" value={category} onChangeText={setCategory} />
        <TextInput style={styles.input} placeholder="Public area (shown to everyone)" placeholderTextColor="#9ca3af" value={area} onChangeText={setArea} />
        <TextInput style={styles.input} placeholder="Exact location (approved only)" placeholderTextColor="#9ca3af" value={exactLocation} onChangeText={setExactLocation} />
        <TextInput style={styles.input} placeholder="Exact time (approved only)" placeholderTextColor="#9ca3af" value={exactTime} onChangeText={setExactTime} />

        <TouchableOpacity style={styles.primaryBtn} onPress={createEvent}>
          <Text style={styles.primaryBtnText}>Create Event</Text>
        </TouchableOpacity>
      </View>

      {pendingForMyHostedEvents.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pending approvals</Text>
          {pendingForMyHostedEvents.map((r) => {
            const event = events.find((e) => e.id === r.event_id);
            return (
              <View key={r.id} style={styles.pendingItem}>
                <Text style={styles.eventTitle}>{event?.title ?? 'Event'} • {r.requester_name}</Text>
                <View style={styles.rowGap}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => setRequestStatus(r.id, 'approved')}>
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => setRequestStatus(r.id, 'rejected')}>
                    <Text style={styles.approveBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isHost = item.host_user_id === userId;
          const myReq = requests.find((r) => r.event_id === item.id && r.requester_user_id === userId);
          const approved = isHost || myReq?.status === 'approved';

          return (
            <View style={styles.eventCard}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.meta}>{item.category} • Host: {item.host_name}</Text>
              <Text style={styles.meta}>Area: {item.area}</Text>

              <TouchableOpacity style={styles.mapBtn} onPress={() => openMap(approved ? item.exact_location : item.area)}>
                <Text style={styles.mapBtnText}>{approved ? 'Open exact location in map' : 'Open rough area in map'}</Text>
              </TouchableOpacity>

              {approved ? (
                <View style={styles.revealedBox}>
                  <Text style={styles.revealedText}>📍 {item.exact_location}</Text>
                  <Text style={styles.revealedText}>🕒 {item.exact_time}</Text>
                </View>
              ) : (
                <Text style={styles.hiddenText}>🔒 Exact location/time hidden until host approval</Text>
              )}

              {!isHost && !myReq && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => requestJoin(item.id)}>
                  <Text style={styles.primaryBtnText}>Request to Join</Text>
                </TouchableOpacity>
              )}

              {!isHost && myReq?.status === 'pending' && <Text style={styles.pendingText}>Request pending host approval…</Text>}
              {!isHost && myReq?.status === 'approved' && <Text style={styles.approvedText}>Approved ✅</Text>}
              {!isHost && myReq?.status === 'rejected' && <Text style={styles.rejectedText}>Request rejected</Text>}

              <Text style={styles.ratingHint}>After event: rate skill • friendliness • reliability</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220', paddingHorizontal: 16, paddingTop: 8 },
  brand: { color: '#f9fafb', fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#9ca3af', marginBottom: 12 },
  error: { color: '#fca5a5', marginVertical: 8 },
  card: {
    backgroundColor: '#111827', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1f2937',
  },
  cardTitle: { color: '#f9fafb', fontWeight: '700', marginBottom: 10 },
  input: {
    backgroundColor: '#1f2937', color: '#f9fafb', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, marginBottom: 8,
  },
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
  approveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  rejectBtn: { backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  approveBtnText: { color: '#fff', fontWeight: '700' },
  mapBtn: {
    marginTop: 10, backgroundColor: '#374151', paddingVertical: 8, borderRadius: 10, alignItems: 'center',
  },
  mapBtnText: { color: '#e5e7eb', fontWeight: '600' },
});
