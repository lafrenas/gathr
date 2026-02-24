import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from './lib/supabase';

type Event = {
  id: string;
  title: string;
  category: string;
  area: string;
  exactLocation: string;
  exactTime: string;
  host: string;
  joined: boolean;
  approved: boolean;
  pending: boolean;
};

export default function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Sports');
  const [area, setArea] = useState('');
  const [exactLocation, setExactLocation] = useState('');
  const [exactTime, setExactTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pendingRequests = useMemo(
    () => events.filter((e) => e.pending && e.host === 'Ignas'),
    [events]
  );

  const loadEvents = async () => {
    setError(null);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    const mapped: Event[] = (data ?? []).map((e: any) => ({
      id: String(e.id),
      title: e.title,
      category: e.category,
      area: e.area,
      exactLocation: e.exact_location,
      exactTime: e.exact_time,
      host: e.host_name,
      joined: false,
      approved: false,
      pending: false,
    }));

    setEvents(mapped);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const requestJoin = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, pending: true, joined: true } : e))
    );
  };

  const approveJoin = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, pending: false, approved: true } : e))
    );
  };

  const createEvent = async () => {
    if (!title.trim() || !area.trim() || !exactLocation.trim() || !exactTime.trim()) return;

    setError(null);
    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      category: category.trim(),
      area: area.trim(),
      exact_location: exactLocation.trim(),
      exact_time: exactTime.trim(),
      host_name: 'Ignas',
    });

    if (error) {
      setError(error.message);
      return;
    }

    setTitle('');
    setCategory('Sports');
    setArea('');
    setExactLocation('');
    setExactTime('');
    await loadEvents();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <Text style={styles.brand}>gathr</Text>
      <Text style={styles.subtitle}>Create events. Request to join. Approve before details unlock.</Text>
      {!!error && <Text style={styles.error}>Backend: {error}</Text>}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create event (Host)</Text>
        <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Category (Sports/Social)" placeholderTextColor="#9ca3af" value={category} onChangeText={setCategory} />
        <TextInput style={styles.input} placeholder="Public area (e.g. North London)" placeholderTextColor="#9ca3af" value={area} onChangeText={setArea} />
        <TextInput style={styles.input} placeholder="Exact location (hidden until approved)" placeholderTextColor="#9ca3af" value={exactLocation} onChangeText={setExactLocation} />
        <TextInput style={styles.input} placeholder="Exact time (hidden until approved)" placeholderTextColor="#9ca3af" value={exactTime} onChangeText={setExactTime} />

        <TouchableOpacity style={styles.primaryBtn} onPress={createEvent}>
          <Text style={styles.primaryBtnText}>Create Event</Text>
        </TouchableOpacity>
      </View>

      {pendingRequests.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pending requests (Host approvals)</Text>
          {pendingRequests.map((e) => (
            <View key={e.id} style={styles.rowBetween}>
              <Text style={styles.eventTitle}>{e.title}</Text>
              <TouchableOpacity style={styles.approveBtn} onPress={() => approveJoin(e.id)}>
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.category} • Host: {item.host}</Text>
            <Text style={styles.meta}>Area: {item.area}</Text>

            {item.approved ? (
              <View style={styles.revealedBox}>
                <Text style={styles.revealedText}>📍 {item.exactLocation}</Text>
                <Text style={styles.revealedText}>🕒 {item.exactTime}</Text>
              </View>
            ) : (
              <Text style={styles.hiddenText}>🔒 Exact location/time hidden until host approval</Text>
            )}

            {!item.joined ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={() => requestJoin(item.id)}>
                <Text style={styles.primaryBtnText}>Request to Join</Text>
              </TouchableOpacity>
            ) : item.pending ? (
              <Text style={styles.pendingText}>Request pending host approval…</Text>
            ) : (
              <Text style={styles.approvedText}>Approved ✅</Text>
            )}

            <Text style={styles.ratingHint}>After event: rate skill • friendliness • reliability</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b1220',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  brand: {
    color: '#f9fafb',
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9ca3af',
    marginBottom: 12,
  },
  error: {
    color: '#fca5a5',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  cardTitle: {
    color: '#f9fafb',
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
  },
  list: {
    paddingBottom: 24,
  },
  eventCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  eventTitle: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 16,
  },
  meta: {
    color: '#9ca3af',
    marginTop: 2,
  },
  hiddenText: {
    color: '#fbbf24',
    marginTop: 8,
  },
  revealedBox: {
    marginTop: 8,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  revealedText: {
    color: '#bfdbfe',
  },
  primaryBtn: {
    marginTop: 10,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  pendingText: {
    marginTop: 10,
    color: '#fbbf24',
    fontWeight: '600',
  },
  approvedText: {
    marginTop: 10,
    color: '#4ade80',
    fontWeight: '700',
  },
  ratingHint: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  approveBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
